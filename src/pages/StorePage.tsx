import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Package, Image as ImageIcon, ArrowRight, Search, Store, ShoppingBag, MapPin, Phone } from "lucide-react";
import { Loader2 } from "lucide-react";
import { usePublicProducts } from "@/hooks/usePublicProducts";
import { Input } from "@/components/ui/input";

export default function StorePage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, error } = usePublicProducts(slug);
  const products = data?.products ?? [];
  const store = data?.store;
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = products;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description?.toLowerCase().includes(q)) ||
        (p.category?.toLowerCase().includes(q))
      );
    }
    if (activeCategory) {
      list = list.filter((p) => (p.category || "عام") === activeCategory);
    }
    return list;
  }, [products, search, activeCategory]);

  const grouped = useMemo(() => {
    return filtered.reduce<Record<string, typeof products>>((acc, p) => {
      const cat = p.category || "عام";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(p);
      return acc;
    }, {});
  }, [filtered]);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category || "عام"));
    return Array.from(set).sort();
  }, [products]);

  const baseUrl = `${window.location.protocol}//${window.location.host}`;
  const storeUrl = `${baseUrl}/store/${slug}`;
  const tgDeepLink = `https://t.me/wflowAbod_bot?start=${slug}`;

  const socialPlatforms: Record<string, { label: string; icon: string }> = {
    instagram: { label: "إنستقرام", icon: "📸" },
    facebook: { label: "فيسبوك", icon: "📘" },
    twitter: { label: "تويتر", icon: "🐦" },
    tiktok: { label: "تيك توك", icon: "🎵" },
    whatsapp: { label: "واتساب", icon: "💬" },
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Hero / Header */}
      <header className="bg-gradient-to-br from-primary/5 via-background to-background border-b border-outline-variant/10">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-3">
            {store?.logoUrl ? (
              <div className="w-14 h-14 rounded-2xl overflow-hidden border border-outline-variant/10 flex-shrink-0 shadow-sm">
                <img src={store.logoUrl} alt={store.workspaceName} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-14 h-14 gradient-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 flex-shrink-0">
                <Store className="w-7 h-7 text-primary-foreground" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-2xl font-black text-on-surface font-headline truncate">
                {store?.workspaceName || "المتجر"}
              </h1>
              <p className="text-sm text-on-surface-variant/60">
                {products.length} {products.length === 1 ? "منتج" : "منتجات"} متاحة
              </p>
            </div>
          </div>

          {store?.description && (
            <p className="text-sm text-on-surface-variant/70 leading-relaxed max-w-lg mb-3">
              {store.description}
            </p>
          )}

          <div className="flex flex-wrap gap-2 items-center text-xs text-on-surface-variant/60 mb-4">
            {store?.phone && (
              <span className="flex items-center gap-1" dir="ltr">
                <Phone className="w-3 h-3" />
                {store.phone}
              </span>
            )}
            {store?.address && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {store.address}
              </span>
            )}
          </div>

          {store?.socialLinks && Object.entries(store.socialLinks).filter(([, v]) => v).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(store.socialLinks).map(([key, value]) => {
                if (!value) return null;
                const platform = socialPlatforms[key];
                return (
                  <a
                    key={key}
                    href={value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-surface-container-high hover:bg-surface-container-highest rounded-lg text-xs font-bold text-on-surface-variant transition-colors"
                  >
                    {platform?.icon ?? "🔗"} {platform?.label ?? key}
                  </a>
                );
              })}
            </div>
          )}

          <div className="flex flex-wrap gap-3 items-center">
            <a href={tgDeepLink}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
              <ShoppingBag className="w-4 h-4" />
              اطلب عبر التليجرام
            </a>
          </div>
        </div>
      </header>

      {/* Search + Categories */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-outline-variant/5">
        <div className="max-w-5xl mx-auto px-4 py-3 space-y-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40" />
            <Input
              type="text"
              placeholder="ابحث عن منتج..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setActiveCategory(null); }}
              className="pr-10 h-10 bg-surface-container-high border-outline-variant/20 rounded-xl text-sm"
            />
          </div>
          {categories.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setActiveCategory(null)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${!activeCategory ? "bg-primary text-primary-foreground" : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container"}`}
              >
                الكل
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container"}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : error || !data ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto">
              <Package className="w-8 h-8 text-destructive/50" />
            </div>
            <p className="text-destructive text-sm">عذراً، حدث خطأ في تحميل المتجر</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-16 h-16 bg-surface-container-high rounded-2xl flex items-center justify-center mx-auto">
              <Package className="w-8 h-8 text-on-surface-variant/30" />
            </div>
            <p className="text-on-surface-variant text-sm">لا توجد منتجات متاحة حالياً</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-16 h-16 bg-surface-container-high rounded-2xl flex items-center justify-center mx-auto">
              <Search className="w-8 h-8 text-on-surface-variant/30" />
            </div>
            <p className="text-on-surface-variant text-sm">لا توجد نتائج للبحث</p>
            <button onClick={() => { setSearch(""); setActiveCategory(null); }} className="text-primary text-xs font-bold hover:underline">
              إعادة تعيين
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(grouped).map(([category, catProducts]) => (
              <section key={category}>
                <h2 className="text-lg font-bold text-on-surface font-headline mb-4 flex items-center gap-2">
                  <span className="w-1 h-5 bg-primary rounded-full inline-block" />
                  {category}
                  <span className="text-xs text-on-surface-variant/40 font-normal">({catProducts.length})</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {catProducts.map((product) => (
                    <Link
                      key={product.id}
                      to={`/store/${slug}/product/${product.id}`}
                      className="group bg-surface-container-low rounded-xl overflow-hidden border border-outline-variant/10 hover:shadow-lg hover:border-primary/20 transition-all"
                    >
                      <div className="h-44 bg-surface-container-high flex items-center justify-center overflow-hidden">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        ) : (
                          <ImageIcon className="w-12 h-12 text-on-surface-variant/20" />
                        )}
                      </div>
                      <div className="p-4 space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">
                            {product.name}
                          </h3>
                          <p className="text-sm font-black text-primary tabular-nums whitespace-nowrap">
                            {product.price.toLocaleString("ar-SA", { minimumFractionDigits: 2 })} ر.س
                          </p>
                        </div>
                        {product.description && (
                          <p className="text-xs text-on-surface-variant/70 line-clamp-2">{product.description}</p>
                        )}
                        <div className="flex items-center justify-between pt-1">
                          {product.sku && (
                            <p className="text-[10px] text-on-surface-variant/50" dir="ltr">SKU: {product.sku}</p>
                          )}
                          <span className="text-[10px] text-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                            عرض التفاصيل ←
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-outline-variant/5 py-8 text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-on-surface-variant/40">
          <Store className="w-3 h-3" />
          <a href={storeUrl} className="text-xs hover:text-on-surface-variant/60 transition-colors">
            {storeUrl.replace(/^https?:\/\//, "")}
          </a>
        </div>
        <p className="text-xs text-on-surface-variant/40">
          مدعوم من <span className="font-bold text-on-surface-variant/60">W-Flow Connect</span>
        </p>
      </footer>
    </div>
  );
}
