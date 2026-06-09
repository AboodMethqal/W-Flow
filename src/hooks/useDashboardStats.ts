import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useWorkspace } from "./useWorkspace";
import { subDays, startOfDay } from "date-fns";
import type { Order } from "./useOrders";

export interface DashboardStats {
  totalRevenue: number;
  completedOrders: number;
  conversionRate: number;
  todayMessages: number;
  newCustomers: number;
  responseRate: number;
}

function calcStats(orders: Order[]): DashboardStats {
  const completed = orders.filter((o) => o.status === "completed");
  const totalRevenue = completed.reduce((sum, o) => sum + Number(o.amount), 0);
  const conversionRate = orders.length > 0 ? (completed.length / orders.length) * 100 : 0;
  const responded = orders.filter((o) => o.status !== "pending").length;
  const responseRate = orders.length > 0 ? Math.round((responded / orders.length) * 100) : 0;
  return {
    totalRevenue,
    completedOrders: completed.length,
    conversionRate: Math.round(conversionRate * 10) / 10,
    todayMessages: 0,
    newCustomers: 0,
    responseRate,
  };
}

export function useDashboardStats(orders: Order[]) {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();

  const todayStart = useMemo(() => startOfDay(new Date()).toISOString(), []);
  const weekAgoStart = useMemo(() => subDays(startOfDay(new Date()), 7).toISOString(), []);
  const twoWeeksAgoStart = useMemo(() => subDays(startOfDay(new Date()), 14).toISOString(), []);

  // New customers today
  const { data: newCustomersCount = 0 } = useQuery({
    queryKey: ["dashboard-new-customers", currentWorkspace?.id, todayStart],
    queryFn: async () => {
      if (!currentWorkspace?.id) return 0;

      const { count, error } = await supabase
        .from("customers")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", currentWorkspace.id)
        .gte("created_at", todayStart);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user && !!currentWorkspace?.id,
  });

  // Last week orders (for prevStats comparison)
  const { data: lastWeekOrders = [] } = useQuery({
    queryKey: ["dashboard-prev-orders", currentWorkspace?.id, weekAgoStart, twoWeeksAgoStart],
    queryFn: async () => {
      if (!currentWorkspace?.id) return [];

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("workspace_id", currentWorkspace.id)
        .gte("created_at", twoWeeksAgoStart)
        .lt("created_at", weekAgoStart);
      if (error) throw error;
      return data as Order[];
    },
    enabled: !!user && !!currentWorkspace?.id,
  });

  const stats: DashboardStats = useMemo(() => {
    const base = calcStats(orders);
    const todayMessages = orders.filter((o) => o.created_at >= todayStart).length;
    return { ...base, todayMessages, newCustomers: newCustomersCount };
  }, [orders, todayStart, newCustomersCount]);

  const prevStats: DashboardStats = useMemo(() => calcStats(lastWeekOrders), [lastWeekOrders]);

  return { stats, prevStats };
}
