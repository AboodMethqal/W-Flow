import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowRight, Printer, Sparkles, User, MapPin, CreditCard, Clock,
  CheckCircle2, Circle, Package, Phone, Navigation, ShieldCheck,
  Send, Truck, Plus,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { useOrderDetails } from "@/hooks/useOrderDetails";
import { useOrders } from "@/hooks/useOrders";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { useState } from "react";

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: "قيد الانتظار", color: "bg-on-surface-variant" },
  processing: { label: "قيد المعالجة", color: "bg-primary" },
  delivering: { label: "قيد التوصيل", color: "bg-whatsapp" },
  completed: { label: "مكتمل", color: "bg-primary" },
  cancelled: { label: "ملغي", color: "bg-tertiary" },
};

const statusTimeline = [
  { key: "pending", label: "تم إنشاء الطلب", icon: CheckCircle2 },
  { key: "processing", label: "تأكيد الدفع", icon: ShieldCheck },
  { key: "delivering", label: "جاري التجهيز", icon: Package },
  { key: "completed", label: "بالانتظار شركة الشحن", icon: Truck },
];

const statusOrder = ["pending", "processing", "delivering", "completed"];

// Inline editable field — shows button when empty, input when editing
function InlineField({
  value, placeholder, onSave, multiline = false,
}: {
  value: string | null;
  placeholder: string;
  onSave: (v: string) => Promise<void>;
  multiline?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!draft.trim()) return;
    setSaving(true);
    try {
      await onSave(draft.trim());
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    if (value) return <p className="text-sm">{value}</p>;
    return (
      <button
        onClick={() => { setDraft(""); setEditing(true); }}
        className="flex items-center gap-1.5 text-xs text-on-surface-variant/60 border border-dashed border-outline-variant/40 rounded-lg px-3 py-1.5 hover:border-primary/40 hover:text-primary transition-colors"
      >
        <Plus className="w-3 h-3" />
        {placeholder}
      </button>
    );
  }

  return (
    <div className="space-y-2">
      {multiline ? (
        <textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          className="w-full bg-surface-container-highest rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
        />
      ) : (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
          className="w-full bg-surface-container-highest rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
      )}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving || !draft.trim()}
          className="text-xs font-bold text-primary hover:underline disabled:opacity-40"
        >
          {saving ? "جاري الحفظ..." : "حفظ"}
        </button>
        <button onClick={() => setEditing(false)} className="text-xs text-on-surface-variant hover:underline">
          إلغاء
        </button>
      </div>
    </div>
  );
}

export default function OrderDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { order, isLoading } = useOrderDetails(id);
  const { updateOrderStatus } = useOrders();
  const queryClient = useQueryClient();

  const updateField = async (field: string, value: string) => {
    const { error } = await supabase.from("orders").update({ [field]: value }).eq("id", id!);
    if (error) { toast.error(error.message); throw error; }
    queryClient.invalidateQueries({ queryKey: ["order", id] });
    toast.success("تم الحفظ");
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!order) {
    return (
      <AppLayout>
        <div className="text-center py-20 text-on-surface-variant">
          <p className="text-lg">لم يتم العثور على الطلب</p>
          <button onClick={() => navigate("/orders")} className="text-primary mt-4 underline">
            العودة للطلبات
          </button>
        </div>
      </AppLayout>
    );
  }

  const currentStatusIndex = statusOrder.indexOf(order.status);
  const timeAgo = formatDistanceToNow(new Date(order.created_at), { locale: ar, addSuffix: false });
  const st = statusMap[order.status];

  const handleStatusChange = (newStatus: typeof order.status) => {
    updateOrderStatus.mutate(
      { id: order.id, status: newStatus },
      {
        onSuccess: () => toast.success("تم تحديث حالة الطلب"),
        onError: (err) => toast.error(err.message),
      }
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Breadcrumb + header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
            <button onClick={() => navigate("/orders")} className="hover:text-primary transition-colors flex items-center gap-1">
              الطلبات
              <ArrowRight className="w-3 h-3 rotate-180" />
            </button>
            <span>تفاصيل الطلب #{order.order_number}</span>
            <span className="text-on-surface-variant/40">ORD-{order.order_number}</span>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <h1 className="text-2xl md:text-3xl font-extrabold font-headline">
              تفاصيل الطلب <span className="text-primary">#{order.order_number}</span>
            </h1>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 bg-surface-container-high hover:bg-surface-container-highest px-5 py-2.5 rounded-xl text-sm font-bold transition-colors">
                <Printer className="w-4 h-4" />
                طباعة الفاتورة
              </button>
              <button className="flex items-center gap-2 gradient-primary text-primary-container-foreground px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity">
                <Sparkles className="w-4 h-4" />
                إنشاء وإرسال الرابط السحري
              </button>
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Right column - main info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status + Amount card */}
            <div className="bg-surface-container-low rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${st.color}`} />
                  <span className="text-sm font-bold">{st.label}</span>
                </div>
                <div className="flex items-center gap-2 text-on-surface-variant text-xs">
                  <Clock className="w-3.5 h-3.5" />
                  منذ {timeAgo}
                </div>
              </div>

              <div>
                <p className="text-xs text-on-surface-variant mb-1">إجمالي المبلغ</p>
                <p className="text-3xl font-extrabold font-headline text-primary tabular-nums">
                  {Number(order.amount).toLocaleString("ar-SA", { minimumFractionDigits: 2 })} <span className="text-lg">ر.س</span>
                </p>
              </div>

              {/* Customer / Delivery / Payment */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-outline-variant/10">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-on-surface-variant text-xs">
                    <User className="w-3.5 h-3.5" />
                    معلومات العميل
                  </div>
                  <p className="font-bold">{order.customer_name}</p>
                  {order.phone && (
                    <p className="text-xs text-on-surface-variant flex items-center gap-1.5">
                      <Phone className="w-3 h-3" /> {order.phone}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-on-surface-variant text-xs">
                    <MapPin className="w-3.5 h-3.5" />
                    تفاصيل التوصيل
                  </div>
                  <InlineField
                    value={order.address}
                    placeholder="إضافة عنوان"
                    onSave={(v) => updateField("address", v)}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-on-surface-variant text-xs">
                    <CreditCard className="w-3.5 h-3.5" />
                    طريقة الدفع
                  </div>
                  <InlineField
                    value={order.payment_method}
                    placeholder="إضافة طريقة الدفع"
                    onSave={(v) => updateField("payment_method", v)}
                  />
                </div>
              </div>
            </div>

            {/* Product list */}
            <div className="bg-surface-container-low rounded-2xl p-6">
              <h3 className="font-bold font-headline text-lg mb-4">
                قائمة المنتجات ({order.items.length})
              </h3>
              {order.items.length === 0 ? (
                <p className="text-on-surface-variant text-sm text-center py-8">لا توجد منتجات مضافة لهذا الطلب</p>
              ) : (
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 bg-surface-container rounded-xl p-4">
                      <div className="w-16 h-16 rounded-xl bg-surface-container-highest flex items-center justify-center overflow-hidden flex-shrink-0">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-6 h-6 text-on-surface-variant/40" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm">{item.product_name}</p>
                        {item.sku && <p className="text-[11px] text-on-surface-variant">SKU: {item.sku}</p>}
                      </div>
                      <div className="text-center px-4">
                        <p className="text-[10px] text-on-surface-variant">الكمية</p>
                        <p className="font-bold text-sm tabular-nums">{String(item.quantity).padStart(2, "0")}</p>
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] text-on-surface-variant">السعر</p>
                        <p className="font-bold text-sm tabular-nums text-primary">
                          {Number(item.price).toLocaleString("ar-SA", { minimumFractionDigits: 2 })} ر.س
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick action buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleStatusChange("processing")}
                className="flex items-center gap-2 bg-surface-container-low hover:bg-surface-container px-5 py-3 rounded-xl text-sm font-bold transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-primary" />
                تأكيد الدفع
              </button>
              <button className="flex items-center gap-2 bg-surface-container-low hover:bg-surface-container px-5 py-3 rounded-xl text-sm font-bold transition-colors">
                <Navigation className="w-4 h-4 text-primary" />
                طلب الموقع
              </button>
              <button className="flex items-center gap-2 bg-surface-container-low hover:bg-surface-container px-5 py-3 rounded-xl text-sm font-bold transition-colors">
                <Send className="w-4 h-4 text-primary" />
                إرسال رقم التتبع
              </button>
            </div>
          </div>

          {/* Left column - sidebar */}
          <div className="space-y-6">
            {/* AI Analysis */}
            <div className="bg-surface-container-low rounded-2xl p-5 space-y-4 border border-primary/10">
              <div className="flex items-center gap-2">
                <h3 className="font-bold font-headline">تحليل AI الذكي</h3>
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <p className="text-[11px] text-on-surface-variant">توصيات مدعومة بالذكاء الاصطناعي</p>
              <div className="bg-surface-container rounded-xl p-4 border border-primary/5">
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  "هذا العميل يفضل التوصيل في الفترة المسائية. تم تحسين مسار التوصيل بناءً على ذلك."
                </p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-on-surface-variant">احتمالية تكرار الشراء</span>
                <span className="text-2xl font-extrabold font-headline text-primary">85%</span>
              </div>
            </div>

            {/* Delivery map placeholder */}
            <div className="bg-surface-container-low rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="font-bold font-headline">موقع التسليم</h3>
                <Navigation className="w-5 h-5 text-on-surface-variant" />
              </div>
              <div className="bg-surface-container-highest rounded-xl h-40 flex items-center justify-center">
                <MapPin className="w-8 h-8 text-primary/30" />
              </div>
              <button className="w-full text-center text-sm text-primary font-bold bg-surface-container hover:bg-surface-container-high rounded-xl py-3 transition-colors">
                فتح في خرائط جوجل
              </button>
            </div>

            {/* Status timeline */}
            <div className="bg-surface-container-low rounded-2xl p-5 space-y-4">
              <h3 className="font-bold font-headline text-center">تتبع الحالة</h3>
              <div className="space-y-0 relative">
                {statusTimeline.map((step, i) => {
                  const reached = i <= currentStatusIndex;
                  const Icon = step.icon;
                  return (
                    <div key={step.key} className="flex items-start gap-3 relative pb-6 last:pb-0">
                      {i < statusTimeline.length - 1 && (
                        <div className={`absolute right-[11px] top-7 w-0.5 h-full ${reached ? "bg-primary/40" : "bg-surface-container-highest"}`} />
                      )}
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${reached ? "bg-primary text-primary-foreground" : "bg-surface-container-highest text-on-surface-variant/40"}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className={`text-sm font-bold ${reached ? "text-on-surface" : "text-on-surface-variant/40"}`}>
                          {step.label}
                        </p>
                        {reached && (
                          <p className="text-[10px] text-on-surface-variant">
                            {i === currentStatusIndex ? `منذ ${timeAgo}` : "تم"}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
