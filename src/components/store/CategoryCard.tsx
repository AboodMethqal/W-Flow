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
      className={`flex flex-col items-center gap-2.5 p-5 rounded-2xl border-2 transition-all min-w-[110px] snap-start shrink-0 ${
        isActive
          ? "bg-blue-600 border-blue-600 shadow-lg shadow-blue-500/20"
          : "bg-white border-gray-100 hover:border-blue-200 hover:shadow-md hover:shadow-blue-500/5"
      }`}
    >
      <span className={`text-3xl leading-none ${isActive ? "brightness-[10]" : ""}`}>
        {icon}
      </span>
      <span className={`text-xs font-semibold text-center leading-tight ${
        isActive ? "text-white" : "text-gray-700"
      }`}>
        {name}
      </span>
      <span className={`text-[10px] ${
        isActive ? "text-blue-200" : "text-gray-400"
      }`}>
        {count} {count === 1 ? "منتج" : "منتجات"}
      </span>
    </button>
  );
}
