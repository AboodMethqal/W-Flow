import { useState } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { toast } from "sonner";
import { Copy, ExternalLink, Share2, Check, Globe, Send } from "lucide-react";

export default function StoreLinks() {
  const { currentWorkspace } = useWorkspace();
  const [copied, setCopied] = useState<string | null>(null);

  if (!currentWorkspace?.slug) return null;

  const baseUrl = `${window.location.protocol}//${window.location.host}`;
  const storeUrl = `${baseUrl}/store/${currentWorkspace.slug}`;
  const tgLink = `https://t.me/wflowAbod_bot?start=${currentWorkspace.slug}`;

  const links = [
    {
      id: "store",
      label: "الرابط العام للمتجر",
      url: storeUrl,
      icon: Globe,
      desc: "رابط متجرك العام الذي يمكن لأي زائر الدخول إليه",
    },
    {
      id: "telegram",
      label: "رابط متجر تليجرام",
      url: tgLink,
      icon: Send,
      desc: "رابط خاص بالبوت الذكي - يرسل العملاء طلباتهم عبره",
    },
  ];

  const copyLink = async (id: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(id);
      toast.success("تم نسخ الرابط");
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("فشل في نسخ الرابط");
    }
  };

  const shareLink = async (url: string, title: string) => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // user cancelled
      }
    } else {
      // fallback: prompt
      toast.success("رابط المتجر: " + url);
    }
  };

  return (
    <div className="bg-surface-container-low rounded-2xl p-5 space-y-4 border border-outline-variant/10">
      <div>
        <h3 className="font-bold text-sm">روابط المتجر</h3>
        <p className="text-xs text-on-surface-variant mt-1">شارك متجرك مع عملائك من خلال هذه الروابط</p>
      </div>

      <div className="space-y-3">
        {links.map(({ id, label, url, icon: Icon, desc }) => (
          <div key={id} className="bg-surface-container rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                id === "telegram" ? "bg-green-500/10" : "bg-primary/10"
              }`}>
                <Icon className={`w-4 h-4 ${id === "telegram" ? "text-green-500" : "text-primary"}`} />
              </div>
              <div>
                <h4 className="text-sm font-bold">{label}</h4>
                <p className="text-[10px] text-on-surface-variant/60">{desc}</p>
              </div>
            </div>

            <div className="font-mono text-xs bg-surface-container-highest rounded-xl px-4 py-2.5 truncate text-left" dir="ltr">
              {url}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => copyLink(id, url)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-surface-container-high hover:bg-surface-container-highest rounded-xl text-xs font-bold transition-colors"
              >
                {copied === id ? (
                  <><Check className="w-3.5 h-3.5 text-green-500" /> تم النسخ</>
                ) : (
                  <><Copy className="w-3.5 h-3.5" /> نسخ الرابط</>
                )}
              </button>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-surface-container-high hover:bg-surface-container-highest rounded-xl text-xs font-bold transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                فتح
              </a>
              <button
                onClick={() => shareLink(url, `متجر ${currentWorkspace.name}`)}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-surface-container-high hover:bg-surface-container-highest rounded-xl text-xs font-bold transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                مشاركة
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
