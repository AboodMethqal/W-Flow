import type { Tables } from "@/integrations/supabase/types";
import { ShoppingBag, ImageIcon, PackageCheck } from "lucide-react";
import { Link } from "react-router-dom";

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
      className="group bg-card rounded-xl overflow-hidden border border-border hover:border-primary/30 hover:shadow-[0_4px_20px_rgba(37,99,235,0.12)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
    >
      <div className="relative aspect-square bg-muted overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-10 h-10 text-muted-foreground/20" />
          </div>
        )}
        {!product.is_available && (
          <span className="absolute top-2 right-2 px-2 py-0.5 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-md">
            غير متوفر
          </span>
        )}
        {product.is_available && (
          <span className="absolute top-2 left-2 px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-bold rounded-md flex items-center gap-0.5">
            <PackageCheck className="w-2.5 h-2.5" />
            متوفر
          </span>
        )}
        <span
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(tgDeepLink, "_blank"); }}
          className="absolute bottom-2 left-2 right-2 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-center shadow-lg"
        >
          <ShoppingBag className="w-3.5 h-3.5 inline-block ml-1" />
          اطلب الآن
        </span>
      </div>
      <div className="p-2.5 flex flex-col gap-1">
        {product.category && (
          <span className="text-[9px] text-muted-foreground/60 font-medium">{product.category}</span>
        )}
        <h3 className="text-[12px] font-semibold text-card-foreground leading-snug line-clamp-1">
          {product.name}
        </h3>
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-sm font-bold text-card-foreground tabular-nums">
            {product.price.toLocaleString("ar-SA", { minimumFractionDigits: 0 })}
            <span className="text-[9px] text-muted-foreground mr-0.5">ر.س</span>
          </p>
          <span className="text-[9px] text-primary font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
            تفاصيل ←
          </span>
        </div>
      </div>
    </Link>
  );
}
