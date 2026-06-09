import { Package, Users, ShoppingCart, Clock, CheckCircle } from "lucide-react";

interface QuickStatsData {
  totalProducts: number;
  totalCustomers: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
}

interface QuickStatsProps {
  data: QuickStatsData;
  isLoading: boolean;
}

export default function QuickStats({ data, isLoading }: QuickStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/10 animate-pulse">
            <div className="h-3 bg-surface-container-highest rounded w-16 mb-3" />
            <div className="h-7 bg-surface-container-highest rounded w-10" />
          </div>
        ))}
      </div>
    );
  }

  const items = [
    { label: "المنتجات", value: data.totalProducts, icon: Package, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "العملاء", value: data.totalCustomers, icon: Users, color: "text-violet-500", bg: "bg-violet-500/10" },
    { label: "إجمالي الطلبات", value: data.totalOrders, icon: ShoppingCart, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "معلقة", value: data.pendingOrders, icon: Clock, color: "text-orange-500", bg: "bg-orange-500/10" },
    { label: "مكتملة", value: data.completedOrders, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {items.map(({ label, value, icon: Icon, color, bg }) => (
        <div key={label} className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/10 hover:shadow-sm transition-shadow">
          <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center mb-3`}>
            <Icon className={`w-4 h-4 ${color}`} />
          </div>
          <p className="text-2xl font-black text-on-surface tabular-nums">{value}</p>
          <p className="text-[10px] text-on-surface-variant/70 font-bold mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  );
}
