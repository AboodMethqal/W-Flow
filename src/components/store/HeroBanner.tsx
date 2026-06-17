import { Store, ShoppingBag, Sparkles, ShieldCheck, Truck, Headphones } from "lucide-react";
import type { StoreInfo } from "@/hooks/usePublicProducts";

const socialPlatforms: Record<string, { label: string; icon: string }> = {
  instagram: { label: "إنستقرام", icon: "📸" },
  facebook: { label: "فيسبوك", icon: "📘" },
  twitter: { label: "تويتر", icon: "🐦" },
  tiktok: { label: "تيك توك", icon: "🎵" },
  whatsapp: { label: "واتساب", icon: "💬" },
};

const trustBadges = [
  { icon: Truck, label: "شحن سريع" },
  { icon: ShieldCheck, label: "تاجر موثوق" },
  { icon: Headphones, label: "دعم متواصل" },
  { icon: Sparkles, label: "منتجات أصلية" },
];

interface HeroBannerProps {
  store: StoreInfo;
  slug: string;
  productCount: number;
  categoryCount: number;
}

export function HeroBanner({ store, slug, productCount, categoryCount }: HeroBannerProps) {
  const tgDeepLink = `https://t.me/wflowAbod_bot?start=ws-${slug}`;

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-50/30 border-b border-gray-100/50">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(37,99,235,0.04),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(59,130,246,0.03),transparent_60%)]" />

      <div className="relative max-w-6xl mx-auto px-4 py-12 sm:py-20">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8 text-center sm:text-right">
          {store.logoUrl ? (
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border border-gray-100 shadow-lg flex-shrink-0 ring-4 ring-white">
              <img src={store.logoUrl} alt={store.workspaceName} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20 flex-shrink-0 ring-4 ring-white">
              <Store className="w-12 h-12 text-white" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-[1.1] tracking-tight">
              {store.workspaceName}
            </h1>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-4">
              <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3.5 py-1.5 rounded-full text-sm font-semibold">
                <Sparkles className="w-4 h-4" />
                {productCount} {productCount === 1 ? "منتج" : "منتجات"}
              </span>
              {categoryCount > 0 && (
                <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-600 px-3.5 py-1.5 rounded-full text-sm font-medium">
                  {categoryCount} {categoryCount === 1 ? "قسم" : "أقسام"}
                </span>
              )}
            </div>
          </div>
        </div>

        {store.description && (
          <p className="text-base sm:text-lg text-gray-500 leading-relaxed max-w-xl text-center sm:text-right mx-auto sm:mx-0 mb-8">
            {store.description}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-10">
          <a
            href={tgDeepLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0"
          >
            <ShoppingBag className="w-4 h-4" />
            تسوق الآن
          </a>
        </div>

        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-6">
          {store.phone && (
            <a
              href={`tel:${store.phone}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200/80 rounded-xl text-sm text-gray-600 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
              dir="ltr"
            >
              {store.phone}
            </a>
          )}
          {store.address && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200/80 rounded-xl text-sm text-gray-600 shadow-sm">
              {store.address}
            </span>
          )}
        </div>

        {store.socialLinks && Object.entries(store.socialLinks).filter(([, v]) => v).length > 0 && (
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-10">
            {Object.entries(store.socialLinks).map(([key, value]) => {
              if (!value) return null;
              const platform = socialPlatforms[key];
              return (
                <a
                  key={key}
                  href={value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200/80 hover:border-blue-200 rounded-xl text-xs font-semibold text-gray-600 hover:text-blue-600 transition-all shadow-sm"
                >
                  {platform?.icon ?? "🔗"} {platform?.label ?? key}
                </a>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-6 pt-6 border-t border-gray-200/60">
          {trustBadges.map((badge) => (
            <div key={badge.label} className="flex items-center gap-2 text-sm text-gray-400">
              <div className="w-8 h-8 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center">
                <badge.icon className="w-4 h-4 text-blue-500" />
              </div>
              <span>{badge.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
