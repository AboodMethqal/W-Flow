import { useParams, useNavigate } from "react-router-dom";
import { ArrowRight, User, MapPin, Phone, Package, Trash2, Loader2 } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { useOrderDetails } from "@/hooks/useOrderDetails";
import { useOrders } from "@/hooks/useOrders";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

const statusOptions: { value: string; label: string; badgeClass: string }[] = [
  { value: "pending",    label: "جديد",          badgeClass: "bg-blue-500/15 text-blue-400" },
  { value: "processing", label: "قيد التحضير",   badgeClass: "bg-yellow-500/15 text-yellow-400" },
  { value: "delivering", label: "جاهز",           badgeClass: "bg-purple-500/15 text-purple-400" },
  { value: "completed",  label: "مسلّم",          badgeClass: "bg-green-500/15 text-green-400" },
  { value: "cancelled",  label: "ملغي",            badgeClass: "bg-red-500/15 text-red-400" },
];

export default function OrderDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { order, isLoading } = useOrderDetails(id);
  const { updateOrderStatus, deleteOrder } = useOrders();

  const handleStatusChange = (newStatus: string) => {
    updateOrderStatus.mutate(
      { id: order!.id, status: newStatus as typeof order.status },
      {
        onSuccess: () => toast.success("تم تحديث حالة الطلب"),
        onError: (err) => toast.error(err.message),
      }
    );
  };

  const handleDelete = () => {
    if (!confirm("هل انت متاكد من حذف هذا الطلب؟")) return;
    deleteOrder.mutate(order!.id, {
      onSuccess: () => {
        toast.success("تم حذف الطلب");
        navigate("/orders");
      },
      onError: (err) => toast.error(err.message),
    });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!order) {
    return (
      <AppLayout>
        <div className="text-center py-20 space-y-3">
          <p className="text-on-surface-variant">لم يتم العثور على الطلب</p>
          <button
            onClick={() => navigate("/orders")}
            className="text-primary font-bold hover:underline text-sm"
          >
            العودة للطلبات
          </button>
        </div>
      </AppLayout>
    );
  }

  const currentStatus = statusOptions.find((s) => s.value === order.status);
  const timeAgo = formatDistanceToNow(new Date(order.created_at), { locale: ar, addSuffix: true });

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-5 pb-10" dir="rtl">
        {/* Back button + title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest transition-colors text-on-surface-variant"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-extrabold text-on-surface font-headline">
              طلب #{order.order_number}
            </h2>
            <p className="text-xs text-on-surface-variant">{timeAgo}</p>
          </div>
        </div>

        {/* Status card */}
        <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-on-surface-variant">حالة الطلب</h3>
            {currentStatus && (
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${currentStatus.badgeClass}`}>
                {currentStatus.label}
              </span>
            )}
          </div>

          {/* Status change buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {statusOptions.filter((s) => s.value !== "cancelled").map((s) => (
              <button
                key={s.value}
                onClick={() => handleStatusChange(s.value)}
                disabled={order.status === s.value || updateOrderStatus.isPending}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                  order.status === s.value
                    ? `${s.badgeClass} ring-2 ring-current ring-offset-2 ring-offset-surface-container-low`
                    : "bg-surface-container-highest text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div className="pt-3 border-t border-outline-variant/10">
            <p className="text-xs text-on-surface-variant mb-1">اجمالي المبلغ</p>
            <p className="text-3xl font-black text-primary tabular-nums">
              {Number(order.amount).toLocaleString("ar-SA", { minimumFractionDigits: 2 })}
              <span className="text-base font-bold text-on-surface-variant mr-1">ر.س</span>
            </p>
          </div>
        </div>

        {/* Customer info */}
        <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/10 space-y-4">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <User className="w-4 h-4 text-on-surface-variant" />
            بيانات العميل
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-sm flex-shrink-0">
                {order.customer_name.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-sm text-on-surface">{order.customer_name}</p>
                {order.phone && (
                  <a
                    href={`tel:${order.phone}`}
                    className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5 hover:text-primary transition-colors"
                    dir="ltr"
                  >
                    <Phone className="w-3 h-3" />
                    {order.phone}
                  </a>
                )}
              </div>
            </div>
            {order.address && (
              <div className="flex items-start gap-2 text-xs text-on-surface-variant bg-surface-container rounded-xl p-3">
                <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>{order.address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Order details */}
        {order.details && (
          <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/10 space-y-2">
            <h3 className="text-sm font-bold">تفاصيل الطلب</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">{order.details}</p>
          </div>
        )}

        {/* Order items */}
        {order.items.length > 0 && (
          <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/10 space-y-3">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Package className="w-4 h-4 text-on-surface-variant" />
              المنتجات ({order.items.length})
            </h3>
            <div className="space-y-2">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-2.5 border-b border-outline-variant/10 last:border-0"
                >
                  <div>
                    <p className="text-sm font-bold text-on-surface">{item.product_name}</p>
                    {item.sku && (
                      <p className="text-[11px] text-on-surface-variant" dir="ltr">SKU: {item.sku}</p>
                    )}
                  </div>
                  <div className="text-left space-y-0.5">
                    <p className="text-xs text-on-surface-variant">x{item.quantity}</p>
                    <p className="text-sm font-black text-primary tabular-nums">
                      {Number(item.price).toLocaleString("ar-SA", { minimumFractionDigits: 2 })} ر.س
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Delete button */}
        <button
          onClick={handleDelete}
          disabled={deleteOrder.isPending}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-xl font-bold text-sm transition-colors active:scale-95"
        >
          {deleteOrder.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
          حذف هذا الطلب
        </button>
      </div>
    </AppLayout>
  );
}
