import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Store, ShoppingBag, ArrowRight, ImageIcon, Loader2, Package, Phone, Tag, Hash, Truck, ShieldCheck, Headphones, Sparkles } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { ProductCard } from "@/components/store/ProductCard";
import { StoreFooter } from "@/components/store/StoreFooter";
import type { StoreInfo } from "@/hooks/usePublicProducts";

type Product = Tables<"products">;

const trustItems = [
  { icon: Truck, label: "شحن سريع وآمن" },
  { icon: ShieldCheck, label: "تسوق آمن وموثوق" },
  { icon: Headphones, label: "دعم فني متواصل" },
  { icon: Sparkles, label: "منتجات أصلية 100%" },
];

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
        .limit(4);

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
  const tgDeepLink = product
    ? `https://t.me/wflowAbod_bot?start=ws-${slug}`
    : "";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center" dir="rtl">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <p className="text-sm text-gray-400">جاري تحميل المنتج...</p>
        </div>
      </div>
    );
  }

  if (!product || !store) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center" dir="rtl">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
            <Package className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-600 font-semibold text-sm">المنتج غير موجود</p>
          <Link to={`/store/${slug}`} className="inline-flex items-center gap-1 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg text-sm font-medium transition-all">
            <ArrowRight className="w-3.5 h-3.5" />
            العودة إلى المتجر
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="storefront min-h-screen bg-white" dir="rtl">
      {/* Top bar */}
      <header className="border-b border-gray-100 bg-white/95 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            to={`/store/${slug}`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            العودة
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Store className="w-3 h-3" />
            {store.workspaceName}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 sm:py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12">
          {/* Image Gallery */}
          <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 group">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-200">
                <ImageIcon className="w-20 h-20" />
                <span className="text-xs text-gray-300">لا توجد صورة</span>
              </div>
            )}
            <div className="absolute top-3 right-3 flex flex-col gap-1.5">
              {product.category && (
                <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-gray-600 text-xs font-medium rounded-lg border border-gray-100/50 shadow-sm flex items-center gap-1.5">
                  <Tag className="w-3 h-3" />
                  {product.category}
                </span>
              )}
              {product.sku && (
                <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-gray-400 text-[10px] rounded-lg border border-gray-100/50 shadow-sm flex items-center gap-1.5" dir="ltr">
                  <Hash className="w-3 h-3" />
                  {product.sku}
                </span>
              )}
            </div>
            <span className={`absolute bottom-3 right-3 px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 border ${
              product.is_available
                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                : "bg-red-50 text-red-500 border-red-100"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${product.is_available ? "bg-emerald-500" : "bg-red-500"}`} />
              {product.is_available ? "متوفر" : "غير متوفر"}
            </span>
          </div>

          {/* Product Info */}
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">{product.name}</h1>
            </div>

            {/* Price */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <p className="text-3xl sm:text-4xl font-bold text-gray-900 tabular-nums">
                {product.price.toLocaleString("ar-SA", { minimumFractionDigits: 2 })}
                <span className="text-lg sm:text-xl text-gray-500 mr-1">ر.س</span>
              </p>
            </div>

            {/* Description */}
            {product.description && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <h3 className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1.5">
                  <span className="w-1 h-3 bg-blue-500 rounded-full inline-block" />
                  الوصف
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{product.description}</p>
              </div>
            )}

            {/* Trust */}
            <div className="grid grid-cols-2 gap-2">
              {trustItems.map((item) => (
                <div key={item.label} className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-100">
                  <item.icon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <span className="text-xs text-gray-600">{item.label}</span>
                </div>
              ))}
            </div>

            {/* Contact Merchant */}
            {store.phone && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <h3 className="text-xs font-bold text-gray-500 mb-3 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-blue-500" />
                  تواصل مع التاجر
                </h3>
                <a
                  href={`tel:${store.phone}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:text-blue-600 hover:border-blue-200 transition-all"
                  dir="ltr"
                >
                  <Phone className="w-4 h-4 text-blue-500" />
                  {store.phone}
                </a>
              </div>
            )}

            {/* CTA */}
            <div className="space-y-3 pt-2">
              <a
                href={tgDeepLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/25 w-full"
              >
                <ShoppingBag className="w-4 h-4" />
                اطلب هذا المنتج عبر التليجرام
              </a>
              <p className="text-xs text-gray-400 text-center">
                بعد فتح التليجرام، اكتب اسم المنتج وسيساعدك البوت في إتمام الطلب
              </p>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <section className="mt-12 sm:mt-16 pt-8 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-5">
              <span className="w-1 h-5 bg-blue-500 rounded-full inline-block" />
              <h2 className="text-lg font-bold text-gray-900">منتجات مشابهة</h2>
              <span className="text-sm text-gray-400 font-normal">({related.length})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} slug={slug!} />
              ))}
            </div>
          </section>
        )}
      </main>

      <StoreFooter store={store} slug={slug!} />
    </div>
  );
}
