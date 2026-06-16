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
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-white border-b border-gray-100">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(37,99,235,0.03),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(59,130,246,0.02),transparent_50%)]" />

      <div className="relative max-w-6xl mx-auto px-4 py-10 sm:py-16">
        {/* Logo + Name */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 mb-6 text-center sm:text-right">
          {store.logoUrl ? (
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-gray-100 shadow-md flex-shrink-0">
              <img src={store.logoUrl} alt={store.workspaceName} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
              <Store className="w-10 h-10 text-white" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              {store.workspaceName}
            </h1>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3 text-sm text-gray-500">
              <span className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                {productCount} {productCount === 1 ? "منتج" : "منتجات"}
              </span>
              {categoryCount > 0 && (
                <span className="flex items-center gap-1.5 bg-gray-50 text-gray-600 px-3 py-1 rounded-full font-medium">
                  {categoryCount} {categoryCount === 1 ? "قسم" : "أقسام"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {store.description && (
          <p className="text-base sm:text-lg text-gray-500 leading-relaxed max-w-2xl text-center sm:text-right mx-auto sm:mx-0 mb-6">
            {store.description}
          </p>
        )}

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-8">
          <a
            href={tgDeepLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/25"
          >
            <ShoppingBag className="w-4 h-4" />
            تسوق الآن
          </a>
        </div>

        {/* Contact Info + Social */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-6 text-sm">
          {store.phone && (
            <a
              href={`tel:${store.phone}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-600 hover:text-blue-600 hover:border-blue-200 transition-all"
              dir="ltr"
            >
              {store.phone}
            </a>
          )}
          {store.address && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-600">
              {store.address}
            </span>
          )}
        </div>

        {/* Social Links */}
        {store.socialLinks && Object.entries(store.socialLinks).filter(([, v]) => v).length > 0 && (
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-8">
            {Object.entries(store.socialLinks).map(([key, value]) => {
              if (!value) return null;
              const platform = socialPlatforms[key];
              return (
                <a
                  key={key}
                  href={value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:border-blue-200 rounded-lg text-xs font-medium text-gray-600 hover:text-blue-600 transition-all"
                >
                  {platform?.icon ?? "🔗"} {platform?.label ?? key}
                </a>
              );
            })}
          </div>
        )}

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-4 border-t border-gray-100">
          {trustBadges.map((badge) => (
            <div key={badge.label} className="flex items-center gap-1.5 text-xs text-gray-400">
              <badge.icon className="w-3.5 h-3.5 text-blue-500" />
              {badge.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
