import { ShoppingBag, Sparkles, Truck, ShieldCheck, Headphones } from "lucide-react";
import type { StoreInfo } from "@/hooks/usePublicProducts";

const trustBadges = [
  { icon: Truck, label: "شحن سريع" },
  { icon: ShieldCheck, label: "تاجر موثوق" },
  { icon: Headphones, label: "دعم متواصل" },
  { icon: Sparkles, label: "منتجات أصلية" },
];

interface HeroBannerProps {
  store: StoreInfo;
  slug: string;
  featuredImage?: string | null;
}

export function HeroBanner({ store, slug, featuredImage }: HeroBannerProps) {
  const tgDeepLink = `https://t.me/wflowAbod_bot?start=ws-${slug}`;

  return (
    <section className="relative bg-gradient-to-l from-blue-600 via-blue-500 to-indigo-600 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.1),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(99,102,241,0.2),transparent_60%)]" />
      <div className="relative max-w-6xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex items-center gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              {store.logoUrl ? (
                <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/20 shadow-lg flex-shrink-0">
                  <img src={store.logoUrl} alt="" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                  <ShoppingBag className="w-5 h-5 text-white" />
                </div>
              )}
              <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                {store.workspaceName}
              </h1>
            </div>
            {store.description && (
              <p className="text-sm text-blue-100 leading-relaxed max-w-md mb-3 line-clamp-1 sm:line-clamp-none">
                {store.description}
              </p>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <a
                href={tgDeepLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-50 transition-all shadow-lg"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                تسوق الآن
              </a>
              <div className="flex items-center gap-3 mr-2">
                {trustBadges.map((badge) => (
                  <div key={badge.label} className="hidden sm:flex items-center gap-1 text-[10px] text-blue-200">
                    <badge.icon className="w-3 h-3" />
                    {badge.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
          {featuredImage && (
            <div className="hidden sm:block w-32 h-32 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl flex-shrink-0 -rotate-3 hover:rotate-0 transition-transform duration-500">
              <img src={featuredImage} alt="" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
