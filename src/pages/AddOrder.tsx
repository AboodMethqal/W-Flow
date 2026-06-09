import { useState } from "react";
import { ArrowRight, Truck, Store, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { useOrders } from "@/hooks/useOrders";
import { useResolveCustomer } from "@/hooks/useResolveCustomer";
import { toast } from "sonner";

export default function AddOrderPage() {
  const navigate = useNavigate();
  const { addOrder } = useOrders();
  const { resolveCustomer } = useResolveCustomer();

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [details, setDetails] = useState("");
  const [amount, setAmount] = useState("");
  const [deliveryType, setDeliveryType] = useState<"delivery" | "pickup">("delivery");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deliveryType === "delivery" && !address.trim()) {
      toast.error("العنوان مطلوب للتوصيل المنزلي");
      return;
    }
    setLoading(true);
    try {
      const customerId = await resolveCustomer(phone.trim(), customerName.trim());
      const order = await addOrder.mutateAsync({
        customer_id: customerId,
        customer_name: customerName.trim(),
        phone: phone.trim(),
        details,
        amount: parseFloat(amount) || 0,
        status: "pending",
        source: "store",
        address: deliveryType === "delivery" ? address.trim() : null,
      });
      toast.success("تم اضافة الطلب بنجاح");
      navigate(`/orders/${order.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "حدث خطا اثناء اضافة الطلب");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full bg-surface-container-highest rounded-xl px-4 py-3.5 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/30 placeholder:text-on-surface-variant/40";
  const labelClass = "text-xs font-bold text-on-surface-variant block mb-2";

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto pb-10" dir="rtl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest transition-colors text-on-surface-variant"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-extrabold text-on-surface font-headline">طلب جديد</h2>
            <p className="text-on-surface-variant text-sm mt-0.5">ادخل بيانات الطلب</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Customer Info */}
          <div className="bg-surface-container-low rounded-2xl p-5 space-y-4 border border-outline-variant/10">
            <h3 className="font-bold text-sm">بيانات العميل</h3>
            <div>
              <label className={labelClass}>اسم العميل</label>
              <input
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className={inputClass}
                placeholder="ادخل اسم العميل"
              />
            </div>
            <div>
              <label className={labelClass}>رقم الهاتف</label>
              <input
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
                placeholder="+966..."
                dir="ltr"
              />
            </div>
          </div>

          {/* Order Info */}
          <div className="bg-surface-container-low rounded-2xl p-5 space-y-4 border border-outline-variant/10">
            <h3 className="font-bold text-sm">تفاصيل الطلب</h3>
            <div>
              <label className={labelClass}>تفاصيل الطلب</label>
              <textarea
                required
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className={`${inputClass} resize-none h-24`}
                placeholder="صف الطلب هنا..."
              />
            </div>
            <div>
              <label className={labelClass}>المبلغ (ر.س)</label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={inputClass}
                placeholder="0.00"
                dir="ltr"
              />
            </div>
          </div>

          {/* Delivery Type */}
          <div className="bg-surface-container-low rounded-2xl p-5 space-y-4 border border-outline-variant/10">
            <h3 className="font-bold text-sm">نوع الاستلام</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeliveryType("delivery")}
                className={`flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold border-2 transition-all ${
                  deliveryType === "delivery"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-outline-variant/20 bg-surface-container-highest text-on-surface-variant"
                }`}
              >
                <Truck className="w-4 h-4" />
                توصيل منزلي
              </button>
              <button
                type="button"
                onClick={() => setDeliveryType("pickup")}
                className={`flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold border-2 transition-all ${
                  deliveryType === "pickup"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-outline-variant/20 bg-surface-container-highest text-on-surface-variant"
                }`}
              >
                <Store className="w-4 h-4" />
                استلام من الفرع
              </button>
            </div>

            {deliveryType === "delivery" && (
              <div>
                <label className={labelClass}>
                  العنوان <span className="text-destructive">*</span>
                </label>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={inputClass}
                  placeholder="المدينة، الحي، الشارع..."
                />
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full gradient-primary text-primary-container-foreground py-4 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 text-base shadow-lg"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {loading ? "جاري الاضافة..." : "اضافة الطلب"}
          </button>
        </form>
      </div>
    </AppLayout>
  );
}
