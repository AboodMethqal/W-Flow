import { useState, useCallback } from "react";
import { Plus, Clock, Phone, MessageSquare, AlertTriangle, CheckCheck, Trash2 } from "lucide-react";
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
  color: string;
  dotColor: string;
};

const columns: KanbanColumn[] = [
  { id: "pending", label: "رسالة جديدة", color: "bg-on-surface-variant", dotColor: "bg-primary" },
  { id: "processing", label: "معلومات مطلوبة", color: "bg-primary", dotColor: "bg-tertiary" },
  { id: "delivering", label: "بالانتظار الدفع", color: "bg-whatsapp", dotColor: "bg-on-surface-variant" },
  { id: "completed", label: "مكتمل", color: "bg-surface-container-highest", dotColor: "bg-primary" },
  { id: "cancelled", label: "ملغي", color: "bg-tertiary", dotColor: "bg-tertiary" },
];

function getTimeBadge(createdAt: string) {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const hours = diffMs / (1000 * 60 * 60);
  if (hours > 24) {
    return { text: `${Math.floor(hours)} ساعة`, isAlert: true };
  }
  return {
    text: formatDistanceToNow(new Date(createdAt), { locale: ar, addSuffix: false }),
    isAlert: false,
  };
}

function getSourceBadge(source: Order["source"]) {
  switch (source) {
    case "whatsapp": return { label: "استفسار جديد", color: "bg-primary/15 text-primary" };
    case "store": return { label: "طلب خاص", color: "bg-primary/15 text-primary" };
    case "phone": return { label: "فاتورة معلقة", color: "bg-surface-container-highest text-on-surface-variant" };
  }
}

export default function OrdersKanban() {
  const { orders, updateOrderStatus, deleteOrder } = useOrders();
  const navigate = useNavigate();
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [prefillData, setPrefillData] = useState<PrefillData | undefined>();
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<Order["status"] | null>(null);

  const handleApproveAsOrder = useCallback((e: React.MouseEvent, order: Order) => {
    e.stopPropagation();
    setPrefillData({
      customerName: order.customer_name,
      phone: order.phone,
      details: order.details ?? "",
    });
    setIsNewOrderOpen(true);
  }, []);

  const handleDelete = useCallback((e: React.MouseEvent, orderId: string) => {
    e.stopPropagation();
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
          onSuccess: () => toast.success(`تم نقل الطلب إلى "${colLabel}"`),
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

  return (
    <AppLayout onNewOrder={() => setIsNewOrderOpen(true)}>
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 h-[calc(100vh-120px)]">
        {columns.map((col) => {
          const colOrders = orders.filter((o) => o.status === col.id);
          const isOver = dragOver === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => onDragOver(e, col.id)}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => onDrop(e, col.id)}
              className={`flex-shrink-0 w-80 flex flex-col transition-all duration-200 ${
                isOver ? "ring-2 ring-primary/30" : ""
              }`}
            >
              {/* Column header */}
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                  <h3 className="font-bold text-sm">{col.label}</h3>
                  <span className="text-[10px] text-on-surface-variant bg-surface-container-highest w-5 h-5 flex items-center justify-center rounded-full font-bold">
                    {colOrders.length}
                  </span>
                </div>
                <button className="text-on-surface-variant/50 hover:text-on-surface-variant">
                  •••
                </button>
              </div>

              {/* Cards */}
              <div className="space-y-3 flex-1 overflow-y-auto min-h-[200px] pb-4">
                {colOrders.map((order) => {
                  const timeBadge = getTimeBadge(order.created_at);
                  const sourceBadge = getSourceBadge(order.source);

                  return (
                    <div
                      key={order.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, order.id)}
                      onDragEnd={onDragEnd}
                      onClick={() => navigate(`/orders/${order.id}`)}
                      className={`bg-surface-container-low p-4 rounded-2xl cursor-grab active:cursor-grabbing hover:bg-surface-container transition-all duration-200 group ${
                        dragging === order.id ? "opacity-50 scale-95" : ""
                      } ${timeBadge.isAlert ? "ring-1 ring-tertiary/30" : ""}`}
                    >
                      {/* Top row: badge + time */}
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${sourceBadge.color}`}>
                          {sourceBadge.label}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {timeBadge.isAlert && <AlertTriangle className="w-3 h-3 text-tertiary" />}
                          <span className={`text-[10px] flex items-center gap-1 ${timeBadge.isAlert ? "text-tertiary font-bold" : "text-on-surface-variant"}`}>
                            <Clock className="w-3 h-3" />
                            {timeBadge.text}
                          </span>
                        </div>
                      </div>

                      {/* Alert banner for abandoned orders */}
                      {timeBadge.isAlert && (
                        <div className="bg-tertiary/10 text-tertiary text-[10px] font-bold px-3 py-1.5 rounded-lg mb-3 flex items-center gap-1.5">
                          <AlertTriangle className="w-3 h-3" />
                          تنبيه: طلب مهجور
                        </div>
                      )}

                      {/* Customer name */}
                      <p className="font-bold text-sm mb-1">{order.customer_name}</p>

                      {/* Details snippet */}
                      {order.details && (
                        <p className="text-[11px] text-on-surface-variant mb-3 line-clamp-2">
                          {order.details}
                        </p>
                      )}

                      {/* Bottom row: avatar + amount + icons */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-outline-variant/5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-surface-container-highest flex items-center justify-center text-[10px] font-bold text-on-surface-variant">
                            {order.customer_name.charAt(0)}
                          </div>
                          <div className="flex gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-on-surface-variant/50 hover:text-primary cursor-pointer transition-colors" />
                            <MessageSquare className="w-3.5 h-3.5 text-on-surface-variant/50 hover:text-whatsapp cursor-pointer transition-colors" />
                          </div>
                        </div>
                        <p className="text-sm font-bold tabular-nums text-primary">
                          المجموع: {Number(order.amount).toLocaleString("ar-SA", { minimumFractionDigits: 2 })} ر.س
                        </p>
                      </div>

                      {/* Approve + Delete buttons — only for pending */}
                      {order.status === "pending" && (
                        <div className="mt-3 flex gap-2">
                          {order.source === "whatsapp" && (
                            <button
                              onClick={(e) => handleApproveAsOrder(e, order)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary/10 text-primary text-[11px] font-bold hover:bg-primary/20 transition-colors"
                            >
                              <CheckCheck className="w-3.5 h-3.5" />
                              اعتماد كطلب
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDelete(e, order.id)}
                            className="flex items-center justify-center p-2 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                            title="حذف الطلب"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
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
