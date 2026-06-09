import { useState, useRef, useEffect } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, X, Loader2 } from "lucide-react";

interface StoreInfoData {
  name: string;
  description: string;
  phone: string;
  address: string;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    tiktok?: string;
    whatsapp?: string;
  };
}

interface StoreInfoProps {
  onSave?: () => void;
}

const inputClass =
  "w-full bg-surface-container-highest rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/30 placeholder:text-on-surface-variant/40";
const labelClass = "text-xs font-bold text-on-surface-variant block mb-2";

export default function StoreInfo({ onSave }: StoreInfoProps) {
  const { currentWorkspace, updateWorkspace } = useWorkspace();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<StoreInfoData>({
    name: currentWorkspace?.name ?? "",
    description: "",
    phone: "",
    address: "",
    socialLinks: {
      facebook: "",
      instagram: "",
      twitter: "",
      tiktok: "",
      whatsapp: "",
    },
  });

  const [logoUrl, setLogoUrl] = useState(currentWorkspace?.logo_url ?? "");

  useEffect(() => {
    if (currentWorkspace) {
      setForm({
        name: currentWorkspace.name ?? "",
        description: (currentWorkspace as any).description ?? "",
        phone: (currentWorkspace as any).phone ?? "",
        address: (currentWorkspace as any).address ?? "",
        socialLinks: {
          facebook: "",
          instagram: "",
          twitter: "",
          tiktok: "",
          whatsapp: "",
          ...((currentWorkspace as any).social_links || {}),
        },
      });
      setLogoUrl(currentWorkspace.logo_url ?? "");
    }
  }, [currentWorkspace]);

  const updateField = (field: keyof StoreInfoData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateSocial = (platform: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [platform]: value },
    }));
  };

  const handleLogoUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("الرجاء اختيار صورة");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("الصورة كبيرة جداً (الحد 5MB)");
      return;
    }
    if (!currentWorkspace) return;

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `logos/${currentWorkspace.id}/${crypto.randomUUID()}.${ext}`;

      if (logoUrl) {
        // Remove old logo if exists
        const oldPath = logoUrl.split("/logos/")[1];
        if (oldPath) {
          await supabase.storage.from("product-images").remove([oldPath]).catch(() => {});
        }
      }

      const { error: uploadErr } = await supabase.storage
        .from("product-images")
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
      setLogoUrl(urlData.publicUrl);
      toast.success("تم رفع الشعار");
    } catch (err) {
      toast.error("فشل رفع الشعار");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const removeLogo = () => {
    setLogoUrl("");
    if (currentWorkspace) {
      updateWorkspace(currentWorkspace.id, { logo_url: null as any }).catch(() => {});
    }
  };

  const handleSave = async () => {
    if (!currentWorkspace) return;
    setSaving(true);
    try {
      await updateWorkspace(currentWorkspace.id, {
        name: form.name,
        logo_url: logoUrl || null,
      } as any);

      // Update store info fields that are on the workspace
      const { error } = await supabase
        .from("workspaces")
        .update({
          description: form.description || null,
          phone: form.phone || null,
          address: form.address || null,
          social_links: form.socialLinks,
        })
        .eq("id", currentWorkspace.id);

      if (error) throw error;

      toast.success("تم حفظ معلومات المتجر");
      onSave?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setSaving(false);
    }
  };

  const socialFields = [
    { key: "facebook", label: "فيسبوك", placeholder: "https://facebook.com/..." },
    { key: "instagram", label: "انستقرام", placeholder: "https://instagram.com/..." },
    { key: "twitter", label: "تويتر / X", placeholder: "https://x.com/..." },
    { key: "tiktok", label: "تيك توك", placeholder: "https://tiktok.com/..." },
    { key: "whatsapp", label: "واتساب", placeholder: "https://wa.me/..." },
  ];

  return (
    <div className="space-y-4">
      {/* Store Name */}
      <div>
        <label className={labelClass}>اسم المتجر</label>
        <input
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
          className={inputClass}
          placeholder="متجر الأناقة، مطعم الشيف..."
        />
      </div>

      {/* Store Logo */}
      <div>
        <label className={labelClass}>شعار المتجر</label>
        <div className="flex items-center gap-4">
          {logoUrl ? (
            <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-outline-variant/10 flex-shrink-0">
              <img src={logoUrl} alt="شعار" className="w-full h-full object-cover" />
              <button
                onClick={removeLogo}
                className="absolute top-1 right-1 w-5 h-5 bg-destructive/80 text-white rounded-full flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="w-20 h-20 rounded-xl bg-surface-container-highest flex items-center justify-center flex-shrink-0 border border-dashed border-outline-variant/30">
              <Upload className="w-6 h-6 text-on-surface-variant/30" />
            </div>
          )}
          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleLogoUpload(f);
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-high hover:bg-surface-container-highest rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {uploading ? "جاري الرفع..." : "اختيار صورة"}
            </button>
            <p className="text-[10px] text-on-surface-variant/50 mt-1">JPEG, PNG, WEBP - حد أقصى 5MB</p>
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className={labelClass}>وصف المتجر</label>
        <textarea
          value={form.description}
          onChange={(e) => updateField("description", e.target.value)}
          rows={3}
          className={`${inputClass} resize-none`}
          placeholder="وصف مختصر لمتجرك ومنتجاتك..."
        />
      </div>

      {/* Contact Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>رقم الجوال (اختياري)</label>
          <input
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            className={inputClass}
            placeholder="+966 50 000 0000"
            dir="ltr"
          />
        </div>
        <div>
          <label className={labelClass}>العنوان (اختياري)</label>
          <input
            value={form.address}
            onChange={(e) => updateField("address", e.target.value)}
            className={inputClass}
            placeholder="الرياض، المملكة العربية السعودية"
          />
        </div>
      </div>

      {/* Social Links */}
      <div>
        <label className={labelClass}>روابط التواصل الاجتماعي (اختياري)</label>
        <div className="space-y-2">
          {socialFields.map(({ key, label, placeholder }) => (
            <div key={key} className="flex items-center gap-2">
              <span className="w-20 text-xs text-on-surface-variant/70 font-bold flex-shrink-0">{label}</span>
              <input
                value={(form.socialLinks as any)[key] || ""}
                onChange={(e) => updateSocial(key, e.target.value)}
                className={inputClass}
                placeholder={placeholder}
                dir="ltr"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full gradient-primary text-primary-container-foreground py-3.5 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 text-sm shadow-md"
      >
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Upload className="w-4 h-4" />
        )}
        {saving ? "جاري الحفظ..." : "حفظ معلومات المتجر"}
      </button>
    </div>
  );
}
