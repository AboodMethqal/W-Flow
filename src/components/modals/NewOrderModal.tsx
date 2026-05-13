import { useState, useEffect } from "react";
import { X, Loader2, Sparkles, ChevronDown, ChevronUp, Truck, Store } from "lucide-react";
import { toast } from "sonner";
import { useOrders } from "@/hooks/useOrders";
import { useResolveCustomer } from "@/hooks/useResolveCustomer";
import { useExtractOrder } from "@/hooks/useExtractOrder";
import { useQueryClient } from "@tanstack/react-query";

export interface PrefillData {
  customerName?: string;
  phone?: string;
  details?: string;
}

interface NewOrderModalProps {
  open: boolean;
  onClose: () => void;
  prefillData?: PrefillData;
}

export default function NewOrderModal({ open, onClose, prefillData }: NewOrderModalProps) {
  const { addOrder } = useOrders();
  const { resolveCustomer } = useResolveCustomer();
  const { extractFromMessage, loading: extracting, error } = useExtractOrder();
  const queryClient = useQueryClient();

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [details, setDetails] = useState("");
  const [amount, setAmount] = useState("");
  const [deliveryType, setDeliveryType] = useState<"delivery" | "pickup">("delivery");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [showExtractor, setShowExtractor] = useState(false);
  const [waMessage, setWaMessage] = useState("");

  // Prefill when modal opens with data
  useEffect(() => {
    if (open && prefillData) {
      if (prefillData.customerName) setCustomerName(prefillData.customerName);
      if (prefillData.phone) setPhone(prefillData.phone);
      if (prefillData.details) setDetails(prefillData.details);
    }
  }, [open, prefillData]);

  if (!open) return null;

  const isPrefilled = !!prefillData;

  const reset = () => {
    setCustomerName("");
    setPhone("");
    setDetails("");
    setAmount("");
    setAddress("");
    setDeliveryType("delivery");
    setWaMessage("");
    setShowExtractor(false);
  };

  const handleExtract = async () => {
    if (!waMessage.trim()) return;
    const result = await extractFromMessage(waMessage);
    if (!result) {
      toast.error(error ?? "تعذّر استخراج البيانات، حاول مجدداً");
      return;
    }
    if (result.customer_name) setCustomerName(result.customer_name);
    if (result.phone) setPhone(result.phone);
    if (result.product) setDetails(result.product);
    if (result.price) setAmount(String(result.price));
    toast.success("تم استخراج البيانات بنجاح");
    setShowExtractor(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deliveryType === "delivery" && !address.trim()) {
      toast.error("العنوان مطلوب للتوصيل المنزلي");
      return;
    }
    setLoading(true);
    try {
      const customerId = await resolveCustomer(phone.trim(), customerName.trim());
      await addOrder.mutateAsync({
        customer_id: customerId,
        customer_name: customerName.trim(),
        phone: phone.trim(),
        details,
        amount: parseFloat(amount) || 0,
        status: "pending",
        source: "whatsapp",
        address: deliveryType === "delivery" ? address.trim() : null,
      });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("تمت إضافة الطلب بنجاح");
      reset();
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ أثناء إضافة الطلب");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-container rounded-2xl p-6 w-full max-w-md animate-fade-in shadow-2xl border border-outline-variant/10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold font-headline">طلب جديد</h2>
            {isPrefilled && (
              <p className="text-xs text-primary mt-0.5">البيانات معبأة من رسالة واتساب</p>
            )}
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* WhatsApp extractor — hide when prefilled */}
          {!isPrefilled && (
            <div className="rounded-xl border border-outline-variant/20 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowExtractor((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 bg-surface-container-highest text-sm font-bold hover:bg-surface-container transition-colors"
              >
                <span className="flex items-center gap-2 text-primary">
                  <Sparkles className="w-4 h-4" />
                  استخراج تلقائي من رسالة واتساب
                </span>
                {showExtractor ? <ChevronUp className="w-4 h-4 text-on-surface-variant" /> : <ChevronDown className="w-4 h-4 text-on-surface-variant" />}
              </button>
              {showExtractor && (
                <div className="p-4 space-y-3 bg-surface-container-low">
                  <textarea
                    value={waMessage}
                    onChange={(e) => setWaMessage(e.target.value)}
                    rows={4}
                    className="w-full bg-surface-container-highest rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none placeholder:text-on-surface-variant/40"
                    placeholder="الصق رسالة الواتساب هنا..."
                  />
                  <button
                    type="button"
                    onClick={handleExtract}
                    disabled={extracting || !waMessage.trim()}
                    className="w-full gradient-primary text-primary-container-foreground py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {extracting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {extracting ? "جاري الاستخراج..." : "استخراج البيانات"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Customer name */}
          <div>
            <label className="text-xs font-bold text-on-surface-variant block mb-2">اسم العميل</label>
            <input
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full bg-surface-container-highest rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all placeholder:text-on-surface-variant/40"
              placeholder="أدخل اسم العميل"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="text-xs font-bold text-on-surface-variant block mb-2">رقم الهاتف</label>
            <input
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-surface-container-highest rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all placeholder:text-on-surface-variant/40"
              placeholder="+966..."
              dir="ltr"
            />
          </div>

          {/* Details */}
          <div>
            <label className="text-xs font-bold text-on-surface-variant block mb-2">تفاصيل الطلب</label>
            <textarea
              required
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full bg-surface-container-highest rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all placeholder:text-on-surface-variant/40 resize-none h-24"
              placeholder="وصف الطلب..."
            />
          </div>

          {/* Delivery type */}
          <div>
            <label className="text-xs font-bold text-on-surface-variant block mb-2">نوع الاستلام</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDeliveryType("delivery")}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                  deliveryType === "delivery"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-outline-variant/20 bg-surface-container-highest text-on-surface-variant hover:border-primary/30"
                }`}
              >
                <Truck className="w-4 h-4" />
                توصيل منزلي
              </button>
              <button
                type="button"
                onClick={() => setDeliveryType("pickup")}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                  deliveryType === "pickup"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-outline-variant/20 bg-surface-container-highest text-on-surface-variant hover:border-primary/30"
                }`}
              >
                <Store className="w-4 h-4" />
                استلام من الفرع
              </button>
            </div>
          </div>

          {/* Address — only for delivery */}
          {deliveryType === "delivery" && (
            <div>
              <label className="text-xs font-bold text-on-surface-variant block mb-2">
                العنوان <span className="text-destructive">*</span>
              </label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-surface-container-highest rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all placeholder:text-on-surface-variant/40"
                placeholder="المدينة، الحي، الشارع..."
              />
            </div>
          )}

          {/* Amount — highlighted when prefilled */}
          <div>
            <label className={`text-xs font-bold block mb-2 ${isPrefilled ? "text-primary" : "text-on-surface-variant"}`}>
              المبلغ (ر.س) {isPrefilled && <span className="text-primary">← يحتاج تأكيد</span>}
            </label>
            <input
              required
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`w-full rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none transition-all placeholder:text-on-surface-variant/40 ${
                isPrefilled
                  ? "bg-primary/10 ring-2 ring-primary/30 focus:ring-primary/60"
                  : "bg-surface-container-highest focus:ring-1 focus:ring-primary/30"
              }`}
              placeholder="0.00"
              dir="ltr"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full gradient-primary text-primary-container-foreground py-3 rounded-xl font-bold hover:opacity-90 transition-opacity mt-2 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "جاري الإضافة..." : isPrefilled ? "اعتماد الطلب" : "إضافة الطلب"}
          </button>
        </form>
      </div>
    </div>
  );
}
