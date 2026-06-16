import { Link } from "react-router-dom";
import { ShoppingBag, ImageIcon } from "lucide-react";
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
      className="group bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant/10 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 flex flex-col animate-fade-in"
    >
      <div className="relative h-48 sm:h-52 bg-surface-container-high overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-on-surface-variant/20" />
          </div>
        )}
        {product.category && (
          <span className="absolute top-3 right-3 px-2.5 py-1 bg-surface/90 backdrop-blur-sm text-on-surface-variant text-[10px] font-bold rounded-lg border border-outline-variant/10">
            {product.category}
          </span>
        )}
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors line-clamp-2 leading-snug">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-xs text-on-surface-variant/60 line-clamp-2 leading-relaxed">{product.description}</p>
        )}
        <div className="flex items-center justify-between gap-2 mt-auto pt-2 border-t border-outline-variant/5">
          <p className="text-base font-black text-primary tabular-nums">
            {product.price.toLocaleString("ar-SA", { minimumFractionDigits: 2 })} ر.س
          </p>
          <span
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(tgDeepLink, "_blank"); }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground rounded-lg text-xs font-bold transition-all"
          >
            <ShoppingBag className="w-3 h-3" />
            اطلب
          </span>
        </div>
      </div>
    </Link>
  );
}
