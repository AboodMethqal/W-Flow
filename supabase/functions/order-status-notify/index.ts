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

async function sendTelegramMessage(token: string, chatId: number, text: string): Promise<boolean> {
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
  if (!res.ok) { console.error("[tg-notify]", res.status, await res.text()); return false; }
  return true;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "قيد المراجعة 📋",
  confirmed: "تم التأكيد ✅",
  preparing: "قيد التحضير 👨‍🍳",
  delivering: "في الطريق 🚚",
  completed: "تم التوصيل 🎉",
  cancelled: "ملغي ❌",
};

function buildNotification(status: string, customerName: string, orderNumber: string, storeUrl: string): string {
  const label = STATUS_LABELS[status] || status;
  let msg = `مرحباً ${customerName} 🙋\n\n`;
  msg += `طلبك رقم <b>#${orderNumber}</b>\n`;
  msg += `الحالة: <b>${label}</b>\n\n`;

  switch (status) {
    case "pending":
      msg += `تم استلام طلبك بنجاح. سنقوم بمراجعته قريباً.`;
      break;
    case "confirmed":
      msg += `تم تأكيد طلبك. سنبدأ بتجهيزه قريباً.`;
      break;
    case "preparing":
      msg += `يتم الآن تحضير طلبك. سنخبرك عندما يصبح جاهزاً.`;
      break;
    case "delivering":
      msg += `طلبك في الطريق إليك 🚚`;
      break;
    case "completed":
      msg += `تم توصيل طلبك بنجاح ✅\nنتمنى أن تكون راضياً عن تجربتك!`;
      break;
    case "cancelled":
      msg += `تم إلغاء الطلب. للاستفسار يرجى التواصل مع المتجر.`;
      break;
  }

  if (storeUrl) msg += `\n\n${storeUrl}`;
  msg += `\n\nشكراً لثقتك بنا! 💚`;
  return msg;
}

async function findTelegramChatId(
  supabase: ReturnType<typeof createClient>,
  customerId: string | null,
  workspaceId: string,
  phone: string,
): Promise<number | null> {
  // Try to find via customer_id in conversations
  if (customerId) {
    const { data: conv } = await supabase
      .from("conversations")
      .select("telegram_chat_id")
      .eq("customer_id", customerId)
      .eq("workspace_id", workspaceId)
      .maybeSingle();
    if (conv?.telegram_chat_id) return conv.telegram_chat_id;
  }

  // Fallback: parse from phone (telegram_{chatId} format)
  if (phone.startsWith("telegram_")) {
    const chatId = parseInt(phone.replace("telegram_", ""), 10);
    if (!isNaN(chatId)) return chatId;
  }

  return null;
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

  if (newStatus === oldStatus) {
    return new Response(JSON.stringify({ ok: true, skipped: "no change" }), { status: 200, headers: corsHeaders });
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const userId = String(record.user_id ?? "");
  const workspaceId = String(record.workspace_id ?? "");
  const customerId = record.customer_id ? String(record.customer_id) : null;
  const customerName = String(record.customer_name ?? "");
  const orderNumber = String(record.order_number ?? "");
  const phone = String(record.phone ?? "");
  const source = String(record.source ?? "");

  // Load merchant settings
  const { data: settings } = await supabase
    .from("settings")
    .select("whapi_token, msg_delivering, msg_completed, store_url")
    .eq("user_id", userId)
    .maybeSingle();

  const storeUrl = settings?.store_url ?? "";

  // --- WhatsApp notification (existing flow) ---
  if (settings?.whapi_token) {
    const defaultDelivering = `أهلاً ${customerName} 🚚\nطلبك رقم #${orderNumber} تم شحنه بنجاح وهو في طريقه إليك.\nشكراً لثقتك بنا! 💚`;
    const defaultCompleted = `أهلاً ${customerName} ✅\nطلبك رقم #${orderNumber} تم تسليمه بنجاح.\nنشكرك على تعاملك معنا، يسعدنا تقييمك لتجربتك! ⭐`;

    const templateDelivering = settings.msg_delivering ?? defaultDelivering;
    const templateCompleted = settings.msg_completed ?? defaultCompleted;

    const interpolate = (tpl: string) =>
      tpl
        .replace(/\{customer_name\}/g, customerName)
        .replace(/\{order_number\}/g, orderNumber)
        .replace(/\{store_url\}/g, storeUrl);

    let waMessage = "";
    if (newStatus === "delivering") waMessage = interpolate(templateDelivering);
    else if (newStatus === "completed") waMessage = interpolate(templateCompleted);

    if (waMessage && phone) {
      const sent = await sendWhapiMessage(settings.whapi_token, phone, waMessage);
      console.log(`[notify] whatsapp sent=${sent} status=${newStatus}`);
    }
  }

  // --- Telegram notification (new) ---
  const tgToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (tgToken) {
    const tgChatId = await findTelegramChatId(supabase, customerId, workspaceId, phone);
    if (tgChatId) {
      const tgMessage = buildNotification(newStatus, customerName, orderNumber, storeUrl);
      const sent = await sendTelegramMessage(tgToken, tgChatId, tgMessage);
      console.log(`[notify] telegram chat=${tgChatId} sent=${sent} status=${newStatus}`);
    }
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders });
});
