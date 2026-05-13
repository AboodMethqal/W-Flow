import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOrders } from "@/hooks/useOrders";
import AppLayout from "@/components/layout/AppLayout";
import SalesChart from "@/components/dashboard/SalesChart";
import { TrendingUp, ShoppingBag, Users, CheckCircle } from "lucide-react";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { orders } = useOrders();

  // Orders by status counts
  const statusCounts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});

  // Revenue by source
  const revenueBySource = orders.reduce<Record<string, number>>((acc, o) => {
    if (o.status === "completed") {
      acc[o.source] = (acc[o.source] ?? 0) + Number(o.amount);
    }
    return acc;
  }, {});

  // Total customers count
  const { data: customerCount = 0 } = useQuery({
    queryKey: ["analytics-customers", user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("customers")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user,
  });

  const totalRevenue = orders
    .filter((o) => o.status === "completed")
    .reduce((s, o) => s + Number(o.amount), 0);

  const conversionRate = orders.length > 0
    ? Math.round((statusCounts["completed"] ?? 0) / orders.length * 100)
    : 0;

  const statusLabels: Record<string, string> = {
    pending: "رسالة جديدة",
    processing: "معلومات مطلوبة",
    delivering: "بانتظار الدفع",
    completed: "مكتمل",
    cancelled: "ملغي",
  };

  const statusColors: Record<string, string> = {
    pending: "bg-primary",
    processing: "bg-tertiary",
    delivering: "bg-yellow-400",
    completed: "bg-green-500",
    cancelled: "bg-destructive",
  };

  const sourceLabels: Record<string, string> = {
    whatsapp: "واتساب",
    store: "المتجر",
    phone: "هاتف",
  };

  return (
    <AppLayout onNewOrder={() => {}}>
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-extrabold font-headline">التحليلات</h2>
          <p className="text-on-surface-variant text-sm mt-1">نظرة شاملة على أداء المبيعات والطلبات</p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon={<TrendingUp className="w-5 h-5" />} label="إجمالي الإيرادات" value={`${totalRevenue.toLocaleString("ar-SA")} ر.س`} />
          <KpiCard icon={<ShoppingBag className="w-5 h-5" />} label="إجمالي الطلبات" value={orders.length.toLocaleString("ar-SA")} />
          <KpiCard icon={<Users className="w-5 h-5" />} label="إجمالي العملاء" value={customerCount.toLocaleString("ar-SA")} />
          <KpiCard icon={<CheckCircle className="w-5 h-5" />} label="معدل التحويل" value={`${conversionRate}%`} />
        </div>

        {/* Sales chart */}
        <SalesChart />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Orders by status */}
          <div className="bg-surface-container-low rounded-2xl p-6 space-y-4">
            <h3 className="font-bold font-headline text-sm">توزيع الطلبات حسب الحالة</h3>
            {orders.length === 0 ? (
              <p className="text-xs text-on-surface-variant/50 text-center py-6">لا توجد بيانات</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(statusCounts).map(([status, count]) => (
                  <div key={status}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-on-surface-variant">{statusLabels[status] ?? status}</span>
                      <span className="font-bold">{count} ({Math.round(count / orders.length * 100)}%)</span>
                    </div>
                    <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${statusColors[status] ?? "bg-primary"}`}
                        style={{ width: `${Math.round(count / orders.length * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Revenue by source */}
          <div className="bg-surface-container-low rounded-2xl p-6 space-y-4">
            <h3 className="font-bold font-headline text-sm">الإيرادات حسب المصدر</h3>
            {Object.keys(revenueBySource).length === 0 ? (
              <p className="text-xs text-on-surface-variant/50 text-center py-6">لا توجد إيرادات مكتملة بعد</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(revenueBySource).map(([source, revenue]) => (
                  <div key={source} className="flex items-center justify-between p-3 bg-surface-container-highest rounded-xl">
                    <span className="text-sm font-medium">{sourceLabels[source] ?? source}</span>
                    <span className="text-sm font-bold text-primary tabular-nums">
                      {revenue.toLocaleString("ar-SA")} ر.س
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function KpiCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-surface-container-low rounded-2xl p-5 space-y-3">
      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
      <div>
        <p className="text-[11px] text-on-surface-variant">{label}</p>
        <p className="text-xl font-extrabold font-headline tabular-nums">{value}</p>
      </div>
    </div>
  );
}
