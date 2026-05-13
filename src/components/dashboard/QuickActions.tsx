import { Upload, Mail } from "lucide-react";

export default function QuickActions() {
  return (
    <div className="bg-surface-container-lowest p-6 rounded-2xl border border-dashed border-outline-variant/30">
      <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4 text-center">
        إجراءات سريعة
      </h4>
      <div className="grid grid-cols-2 gap-3">
        <button className="p-4 bg-surface-container-high rounded-xl hover:bg-surface-container-highest transition-colors flex flex-col items-center gap-2 group">
          <Upload className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-bold">رفع بيانات</span>
        </button>
        <button className="p-4 bg-surface-container-high rounded-xl hover:bg-surface-container-highest transition-colors flex flex-col items-center gap-2 group">
          <Mail className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-bold">رسالة جماعية</span>
        </button>
      </div>
    </div>
  );
}
