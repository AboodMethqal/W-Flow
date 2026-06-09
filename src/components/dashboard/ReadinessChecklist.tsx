import { CheckCircle, Circle, AlertCircle } from "lucide-react";

interface ChecklistData {
  storeInfo: boolean;
  productsAdded: boolean;
  productImages: boolean;
  telegramActive: boolean;
  ordersReceived: boolean;
  displayName: string;
}

interface ReadinessChecklistProps {
  data: ChecklistData;
}

export default function ReadinessChecklist({ data }: ReadinessChecklistProps) {
  const items = [
    { key: "storeInfo" as const, label: "معلومات المتجر مكتملة", desc: "اسم المتجر والوصف وبيانات التواصل" },
    { key: "productsAdded" as const, label: "تم إضافة منتجات", desc: "أضف منتجاً واحداً على الأقل للمتجر" },
    { key: "productImages" as const, label: "تم رفع صور المنتجات", desc: "صور المنتجات تجذب المزيد من الزبائن" },
    { key: "telegramActive" as const, label: "بوت التليجرام نشط", desc: "يمكن للعملاء الطلب عبر التليجرام" },
    { key: "ordersReceived" as const, label: "تم استقبال طلبات", desc: "متجرك جاهز لاستقبال الطلبات" },
  ];

  const checkedCount = items.filter((item) => data[item.key]).length;
  const totalCount = items.length;
  const progress = Math.round((checkedCount / totalCount) * 100);

  const getLevel = () => {
    if (progress === 100) return { label: "جاهز بالكامل", color: "text-emerald-500", bg: "bg-emerald-500/10" };
    if (progress >= 60) return { label: "جاهز تقريباً", color: "text-blue-500", bg: "bg-blue-500/10" };
    if (progress >= 40) return { label: "في منتصف الطريق", color: "text-amber-500", bg: "bg-amber-500/10" };
    return { label: "لم يكتمل بعد", color: "text-orange-500", bg: "bg-orange-500/10" };
  };

  const level = getLevel();

  return (
    <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/10 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm">جاهزية المتجر</h3>
          <p className="text-[10px] text-on-surface-variant/60">{data.displayName}</p>
        </div>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${level.bg} ${level.color}`}>
          {progress}% · {level.label}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-l from-primary to-primary/60 transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="space-y-2">
        {items.map(({ key, label, desc }) => {
          const done = data[key];
          return (
            <div key={key} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-surface-container transition-colors">
              {done ? (
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-on-surface-variant/30 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <p className={`text-xs font-bold ${done ? "text-on-surface" : "text-on-surface-variant/70"}`}>
                  {done ? "✅ " : ""}{label}
                </p>
                {!done && <p className="text-[10px] text-on-surface-variant/40 mt-0.5">{desc}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
