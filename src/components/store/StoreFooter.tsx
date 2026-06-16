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
    <footer className="bg-white border-t border-gray-100 mt-16">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {store.logoUrl ? (
                <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0 shadow-sm">
                  <img src={store.logoUrl} alt={store.workspaceName} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Store className="w-5 h-5 text-white" />
                </div>
              )}
              <h3 className="font-bold text-base text-gray-900">{store.workspaceName}</h3>
            </div>
            {store.description && (
              <p className="text-sm text-gray-400 leading-relaxed line-clamp-3">{store.description}</p>
            )}
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">اتصل بنا</h4>
            <ul className="space-y-2.5">
              {store.phone && (
                <li>
                  <a href={`tel:${store.phone}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors" dir="ltr">
                    <Phone className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    {store.phone}
                  </a>
                </li>
              )}
              {store.address && (
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span>{store.address}</span>
                </li>
              )}
              <li>
                <a
                  href={tgDeepLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <Send className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  تواصل عبر التليجرام
                </a>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">روابط سريعة</h4>
            <ul className="space-y-2.5">
              <li>
                <a href={storeUrl} className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  الصفحة الرئيسية
                </a>
              </li>
              <li>
                <a href={tgDeepLink} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  الطلب عبر التليجرام
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">تابعنا</h4>
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
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-blue-50 rounded-lg text-xs font-medium text-gray-600 hover:text-blue-600 transition-all border border-gray-100 hover:border-blue-200"
                    >
                      {socialIcons[key] ?? "🔗"} {socialLabels[key] ?? key}
                    </a>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400">لا توجد روابط تواصل</p>
            )}
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <Copyright className="w-3 h-3" />
            {new Date().getFullYear()} {store.workspaceName}. جميع الحقوق محفوظة.
          </p>
          <p className="text-xs text-gray-300">
            مدعوم من <span className="font-bold text-gray-400">W-Flow Connect</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
