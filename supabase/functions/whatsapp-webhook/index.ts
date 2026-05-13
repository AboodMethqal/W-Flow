/**
 * WhatsApp Webhook — Whapi.cloud
 * Multi-tenant: each merchant identified by WEBHOOK_USER_ID secret.
 * Pulls settings (token, auto_reply_message, store_url) dynamically from DB.
 *
 * Supabase Secrets: SUPABASE_SERVICE_ROLE_KEY, WEBHOOK_USER_ID
 */

import { createClient } from "jsr:@supabase/supabase-js@2";

async function sendWhapiMessage(token: string, to: string, text: string): Promise<boolean> {
  const phone = to.replace(/\D/g, "");
  const res = await fetch("https://gate.whapi.cloud/messages/text", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ to: `${phone}@s.whatsapp.net`, body: text }),
  });
  if (!res.ok) { console.error("[whapi]", res.status, await res.text()); return false; }
  return true;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const PRICING_KEYWORDS = ["سعر", "بكم", "تفاصيل", "قديش", "كم سعر", "كم الثمن", "بسعر", "السعر"];

function hasPricingKeyword(text: string): boolean {
  return PRICING_KEYWORDS.some((kw) => text.includes(kw));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });

  if (req.method === "GET") {
    const url = new URL(req.url);
    const challenge = url.searchParams.get("hub.challenge");
    if (challenge) return new Response(challenge, { status: 200, headers: corsHeaders });
    return new Response("OK", { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: corsHeaders });
  }

  console.log("[webhook] payload:", JSON.stringify(body).substring(0, 300));

  const rawMessages = Array.isArray(body?.messages) ? body.messages as Record<string, unknown>[] : [];

  const incoming = rawMessages.filter((m) => {
    const from = String(m.from ?? "");
    const chatId = String(m.chat_id ?? m.from ?? "");
    return !chatId.includes("@g.us") && m.from_me !== true && m.type === "text" && from.length > 0;
  });

  if (incoming.length === 0) {
    return new Response(JSON.stringify({ ok: true, skipped: "no incoming individual text messages" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userId = Deno.env.get("WEBHOOK_USER_ID");
  if (!userId) return new Response(JSON.stringify({ error: "WEBHOOK_USER_ID not configured" }), { status: 500, headers: corsHeaders });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Load merchant settings dynamically — no hardcoded values
  const { data: settings } = await supabase
    .from("settings")
    .select("whapi_token, auto_reply_enabled, auto_reply_message, store_url")
    .eq("user_id", userId)
    .maybeSingle();

  const results = [];

  for (const msg of incoming) {
    const rawPhone = String(msg.from).replace(/[^\d]/g, "");
    const phone = `+${rawPhone}`;
    const textObj = msg.text as Record<string, unknown> | undefined;
    const text = String(textObj?.body ?? "").trim();
    if (!text) continue;

    // Auto-reply for pricing keywords using merchant's own message
    if (settings?.auto_reply_enabled && settings?.whapi_token && hasPricingKeyword(text)) {
      const storeUrl = settings.store_url ?? "";
      const replyTemplate = settings.auto_reply_message
        ?? "مرحباً! 👋 للاطلاع على أسعارنا وتفاصيل المنتجات، تفضل بزيارة متجرنا: {store_url}";
      const replyText = replyTemplate.replace(/\{store_url\}/g, storeUrl);
      await sendWhapiMessage(settings.whapi_token, phone, replyText);
      console.log(`[webhook] auto-replied to ${phone}`);
    }

    // Resolve or create customer
    const { data: existing } = await supabase
      .from("customers").select("id, name").eq("user_id", userId).eq("phone", phone).maybeSingle();

    let customerId: string;
    let customerName: string;

    if (existing) {
      customerId = existing.id;
      customerName = existing.name;
    } else {
      const { data: created, error: createErr } = await supabase
        .from("customers").insert({ user_id: userId, name: phone, phone }).select("id, name").single();
      if (createErr) { console.error("[webhook] create customer:", createErr.message); continue; }
      customerId = created.id;
      customerName = created.name;
    }

    // Create order
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({ user_id: userId, customer_id: customerId, customer_name: customerName, phone, details: text, amount: 0, status: "pending", source: "whatsapp" })
      .select("id, order_number").single();

    if (orderErr) { console.error("[webhook] create order:", orderErr.message); continue; }
    console.log(`[webhook] created order #${order.order_number} for merchant ${userId}`);
    results.push({ order_number: order.order_number, phone });
  }

  return new Response(JSON.stringify({ ok: true, created: results }), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
