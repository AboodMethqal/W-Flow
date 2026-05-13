// State management is handled via Supabase + TanStack Query (useOrders, useCustomers, useDashboardStats)
// This store is kept as a shared types reference only.

export interface Order {
  id: string;
  orderNumber: number;
  customerName: string;
  phone: string;
  details: string;
  amount: number;
  status: "pending" | "processing" | "delivering" | "completed" | "cancelled";
  source: "whatsapp" | "store" | "phone";
  createdAt: string;
}

export interface DashboardStats {
  totalRevenue: number;
  completedOrders: number;
  conversionRate: number;
  todayMessages: number;
  newCustomers: number;
  responseRate: number;
}
