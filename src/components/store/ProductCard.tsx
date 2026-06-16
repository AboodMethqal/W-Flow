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
      className="group bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 flex flex-col animate-fade-in"
    >
      <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-10 h-10 text-gray-200" />
          </div>
        )}
        <div className="absolute top-2 right-2 left-2 flex items-start justify-between gap-1">
          {product.category && (
            <span className="px-2 py-0.5 bg-white/90 backdrop-blur-sm text-gray-600 text-[10px] font-medium rounded-md border border-gray-100/50 shadow-sm">
              {product.category}
            </span>
          )}
          {product.is_available ? (
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-medium rounded-md border border-emerald-100/50 flex items-center gap-1">
              <PackageCheck className="w-2.5 h-2.5" />
              متوفر
            </span>
          ) : (
            <span className="px-2 py-0.5 bg-red-50 text-red-500 text-[10px] font-medium rounded-md border border-red-100/50">
              غير متوفر
            </span>
          )}
        </div>
      </div>
      <div className="p-3.5 flex flex-col gap-1.5 flex-1">
        <h3 className="font-semibold text-sm text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-xs text-gray-400 line-clamp-1 leading-relaxed">{product.description}</p>
        )}
        <div className="flex items-center justify-between gap-2 mt-auto pt-2.5 border-t border-gray-50">
          <p className="text-lg font-bold text-gray-900 tabular-nums">
            {product.price.toLocaleString("ar-SA", { minimumFractionDigits: 2 })}
            <span className="text-xs text-gray-500 mr-0.5">ر.س</span>
          </p>
          <span
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(tgDeepLink, "_blank"); }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white rounded-lg text-xs font-medium transition-all"
          >
            <ShoppingBag className="w-3 h-3" />
            اطلب
          </span>
        </div>
      </div>
    </Link>
  );
}
