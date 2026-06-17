import { Link } from "react-router-dom";
import { ShoppingBag, ImageIcon, PackageCheck } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;

interface ProductCardProps {
  product: Product;
  slug: string;
}

export function ProductCard({ product, slug }: ProductCardProps) {
  const tgDeepLink = `https://t.me/wflowAbod_bot?start=ws-${slug}`;

  return (
    <Link
      to={`/store/${slug}/product/${product.id}`}
      className="group bg-white rounded-2xl overflow-hidden border border-gray-100/80 hover:border-blue-100 hover:shadow-[0_8px_30px_rgba(37,99,235,0.08)] hover:translate-y-[-2px] transition-all duration-300 flex flex-col animate-fade-in"
    >
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-[1.08] transition-transform duration-700"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; (e.target as HTMLImageElement).parentElement!.classList.add("bg-gray-100"); }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-gray-200" />
          </div>
        )}
        <div className="absolute top-3 right-3 left-3 flex items-start justify-between gap-2">
          {product.category && (
            <span className="px-2.5 py-1 bg-white/80 backdrop-blur-md text-gray-600 text-[10px] font-semibold rounded-lg border border-white/50 shadow-sm">
              {product.category}
            </span>
          )}
          {product.is_available ? (
            <span className="px-2 py-1 bg-emerald-50/80 backdrop-blur-md text-emerald-600 text-[10px] font-semibold rounded-lg border border-emerald-100/50 flex items-center gap-1 shadow-sm">
              <PackageCheck className="w-2.5 h-2.5" />
              متوفر
            </span>
          ) : (
            <span className="px-2 py-1 bg-red-50/80 backdrop-blur-md text-red-500 text-[10px] font-semibold rounded-lg border border-red-100/50 shadow-sm">
              غير متوفر
            </span>
          )}
        </div>
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="font-semibold text-sm text-gray-900 leading-snug line-clamp-2 min-h-[2.5em]">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-1">{product.description}</p>
        )}
        <div className="flex items-center justify-between gap-3 mt-auto pt-3 border-t border-gray-50">
          <p className="text-base font-bold text-gray-900 tabular-nums tracking-tight">
            {product.price.toLocaleString("ar-SA", { minimumFractionDigits: 2 })}
            <span className="text-[11px] text-gray-400 mr-0.5 font-medium">ر.س</span>
          </p>
          <span
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(tgDeepLink, "_blank"); }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-50 hover:bg-blue-600 text-gray-600 hover:text-white rounded-xl text-[11px] font-semibold transition-all border border-gray-100 hover:border-blue-600"
          >
            <ShoppingBag className="w-3 h-3" />
            اطلب
          </span>
        </div>
      </div>
    </Link>
  );
}
