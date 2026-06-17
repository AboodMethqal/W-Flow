import { Store, Phone, MapPin, Send, Copyright, ShoppingBag } from "lucide-react";
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
    <footer className="bg-gray-900 mt-16">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {store.logoUrl ? (
                <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-700 flex-shrink-0">
                  <img src={store.logoUrl} alt={store.workspaceName} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ShoppingBag className="w-5 h-5 text-white" />
                </div>
              )}
              <h3 className="font-bold text-base text-white">{store.workspaceName}</h3>
            </div>
            {store.description && (
              <p className="text-sm text-gray-400 leading-relaxed line-clamp-4">{store.description}</p>
            )}
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-[0.08em]">روابط سريعة</h4>
            <ul className="space-y-3">
              <li>
                <a href={storeUrl} className="text-sm text-gray-400 hover:text-white transition-colors">الرئيسية</a>
              </li>
              <li>
                <a href={tgDeepLink} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400 hover:text-white transition-colors">
                  الطلب عبر التليجرام
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-[0.08em]">معلومات الاتصال</h4>
            <ul className="space-y-3">
              {store.phone && (
                <li>
                  <a href={`tel:${store.phone}`} className="flex items-center gap-2.5 text-sm text-gray-400 hover:text-white transition-colors group" dir="ltr">
                    <span className="w-7 h-7 rounded-lg bg-gray-800 flex items-center justify-center group-hover:bg-gray-700 transition-colors">
                      <Phone className="w-3.5 h-3.5 text-blue-400" />
                    </span>
                    {store.phone}
                  </a>
                </li>
              )}
              {store.address && (
                <li className="flex items-start gap-2.5 text-sm text-gray-400">
                  <span className="w-7 h-7 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  </span>
                  {store.address}
                </li>
              )}
              <li>
                <a href={tgDeepLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm text-gray-400 hover:text-white transition-colors group">
                  <span className="w-7 h-7 rounded-lg bg-gray-800 flex items-center justify-center group-hover:bg-gray-700 transition-colors">
                    <Send className="w-3.5 h-3.5 text-blue-400" />
                  </span>
                  راسلنا عبر التليجرام
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-[0.08em]">تواصل معنا</h4>
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
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-xs font-medium text-gray-400 hover:text-white transition-all"
                    >
                      {socialIcons[key] ?? "🔗"} {socialLabels[key] ?? key}
                    </a>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">لا توجد روابط تواصل اجتماعي</p>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500 flex items-center gap-1.5">
            <Copyright className="w-3 h-3" />
            {new Date().getFullYear()} {store.workspaceName}. جميع الحقوق محفوظة.
          </p>
          <p className="text-xs text-gray-600">
            مدعوم من <span className="font-bold text-gray-500">W-Flow Connect</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
