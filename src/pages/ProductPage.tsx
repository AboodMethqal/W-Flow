import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Store, ShoppingBag, ArrowRight, Image as ImageIcon, Loader2, Package } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;

export default function ProductPage() {
  const { slug, id } = useParams<{ slug: string; id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ["public-product", slug, id],
    queryFn: async () => {
      if (!slug || !id) return null;
      const { data: ws } = await supabase
        .from("workspaces")
        .select("id, name")
        .eq("slug", slug)
        .maybeSingle();
      if (!ws) return null;
      const { data: product } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .eq("workspace_id", ws.id)
        .maybeSingle();
      if (!product) return null;
      return { workspaceName: ws.name, product: product as Product };
    },
    enabled: !!slug && !!id,
  });

  const product = data?.product;
  const workspaceName = data?.workspaceName || "";
  const baseUrl = `${window.location.protocol}//${window.location.host}`;
  const storeUrl = `${baseUrl}/store/${slug}`;
  const tgDeepLink = product
    ? `https://t.me/wflowAbod_bot?start=ws-${slug}`
    : "";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-surface-container-high rounded-2xl flex items-center justify-center mx-auto">
            <Package className="w-8 h-8 text-on-surface-variant/30" />
          </div>
          <p className="text-on-surface-variant text-sm">المنتج غير موجود</p>
          <Link to={`/store/${slug}`} className="text-primary text-sm font-bold hover:underline inline-flex items-center gap-1">
            <ArrowRight className="w-3 h-3" />
            العودة إلى المتجر
          </Link>
        </div>
      </div>
    );
  }

  const statusEmoji = product.is_available ? "✅" : "❌";
  const statusText = product.is_available ? "متوفر" : "غير متوفر";

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Top bar */}
      <header className="border-b border-outline-variant/10 bg-surface-container-low/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to={`/store/${slug}`} className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors">
            <ArrowRight className="w-4 h-4" />
            العودة إلى {workspaceName || "المتجر"}
          </Link>
          <div className="flex items-center gap-2 text-xs text-on-surface-variant/60">
            <Store className="w-3 h-3" />
            {workspaceName}
          </div>
        </div>
      </header>

      {/* Product details */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Image */}
          <div className="aspect-square bg-surface-container-high rounded-2xl overflow-hidden flex items-center justify-center border border-outline-variant/10">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <ImageIcon className="w-24 h-24 text-on-surface-variant/20" />
            )}
          </div>

          {/* Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-black text-on-surface font-headline">{product.name}</h1>
              {product.category && (
                <span className="inline-block mt-2 px-3 py-1 bg-primary/10 text-primary rounded-lg text-xs font-bold">
                  {product.category}
                </span>
              )}
            </div>

            <p className="text-3xl font-black text-primary tabular-nums">
              {product.price.toLocaleString("ar-SA", { minimumFractionDigits: 2 })} ر.س
            </p>

            <div className="flex items-center gap-2 text-sm">
              <span>{statusEmoji}</span>
              <span className={product.is_available ? "text-emerald-600 font-bold" : "text-red-500 font-bold"}>
                {statusText}
              </span>
            </div>

            {product.description && (
              <div>
                <h3 className="text-sm font-bold text-on-surface mb-2">الوصف</h3>
                <p className="text-sm text-on-surface-variant/80 leading-relaxed whitespace-pre-line">{product.description}</p>
              </div>
            )}

            {product.sku && (
              <p className="text-xs text-on-surface-variant/50" dir="ltr">SKU: {product.sku}</p>
            )}

            <a
              href={tgDeepLink}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 w-full justify-center"
            >
              <ShoppingBag className="w-4 h-4" />
              اطلب هذا المنتج عبر التليجرام
            </a>

            <p className="text-xs text-on-surface-variant/40 text-center">
              بعد فتح التليجرام، اكتب اسم المنتج وسيساعدك البوت في إتمام الطلب
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-outline-variant/5 py-8 text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-on-surface-variant/40">
          <Store className="w-3 h-3" />
          <a href={storeUrl} className="text-xs hover:text-on-surface-variant/60 transition-colors">
            {storeUrl.replace(/^https?:\/\//, "")}
          </a>
        </div>
        <p className="text-xs text-on-surface-variant/40">
          مدعوم من <span className="font-bold text-on-surface-variant/60">W-Flow Connect</span>
        </p>
      </footer>
    </div>
  );
}
