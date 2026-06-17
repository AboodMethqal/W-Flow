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
      <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center" dir="rtl">
        <div className="flex flex-col items-center gap-3 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <p className="text-sm text-gray-400">جاري تحميل المنتج...</p>
        </div>
      </div>
    );
  }

  if (!product || !store) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center" dir="rtl">
        <div className="text-center space-y-4 bg-white p-10 rounded-2xl shadow-sm border border-gray-100 max-w-sm mx-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <Package className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-700 font-bold">المنتج غير موجود</p>
          <Link to={`/store/${slug}`} className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20">
            <ArrowRight className="w-3.5 h-3.5" />
            العودة إلى المتجر
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="storefront min-h-screen bg-[#F4F6F9]" dir="rtl">
      {/* Top bar */}
      <header className="border-b border-gray-100/50 bg-white/95 backdrop-blur-xl sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            to={`/store/${slug}`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            العودة للمتجر
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Store className="w-3 h-3" />
            {store.workspaceName}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-14">
          {/* Image */}
          <div className="relative aspect-square bg-white rounded-2xl overflow-hidden border border-gray-100/80 group shadow-sm">
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
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              {product.category && (
                <span className="px-3 py-1.5 bg-white/80 backdrop-blur-md text-gray-600 text-xs font-semibold rounded-lg border border-white/50 shadow-sm flex items-center gap-1.5">
                  <Tag className="w-3 h-3" />
                  {product.category}
                </span>
              )}
              {product.sku && (
                <span className="px-3 py-1.5 bg-white/80 backdrop-blur-md text-gray-400 text-[10px] rounded-lg border border-white/50 shadow-sm flex items-center gap-1.5" dir="ltr">
                  <Hash className="w-3 h-3" />
                  {product.sku}
                </span>
              )}
            </div>
            <span className={`absolute bottom-4 right-4 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border shadow-sm ${
              product.is_available
                ? "bg-white/80 backdrop-blur-md text-emerald-600 border-emerald-100/50"
                : "bg-white/80 backdrop-blur-md text-red-500 border-red-100/50"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${product.is_available ? "bg-emerald-500" : "bg-red-500"}`} />
              {product.is_available ? "متوفر" : "غير متوفر"}
            </span>
          </div>

          {/* Info */}
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">{product.name}</h1>
            </div>

            {/* Price */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-50/50 rounded-2xl p-5 border border-blue-100/50">
              <p className="text-3xl sm:text-4xl font-bold text-gray-900 tabular-nums tracking-tight">
                {product.price.toLocaleString("ar-SA", { minimumFractionDigits: 2 })}
                <span className="text-lg sm:text-xl text-gray-500 mr-1 font-medium">ر.س</span>
              </p>
            </div>

            {/* Description */}
            {product.description && (
              <div className="bg-white rounded-2xl p-5 border border-gray-100/80 shadow-sm">
                <h3 className="text-xs font-bold text-gray-500 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-blue-500 rounded-full inline-block" />
                  الوصف
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{product.description}</p>
              </div>
            )}

            {/* Trust */}
            <div className="grid grid-cols-2 gap-2.5">
              {trustItems.map((item) => (
                <div key={item.label} className="flex items-center gap-2.5 px-3.5 py-3 bg-white rounded-xl border border-gray-100/80 shadow-sm">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-4 h-4 text-blue-500" />
                  </div>
                  <span className="text-xs text-gray-600 font-medium">{item.label}</span>
                </div>
              ))}
            </div>

            {/* Contact */}
            {store.phone && (
              <div className="bg-white rounded-2xl p-5 border border-gray-100/80 shadow-sm">
                <h3 className="text-xs font-bold text-gray-500 mb-3 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Phone className="w-3 h-3 text-blue-500" />
                  </div>
                  تواصل مع التاجر
                </h3>
                <a
                  href={`tel:${store.phone}`}
                  className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 hover:text-blue-600 hover:border-blue-200 transition-all font-medium"
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
                className="inline-flex items-center justify-center gap-2.5 px-6 py-4 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 w-full"
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
          <section className="mt-14 sm:mt-18 pt-10 border-t border-gray-100/60">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-1 h-6 bg-blue-500 rounded-full inline-block" />
              <h2 className="text-xl font-bold text-gray-900">منتجات مشابهة</h2>
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
