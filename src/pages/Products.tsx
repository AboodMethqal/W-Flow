import { useState, useRef } from "react";
import { Plus, Trash2, Package, Edit2, X, Check, Image, Search, Upload, Link, ExternalLink } from "lucide-react";
import { Loader2 } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { useProducts, type Product, type ProductInsert } from "@/hooks/useProducts";
import { supabase } from "@/integrations/supabase/client";
import { PREDEFINED_CATEGORIES } from "@/lib/categories";
import { toast } from "sonner";

const inputClass = "w-full bg-surface-container-highest rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/30 placeholder:text-on-surface-variant/40";

export default function ProductsPage() {
  const { products, isLoading, addProduct, updateProduct, deleteProduct, toggleAvailability } = useProducts();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formSku, setFormSku] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formCustomCategory, setFormCustomCategory] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formImageMode, setFormImageMode] = useState<"url" | "upload">("url");
  const [formAvailable, setFormAvailable] = useState(true);

  const filtered = products.filter((p) =>
    !search.trim() || p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.category?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  const resetForm = () => {
    setFormName(""); setFormPrice(""); setFormSku(""); setFormCategory(""); setFormCustomCategory("");
    setFormDescription(""); setFormImageUrl(""); setFormAvailable(true);
    setEditingId(null); setShowForm(false); setFormImageMode("url");
  };

  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setFormName(p.name);
    setFormPrice(String(p.price));
    setFormSku(p.sku ?? "");
    setFormCategory(p.category ?? "");
    setFormDescription(p.description ?? "");
    setFormImageUrl(p.image_url ?? "");
    setFormAvailable(p.is_available);
    setFormImageMode(p.image_url ? (p.image_url.startsWith("blob:") || p.image_url.includes("supabase.co") ? "upload" : "url") : "url");
    setShowForm(true);
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("الرجاء اختيار صورة"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("الصورة كبيرة جداً (الحد 5MB)"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("product-images").upload(path, file, {
        cacheControl: "3600", upsert: false,
      });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
      setFormImageUrl(urlData.publicUrl);
      toast.success("تم رفع الصورة");
    } catch (err) {
      toast.error("فشل رفع الصورة");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const getCategory = () => formCategory === "أخرى" ? formCustomCategory.trim() : formCategory;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) { toast.error("ادخل اسم المنتج"); return; }
    const price = parseFloat(formPrice) || 0;
    if (price <= 0) { toast.error("ادخل سعر صحيح"); return; }
    const category = getCategory();

    const payload = {
      name: formName.trim(),
      price,
      sku: formSku.trim() || null,
      category: category || null,
      description: formDescription.trim() || null,
      image_url: formImageUrl.trim() || null,
      is_available: formAvailable,
    };

    if (editingId) {
      await updateProduct.mutateAsync({ id: editingId, ...payload });
      toast.success("تم تحديث المنتج");
    } else {
      await addProduct.mutateAsync(payload);
      toast.success("تم إضافة المنتج");
    }
    resetForm();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف "${name}"؟`)) return;
    await deleteProduct.mutateAsync(id);
    toast.success("تم حذف المنتج");
  };

  const usedCategories = [...new Set(products.map((p) => p.category).filter(Boolean))] as string[];
  const allCategoryOptions = [...new Set([...PREDEFINED_CATEGORIES, ...usedCategories])];

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6 pb-10 px-2" dir="rtl">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-on-surface font-headline">المنتجات</h2>
            <p className="text-on-surface-variant text-sm mt-1">إدارة كتالوج منتجات متجرك</p>
          </div>
          <button onClick={() => { resetForm(); setShowForm((v) => !v); }}
            className="flex items-center gap-2 px-5 py-3 gradient-primary text-primary-container-foreground rounded-xl font-bold hover:opacity-90 active:scale-95 transition-all text-sm shadow-md">
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{showForm ? "إلغاء" : "منتج جديد"}</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            className={`${inputClass} pr-11`} placeholder="ابحث عن منتج..." />
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-surface-container-low rounded-2xl p-5 space-y-4 border border-outline-variant/10">
            <h3 className="font-bold text-base font-headline">{editingId ? "تعديل منتج" : "إضافة منتج جديد"}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-on-surface-variant block mb-2">اسم المنتج *</label>
                <input required value={formName} onChange={(e) => setFormName(e.target.value)} className={inputClass} placeholder="مثال: تيشرت قطن أبيض" />
              </div>
              <div>
                <label className="text-xs font-bold text-on-surface-variant block mb-2">السعر (ر.س) *</label>
                <input type="number" step="0.01" min="0.01" required value={formPrice} onChange={(e) => setFormPrice(e.target.value)} className={inputClass} placeholder="0.00" dir="ltr" />
              </div>
              <div>
                <label className="text-xs font-bold text-on-surface-variant block mb-2">رمز المنتج (SKU)</label>
                <input value={formSku} onChange={(e) => setFormSku(e.target.value)} className={inputClass} placeholder="PROD-001" dir="ltr" />
              </div>
              <div>
                <label className="text-xs font-bold text-on-surface-variant block mb-2">التصنيف</label>
                <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)} className={`${inputClass} appearance-none`}>
                  <option value="">-- اختر تصنيف --</option>
                  {allCategoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                {formCategory === "أخرى" && (
                  <input value={formCustomCategory} onChange={(e) => setFormCustomCategory(e.target.value)} className={`${inputClass} mt-2`} placeholder="أدخل تصنيف مخصص" />
                )}
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-on-surface-variant block mb-2">الوصف</label>
                <textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} className={`${inputClass} resize-none h-20`} placeholder="وصف المنتج..." />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-on-surface-variant block mb-2">صورة المنتج</label>
                <div className="flex gap-2 mb-3">
                  <button type="button" onClick={() => setFormImageMode("url")}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${formImageMode === "url" ? "bg-primary text-primary-container-foreground" : "bg-surface-container-high text-on-surface-variant"}`}>
                    <Link className="w-3 h-3 inline ml-1" />رابط
                  </button>
                  <button type="button" onClick={() => setFormImageMode("upload")}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${formImageMode === "upload" ? "bg-primary text-primary-container-foreground" : "bg-surface-container-high text-on-surface-variant"}`}>
                    <Upload className="w-3 h-3 inline ml-1" />رفع
                  </button>
                </div>
                {formImageMode === "url" ? (
                  <input value={formImageUrl} onChange={(e) => setFormImageUrl(e.target.value)} className={inputClass} placeholder="https://example.com/image.jpg" dir="ltr" />
                ) : (
                  <div className="flex items-center gap-3">
                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} />
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                      className="flex items-center gap-2 px-4 py-3 bg-surface-container-high hover:bg-surface-container-highest rounded-xl text-sm font-bold text-on-surface-variant transition-colors disabled:opacity-50">
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {uploading ? "جاري الرفع..." : "اختر صورة"}
                    </button>
                    {formImageUrl && <span className="text-xs text-green-600">✅ تم رفع الصورة</span>}
                  </div>
                )}
                {formImageUrl && (
                  <div className="mt-2">
                    <img src={formImageUrl} alt="Preview" className="w-20 h-20 object-cover rounded-lg border border-outline-variant/10"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-on-surface-variant">متاح في المخزون</label>
                <button type="button" onClick={() => setFormAvailable(!formAvailable)}
                  className={`w-12 h-6 rounded-full transition-colors ${formAvailable ? "bg-green-500" : "bg-surface-container-high"} relative`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${formAvailable ? "translate-x-6" : "translate-x-0.5"}`} />
                </button>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={addProduct.isPending || updateProduct.isPending || uploading}
                className="flex-1 gradient-primary text-primary-container-foreground py-3.5 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 text-sm shadow-md">
                {(addProduct.isPending || updateProduct.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingId ? "حفظ التعديلات" : "إضافة المنتج"}
              </button>
              <button type="button" onClick={resetForm}
                className="px-5 py-3.5 bg-surface-container-high hover:bg-surface-container-highest rounded-xl text-sm font-bold text-on-surface-variant transition-colors">إلغاء</button>
            </div>
          </form>
        )}

        {/* Products Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-16 h-16 bg-surface-container-high rounded-2xl flex items-center justify-center mx-auto">
              <Package className="w-8 h-8 text-on-surface-variant/30" />
            </div>
            <p className="text-on-surface-variant text-sm">{search ? "لا توجد نتائج" : "لا توجد منتجات بعد"}</p>
            {!search && <button onClick={() => { resetForm(); setShowForm(true); }} className="text-primary text-sm font-bold hover:underline">أضف منتجك الأول</button>}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((product) => (
              <div key={product.id} className={`bg-surface-container-low rounded-xl overflow-hidden border border-outline-variant/10 hover:shadow-md transition-all ${!product.is_available ? "opacity-60" : ""}`}>
                <div className="h-40 bg-surface-container-high flex items-center justify-center overflow-hidden">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  ) : (
                    <Image className="w-10 h-10 text-on-surface-variant/20" />
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-on-surface truncate">{product.name}</p>
                      {product.category && <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full inline-block mt-1">{product.category}</span>}
                    </div>
                    <p className="text-sm font-black text-primary tabular-nums whitespace-nowrap">{product.price.toLocaleString("ar-SA", { minimumFractionDigits: 2 })} ر.س</p>
                  </div>
                  {product.description && <p className="text-xs text-on-surface-variant/70 line-clamp-2">{product.description}</p>}
                  {product.sku && <p className="text-[10px] text-on-surface-variant/50" dir="ltr">SKU: {product.sku}</p>}
                  <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/5">
                    <button onClick={() => toggleAvailability.mutate({ id: product.id, is_available: !product.is_available })}
                      disabled={toggleAvailability.isPending}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${product.is_available ? "bg-green-500/10 text-green-600" : "bg-surface-container-high text-on-surface-variant"}`}>
                      {toggleAvailability.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      {product.is_available ? "متوفر" : "غير متوفر"}
                    </button>
                    <button onClick={() => openEdit(product)} className="p-1.5 rounded-lg text-on-surface-variant/40 hover:text-primary hover:bg-primary/10 transition-colors" title="تعديل">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(product.id, product.name)} className="p-1.5 rounded-lg text-on-surface-variant/40 hover:text-destructive hover:bg-destructive/10 transition-colors mr-auto" title="حذف">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        {!isLoading && products.length > 0 && (
          <p className="text-xs text-on-surface-variant/50 text-center">{products.length} منتج · {usedCategories.length} تصنيف</p>
        )}
      </div>
    </AppLayout>
  );
}
