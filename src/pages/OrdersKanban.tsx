import { useState, useCallback } from "react";
import { Plus, Clock, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import NewOrderModal, { type PrefillData } from "@/components/modals/NewOrderModal";
import { useOrders } from "@/hooks/useOrders";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import type { Order } from "@/hooks/useOrders";

type KanbanColumn = {
  id: Order["status"];
  label: string;
  badgeClass: string;
};

const columns: KanbanColumn[] = [
  { id: "pending",    label: "جديد",          badgeClass: "bg-blue-500/15 text-blue-400" },
  { id: "processing", label: "قيد التحضير",   badgeClass: "bg-yellow-500/15 text-yellow-400" },
  { id: "delivering", label: "جاهز",           badgeClass: "bg-purple-500/15 text-purple-400" },
  { id: "completed",  label: "مسلّم",          badgeClass: "bg-green-500/15 text-green-400" },
];

export default function OrdersKanban() {
  const { orders, updateOrderStatus, deleteOrder } = useOrders();
  const navigate = useNavigate();
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [prefillData, setPrefillData] = useState<PrefillData | undefined>();
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<Order["status"] | null>(null);

  const handleDelete = useCallback((e: React.MouseEvent, orderId: string) => {
    e.stopPropagation();
    if (!confirm("هل انت متاكد من حذف هذا الطلب؟")) return;
    deleteOrder.mutate(orderId, {
      onSuccess: () => toast.success("تم حذف الطلب"),
      onError: (err) => toast.error(err.message),
    });
  }, [deleteOrder]);

  const onDragStart = useCallback((e: React.DragEvent, orderId: string) => {
    e.dataTransfer.setData("text/plain", orderId);
    setDragging(orderId);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent, colId: Order["status"]) => {
    e.preventDefault();
    setDragOver(colId);
  }, []);

  const onDrop = useCallback((e: React.DragEvent, colId: Order["status"]) => {
    e.preventDefault();
    const orderId = e.dataTransfer.getData("text/plain");
    if (orderId) {
      const colLabel = columns.find((c) => c.id === colId)?.label ?? colId;
      updateOrderStatus.mutate(
        { id: orderId, status: colId },
        {
          onSuccess: () => toast.success(`تم نقل الطلب الى "${colLabel}"`),
          onError: (err) => toast.error(err.message),
        }
      );
    }
    setDragging(null);
    setDragOver(null);
  }, [updateOrderStatus]);

  const onDragEnd = useCallback(() => {
    setDragging(null);
    setDragOver(null);
  }, []);

  const activeOrders = orders.filter((o) => o.status !== "cancelled");

  return (
    <AppLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-on-surface font-headline">لوحة الطلبات</h2>
          <p className="text-on-surface-variant text-sm mt-1">اسحب الطلبات بين الاعمدة لتغيير حالتها</p>
        </div>
        <button
          onClick={() => setIsNewOrderOpen(true)}
          className="flex items-center gap-2 px-4 py-3 gradient-primary text-primary-container-foreground rounded-xl font-bold hover:opacity-90 active:scale-95 transition-all text-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">اضافة طلب</span>
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 h-[calc(100vh-180px)]">
        {columns.map((col) => {
          const colOrders = activeOrders.filter((o) => o.status === col.id);
          const isOver = dragOver === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => onDragOver(e, col.id)}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => onDrop(e, col.id)}
              className={`flex-shrink-0 w-72 sm:w-80 flex flex-col transition-all duration-200 ${
                isOver ? "ring-2 ring-primary/40 rounded-2xl" : ""
              }`}
            >
              <div className="flex items-center gap-2 mb-3 px-1">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${col.badgeClass}`}>
                  {col.label}
                </span>
                <span className="text-xs text-on-surface-variant bg-surface-container-highest px-2 py-0.5 rounded-full font-bold">
                  {colOrders.length}
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto min-h-[200px] pb-4">
                {colOrders.length === 0 && (
                  <div className="border-2 border-dashed border-outline-variant/20 rounded-xl h-24 flex items-center justify-center">
                    <p className="text-xs text-on-surface-variant/40">لا توجد طلبات</p>
                  </div>
                )}
                {colOrders.map((order) => (
                  <div
                    key={order.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, order.id)}
                    onDragEnd={onDragEnd}
                    onClick={() => navigate(`/orders/${order.id}`)}
                    className={`bg-surface-container-low p-4 rounded-2xl cursor-grab active:cursor-grabbing hover:bg-surface-container transition-all duration-150 ${
                      dragging === order.id ? "opacity-40 scale-95" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-on-surface-variant">
                        طلب #{order.order_number}
                      </span>
                      <span className="text-[10px] text-on-surface-variant flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(order.created_at), { locale: ar, addSuffix: true })}
                      </span>
                    </div>

                    <p className="font-bold text-sm mb-1 text-on-surface">{order.customer_name}</p>

                    {order.details && (
                      <p className="text-[11px] text-on-surface-variant mb-3 line-clamp-2">
                        {order.details}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-outline-variant/10">
                      <p className="text-sm font-black text-primary tabular-nums">
                        {Number(order.amount).toLocaleString("ar-SA", { minimumFractionDigits: 2 })} ر.س
                      </p>
                      <button
                        onClick={(e) => handleDelete(e, order.id)}
                        className="p-1.5 rounded-lg text-on-surface-variant/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="حذف الطلب"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <NewOrderModal
        open={isNewOrderOpen}
        onClose={() => { setIsNewOrderOpen(false); setPrefillData(undefined); }}
        prefillData={prefillData}
      />
    </AppLayout>
  );
}
