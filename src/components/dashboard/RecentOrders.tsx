import { MessageCircle, ShoppingBag, AlertCircle } from "lucide-react";
import type { Order } from "@/store/appStore";

interface RecentOrdersProps {
  orders: Order[];
}

const sourceIcon = {
  whatsapp: MessageCircle,
  store: ShoppingBag,
  phone: AlertCircle,
};
const sourceColor = {
  whatsapp: "bg-whatsapp/10 text-whatsapp",
  store: "bg-primary/10 text-primary",
  phone: "bg-tertiary/10 text-tertiary",
};
const statusLabel: Record<Order["status"], { text: string; cls: string }> = {
  pending: { text: "قيد الانتظار", cls: "text-on-surface-variant bg-surface-container-highest" },
  processing: { text: "قيد التجهيز", cls: "text-primary bg-primary/10" },
  delivering: { text: "قيد التوصيل", cls: "text-primary bg-primary/10" },
  completed: { text: "مكتمل", cls: "text-on-surface-variant bg-surface-container-highest" },
  cancelled: { text: "ملغي", cls: "text-tertiary bg-tertiary/10" },
};

export default function RecentOrders({ orders }: RecentOrdersProps) {
  return (
    <div className="bg-surface-container-low rounded-2xl overflow-hidden">
      <div className="p-6 flex justify-between items-center">
        <h3 className="text-lg font-bold font-headline">آخر الطلبات</h3>
        <button className="text-primary text-sm font-bold hover:underline">عرض الكل</button>
      </div>
      <div className="divide-y divide-outline-variant/10">
        {orders.slice(0, 5).map((order) => {
          const Icon = sourceIcon[order.source];
          const st = statusLabel[order.status];
          return (
            <div
              key={order.id}
              className="p-4 hover:bg-surface-container-highest/30 flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${sourceColor[order.source]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold">{order.customerName}</p>
                  <p className="text-[11px] text-on-surface-variant">
                    {order.details} #{order.orderNumber}
                  </p>
                </div>
              </div>
              <div className="text-left">
                <p className="text-sm font-bold tabular-nums">{order.amount.toFixed(2)} ر.س</p>
                <p className={`text-[10px] px-2 py-0.5 rounded-full inline-block ${st.cls}`}>{st.text}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
