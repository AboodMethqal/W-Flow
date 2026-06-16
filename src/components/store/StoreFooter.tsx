import { Store, Phone, MapPin, Send, Copyright } from "lucide-react";
import type { StoreInfo } from "@/hooks/usePublicProducts";

interface StoreFooterProps {
  store: StoreInfo;
  slug: string;
}

const socialIcons: Record<string, string> = {
  instagram: "📸",
  facebook: "📘",
  twitter: "🐦",
  tiktok: "🎵",
  whatsapp: "💬",
};

const socialLabels: Record<string, string> = {
  instagram: "إنستقرام",
  facebook: "فيسبوك",
  twitter: "تويتر",
  tiktok: "تيك توك",
  whatsapp: "واتساب",
};

export function StoreFooter({ store, slug }: StoreFooterProps) {
  const storeUrl = `${window.location.protocol}//${window.location.host}/store/${slug}`;
  const tgDeepLink = `https://t.me/wflowAbod_bot?start=ws-${slug}`;

  const hasSocialLinks = store.socialLinks && Object.entries(store.socialLinks).filter(([, v]) => v).length > 0;

  return (
    <footer className="border-t border-outline-variant/10 bg-surface-container-low mt-16">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand column */}
          <div className="lg:col-span-1 space-y-3">
            <div className="flex items-center gap-3">
              {store.logoUrl ? (
                <div className="w-10 h-10 rounded-xl overflow-hidden border border-outline-variant/10 flex-shrink-0">
                  <img src={store.logoUrl} alt={store.workspaceName} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center flex-shrink-0">
                  <Store className="w-5 h-5 text-primary-foreground" />
                </div>
              )}
              <h3 className="font-black text-sm text-on-surface font-headline">{store.workspaceName}</h3>
            </div>
            {store.description && (
              <p className="text-xs text-on-surface-variant/60 leading-relaxed line-clamp-3">{store.description}</p>
            )}
          </div>

          {/* Contact column */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">معلومات الاتصال</h4>
            <ul className="space-y-2">
              {store.phone && (
                <li className="flex items-center gap-2 text-xs text-on-surface-variant/70" dir="ltr">
                  <Phone className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <a href={`tel:${store.phone}`} dir="ltr" className="hover:text-primary transition-colors">{store.phone}</a>
                </li>
              )}
              {store.address && (
                <li className="flex items-start gap-2 text-xs text-on-surface-variant/70">
                  <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                  <span>{store.address}</span>
                </li>
              )}
              <li className="flex items-center gap-2 text-xs text-on-surface-variant/70">
                <Send className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <a
                  href={tgDeepLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  تواصل عبر التليجرام
                </a>
              </li>
            </ul>
          </div>

          {/* Quick links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">روابط سريعة</h4>
            <ul className="space-y-2">
              <li>
                <a href={storeUrl} className="text-xs text-on-surface-variant/70 hover:text-primary transition-colors">
                  الصفحة الرئيسية
                </a>
              </li>
              <li>
                <a
                  href={tgDeepLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-on-surface-variant/70 hover:text-primary transition-colors"
                >
                  الطلب عبر التليجرام
                </a>
              </li>
            </ul>
          </div>

          {/* Social column */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">تابعنا</h4>
            {hasSocialLinks ? (
              <div className="flex flex-wrap gap-2">
                {Object.entries(store.socialLinks).map(([key, value]) => {
                  if (!value) return null;
                  return (
                    <a
                      key={key}
                      href={value}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-high hover:bg-surface-container-highest rounded-lg text-xs font-bold text-on-surface-variant hover:text-primary transition-all"
                    >
                      {socialIcons[key] ?? "🔗"} {socialLabels[key] ?? key}
                    </a>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-on-surface-variant/40">لا توجد روابط تواصل اجتماعي</p>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-outline-variant/5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[10px] text-on-surface-variant/40 flex items-center gap-1">
            <Copyright className="w-3 h-3" />
            {new Date().getFullYear()} {store.workspaceName}. جميع الحقوق محفوظة.
          </p>
          <p className="text-[10px] text-on-surface-variant/30">
            مدعوم من <span className="font-bold text-on-surface-variant/40">W-Flow Connect</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
