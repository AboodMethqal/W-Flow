import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Store, ShoppingBag, ArrowRight, ImageIcon, Loader2, Package, Phone, Tag, Hash } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { ProductCard } from "@/components/store/ProductCard";
import { StoreFooter } from "@/components/store/StoreFooter";
import type { StoreInfo } from "@/hooks/usePublicProducts";

type Product = Tables<"products">;

export default function ProductPage() {
  const { slug, id } = useParams<{ slug: string; id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ["public-product", slug, id],
    queryFn: async () => {
      if (!slug || !id) return null;
      const { data: ws } = await supabase
        .from("workspaces")
        .select("id, name, logo_url, description, phone, address, social_links")
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

      const { data: related } = await supabase
        .from("products")
        .select("*")
        .eq("workspace_id", ws.id)
        .eq("is_available", true)
        .eq("category", product.category)
        .neq("id", product.id)
        .order("created_at", { ascending: false })
        .limit(3);

      return {
        store: {
          workspaceName: ws.name,
          workspaceId: ws.id,
          logoUrl: ws.logo_url,
          description: ws.description,
          phone: ws.phone,
          address: ws.address,
          socialLinks: (ws.social_links as Record<string, string>) || {},
        } as StoreInfo,
        product: product as Product,
        related: (related ?? []) as Product[],
      };
    },
    enabled: !!slug && !!id,
  });

  const product = data?.product;
  const store = data?.store;
  const related = data?.related ?? [];
  const baseUrl = `${window.location.protocol}//${window.location.host}`;
  const storeUrl = `${baseUrl}/store/${slug}`;
  const tgDeepLink = product
    ? `https://t.me/wflowAbod_bot?start=ws-${slug}`
    : "";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs text-on-surface-variant/50">جاري تحميل المنتج...</p>
        </div>
      </div>
    );
  }

  if (!product || !store) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="text-center space-y-3">
          <div className="w-20 h-20 bg-surface-container-high rounded-full flex items-center justify-center mx-auto">
            <Package className="w-10 h-10 text-on-surface-variant/20" />
          </div>
          <p className="text-on-surface-variant font-bold text-sm">المنتج غير موجود</p>
          <Link to={`/store/${slug}`} className="inline-flex items-center gap-1 px-4 py-2 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground rounded-lg text-xs font-bold transition-all">
            <ArrowRight className="w-3 h-3" />
            العودة إلى المتجر
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Top bar */}
      <header className="border-b border-outline-variant/10 bg-surface/95 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            to={`/store/${slug}`}
            className="inline-flex items-center gap-2 text-xs text-on-surface-variant/60 hover:text-on-surface transition-colors"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            العودة إلى {store.workspaceName}
          </Link>
          <div className="flex items-center gap-2 text-xs text-on-surface-variant/50">
            <Store className="w-3 h-3" />
            {store.workspaceName}
          </div>
        </div>
      </header>

      {/* Product details */}
      <main className="max-w-5xl mx-auto px-4 py-6 sm:py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
          {/* Image */}
          <div className="aspect-square bg-surface-container-high rounded-2xl overflow-hidden flex items-center justify-center border border-outline-variant/10 group relative">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-on-surface-variant/20">
                <ImageIcon className="w-24 h-24" />
                <span className="text-xs">لا توجد صورة</span>
              </div>
            )}
            {product.category && (
              <span className="absolute top-4 right-4 px-3 py-1.5 bg-surface/90 backdrop-blur-sm text-on-surface-variant text-[10px] font-bold rounded-lg border border-outline-variant/10 flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {product.category}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="space-y-5 sm:space-y-6">
            <div>
              <h1 className="text-xl sm:text-3xl font-black text-on-surface font-headline leading-tight">{product.name}</h1>
              <div className="flex items-center gap-3 mt-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                  product.is_available ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${product.is_available ? "bg-emerald-400" : "bg-red-400"}`} />
                  {product.is_available ? "متوفر" : "غير متوفر"}
                </span>
                {product.sku && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-on-surface-variant/50" dir="ltr">
                    <Hash className="w-3 h-3" />
                    {product.sku}
                  </span>
                )}
              </div>
            </div>

            <div className="bg-surface-container-high rounded-xl p-4 border border-outline-variant/5">
              <p className="text-3xl sm:text-4xl font-black text-primary tabular-nums">
                {product.price.toLocaleString("ar-SA", { minimumFractionDigits: 2 })}
                <span className="text-lg sm:text-xl mr-1">ر.س</span>
              </p>
            </div>

            {product.description && (
              <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/5">
                <h3 className="text-xs font-bold text-on-surface-variant mb-2 flex items-center gap-1.5">
                  <span className="w-1 h-3 bg-primary rounded-full inline-block" />
                  الوصف
                </h3>
                <p className="text-sm text-on-surface-variant/80 leading-relaxed whitespace-pre-line">{product.description}</p>
              </div>
            )}

            {/* Quick info */}
            <div className="grid grid-cols-2 gap-3">
              {store.phone && (
                <a
                  href={`tel:${store.phone}`}
                  className="flex items-center gap-2 px-3 py-2.5 bg-surface-container-high rounded-xl border border-outline-variant/5 text-xs text-on-surface-variant/70 hover:text-primary hover:border-primary/20 transition-all"
                  dir="ltr"
                >
                  <Phone className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  {store.phone}
                </a>
              )}
            </div>

            {/* CTA */}
            <div className="space-y-3 pt-2">
              <a
                href={tgDeepLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 w-full"
              >
                <ShoppingBag className="w-4 h-4" />
                اطلب هذا المنتج عبر التليجرام
              </a>
              <p className="text-[10px] text-on-surface-variant/40 text-center">
                بعد فتح التليجرام، اكتب اسم المنتج وسيساعدك البوت في إتمام الطلب
              </p>
            </div>
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <section className="mt-12 sm:mt-16 pt-8 border-t border-outline-variant/10">
            <div className="flex items-center gap-2 mb-5">
              <span className="w-1 h-5 bg-primary rounded-full inline-block" />
              <h2 className="text-base font-black text-on-surface font-headline">منتجات مشابهة</h2>
              <span className="text-xs text-on-surface-variant/40 font-normal">({related.length})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} slug={slug!} />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      {store && <StoreFooter store={store} slug={slug!} />}
    </div>
  );
}
