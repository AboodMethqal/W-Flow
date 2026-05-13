/**
 * daily-report — sends daily sales summary to merchant via WhatsApp
 * Trigger via Supabase Cron: "0 20 * * *" (8 PM daily)
 *
 * Supabase Secrets required:
 *   SUPABASE_SERVICE_ROLE_KEY
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

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Get all users with daily report enabled
  const { data: settingsList } = await supabase
    .from("settings")
    .select("user_id, whapi_token, daily_report_phone, daily_report_enabled")
    .eq("daily_report_enabled", true);

  if (!settingsList?.length) {
    return new Response(JSON.stringify({ ok: true, skipped: "no users with daily report enabled" }), { status: 200, headers: corsHeaders });
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const results = [];

  for (const s of settingsList) {
    if (!s.whapi_token || !s.daily_report_phone) continue;

    // Fetch today's orders
    const { data: orders } = await supabase
      .from("orders")
      .select("status, amount")
      .eq("user_id", s.user_id)
      .gte("created_at", todayStart.toISOString());

    const total = orders?.length ?? 0;
    const completed = orders?.filter((o) => o.status === "completed").length ?? 0;
    const pending = orders?.filter((o) => o.status === "pending").length ?? 0;
    const revenue = orders
      ?.filter((o) => o.status === "completed")
      .reduce((sum, o) => sum + Number(o.amount), 0) ?? 0;

    const date = new Date().toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

    const message =
      `📊 *تقرير المبيعات اليومي*\n` +
      `📅 ${date}\n\n` +
      `📦 إجمالي الطلبات: ${total}\n` +
      `✅ مكتملة: ${completed}\n` +
      `⏳ قيد الانتظار: ${pending}\n` +
      `💰 الإيرادات: ${revenue.toLocaleString("ar-SA")} ر.س\n\n` +
      `شكراً على متابعتك! 💚`;

    const sent = await sendWhapiMessage(s.whapi_token, s.daily_report_phone, message);
    results.push({ user_id: s.user_id, sent });
  }

  return new Response(JSON.stringify({ ok: true, results }), { status: 200, headers: corsHeaders });
});
