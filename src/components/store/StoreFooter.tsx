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
    <footer className="bg-white border-t border-gray-100/80 mt-16">
      <div className="max-w-6xl mx-auto px-4 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {store.logoUrl ? (
                <div className="w-11 h-11 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0 shadow-sm">
                  <img src={store.logoUrl} alt={store.workspaceName} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                  <Store className="w-5 h-5 text-white" />
                </div>
              )}
              <h3 className="font-bold text-base text-gray-900">{store.workspaceName}</h3>
            </div>
            {store.description && (
              <p className="text-sm text-gray-400 leading-relaxed line-clamp-3">{store.description}</p>
            )}
          </div>

          <div className="space-y-4">
            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.08em]">اتصل بنا</h4>
            <ul className="space-y-3">
              {store.phone && (
                <li>
                  <a href={`tel:${store.phone}`} className="flex items-center gap-2.5 text-sm text-gray-600 hover:text-blue-600 transition-colors group" dir="ltr">
                    <span className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                      <Phone className="w-3.5 h-3.5 text-blue-500" />
                    </span>
                    {store.phone}
                  </a>
                </li>
              )}
              {store.address && (
                <li className="flex items-start gap-2.5 text-sm text-gray-600">
                  <span className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-500" />
                  </span>
                  <span>{store.address}</span>
                </li>
              )}
              <li>
                <a
                  href={tgDeepLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-sm text-gray-600 hover:text-blue-600 transition-colors group"
                >
                  <span className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                    <Send className="w-3.5 h-3.5 text-blue-500" />
                  </span>
                  تواصل عبر التليجرام
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.08em]">روابط سريعة</h4>
            <ul className="space-y-3">
              <li>
                <a href={storeUrl} className="text-sm text-gray-600 hover:text-blue-600 transition-colors">الصفحة الرئيسية</a>
              </li>
              <li>
                <a href={tgDeepLink} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">الطلب عبر التليجرام</a>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.08em]">تابعنا</h4>
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
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-50 hover:bg-blue-50 rounded-xl text-xs font-semibold text-gray-600 hover:text-blue-600 transition-all border border-gray-100 hover:border-blue-200"
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

        <div className="mt-12 pt-6 border-t border-gray-100/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-400 flex items-center gap-1.5">
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
