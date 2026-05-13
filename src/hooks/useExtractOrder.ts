import { useState } from "react";

export interface ExtractedOrder {
  customer_name: string | null;
  product: string | null;
  price: number | null;
  phone: string | null;
  raw_text: string;
}

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent";

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

export function useExtractOrder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractFromMessage = async (message: string): Promise<ExtractedOrder | null> => {
    // Guard: prevent double calls while already loading
    if (loading) return null;

    setLoading(true);
    setError(null);

    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!geminiKey || geminiKey === "ضع_مفتاحك_هنا") {
      setError("GEMINI_API_KEY غير مضبوط في ملف .env");
      setLoading(false);
      return null;
    }

    try {
      const res = await fetch(`${GEMINI_API_URL}?key=${geminiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\nالرسالة:\n${message.trim()}` }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 256 },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        // Friendly message for rate limit
        if (res.status === 429) {
          throw new Error("تجاوزت الحد المجاني، انتظر دقيقة ثم حاول مجدداً");
        }
        throw new Error(`Gemini error ${res.status}: ${errText}`);
      }

      const json = await res.json();
      const rawText: string = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      const jsonString = rawText.replace(/```(?:json)?/gi, "").trim();

      const extracted: ExtractedOrder = JSON.parse(jsonString);
      extracted.raw_text = message.trim();
      return extracted;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "حدث خطأ أثناء استخراج البيانات";
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { extractFromMessage, loading, error };
}
