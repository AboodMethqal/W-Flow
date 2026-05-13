import { useState } from "react";
import { Calendar, Plus } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import StatsGrid from "@/components/dashboard/StatsGrid";
import SalesChart from "@/components/dashboard/SalesChart";
import RecentOrders from "@/components/dashboard/RecentOrders";
import WhatsAppCard from "@/components/dashboard/WhatsAppCard";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import QuickActions from "@/components/dashboard/QuickActions";
import NewOrderModal from "@/components/modals/NewOrderModal";
import { useOrders } from "@/hooks/useOrders";
import { useDashboardStats } from "@/hooks/useDashboardStats";

export default function Dashboard() {
  const { orders } = useOrders();
  const { stats, prevStats } = useDashboardStats(orders);
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);

  return (
    <AppLayout onNewOrder={() => setIsNewOrderOpen(true)}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight font-headline">
            نظرة عامة على الأداء
          </h2>
          <p className="text-on-surface-variant mt-1">مرحباً بك مجدداً، إليك ملخص نشاط اليوم</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-surface-container-high rounded-lg text-sm font-medium hover:bg-surface-container-highest transition-colors">
            آخر 24 ساعة
          </button>
          <button className="px-4 py-2 bg-surface-container-high rounded-lg text-sm font-medium hover:bg-surface-container-highest transition-colors flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            تخصيص
          </button>
        </div>
      </div>

      <StatsGrid stats={stats} prevStats={prevStats} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <SalesChart />
          <RecentOrders orders={orders.map(o => ({
            id: o.id,
            orderNumber: o.order_number,
            customerName: o.customer_name,
            phone: o.phone,
            details: o.details ?? "",
            amount: Number(o.amount),
            status: o.status,
            source: o.source,
            createdAt: o.created_at,
          }))} />
        </div>
        <div className="lg:col-span-4 space-y-8">
          <WhatsAppCard stats={stats} />
          <ActivityFeed />
          <QuickActions />
        </div>
      </div>

      <button
        onClick={() => setIsNewOrderOpen(true)}
        className="fixed bottom-8 left-8 w-14 h-14 gradient-primary text-primary-container-foreground rounded-full flex items-center justify-center hover:scale-105 transition-transform z-50"
        style={{ boxShadow: "0px 20px 40px rgba(0, 0, 0, 0.4)" }}
      >
        <Plus className="w-7 h-7" />
      </button>

      <NewOrderModal
        open={isNewOrderOpen}
        onClose={() => setIsNewOrderOpen(false)}
      />
    </AppLayout>
  );
}
