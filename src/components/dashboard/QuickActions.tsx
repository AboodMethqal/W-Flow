import { useNavigate } from "react-router-dom";
import { useWorkspace } from "@/hooks/useWorkspace";
import { toast } from "sonner";
import { Package, ExternalLink, Copy, Send, Plus } from "lucide-react";

export default function QuickActions() {
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspace();

  const baseUrl = `${window.location.protocol}//${window.location.host}`;
  const storeUrl = currentWorkspace?.slug ? `${baseUrl}/store/${currentWorkspace.slug}` : "";

  const actions = [
    {
      label: "إضافة منتج",
      icon: Package,
      action: () => navigate("/products"),
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "عرض المتجر",
      icon: ExternalLink,
      action: () => {
        if (storeUrl) window.open(storeUrl, "_blank");
        else toast.error("لم يتم إنشاء المتجر بعد");
      },
      color: "text-violet-500",
      bg: "bg-violet-500/10",
    },
    {
      label: "نسخ رابط المتجر",
      icon: Copy,
      action: async () => {
        if (storeUrl) {
          await navigator.clipboard.writeText(storeUrl);
          toast.success("تم نسخ رابط المتجر");
        } else {
          toast.error("لم يتم إنشاء المتجر بعد");
        }
      },
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      label: "فتح متجر تليجرام",
      icon: Send,
      action: () => {
        if (currentWorkspace?.slug) {
          window.open(`https://t.me/wflowAbod_bot?start=${currentWorkspace.slug}`, "_blank");
        } else {
          toast.error("لم يتم إنشاء المتجر بعد");
        }
      },
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      label: "طلب جديد",
      icon: Plus,
      action: () => navigate("/orders/new"),
      color: "text-primary",
      bg: "bg-primary/10",
    },
  ];

  return (
    <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/10">
      <h4 className="text-xs font-bold text-on-surface-variant mb-4">إجراءات سريعة</h4>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {actions.map(({ label, icon: Icon, action, color, bg }) => (
          <button
            key={label}
            onClick={action}
            className="p-3 bg-surface-container-high hover:bg-surface-container-highest rounded-xl transition-all flex flex-col items-center gap-2 group active:scale-95"
          >
            <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <span className="text-[10px] font-bold text-on-surface-variant group-hover:text-on-surface transition-colors">
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
