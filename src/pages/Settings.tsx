import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useSettings, defaults } from "@/hooks/useSettings";
import ApiKeysSection from "@/components/settings/ApiKeysSection";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const { settings, isLoading, saveSettings } = useSettings();

  const [businessName, setBusinessName] = useState("");
  const [storeUrl, setStoreUrl] = useState("");
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
        auto_reply_enabled: autoReply,
        auto_reply_message: autoReplyMsg || null,
        daily_report_enabled: dailyReport,
        daily_report_phone: dailyReportPhone || null,
        msg_delivering: msgDelivering || null,
        msg_completed: msgCompleted || null,
      });
      toast.success("تم حفظ الاعدادات بنجاح");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطا");
    }
  };

  const inputClass =
    "w-full bg-surface-container-highest rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/30 placeholder:text-on-surface-variant/40";
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

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto pb-10 space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-extrabold font-headline">الاعدادات</h2>
            <p className="text-xs text-on-surface-variant mt-1">{user?.email}</p>
          </div>
        </div>

        {/* Business Info */}
        <div className="bg-surface-container-low rounded-2xl p-5 space-y-4 border border-outline-variant/10">
          <h3 className="font-bold text-sm">معلومات النشاط التجاري</h3>
          <div>
            <label className={labelClass}>اسم النشاط التجاري</label>
            <input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className={inputClass}
              placeholder="متجر الاناقة، مطعم الشيف..."
            />
          </div>
          <div>
            <label className={labelClass}>رابط المتجر / الكتالوج</label>
            <input
              value={storeUrl}
              onChange={(e) => setStoreUrl(e.target.value)}
              className={inputClass}
              placeholder="https://your-store.com"
              dir="ltr"
            />
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-surface-container-low rounded-2xl p-5 space-y-4 border border-outline-variant/10">
          <h3 className="font-bold text-sm">اعدادات الاشعارات</h3>

          {/* Auto reply toggle */}
          <div className="flex items-center justify-between p-4 bg-surface-container rounded-xl">
            <div>
              <p className="text-sm font-bold">الرد الآلي على الاستفسارات</p>
              <p className="text-[11px] text-on-surface-variant mt-0.5">
                يرد تلقائيا عند ذكر: سعر، بكم، تفاصيل
              </p>
            </div>
            <Toggle value={autoReply} onChange={() => setAutoReply((v) => !v)} />
          </div>

          {autoReply && (
            <div>
              <label className={labelClass}>نص الرد الآلي</label>
              <textarea
                value={autoReplyMsg}
                onChange={(e) => setAutoReplyMsg(e.target.value)}
                rows={3}
                className={textareaClass}
                placeholder="مرحبا! للاطلاع على اسعارنا..."
              />
            </div>
          )}

          {/* Daily report toggle */}
          <div className="flex items-center justify-between p-4 bg-surface-container rounded-xl">
            <div>
              <p className="text-sm font-bold">التقرير اليومي عبر واتساب</p>
              <p className="text-[11px] text-on-surface-variant mt-0.5">ملخص المبيعات يوميا الساعة 8 مساءً</p>
            </div>
            <Toggle value={dailyReport} onChange={() => setDailyReport((v) => !v)} />
          </div>

          {dailyReport && (
            <div>
              <label className={labelClass}>رقم هاتفك لاستقبال التقرير</label>
              <input
                value={dailyReportPhone}
                onChange={(e) => setDailyReportPhone(e.target.value)}
                className={inputClass}
                placeholder="+966..."
                dir="ltr"
              />
            </div>
          )}
        </div>

        {/* Message templates */}
        <div className="bg-surface-container-low rounded-2xl p-5 space-y-4 border border-outline-variant/10">
          <h3 className="font-bold text-sm">رسائل تغيير الحالة</h3>
          <p className="text-xs text-on-surface-variant">
            المتغيرات المتاحة:{" "}
            <span className="font-mono text-primary">{"{customer_name}"}</span>{" "}
            <span className="font-mono text-primary">{"{order_number}"}</span>
          </p>

          <div>
            <label className={labelClass}>رسالة عند "جاهز للاستلام"</label>
            <textarea
              value={msgDelivering}
              onChange={(e) => setMsgDelivering(e.target.value)}
              rows={3}
              className={textareaClass}
              placeholder="مرحبا {customer_name}، طلبك رقم #{order_number} جاهز..."
            />
          </div>

          <div>
            <label className={labelClass}>رسالة عند "مسلّم"</label>
            <textarea
              value={msgCompleted}
              onChange={(e) => setMsgCompleted(e.target.value)}
              rows={3}
              className={textareaClass}
              placeholder="شكرا لك {customer_name}! تم تسليم طلبك رقم #{order_number}..."
            />
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saveSettings.isPending}
          className="w-full gradient-primary text-primary-container-foreground py-4 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 text-base shadow-md"
        >
          {saveSettings.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {saveSettings.isPending ? "جاري الحفظ..." : "حفظ الاعدادات"}
        </button>

        {/* API Keys Section */}
        <ApiKeysSection />
      </div>
    </AppLayout>
  );
}
