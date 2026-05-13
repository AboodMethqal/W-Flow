import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useSettings, defaults } from "@/hooks/useSettings";
import { toast } from "sonner";
import { Loader2, Save, Eye, EyeOff, CheckCircle2, Copy } from "lucide-react";

const tabs = ["عام", "واتساب", "الأتمتة", "الرسائل"];

const WEBHOOK_URL = "https://vaghwmhtztyxdxvxoiag.supabase.co/functions/v1/whatsapp-webhook";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { settings, isLoading, saveSettings } = useSettings();
  const [activeTab, setActiveTab] = useState(0);
  const [showToken, setShowToken] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form fields
  const [businessName, setBusinessName] = useState("");
  const [storeUrl, setStoreUrl] = useState("");
  const [whapiToken, setWhapiToken] = useState("");
  const [autoReply, setAutoReply] = useState(true);
  const [autoReplyMsg, setAutoReplyMsg] = useState("");
  const [dailyReport, setDailyReport] = useState(true);
  const [dailyReportPhone, setDailyReportPhone] = useState("");
  const [msgDelivering, setMsgDelivering] = useState("");
  const [msgCompleted, setMsgCompleted] = useState("");

  useEffect(() => {
    if (!isLoading) {
      setBusinessName(settings.business_name ?? "");
      setStoreUrl(settings.store_url ?? "");
      setWhapiToken(settings.whapi_token ?? "");
      setAutoReply(settings.auto_reply_enabled);
      setAutoReplyMsg(settings.auto_reply_message ?? defaults.auto_reply_message ?? "");
      setDailyReport(settings.daily_report_enabled);
      setDailyReportPhone(settings.daily_report_phone ?? "");
      setMsgDelivering(settings.msg_delivering ?? defaults.msg_delivering ?? "");
      setMsgCompleted(settings.msg_completed ?? defaults.msg_completed ?? "");
    }
  }, [isLoading, settings]);

  const handleSave = async () => {
    try {
      await saveSettings.mutateAsync({
        business_name: businessName || null,
        store_url: storeUrl || null,
        whapi_token: whapiToken || null,
        auto_reply_enabled: autoReply,
        auto_reply_message: autoReplyMsg || null,
        daily_report_enabled: dailyReport,
        daily_report_phone: dailyReportPhone || null,
        msg_delivering: msgDelivering || null,
        msg_completed: msgCompleted || null,
      });
      toast.success("تم حفظ الإعدادات بنجاح");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    }
  };

  const copyWebhook = () => {
    navigator.clipboard.writeText(WEBHOOK_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inputClass = "w-full bg-surface-container-highest rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/30 placeholder:text-on-surface-variant/40";
  const labelClass = "text-xs font-bold text-on-surface-variant block mb-2";
  const textareaClass = `${inputClass} resize-none`;

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <button
      type="button"
      onClick={onChange}
      className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${value ? "bg-primary" : "bg-surface-container-highest"}`}
    >
      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${value ? "right-1" : "left-1"}`} />
    </button>
  );

  if (isLoading) return (
    <AppLayout onNewOrder={() => {}}>
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    </AppLayout>
  );

  return (
    <AppLayout onNewOrder={() => {}}>
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold font-headline">الإعدادات</h2>
          <p className="text-xs text-on-surface-variant mt-1">{user?.email}</p>
        </div>
        <button onClick={signOut} className="px-4 py-2 bg-tertiary/10 text-tertiary rounded-xl text-sm font-bold hover:bg-tertiary/20 transition-colors">
          تسجيل الخروج
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab, i) => (
          <button key={tab} onClick={() => setActiveTab(i)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-colors whitespace-nowrap ${
              activeTab === i ? "gradient-primary text-primary-container-foreground" : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-surface-container-low rounded-2xl p-6 space-y-6">

        {/* ── Tab 0: General ── */}
        {activeTab === 0 && (
          <div className="space-y-5">
            <h3 className="font-bold font-headline text-lg">معلومات النشاط التجاري</h3>
            <div>
              <label className={labelClass}>اسم النشاط التجاري</label>
              <input value={businessName} onChange={(e) => setBusinessName(e.target.value)}
                className={inputClass} placeholder="متجر الأناقة، مطعم الشيف..." />
            </div>
            <div>
              <label className={labelClass}>رابط المتجر / الكتالوج</label>
              <input value={storeUrl} onChange={(e) => setStoreUrl(e.target.value)}
                className={inputClass} placeholder="https://your-store.com" dir="ltr" />
              <p className="text-[11px] text-on-surface-variant mt-1.5">
                يُستخدم في الرد الآلي عند استفسار العملاء عن الأسعار
              </p>
            </div>
          </div>
        )}

        {/* ── Tab 1: WhatsApp ── */}
        {activeTab === 1 && (
          <div className="space-y-5">
            <h3 className="font-bold font-headline text-lg">إعدادات واتساب (Whapi)</h3>

            <div>
              <label className={labelClass}>Whapi API Token</label>
              <div className="relative">
                <input value={whapiToken} onChange={(e) => setWhapiToken(e.target.value)}
                  type={showToken ? "text" : "password"}
                  className={`${inputClass} pl-12`} placeholder="ey..." dir="ltr" />
                <button type="button" onClick={() => setShowToken((v) => !v)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface">
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-on-surface-variant mt-1.5">
                احصل عليه من <span className="text-primary">app.whapi.cloud</span> ← Channel ← Token
              </p>
            </div>

            {/* Webhook URL */}
            <div className="bg-surface-container rounded-xl p-4 space-y-2">
              <p className="text-xs font-bold text-on-surface-variant">رابط الـ Webhook الخاص بك</p>
              <div className="flex items-center gap-2">
                <p className="font-mono text-xs text-primary break-all flex-1" dir="ltr">{WEBHOOK_URL}</p>
                <button onClick={copyWebhook}
                  className="flex-shrink-0 p-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest transition-colors">
                  {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-on-surface-variant" />}
                </button>
              </div>
              <p className="text-[11px] text-on-surface-variant">
                أضف هذا الرابط في Whapi ← Settings ← Webhooks
              </p>
            </div>

            {/* Readiness check */}
            <div className={`rounded-xl p-4 flex items-center gap-3 ${whapiToken ? "bg-green-500/10 border border-green-500/20" : "bg-surface-container border border-outline-variant/20"}`}>
              <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${whapiToken ? "text-green-500" : "text-on-surface-variant/30"}`} />
              <div>
                <p className={`text-sm font-bold ${whapiToken ? "text-green-600" : "text-on-surface-variant"}`}>
                  {whapiToken ? "النظام جاهز للعمل" : "أدخل الـ Token لتفعيل النظام"}
                </p>
                <p className="text-[11px] text-on-surface-variant">
                  {whapiToken ? "بمجرد الحفظ، سيبدأ الـ Webhook بالعمل فوراً" : "الرد الآلي والإشعارات تتطلب Token صالح"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab 2: Automation ── */}
        {activeTab === 2 && (
          <div className="space-y-5">
            <h3 className="font-bold font-headline text-lg">إعدادات الأتمتة</h3>

            {/* Auto reply toggle */}
            <div className="flex items-center justify-between p-4 bg-surface-container rounded-xl">
              <div>
                <p className="text-sm font-bold">الرد الآلي على استفسارات الأسعار</p>
                <p className="text-[11px] text-on-surface-variant mt-0.5">
                  يرد تلقائياً عند ذكر: سعر، بكم، تفاصيل، قديش
                </p>
              </div>
              <Toggle value={autoReply} onChange={() => setAutoReply((v) => !v)} />
            </div>

            {/* Daily report toggle */}
            <div className="flex items-center justify-between p-4 bg-surface-container rounded-xl">
              <div>
                <p className="text-sm font-bold">التقرير اليومي عبر واتساب</p>
                <p className="text-[11px] text-on-surface-variant mt-0.5">ملخص المبيعات يومياً الساعة 8 مساءً</p>
              </div>
              <Toggle value={dailyReport} onChange={() => setDailyReport((v) => !v)} />
            </div>

            {dailyReport && (
              <div>
                <label className={labelClass}>رقم هاتفك لاستقبال التقرير</label>
                <input value={dailyReportPhone} onChange={(e) => setDailyReportPhone(e.target.value)}
                  className={inputClass} placeholder="+966..." dir="ltr" />
              </div>
            )}

            {/* Status notifications info */}
            <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl space-y-1">
              <p className="text-sm font-bold text-primary">إشعارات تغيير الحالة</p>
              <p className="text-[11px] text-on-surface-variant">
                عند نقل طلب لـ "قيد التوصيل" أو "مكتمل"، يتلقى العميل رسالة تلقائية.
                يتطلب ضبط Database Webhook في Supabase على جدول orders.
              </p>
            </div>
          </div>
        )}

        {/* ── Tab 3: Messages ── */}
        {activeTab === 3 && (
          <div className="space-y-5">
            <h3 className="font-bold font-headline text-lg">نصوص الرسائل التلقائية</h3>
            <p className="text-xs text-on-surface-variant">
              المتغيرات المتاحة:
              <span className="font-mono text-primary mx-1">{"{customer_name}"}</span>
              <span className="font-mono text-primary mx-1">{"{order_number}"}</span>
              <span className="font-mono text-primary mx-1">{"{store_url}"}</span>
            </p>

            <div>
              <label className={labelClass}>رسالة الرد الآلي (استفسارات الأسعار)</label>
              <textarea value={autoReplyMsg} onChange={(e) => setAutoReplyMsg(e.target.value)}
                rows={3} className={textareaClass}
                placeholder="مرحباً! للاطلاع على أسعارنا..." />
            </div>

            <div>
              <label className={labelClass}>رسالة الشحن (عند نقل الطلب لـ "قيد التوصيل")</label>
              <textarea value={msgDelivering} onChange={(e) => setMsgDelivering(e.target.value)}
                rows={3} className={textareaClass}
                placeholder="أهلاً {customer_name}، طلبك رقم #{order_number} تم شحنه..." />
            </div>

            <div>
              <label className={labelClass}>رسالة الإتمام (عند نقل الطلب لـ "مكتمل")</label>
              <textarea value={msgCompleted} onChange={(e) => setMsgCompleted(e.target.value)}
                rows={3} className={textareaClass}
                placeholder="أهلاً {customer_name}، طلبك رقم #{order_number} تم تسليمه..." />
            </div>
          </div>
        )}

        {/* Save button */}
        <div className="pt-2 border-t border-outline-variant/10">
          <button onClick={handleSave} disabled={saveSettings.isPending}
            className="gradient-primary text-primary-container-foreground px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
          >
            {saveSettings.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saveSettings.isPending ? "جاري الحفظ..." : "حفظ الإعدادات"}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
