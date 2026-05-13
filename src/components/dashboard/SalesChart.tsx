import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { subDays, startOfDay, format } from "date-fns";
import { ar } from "date-fns/locale";

const DAYS = 7;

function buildDayBuckets(orders: { created_at: string; amount: number }[], fromDate: Date) {
  const buckets: Record<string, number> = {};
  for (let i = 0; i < DAYS; i++) {
    const key = format(subDays(fromDate, DAYS - 1 - i), "yyyy-MM-dd");
    buckets[key] = 0;
  }
  for (const o of orders) {
    const key = format(new Date(o.created_at), "yyyy-MM-dd");
    if (key in buckets) buckets[key] += Number(o.amount);
  }
  return buckets;
}

export default function SalesChart() {
  const { user } = useAuth();

  const today = startOfDay(new Date());
  const thisWeekStart = subDays(today, DAYS - 1);
  const lastWeekStart = subDays(today, DAYS * 2 - 1);

  const { data, isLoading } = useQuery({
    queryKey: ["sales-chart", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("created_at, amount")
        .eq("user_id", user!.id)
        .gte("created_at", lastWeekStart.toISOString())
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Split into this week / last week
  const thisWeekOrders = (data ?? []).filter(o => new Date(o.created_at) >= thisWeekStart);
  const lastWeekOrders = (data ?? []).filter(o => new Date(o.created_at) < thisWeekStart);

  const thisWeekBuckets = buildDayBuckets(thisWeekOrders, today);
  const lastWeekBuckets = buildDayBuckets(lastWeekOrders, subDays(today, DAYS));

  const chartData = Object.keys(thisWeekBuckets).map((date, i) => ({
    day: format(subDays(today, DAYS - 1 - i), "EEE", { locale: ar }),
    thisWeek: thisWeekBuckets[date],
    lastWeek: Object.values(lastWeekBuckets)[i] ?? 0,
  }));

  const maxVal = Math.max(...chartData.map(d => Math.max(d.thisWeek, d.lastWeek)), 1);

  return (
    <div className="bg-surface-container-low rounded-2xl p-6 md:p-8 flex flex-col" style={{ minHeight: 400 }}>
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-lg font-bold font-headline">تحليل المبيعات الأسبوعي</h3>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-xs text-on-surface-variant">هذا الأسبوع</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-surface-container-highest" />
            <span className="text-xs text-on-surface-variant">الأسبوع الماضي</span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="flex-1 flex items-end gap-3 md:gap-4 px-2 md:px-4">
            {chartData.map((d, i) => (
              <div key={i} className="flex-1 flex items-end gap-1">
                {/* Last week bar */}
                <div
                  className="flex-1 bg-surface-container-highest rounded-t-lg transition-all duration-500 hover:bg-surface-bright group relative cursor-pointer"
                  style={{ height: `${(d.lastWeek / maxVal) * 100}%`, minHeight: d.lastWeek > 0 ? 4 : 0 }}
                >
                  {d.lastWeek > 0 && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-on-surface text-background px-2 py-1 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {d.lastWeek.toLocaleString("ar-SA")} ر.س
                    </div>
                  )}
                </div>
                {/* This week bar */}
                <div
                  className="flex-1 bg-primary rounded-t-lg transition-all duration-500 hover:bg-primary/80 group relative cursor-pointer"
                  style={{ height: `${(d.thisWeek / maxVal) * 100}%`, minHeight: d.thisWeek > 0 ? 4 : 0 }}
                >
                  {d.thisWeek > 0 && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-on-surface text-background px-2 py-1 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {d.thisWeek.toLocaleString("ar-SA")} ر.س
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between mt-4 text-[10px] text-on-surface-variant px-2 md:px-4">
            {chartData.map((d, i) => (
              <span key={i}>{d.day}</span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
