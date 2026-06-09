import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useSettings, defaults } from "@/hooks/useSettings";
import { useWorkspace } from "@/hooks/useWorkspace";
import StoreLinks from "@/components/settings/StoreLinks";
import StoreInfo from "@/components/settings/StoreInfo";
import ApiKeysSection from "@/components/settings/ApiKeysSection";
import { toast } from "sonner";
import { Loader2, Save, Store, Bell, MessageSquare, Key, Info } from "lucide-react";

type Tab = "store" | "notifications" | "messages" | "api";

export default function SettingsPage() {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { settings, isLoading, saveSettings } = useSettings();
  const [activeTab, setActiveTab] = useState<Tab>("store");

  const [autoReply, setAutoReply] = useState(true);
  const [autoReplyMsg, setAutoReplyMsg] = useState("");
  const [dailyReport, setDailyReport] = useState(true);
  const [dailyReportPhone, setDailyReportPhone] = useState("");
  const [msgDelivering, setMsgDelivering] = useState("");
  const [msgCompleted, setMsgCompleted] = useState("");

  useEffect(() => {
    if (!isLoading) {
      setAutoReply(settings.auto_reply_enabled);
      setAutoReplyMsg(settings.auto_reply_message ?? defaults.auto_reply_message ?? "");
      setDailyReport(settings.daily_report_enabled);
      setDailyReportPhone(settings.daily_report_phone ?? "");
      setMsgDelivering(settings.msg_delivering ?? defaults.msg_delivering ?? "");
      setMsgCompleted(settings.msg_completed ?? defaults.msg_completed ?? "");
    }
  }, [isLoading, settings]);

  const handleSaveNotifications = async () => {
    try {
      await saveSettings.mutateAsync({
        auto_reply_enabled: autoReply,
        auto_reply_message: autoReplyMsg || null,
        daily_report_enabled: dailyReport,
        daily_report_phone: dailyReportPhone || null,
      });
      toast.success("تم حفظ إعدادات الإشعارات");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    }
  };

  const handleSaveMessages = async () => {
    try {
      await saveSettings.mutateAsync({
        msg_delivering: msgDelivering || null,
        msg_completed: msgCompleted || null,
      });
      toast.success("تم حفظ قوالب الرسائل");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
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

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "store", label: "المتجر", icon: <Store className="w-4 h-4" /> },
    { id: "notifications", label: "الإشعارات", icon: <Bell className="w-4 h-4" /> },
    { id: "messages", label: "الرسائل", icon: <MessageSquare className="w-4 h-4" /> },
    { id: "api", label: "API", icon: <Key className="w-4 h-4" /> },
  ];

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto pb-10 px-2" dir="rtl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-extrabold font-headline">الإعدادات</h2>
            <p className="text-xs text-on-surface-variant mt-1">{user?.email}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface-container-low rounded-xl p-1 mb-6 border border-outline-variant/10 overflow-x-auto">
          {tabs.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === id
                  ? "bg-surface-container-highest text-on-surface shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Store Tab */}
            {activeTab === "store" && (
              <div className="space-y-6">
                {/* Store Info */}
                <div className="bg-surface-container-low rounded-2xl p-5 space-y-4 border border-outline-variant/10">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-primary" />
                    <h3 className="font-bold text-sm">معلومات المتجر</h3>
                    <span className="text-[10px] text-on-surface-variant/50">ستظهر تلقائياً في متجرك العام</span>
                  </div>
                  <StoreInfo />
                </div>

                {/* Store Links */}
                <StoreLinks />
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <div className="bg-surface-container-low rounded-2xl p-5 space-y-4 border border-outline-variant/10">
                <h3 className="font-bold text-sm">إعدادات الإشعارات</h3>

                <div className="flex items-center justify-between p-4 bg-surface-container rounded-xl">
                  <div>
                    <p className="text-sm font-bold">الرد الآلي على الاستفسارات</p>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                      يرد تلقائياً عند ذكر: سعر، بكم، تفاصيل
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
                      placeholder="مرحباً! للاطلاع على أسعارنا..."
                    />
                  </div>
                )}

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
                    <input
                      value={dailyReportPhone}
                      onChange={(e) => setDailyReportPhone(e.target.value)}
                      className={inputClass}
                      placeholder="+966..."
                      dir="ltr"
                    />
                  </div>
                )}

                <button
                  onClick={handleSaveNotifications}
                  disabled={saveSettings.isPending}
                  className="w-full gradient-primary text-primary-container-foreground py-3.5 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 text-sm shadow-md"
                >
                  {saveSettings.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saveSettings.isPending ? "جاري الحفظ..." : "حفظ إعدادات الإشعارات"}
                </button>
              </div>
            )}

            {/* Messages Tab */}
            {activeTab === "messages" && (
              <div className="bg-surface-container-low rounded-2xl p-5 space-y-4 border border-outline-variant/10">
                <div>
                  <h3 className="font-bold text-sm">قوالب رسائل الحالات</h3>
                  <p className="text-xs text-on-surface-variant mt-1">
                    المتغيرات المتاحة:{" "}
                    <span className="font-mono text-primary">{"{customer_name}"}</span>{" "}
                    <span className="font-mono text-primary">{"{order_number}"}</span>
                  </p>
                </div>

                <div>
                  <label className={labelClass}>رسالة "جاهز للاستلام"</label>
                  <textarea
                    value={msgDelivering}
                    onChange={(e) => setMsgDelivering(e.target.value)}
                    rows={3}
                    className={textareaClass}
                    placeholder={`مرحباً {customer_name}، طلبك رقم #${"{order_number}"} جاهز...`}
                  />
                </div>

                <div>
                  <label className={labelClass}>رسالة "تم التسليم"</label>
                  <textarea
                    value={msgCompleted}
                    onChange={(e) => setMsgCompleted(e.target.value)}
                    rows={3}
                    className={textareaClass}
                    placeholder={`شكراً لك {customer_name}! تم تسليم طلبك رقم #${"{order_number}"}...`}
                  />
                </div>

                <button
                  onClick={handleSaveMessages}
                  disabled={saveSettings.isPending}
                  className="w-full gradient-primary text-primary-container-foreground py-3.5 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 text-sm shadow-md"
                >
                  {saveSettings.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saveSettings.isPending ? "جاري الحفظ..." : "حفظ قوالب الرسائل"}
                </button>
              </div>
            )}

            {/* API Tab */}
            {activeTab === "api" && <ApiKeysSection />}
          </>
        )}
      </div>
    </AppLayout>
  );
}
