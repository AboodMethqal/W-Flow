import { MessageSquare } from "lucide-react";
import type { DashboardStats } from "@/hooks/useDashboardStats";

interface WhatsAppCardProps {
  stats: DashboardStats;
}

export default function WhatsAppCard({ stats }: WhatsAppCardProps) {
  return (
    <div className="bg-surface-container-high rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-whatsapp flex items-center justify-center shadow-lg">
          <MessageSquare className="w-4 h-4 text-background" />
        </div>
        <h3 className="font-bold font-headline">أداء حملة الواتساب</h3>
      </div>
      <div className="space-y-4">
        <div className="flex justify-between items-center text-xs">
          <span className="text-on-surface-variant">معدل الرد</span>
          <span className="font-bold text-whatsapp">{stats.responseRate}%</span>
        </div>
        <div className="w-full bg-surface-container-lowest h-1.5 rounded-full">
          <div
            className="bg-whatsapp h-full rounded-full transition-all duration-1000"
            style={{ width: `${stats.responseRate}%`, boxShadow: "0 0 8px hsla(142, 70%, 49%, 0.5)" }}
          />
        </div>
        <div className="pt-4 grid grid-cols-2 gap-4">
          <div className="bg-surface-container-lowest p-3 rounded-xl">
            <p className="text-[10px] text-on-surface-variant mb-1">رسائل اليوم</p>
            <p className="text-lg font-black text-on-surface tabular-nums">{stats.todayMessages.toLocaleString()}</p>
          </div>
          <div className="bg-surface-container-lowest p-3 rounded-xl">
            <p className="text-[10px] text-on-surface-variant mb-1">عملاء جدد</p>
            <p className="text-lg font-black text-on-surface tabular-nums">{stats.newCustomers}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
