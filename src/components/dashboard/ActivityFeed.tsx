import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

const statusLabel: Record<string, string> = {
  pending: "رسالة جديدة",
  processing: "معلومات مطلوبة",
  delivering: "بانتظار الدفع",
  completed: "مكتمل",
  cancelled: "ملغي",
};

const statusColor: Record<string, string> = {
  pending: "bg-primary",
  processing: "bg-tertiary",
  delivering: "bg-yellow-400",
  completed: "bg-green-500",
  cancelled: "bg-destructive",
};

export default function ActivityFeed() {
  const { user } = useAuth();

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["activity-feed", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, customer_name, status, updated_at")
        .eq("user_id", user!.id)
        .order("updated_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchInterval: 30000, // refresh every 30s
  });

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold font-headline px-2">آخر النشاطات</h3>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-8 text-on-surface-variant/50 text-sm">
          لا توجد نشاطات بعد
        </div>
      ) : (
        <div className="space-y-6 relative mr-4 border-r border-outline-variant/20 pr-6">
          {activities.map((a) => (
            <div key={a.id} className="relative animate-fade-in">
              <div className={`absolute -right-[31px] top-1 w-2.5 h-2.5 rounded-full ${statusColor[a.status] ?? "bg-outline-variant"} ring-4 ring-background`} />
              <p className="text-xs font-bold">
                طلب #{a.order_number} — {a.customer_name}
              </p>
              <p className="text-[11px] text-primary font-medium mt-0.5">
                {statusLabel[a.status] ?? a.status}
              </p>
              <p className="text-[10px] text-on-surface-variant mt-0.5 italic">
                {formatDistanceToNow(new Date(a.updated_at), { locale: ar, addSuffix: true })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
