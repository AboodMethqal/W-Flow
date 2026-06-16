import { Grid3X3 } from "lucide-react";

interface CategoryCardProps {
  name: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}

const categoryIcons: Record<string, string> = {
  إلكترونيات: "📱",
  ملابس: "👕",
  "مواد غذائية": "🍎",
  "العناية الشخصية": "🧴",
  منزل: "🏠",
  ديكور: "🪴",
  العناية: "🧴",
  مستحضرات: "💄",
  أطفال: "🧸",
  رياضة: "⚽",
  سيارات: "🚗",
  حيوانات: "🐾",
  كتب: "📚",
  هدايا: "🎁",
  مجوهرات: "💎",
  عطور: "🌸",
  "أحذية": "👟",
  "حقائب": "👜",
  "ساعات": "⌚",
  "نظارات": "👓",
};

export function CategoryCard({ name, count, isActive, onClick }: CategoryCardProps) {
  const icon = categoryIcons[name] || "📦";

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all min-w-[100px] ${
        isActive
          ? "bg-blue-50 border-blue-200 shadow-sm"
          : "bg-white border-gray-100 hover:border-blue-200 hover:shadow-sm hover:bg-blue-50/50"
      }`}
    >
      <span className="text-2xl">{icon}</span>
      <span className={`text-xs font-semibold text-center ${
        isActive ? "text-blue-600" : "text-gray-600"
      }`}>
        {name}
      </span>
      <span className={`text-[10px] ${
        isActive ? "text-blue-400" : "text-gray-400"
      }`}>
        {count} {count === 1 ? "منتج" : "منتجات"}
      </span>
    </button>
  );
}
