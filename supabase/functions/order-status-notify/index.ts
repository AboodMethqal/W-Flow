/**
 * order-status-notify
 * Called via Supabase Database Webhook on orders UPDATE.
 * Sends WhatsApp notification to customer using merchant's own settings.
 *
 * Supabase Secrets: SUPABASE_SERVICE_ROLE_KEY
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
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: corsHeaders }); }

  const record = body.record as Record<string, unknown> | undefined;
  const oldRecord = body.old_record as Record<string, unknown> | undefined;

  if (!record) return new Response(JSON.stringify({ ok: true, skipped: "no record" }), { status: 200, headers: corsHeaders });

  const newStatus = String(record.status ?? "");
  const oldStatus = String(oldRecord?.status ?? "");

  if (newStatus === oldStatus || !["delivering", "completed"].includes(newStatus)) {
    return new Response(JSON.stringify({ ok: true, skipped: "irrelevant" }), { status: 200, headers: corsHeaders });
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const userId = String(record.user_id ?? "");

  // Load merchant settings dynamically
  const { data: settings } = await supabase
    .from("settings")
    .select("whapi_token, msg_delivering, msg_completed, store_url")
    .eq("user_id", userId)
    .maybeSingle();

  if (!settings?.whapi_token) {
    return new Response(JSON.stringify({ ok: true, skipped: "no whapi_token for this merchant" }), { status: 200, headers: corsHeaders });
  }

  const customerName = String(record.customer_name ?? "");
  const orderNumber = String(record.order_number ?? "");
  const phone = String(record.phone ?? "");
  const storeUrl = settings.store_url ?? "";

  const defaultDelivering = `أهلاً ${customerName} 🚚\nطلبك رقم #${orderNumber} تم شحنه بنجاح وهو في طريقه إليك.\nشكراً لثقتك بنا! 💚`;
  const defaultCompleted = `أهلاً ${customerName} ✅\nطلبك رقم #${orderNumber} تم تسليمه بنجاح.\nنشكرك على تعاملك معنا، يسعدنا تقييمك لتجربتك! ⭐`;

  const templateDelivering = settings.msg_delivering ?? defaultDelivering;
  const templateCompleted = settings.msg_completed ?? defaultCompleted;

  const interpolate = (tpl: string) =>
    tpl
      .replace(/\{customer_name\}/g, customerName)
      .replace(/\{order_number\}/g, orderNumber)
      .replace(/\{store_url\}/g, storeUrl);

  let message = "";
  if (newStatus === "delivering") message = interpolate(templateDelivering);
  else if (newStatus === "completed") message = interpolate(templateCompleted);

  if (message && phone) {
    const sent = await sendWhapiMessage(settings.whapi_token, phone, message);
    console.log(`[notify] merchant=${userId} status=${newStatus} sent=${sent}`);
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders });
});
