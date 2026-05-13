import { TrendingUp, TrendingDown } from "lucide-react";
import type { DashboardStats } from "@/hooks/useDashboardStats";

interface StatsGridProps {
  stats: DashboardStats;
  prevStats?: Partial<DashboardStats>;
}

function growthBadge(current: number, prev: number) {
  if (prev === 0) return null;
  const pct = Math.round(((current - prev) / prev) * 100);
  const positive = pct >= 0;
  return (
    <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${positive ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
      {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {positive ? "+" : ""}{pct}%
    </span>
  );
}

export default function StatsGrid({ stats, prevStats }: StatsGridProps) {
  const revenueProgress = stats.totalRevenue > 0
    ? Math.min((stats.totalRevenue / Math.max(stats.totalRevenue * 1.3, 1)) * 100, 100)
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Revenue */}
      <div className="relative overflow-hidden bg-surface-container-low rounded-xl p-6 group hover:bg-surface-container transition-colors duration-300">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <span className="text-on-surface-variant text-sm font-medium">إجمالي الإيرادات</span>
            {prevStats && growthBadge(stats.totalRevenue, prevStats.totalRevenue ?? 0)}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-on-surface tabular-nums">
              {stats.totalRevenue.toLocaleString("ar-SA")}
            </span>
            <span className="text-sm text-primary font-bold">ر.س</span>
          </div>
          <div className="mt-4 w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
            <div className="bg-primary h-full transition-all duration-1000" style={{ width: `${revenueProgress}%` }} />
          </div>
        </div>
      </div>

      {/* Completed orders */}
      <div className="relative overflow-hidden bg-surface-container-low rounded-xl p-6 group hover:bg-surface-container transition-colors duration-300">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <span className="text-on-surface-variant text-sm font-medium">الطلبات المكتملة</span>
            {prevStats && growthBadge(stats.completedOrders, prevStats.completedOrders ?? 0)}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-on-surface tabular-nums">{stats.completedOrders}</span>
            <span className="text-sm text-on-surface-variant">طلب</span>
          </div>
          <div className="mt-4 flex gap-1">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className={`h-2 w-full rounded-full ${i < Math.ceil((stats.conversionRate / 100) * 4) ? "bg-primary" : "bg-primary/20"}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Conversion rate */}
      <div className="relative overflow-hidden gradient-primary rounded-xl p-6 shadow-xl">
        <div className="absolute -bottom-4 -left-4 opacity-20">
          <TrendingUp className="w-28 h-28 text-primary-foreground" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-primary-foreground/80">معدل التحويل</span>
            <span className="bg-primary-foreground/20 text-primary-foreground text-[10px] font-bold px-2 py-1 rounded-full">
              {stats.conversionRate >= 50 ? "عالي" : stats.conversionRate >= 25 ? "متوسط" : "منخفض"}
            </span>
          </div>
          <div className="flex items-baseline gap-2 text-primary-foreground">
            <span className="text-4xl font-black tabular-nums">{stats.conversionRate}</span>
            <span className="text-xl font-bold">%</span>
          </div>
          <p className="text-[11px] text-primary-foreground/70 mt-4 leading-relaxed font-medium">
            نسبة الطلبات المكتملة من إجمالي {stats.completedOrders + Math.round(stats.completedOrders / (stats.conversionRate / 100 || 1) - stats.completedOrders)} طلب
          </p>
        </div>
      </div>
    </div>
  );
}
