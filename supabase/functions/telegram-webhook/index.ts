import { createClient } from "jsr:@supabase/supabase-js@2";

const AI_PROVIDER = Deno.env.get("AI_PROVIDER") || "groq";
const AI_MODEL = Deno.env.get("AI_MODEL") || "";
const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY") || "";
const OPENROUTER_KEY = Deno.env.get("OPENROUTER_API_KEY") || "";

function getAIConfig() {
  switch (AI_PROVIDER) {
    case "groq":
      return {
        url: "https://api.groq.com/openai/v1/chat/completions",
        key: GROQ_API_KEY,
        model: AI_MODEL || "llama-3.3-70b-versatile",
        fallbackModels: ["llama-3.1-70b-versatile", "mixtral-8x7b-32768", "llama-3.1-8b-instant"],
      };
    case "openrouter":
      return {
        url: "https://openrouter.ai/api/v1/chat/completions",
        key: OPENROUTER_KEY,
        model: AI_MODEL || "qwen/qwen-2.5-72b-instruct",
        fallbackModels: ["deepseek/deepseek-chat", "mistralai/mistral-7b-instruct"],
        headers: { "X-Title": "W-Flow Connect" },
      };
    default:
      throw new Error(`Unknown AI_PROVIDER: ${AI_PROVIDER}`);
  }
}

interface Message { role: "user" | "assistant"; text: string; ts: string }

interface Context {
  owner_id: string;
  messages: Message[];
  order_data: Record<string, unknown> | null;
  order_created: boolean;
  last_order_id: string | null;
}

interface ExtractedOrder {
  customer_name: string;
  phone?: string;
  products: { name: string; quantity: number; price?: number }[];
  address?: string;
  notes?: string;
  amount?: number;
  confirmed: boolean;
}

interface CatalogProduct {
  id: string;
  name: string;
  price: number;
  category: string | null;
  is_available: boolean;
  description?: string | null;
  image_url?: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "قيد المراجعة 📋",
  confirmed: "تم التأكيد ✅",
  preparing: "قيد التحضير 👨‍🍳",
  delivering: "في الطريق 🚚",
  completed: "تم التوصيل 🎉",
  cancelled: "ملغي ❌",
};

function reply(chatId: number, text: string) {
  return fetch(`https://api.telegram.org/bot${Deno.env.get("TELEGRAM_BOT_TOKEN")}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}

function sendPhoto(chatId: number, photoUrl: string, caption: string) {
  return fetch(`https://api.telegram.org/bot${Deno.env.get("TELEGRAM_BOT_TOKEN")}/sendPhoto`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, photo: photoUrl, caption, parse_mode: "HTML" }),
  });
}

function getStoreUrl(slug: string): string {
  const base = Deno.env.get("PUBLIC_SITE_URL") || "https://w-flow-theta.vercel.app";
  return `${base.replace(/\/+$/, "")}/store/${slug}`;
}

function getProductUrl(slug: string, productId: string): string {
  const base = Deno.env.get("PUBLIC_SITE_URL") || "https://w-flow-theta.vercel.app";
  return `${base.replace(/\/+$/, "")}/store/${slug}/product/${productId}`;
}

function formatCatalogSection(catalog: CatalogProduct[]): string {
  if (!catalog.length) return "⚠️ المتجر لم يضف منتجات بعد. اسأل العميل وش يطلب وسجل الطلب يدوياً.";

  const available = catalog.filter((p) => p.is_available);
  const unavailable = catalog.filter((p) => !p.is_available);

  const lines: string[] = ["قائمة المنتجات المتاحة (استخدمها حصراً — لا تخترع منتجات):"];
  for (const p of available) {
    const hasImage = p.image_url ? " 🖼️" : "";
    const desc = p.description ? ` — ${p.description.substring(0, 60)}` : "";
    lines.push(`• ${p.name}${hasImage} — ${p.price.toFixed(2)} ر.س${p.category ? ` [${p.category}]` : ""}${desc}`);
  }
  if (unavailable.length) {
    lines.push("", "المنتجات غير المتوفرة حالياً (أخبر العميل أنها نفدت):");
    for (const p of unavailable) {
      lines.push(`• ${p.name}${p.category ? ` [${p.category}]` : ""}`);
    }
  }
  return lines.join("\n");
}

function matchCatalogProduct(productName: string, catalog: CatalogProduct[]): CatalogProduct | null {
  const name = productName.toLowerCase().trim();
  // Exact match first
  let match = catalog.find((p) => p.name.toLowerCase() === name);
  if (match) return match;
  // Contains match (catalog name contains AI product name)
  match = catalog.find((p) => p.name.toLowerCase().includes(name));
  if (match) return match;
  // AI product name contains catalog name
  match = catalog.find((p) => name.includes(p.name.toLowerCase()));
  if (match) return match;
  // Word-by-word: check if any word in AI name matches any word in catalog name
  const words = name.split(/\s+/);
  for (const p of catalog) {
    const catWords = p.name.toLowerCase().split(/\s+/);
    const matched = words.some((w) => w.length > 1 && catWords.some((cw) => cw.includes(w) || w.includes(cw)));
    if (matched) return p;
  }
  return null;
}

async function buildSystemPrompt(
  businessName: string,
  context: Context,
  latestOrder: { order_number: number; status: string } | null,
  catalog: CatalogProduct[],
  catalogLink: string | null,
): Promise<string> {
  const info = context.order_data || {};
  const items = info.products as Array<{ name: string; quantity: number; price?: number }> | undefined;
  const products = items?.length
    ? items.map((p) => `${p.name} x${p.quantity}${p.price ? ` (${p.price} ر.س)` : ""}`).join(", ")
    : "لم يتم التحديد بعد";

  let orderSummary = "";

  if (context.order_created && context.last_order_id && latestOrder) {
    orderSummary =
      `الطلب رقم #${latestOrder.order_number}\n` +
      `الحالة: ${STATUS_LABELS[latestOrder.status] || latestOrder.status}`;
    if (context.order_data?.customer_name) {
      orderSummary += `\nاسم العميل: ${context.order_data.customer_name}`;
    }
    if (items?.length) {
      orderSummary += `\nالمنتجات: ${products}`;
    }
  }

  const catalogSection = formatCatalogSection(catalog);

  const parts: string[] = [
    `أنت مساعد مبيعات لمتجر "${businessName}". تحدث بالعربية الفصحى أو العامية حسب العميل.`,
    "",
    `كتالوج المنتجات (استخدمها فقط — لا تخترع منتجات أو أسعار):`,
    catalogSection,
    "",
    catalogLink ? `رابط المتجر العام (أرسله للعميل إذا طلب): ${catalogLink}` : "",
    "",
    `المعلومات المجمعة حالياً:`,
    `- الاسم: ${(info.customer_name as string) || "—"}`,
    `- الجوال: ${(info.phone as string) || "—"}`,
    `- المنتجات: ${products}`,
    `- العنوان: ${(info.address as string) || "—"}`,
    `- ملاحظات: ${(info.notes as string) || "—"}`,
    "",
  ];

  if (orderSummary) {
    parts.push(`آخر طلب للعميل:\n${orderSummary}\n`);
  }

  if (context.order_created) {
    parts.push(
      `⚠️ تم إنشاء الطلب مسبقاً برقم ${context.last_order_id}.`,
      `إذا سأل العميل عن حالة الطلب — راجع المعلومات أعلاه وأخبره بالحالة الحالية من النظام.`,
      `لا تنشئ [DATA] جديداً — إذا أضاف العميل منتجات إضافية فقط حدّث المحادثة بدون [DATA].`,
    );
  } else {
    parts.push(
      `سير العمل — اتبعه بالترتيب ولا تتجاوز الخطوات:`,
      ``,
      `[المرحلة 1 — جمع المعلومات]`,
      `• اسأل العميل وش يطلب بالضبط من قائمة المنتجات أعلاه`,
      `• اسأل عن الكمية المطلوبة لكل منتج`,
      `• اسأل عن اسمه ورقم جواله`,
      `• اسأل عن عنوان التوصيل إذا احتاج`,
      `• خذ ملاحظات إضافية لو حاب يضيفها`,
      ``,
      `[المرحلة 2 — عرض الملخص مع الأسعار]`,
      `• كرر على العميل كل التفاصيل مع الأسعار من الكتالوج:`,
      `  "ملخص طلبك:\n  • الاسم: ...\n  • المنتجات:\n     - منتج (×الكمية) — السعر\n  • الإجمالي: ... ر.س\n  • العنوان: ...\n  • هل البيانات صحيحة؟"`,
      `• احسب الإجمالي = مجموع (سعر المنتج × الكمية) لكل منتج`,
      `• انتظر رد العميل`,
      ``,
      `[المرحلة 3 — التأكيد]`,
      `• إذا قال "نعم" أو "موافق" أو "Ok" أو "تم" → ضع [DATA] مع confirmed: true والمبلغ الإجمالي في حقل amount`,
      `• إذا قال "لا" أو طلب تغيير → استمر وحدّث المعلومات — لا تضع [DATA]`,
      ``,
      `🔴 ⚠️ قواعد حاسمة لعرض المنتجات — المخالفة غير مقبولة أبداً:`,
      `• ممنوع منعاً باتاً أن تقول "لا أستطيع عرض الصور" أو "لا يمكنني الوصول للمتجر" أو أي عبارة رفض`,
      `• أنت مساعد مبيعات ووظيفتك عرض المنتجات — عندك صلاحية كاملة لعرض أي منتج من المتجر`,
      `• إذا سأل العميل عن منتج محدد (مثال: "شوف/أرني/عندك/صور/تفاصيل/كم سعر" + اسم المنتج) → استخدم [CATALOG] فوراً`,
      `• إذا طلب عرض جميع المنتجات (مثال: "عندكم ايش؟"/"المتجر"/"المنتجات"/"الكتالوج") → استخدم [CATALOG] مع list فوراً`,
      `• [CATALOG] يشتغل مع ردك النصي — النظام يرسل الصورة والتفاصيل ورابط المنتج تلقائياً`,
      `• للرد: اشرح المنتج بالعربي ثم أضف [CATALOG]`,
      `• للمنتج المحدد: [CATALOG]{"action":"show","name":"اسم المنتج بالضبط كما هو بالمتجر"}[/CATALOG]`,
      `• للقائمة الكاملة: [CATALOG]{"action":"list"}[/CATALOG]`,
      `• إذا طلب منتج غير موجود → قل "نعتذر غير متوفر" فقط`,
      ``,
      `مهم جداً:`,
      `• الأسعار مأخوذة من كتالوج المتجر — لا تستخدم أسعاراً من عندك`,
      `• لا تخترع منتجات غير موجودة في الكتالوج`,
      `• لا تضع [DATA] إلا بعد موافقة العميل الصريحة`,
      `• حقل confirmed يجب أن يكون true`,
      `• حقل amount = مجموع (سعر المنتج × الكمية)`,
    );
  }

  parts.push(
    ``,
    `صيغة [DATA]:`,
    `[DATA]`,
    `{"customer_name":"...","phone":"...","products":[{"name":"...","quantity":1,"price":0}],"address":"...","notes":"...","amount":0,"confirmed":true}`,
    `[/DATA]`,
  );

  return parts.join("\n");
}

async function buildMessages(
  businessName: string,
  context: Context,
  newUserText: string,
  supabase: ReturnType<typeof createClient>,
  workspaceId: string,
) {
  const [orderResult, catalogResult, wsResult] = await Promise.all([
    supabase
      .from("orders")
      .select("order_number, status")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("products")
      .select("id, name, price, category, is_available, description, image_url")
      .eq("workspace_id", workspaceId)
      .eq("is_available", true)
      .order("name", { ascending: true }),
    supabase
      .from("workspaces")
      .select("slug")
      .eq("id", workspaceId)
      .maybeSingle(),
  ]);

  const catalog = (catalogResult.data ?? []) as CatalogProduct[];
  const catalogLink = wsResult.data?.slug ? getStoreUrl(wsResult.data.slug) : null;
  const systemPrompt = await buildSystemPrompt(businessName, context, orderResult.data, catalog, catalogLink);
  const messages: Array<{ role: string; content: string }> = [
    { role: "system", content: systemPrompt },
  ];
  const recent = context.messages.slice(-20);
  for (const m of recent) {
    messages.push({ role: m.role === "user" ? "user" : "assistant", content: m.text });
  }
  messages.push({ role: "user", content: newUserText });
  return messages;
}

async function callAI(messages: Array<{ role: string; content: string }>): Promise<{ reply: string; orderData: ExtractedOrder | null }> {
  const config = getAIConfig();
  const allModels = [config.model, ...config.fallbackModels];

  for (const model of allModels) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.key}`,
      };
      if (config.headers) Object.assign(headers, config.headers);

      const res = await fetch(config.url, {
        method: "POST",
        headers,
        body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 1024 }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data?.choices?.[0]?.message?.content || "";
        const finish = data?.choices?.[0]?.finish_reason;
        if (finish === "length") console.warn("[ai] response truncated for model:", model);

        const dataMatch = content.match(/\[DATA\]\s*([\s\S]*?)\s*\[\/DATA\]/);
        const reply = content.replace(/\[DATA\][\s\S]*?\[\/DATA\]/, "").trim();
        let orderData: ExtractedOrder | null = null;
        if (dataMatch) {
          try { orderData = JSON.parse(dataMatch[1]); } catch { console.warn("[ai] failed to parse order data"); }
        }
        return { reply: reply || "شكراً! تم استلام طلبك.", orderData };
      }

      const errText = await res.text();
      console.error(`[ai] ${config.url} model=${model} attempt=${attempt} status=${res.status}:`, errText.substring(0, 200));

      if (res.status === 429) { await new Promise((r) => setTimeout(r, 2000)); continue; }
      if (res.status >= 500) { await new Promise((r) => setTimeout(r, 1000)); continue; }
      break;
    }
  }
  return { reply: "", orderData: null };
}

async function createOrder(
  supabase: ReturnType<typeof createClient>,
  orderData: ExtractedOrder,
  context: Context,
  workspaceId: string,
  chatId: number,
  lastUserText: string,
): Promise<string | null> {
  if (context.order_created || context.last_order_id) {
    console.log(`[telegram] duplicate prevention: order already created (${context.last_order_id}), skipping`);
    return context.last_order_id;
  }

  let ownerId = context.owner_id;
  if (!ownerId) {
    const { data: ws } = await supabase.from("workspaces").select("owner_id").eq("id", workspaceId).single();
    ownerId = ws?.owner_id;
  }

  const phone = orderData.phone || `telegram_${chatId}`;
  const rawProducts = orderData.products || [];
  const address = orderData.address || null;
  const notes = orderData.notes || null;

  let customerId: string | null = null;
  const { data: existingCustomer } = await supabase
    .from("customers").select("id").eq("workspace_id", workspaceId).eq("phone", phone).maybeSingle();
  if (existingCustomer) {
    customerId = existingCustomer.id;
  } else {
    const { data: newCust } = await supabase
      .from("customers").insert({
        workspace_id: workspaceId, user_id: ownerId, name: orderData.customer_name,
        phone, notes: notes || "تم الإنشاء تلقائياً من بوت تليجرام",
      }).select("id").single();
    if (newCust) customerId = newCust.id;
  }

  // Match products against catalog for real prices
  const { data: allProducts } = await supabase
    .from("products")
    .select("id, name, price")
    .eq("workspace_id", workspaceId);

  const catalog = (allProducts ?? []) as CatalogProduct[];

  let totalAmount = 0;
  const orderItems: Array<{ order_id: string; product_name: string; quantity: number; price: number }> = [];

  for (const p of rawProducts) {
    const match = matchCatalogProduct(p.name, catalog);
    const realPrice = match?.price ?? p.price ?? 0;
    const qty = p.quantity || 1;
    totalAmount += realPrice * qty;
    orderItems.push({
      order_id: "",
      product_name: match?.name ?? p.name,
      quantity: qty,
      price: realPrice,
    });
  }

  const details = orderItems.map((p) => `${p.product_name} (x${p.quantity}) — ${p.price} ر.س`).join(", ");

  const { data: order, error: orderErr } = await supabase
    .from("orders").insert({
      workspace_id: workspaceId, user_id: ownerId, customer_id: customerId,
      customer_name: orderData.customer_name, phone,
      details: details || notes || lastUserText, address,
      amount: totalAmount, status: "pending", source: "telegram", bot_source: "telegram",
    }).select("id, order_number").single();

  if (orderErr) {
    console.error("[telegram] order creation error:", orderErr.message);
    return null;
  }

  console.log(`[telegram] order #${order.order_number} created for workspace ${workspaceId}, amount=${totalAmount}`);
  if (orderItems.length) {
    await supabase.from("order_items").insert(
      orderItems.map((item) => ({ ...item, order_id: order.id })),
    );
  }

  // Link customer_id to conversation for notification routing
  if (customerId) {
    await supabase.from("conversations").update({ customer_id: customerId }).eq("telegram_chat_id", chatId);
  }

  return order.id;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method === "GET") return new Response("AI Sales Assistant Bot is running", { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  const config = getAIConfig();
  if (!config.key) {
    console.error(`[telegram] No API key configured for provider: ${AI_PROVIDER}`);
    return new Response(JSON.stringify({ error: "AI provider not configured" }), { status: 500, headers: corsHeaders });
  }

  let update: Record<string, unknown>;
  try { update = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: corsHeaders });
  }

  const msg = (update.message || update.edited_message) as Record<string, unknown> | undefined;
  if (!msg || !msg.text) {
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const chatId = (msg.chat as Record<string, unknown>)?.id as number;
  const text = (msg.text as string).trim();

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Handle /start command
  if (text.startsWith("/start")) {
    const code = text.replace("/start", "").trim();
    if (!code) {
      await reply(chatId, "👋 مرحباً بك في نظام طلبات المتاجر!\n\nللتحدث مع متجر معين، استخدم الرابط الخاص الذي تحصل عليه من التاجر.");
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders });
    }
    const { data: workspace } = await supabase
      .from("workspaces").select("id, name, owner_id").eq("slug", code).maybeSingle();
    if (!workspace) {
      await reply(chatId, "عذراً، رمز المتجر غير صحيح. تحقق من الرابط وأعد المحاولة.");
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders });
    }

    const { data: existing } = await supabase
      .from("conversations").select("id, context").eq("telegram_chat_id", chatId).maybeSingle();

    if (existing) {
      const existingCtx = (existing.context || {}) as unknown as Context;
      if (existingCtx.order_created) {
        await reply(chatId, `👋 أهلاً بعودتك إلى ${workspace.name}!\n\nلديك طلب قيد التجهيز حالياً. إذا احتجت أي مساعدة أنا موجود.`);
      } else {
        await supabase.from("conversations").update({
          context: { messages: [], order_data: null, owner_id: workspace.owner_id, order_created: false, last_order_id: null },
          updated_at: new Date().toISOString(),
        }).eq("id", existing.id);
        await reply(chatId, `👋 أهلاً بك في ${workspace.name}!\n\nأخبرني وش تطلب اليوم؟`);
      }
    } else {
      await supabase.from("conversations").upsert({
        telegram_chat_id: chatId,
        workspace_id: workspace.id,
        context: { messages: [], order_data: null, owner_id: workspace.owner_id, order_created: false, last_order_id: null },
        status: "active",
      }, { onConflict: "telegram_chat_id" });
      console.log(`[telegram] new conversation: chat=${chatId} workspace=${workspace.id}`);
      await reply(chatId, `👋 أهلاً بك في ${workspace.name}!\n\nأخبرني وش تطلب اليوم؟`);
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders });
  }

  // Process incoming message
  const { data: conv } = await supabase
    .from("conversations").select("*").eq("telegram_chat_id", chatId).maybeSingle();

  if (!conv) {
    await reply(chatId, "👋 يرجى استخدام رابط المتجر الخاص للبدء.\n\nتواصل مع التاجر للحصول على رابط البدء.");
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders });
  }

  const context = (conv.context || {}) as unknown as Context;
  if (!context.messages) context.messages = [];
  if (!context.order_data) context.order_data = null;
  if (context.order_created === undefined) context.order_created = false;
  if (!context.last_order_id) context.last_order_id = null;

  context.messages.push({ role: "user", text, ts: new Date().toISOString() });
  if (context.messages.length > 60) context.messages = context.messages.slice(-60);

  const { data: settings } = await supabase
    .from("settings").select("business_name").eq("workspace_id", conv.workspace_id).maybeSingle();

  const businessName = settings?.business_name || "المتجر";

  // === Server-side product query detection ===
  // Catch ALL product/catalog queries BEFORE calling AI — this is the most reliable path
  const isProductQuery = /(شوف|عندك|كم سعر|كم|صور|صورة|تصوير|تفاصيل|ارني|أرني|دلني|ابغى اشوف|ابي|ابغى|ودي اشوف|ودي|وش عند|وش عندكم|وشو عندكم|عرض|الكتالوج|كتالوج|قائمة|قائمة المنتجات|منتجاتكم|منتجات|عندكم|موجود|تحت|يوجد|ارسل|ارسلي|product|catalog|products|show\s+me|send\s+catalog|show\s+catalog|view\s+products|view\s+catalog|menu|list\s+products|what\s+do\s+you\s+have|do\s+you\s+have|i\s+want|i\s+need|send\s+me)/i.test(text);
  let productHandled = false;

  if (isProductQuery && !context.order_created) {
    const productName = text
      .replace(/شوف|عندك|كم سعر|كم|صور|صورة|تصوير|تفاصيل|ارني|أرني|دلني|ابغى اشوف|ابي|ابغى|ودي اشوف|ودي|وش عند|وش عندكم|وشو عندكم|عرض|الكتالوج|كتالوج|قائمة|قائمة المنتجات|منتجاتكم|منتجات|عندكم|موجود|تحت|يوجد|ارسل|ارسلي|لي|the|a|me|my|your|please|من فضلك|لو سمحت|product|catalog|products|show\s+me|send\s+catalog|show\s+catalog|view\s+products|view\s+catalog|menu|list\s+products|what\s+do\s+you\s+have|do\s+you\s+have|i\s+want|i\s+need|send\s+me/gi, "")
      .trim();

    const { data: allProducts } = await supabase
      .from("products")
      .select("id, name, description, price, image_url, is_available")
      .eq("workspace_id", conv.workspace_id);

    const items = (allProducts ?? []) as CatalogProduct[];

    if (items.length > 0) {
      if (productName.length > 1) {
        // Look for specific product
        const match = matchCatalogProduct(productName, items);
        if (match) {
          const prod = items.find((p) => p.id === match.id);
          if (prod) {
            productHandled = true;
            const { data: slugWs } = await supabase
              .from("workspaces").select("slug").eq("id", conv.workspace_id).maybeSingle();
            const productLink = slugWs?.slug ? getProductUrl(slugWs.slug, prod.id) : null;
            const statusEmoji = prod.is_available ? "✅ متوفر" : "❌ غير متوفر";
            const details = [
              `🛍️ <b>${prod.name}</b>`,
              prod.description ? `\n${prod.description}` : "",
              `\n💰 <b>${prod.price.toFixed(2)} ر.س</b>`,
              `\n📦 ${statusEmoji}`,
              productLink ? `\n🔗 ${productLink}` : "",
            ].join("");
            if (prod.image_url) {
              await sendPhoto(chatId, prod.image_url, details);
            } else {
              await reply(chatId, details);
            }
            if (productLink) {
              await reply(chatId, `🔗 رابط المنتج: ${productLink}`);
            }
            context.messages.push({ role: "assistant", text: `هذا منتج ${prod.name} — سعره ${prod.price} ر.س. هل تحب تطلبه؟`, ts: new Date().toISOString() });
          }
        }
      }

      if (!productHandled) {
        // Show catalog list with product summaries
        productHandled = true;
        const { data: ws } = await supabase
          .from("workspaces").select("slug").eq("id", conv.workspace_id).maybeSingle();
        const link = ws?.slug ? getStoreUrl(ws.slug) : null;
        const available = items.filter((p) => p.is_available);
        const count = available.length;

        // Build a rich text summary of the catalog
        const lines: string[] = [`📋 <b>متجر ${businessName}</b> — ${count} منتج متاح\n`];
        for (const p of available.slice(0, 15)) {
          lines.push(`• <b>${p.name}</b> — ${p.price.toFixed(2)} ر.س${p.image_url ? " 🖼️" : ""}`);
        }
        if (available.length > 15) {
          lines.push(`\n... و ${available.length - 15} منتج آخر`);
        }
        if (link) {
          lines.push(`\n🔗 رابط المتجر: ${link}`);
        }
        lines.push(`\nأخبرني وش تحب تطلب بالضبط 😊`);
        await reply(chatId, lines.join("\n"));
        context.messages.push({ role: "assistant", text: `هذه قائمة منتجات ${businessName} المتاحة. أخبرني وش تحب تطلب.`, ts: new Date().toISOString() });
      }
    }
  }

  if (productHandled) {
    await supabase.from("conversations").update({
      context: context as unknown as Record<string, unknown>,
      updated_at: new Date().toISOString(),
    }).eq("id", conv.id);
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const messages = await buildMessages(businessName, context, text, supabase, conv.workspace_id);
  let { reply: aiReply, orderData } = await callAI(messages);

  // Fallback when AI is unavailable
  if (!aiReply) {
    const msgCount = context.messages.length;
    if (msgCount <= 2) {
      aiReply = `👋 شكراً لتواصلك مع ${businessName}!\n\nوش تطلب بالضبط؟`;
    } else if (!context.order_data?.customer_name) {
      aiReply = `👍 تم تسجيل طلبك.\n\nعطني اسمك عشان نكمل الطلب؟`;
    } else {
      aiReply = `شكراً! 🙏\n\nتم تسجيل رسالتك. أحد ممثلي المتجر سيتواصل معك قريباً لتأكيد الطلب.\n\nهل هناك أي شيء آخر تريد إضافته؟`;
    }
  }

  context.messages.push({ role: "assistant", text: aiReply, ts: new Date().toISOString() });

  // Post-AI check: if the AI refuses to show products/images/catalog, override it
  const refusalPattern = /لا أستطيع|لا يمكنني|cannot|can'?t|sorry|unable|not able|don'?t have|not possible|not allowed|i don'?t|i do not|ما عندي صلاحية|غير مصرح|لا املك|لا تتوفر|غير متاح/i;
  const isRefusal = refusalPattern.test(aiReply) && /صور|صورة|product|catalog|كتالوج|منتج|image|عرض/i.test(text);
  if (isRefusal) {
    // Fetch products fresh
    const { data: overrideProducts } = await supabase
      .from("products")
      .select("id, name, description, price, image_url, is_available")
      .eq("workspace_id", conv.workspace_id);
    const overrideItems = (overrideProducts ?? []) as CatalogProduct[];
    if (overrideItems.length > 0) {
      const productName = text.replace(/شوف|عندك|كم سعر|كم|صور|صورة|تصوير|تفاصيل|ارني|أرني|دلني|ابغى اشوف|ابي|ابغى|ودي اشوف|ودي|وش عند|عرض|لي|the|a|me|my|your|please|من فضلك|لو سمحت|product|catalog|products|show\s+me|send\s+catalog/gi, "").trim();
      if (productName.length > 1) {
        const match = matchCatalogProduct(productName, overrideItems);
        if (match) {
          const prod = overrideItems.find((p) => p.id === match.id);
          if (prod) {
            const { data: overrideSlugWs } = await supabase
              .from("workspaces").select("slug").eq("id", conv.workspace_id).maybeSingle();
            const productLink = overrideSlugWs?.slug ? getProductUrl(overrideSlugWs.slug, prod.id) : null;
            const statusEmoji = prod.is_available ? "✅ متوفر" : "❌ غير متوفر";
            const details = [
              `<b>${prod.name}</b>`,
              prod.description ? `\n${prod.description}` : "",
              `\n\n💰 <b>${prod.price.toFixed(2)} ر.س</b>`,
              `\n📦 ${statusEmoji}`,
            ].join("");
            if (prod.image_url) {
              await sendPhoto(chatId, prod.image_url, details);
            } else {
              await reply(chatId, details);
            }
            if (productLink) {
              await reply(chatId, `🔗 رابط المنتج: ${productLink}`);
            }
            aiReply = `تفضل معلومات ${prod.name}: السعر ${prod.price} ر.س. هل تحب تطلبه؟ 😊`;
            context.messages[context.messages.length - 1].text = aiReply;
          }
        }
      }
      if (!aiReply.includes("تفضل")) {
        // Show catalog list
        const { data: ws } = await supabase
          .from("workspaces").select("slug").eq("id", conv.workspace_id).maybeSingle();
        const link = ws?.slug ? getStoreUrl(ws.slug) : null;
        const available = overrideItems.filter((p) => p.is_available);
        const lines: string[] = [`📋 <b>متجر المنتجات</b> — ${available.length} منتج متاح\n`];
        for (const p of available.slice(0, 15)) {
          lines.push(`• <b>${p.name}</b> — ${p.price.toFixed(2)} ر.س${p.image_url ? " 🖼️" : ""}`);
        }
        if (available.length > 15) {
          lines.push(`\n... و ${available.length - 15} منتج آخر`);
        }
        if (link) {
          lines.push(`\n🔗 رابط المتجر: ${link}`);
        }
        await reply(chatId, lines.join("\n"));
        aiReply = `هذه قائمة المنتجات المتاحة. أخبرني وش تحب تطلب 😊`;
        context.messages[context.messages.length - 1].text = aiReply;
      }
    }
  }

  // Handle [CATALOG] tags for product display
  const catalogMatch = aiReply.match(/\[CATALOG\]\s*([\s\S]*?)\s*\[\/CATALOG\]/);
  if (catalogMatch) {
    try {
      const catalogCmd = JSON.parse(catalogMatch[1]);
      const catalogProducts = await supabase
        .from("products")
        .select("id, name, description, price, image_url, is_available")
        .eq("workspace_id", conv.workspace_id);
      const catItems = (catalogProducts.data ?? []) as Array<{ id: string; name: string; description: string | null; price: number; image_url: string | null; is_available: boolean }>;

      if (catalogCmd.action === "show" && catalogCmd.name) {
        const match = matchCatalogProduct(catalogCmd.name, catItems.map((p) => ({ id: p.id, name: p.name, price: p.price, category: null, is_available: p.is_available })));
        if (match) {
          const prod = catItems.find((p) => p.id === match.id);
          if (prod) {
            const { data: slugWs } = await supabase
              .from("workspaces").select("slug").eq("id", conv.workspace_id).maybeSingle();
            const productLink = slugWs?.slug ? getProductUrl(slugWs.slug, prod.id) : null;
            const statusEmoji = prod.is_available ? "✅ متوفر" : "❌ غير متوفر";
            const caption = [
              `<b>${prod.name}</b>`,
              prod.description ? `\n${prod.description}` : "",
              `\n\n💰 <b>${prod.price.toFixed(2)} ر.س</b>`,
              `\n📦 ${statusEmoji}`,
            ].join("");
            if (prod.image_url) {
              await sendPhoto(chatId, prod.image_url, caption);
            } else {
              await reply(chatId, caption);
            }
            if (productLink) {
              await reply(chatId, `🔗 رابط المنتج: ${productLink}`);
            }
          }
        }
      } else if (catalogCmd.action === "list") {
        const { data: ws } = await supabase
          .from("workspaces").select("slug").eq("id", conv.workspace_id).maybeSingle();
        if (ws?.slug) {
          const link = getStoreUrl(ws.slug);
          await reply(chatId, `📋 <b>متجر المنتجات</b>\n\nتصفح جميع منتجاتنا عبر الرابط:\n${link}`);
        }
      }
    } catch (e) {
      console.warn("[telegram] failed to parse [CATALOG]:", e);
    }
    // Remove the tag from the text reply
    aiReply = aiReply.replace(/\[CATALOG\][\s\S]*?\[\/CATALOG\]/, "").trim();
  }

  // Create order only when customer explicitly confirms and no order exists yet
  if (orderData && orderData.confirmed && orderData.customer_name && !context.order_created) {
    const orderId = await createOrder(supabase, orderData, context, conv.workspace_id, chatId, text);
    if (orderId) {
      context.order_created = true;
      context.last_order_id = orderId;
      context.order_data = orderData as unknown as Record<string, unknown>;
    }
  } else if (orderData && !orderData.confirmed && orderData.customer_name) {
    context.order_data = orderData as unknown as Record<string, unknown>;
  }

  await supabase.from("conversations").update({
    context: context as unknown as Record<string, unknown>,
    updated_at: new Date().toISOString(),
  }).eq("id", conv.id);
  await reply(chatId, aiReply);

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
