import { createClient } from "jsr:@supabase/supabase-js@2";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

interface ExtractedOrder {
  customer_name: string | null;
  product: string | null;
  price: number | null;
  phone: string | null;
  raw_text: string;
}

const SYSTEM_PROMPT = `
أنت مساعد ذكي لاستخراج بيانات الطلبات من رسائل واتساب باللغة العربية أو الإنجليزية.
استخرج المعلومات التالية من الرسالة وأعدها كـ JSON فقط بدون أي نص إضافي:

{
  "customer_name": "اسم العميل أو null إذا غير موجود",
  "product": "اسم المنتج أو الخدمة المطلوبة أو null",
  "price": رقم السعر بدون رموز العملة أو null إذا غير موجود,
  "phone": "رقم الهاتف بصيغة دولية أو null إذا غير موجود"
}

قواعد مهمة:
- أعد JSON فقط، لا تضف أي شرح أو نص خارج الـ JSON
- إذا لم تجد معلومة، ضع null
- السعر يجب أن يكون رقماً فقط (مثال: 150 وليس "150 ريال")
- استنتج المعلومات من السياق حتى لو لم تُذكر صراحةً
`.trim();

Deno.serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const { message } = await req.json();
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return new Response(JSON.stringify({ error: "message field is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call Gemini API
    const geminiRes = await fetch(`${GEMINI_API_URL}?key=${geminiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: `${SYSTEM_PROMPT}\n\nالرسالة:\n${message.trim()}` },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,       // low temp for deterministic JSON output
          maxOutputTokens: 256,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return new Response(JSON.stringify({ error: "Gemini API error", details: errText }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const geminiData = await geminiRes.json();
    const rawText: string =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // Strip markdown code fences if Gemini wraps the JSON
    const jsonString = rawText.replace(/```(?:json)?/gi, "").trim();

    let extracted: ExtractedOrder;
    try {
      extracted = JSON.parse(jsonString);
    } catch {
      return new Response(
        JSON.stringify({ error: "Failed to parse Gemini response", raw: rawText }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Attach raw_text for reference
    extracted.raw_text = message.trim();

    return new Response(JSON.stringify({ data: extracted }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
