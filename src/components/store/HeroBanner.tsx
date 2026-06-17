import { ShoppingBag, Sparkles, Truck, ShieldCheck, Headphones, Sun, Moon } from "lucide-react";
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
  onShopNow?: () => void;
  onToggleTheme?: () => void;
  isDark?: boolean;
  productCount?: number;
}

export function HeroBanner({ store, slug, featuredImage, onShopNow, onToggleTheme, isDark, productCount }: HeroBannerProps) {
  const tgDeepLink = `https://t.me/wflowAbod_bot?start=ws-${slug}`;

  return (
    <section className="relative bg-gradient-to-l from-blue-600 via-blue-500 to-indigo-600 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.1),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(99,102,241,0.2),transparent_60%)]" />
      <div className="relative max-w-6xl mx-auto px-4 py-5 sm:py-7">
        <div className="flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1.5">
              {store.logoUrl ? (
                <div className="w-9 h-9 rounded-xl overflow-hidden border border-white/20 shadow-lg flex-shrink-0">
                  <img src={store.logoUrl} alt="" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                  <ShoppingBag className="w-4 h-4 text-white" />
                </div>
              )}
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight truncate">
                  {store.workspaceName}
                </h1>
                {productCount !== undefined && (
                  <p className="text-[11px] text-blue-200">{productCount} منتج</p>
                )}
              </div>
            </div>
            {store.description && (
              <p className="text-xs text-blue-100 leading-relaxed max-w-md line-clamp-1 mb-2">
                {store.description}
              </p>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={onShopNow}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-white text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-50 transition-all shadow-lg"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                تسوق الآن
              </button>
              <a
                href={tgDeepLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 text-white rounded-xl text-xs font-medium hover:bg-blue-500/30 transition-all border border-white/10"
              >
                تواصل عبر التليجرام
              </a>
              <div className="hidden sm:flex items-center gap-3 mr-2">
                {trustBadges.map(badge => (
                  <div key={badge.label} className="flex items-center gap-1 text-[10px] text-blue-200">
                    <badge.icon className="w-3 h-3" />
                    {badge.label}
                  </div>
                ))}
              </div>
              {onToggleTheme && (
                <button
                  onClick={onToggleTheme}
                  className="mr-auto p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white/80"
                >
                  {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>
          {featuredImage && (
            <div className="hidden sm:block w-28 h-28 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl flex-shrink-0 -rotate-3 hover:rotate-0 transition-transform duration-500">
              <img src={featuredImage} alt="" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
