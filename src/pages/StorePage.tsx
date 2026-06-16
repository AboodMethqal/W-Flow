import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  Store, ShoppingBag, Search, MapPin, Phone, Star, Clock, Grid3X3,
  TrendingUp, X, Filter, SlidersHorizontal, ChevronDown, Sparkles,
} from "lucide-react";
import { Loader2 } from "lucide-react";
import { usePublicProducts, type StoreInfo } from "@/hooks/usePublicProducts";
import { ProductCard } from "@/components/store/ProductCard";
import { StoreFooter } from "@/components/store/StoreFooter";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;

const socialPlatforms: Record<string, { label: string; icon: string }> = {
  instagram: { label: "إنستقرام", icon: "📸" },
  facebook: { label: "فيسبوك", icon: "📘" },
  twitter: { label: "تويتر", icon: "🐦" },
  tiktok: { label: "تيك توك", icon: "🎵" },
  whatsapp: { label: "واتساب", icon: "💬" },
};

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="bg-surface-container-low border-b border-outline-variant/10">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-surface-container-high animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-6 w-48 bg-surface-container-high rounded animate-pulse" />
              <div className="h-4 w-24 bg-surface-container-high rounded animate-pulse" />
            </div>
          </div>
          <div className="h-4 w-full max-w-md bg-surface-container-high rounded animate-pulse mb-3" />
          <div className="h-8 w-32 bg-surface-container-high rounded-xl animate-pulse" />
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant/5">
              <div className="h-48 bg-surface-container-high animate-pulse" />
              <div className="p-4 space-y-3">
                <div className="h-4 w-3/4 bg-surface-container-high rounded animate-pulse" />
                <div className="h-3 w-full bg-surface-container-high rounded animate-pulse" />
                <div className="h-5 w-20 bg-surface-container-high rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="text-center py-16 space-y-4">
      <div className="w-20 h-20 bg-surface-container-high rounded-full flex items-center justify-center mx-auto">
        <Search className="w-10 h-10 text-on-surface-variant/20" />
      </div>
      <div>
        <p className="text-on-surface-variant font-bold">لا توجد نتائج للبحث</p>
        <p className="text-xs text-on-surface-variant/50 mt-1">حاول تغيير كلمات البحث أو تصفية الفئات</p>
      </div>
      <button
        onClick={onReset}
        className="inline-flex items-center gap-1 px-4 py-2 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground rounded-lg text-xs font-bold transition-all"
      >
        <X className="w-3 h-3" />
        إعادة تعيين البحث
      </button>
    </div>
  );
}

function NoProducts() {
  return (
    <div className="text-center py-16 space-y-4">
      <div className="w-20 h-20 bg-surface-container-high rounded-full flex items-center justify-center mx-auto">
        <Store className="w-10 h-10 text-on-surface-variant/20" />
      </div>
      <div>
        <p className="text-on-surface-variant font-bold">لا توجد منتجات متاحة حالياً</p>
        <p className="text-xs text-on-surface-variant/50 mt-1">سيتم إضافة منتجات جديدة قريباً</p>
      </div>
    </div>
  );
}

export default function StorePage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, error } = usePublicProducts(slug);
  const products = data?.products ?? [];
  const store = data?.store as StoreInfo | undefined;
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"newest" | "price-asc" | "price-desc">("newest");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 99999]);
  const [showSortMenu, setShowSortMenu] = useState(false);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category || "عام"));
    return Array.from(set).sort();
  }, [products]);

  const featured = useMemo(() => {
    return products.filter((p) => p.image_url).slice(0, 3);
  }, [products]);

  const newArrivals = useMemo(() => {
    return [...products].slice(0, 6);
  }, [products]);

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
    list = list.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);
    if (sortBy === "price-asc") list.sort((a, b) => a.price - b.price);
    if (sortBy === "price-desc") list.sort((a, b) => b.price - a.price);
    return list;
  }, [products, search, activeCategory, priceRange, sortBy]);

  const maxPrice = useMemo(() => {
    return Math.max(...products.map((p) => p.price), 1000);
  }, [products]);

  const tgDeepLink = `https://t.me/wflowAbod_bot?start=ws-${slug}`;

  const resetFilters = () => {
    setSearch("");
    setActiveCategory(null);
    setPriceRange([0, 99999]);
    setSortBy("newest");
  };

  const hasActiveFilters = search || activeCategory || sortBy !== "newest" || priceRange[0] > 0 || priceRange[1] < maxPrice;

  if (isLoading) return <LoadingSkeleton />;

  if (error || !data || !store) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="text-center space-y-3">
          <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            <Store className="w-10 h-10 text-destructive/50" />
          </div>
          <p className="text-destructive font-bold text-sm">عذراً، حدث خطأ في تحميل المتجر</p>
          <p className="text-xs text-on-surface-variant/50">قد يكون المتجر غير موجود أو حدث مشكلة في الاتصال</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background border-b border-outline-variant/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.08),transparent_50%)]" />
        <div className="relative max-w-5xl mx-auto px-4 py-10 sm:py-14">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-5">
            {store.logoUrl ? (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-outline-variant/10 shadow-lg flex-shrink-0">
                <img src={store.logoUrl} alt={store.workspaceName} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 gradient-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 flex-shrink-0">
                <Store className="w-10 h-10 text-primary-foreground" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-3xl sm:text-4xl font-black text-on-surface font-headline">
                {store.workspaceName}
              </h1>
              <div className="flex items-center gap-3 mt-2 text-sm text-on-surface-variant/60">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  {products.length} {products.length === 1 ? "منتج" : "منتجات"}
                </span>
                {categories.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Grid3X3 className="w-3.5 h-3.5 text-primary" />
                    {categories.length} {categories.length === 1 ? "قسم" : "أقسام"}
                  </span>
                )}
              </div>
              {store.description && (
                <p className="text-sm text-on-surface-variant/70 leading-relaxed max-w-lg mt-3">
                  {store.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-center text-xs text-on-surface-variant/60 mb-6">
            {store.phone && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-high rounded-lg" dir="ltr">
                <Phone className="w-3 h-3" />
                {store.phone}
              </span>
            )}
            {store.address && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-high rounded-lg">
                <MapPin className="w-3 h-3" />
                {store.address}
              </span>
            )}
          </div>

          {store?.socialLinks && Object.entries(store.socialLinks).filter(([, v]) => v).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {Object.entries(store.socialLinks).map(([key, value]) => {
                if (!value) return null;
                const platform = socialPlatforms[key];
                return (
                  <a
                    key={key}
                    href={value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-surface-container-high hover:bg-surface-container-highest rounded-lg text-xs font-bold text-on-surface-variant hover:text-primary transition-colors"
                  >
                    {platform?.icon ?? "🔗"} {platform?.label ?? key}
                  </a>
                );
              })}
            </div>
          )}

          <a
            href={tgDeepLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            <ShoppingBag className="w-4 h-4" />
            اطلب عبر التليجرام
          </a>
        </div>
      </section>

      {/* Featured products */}
      {featured.length >= 3 && (
        <section className="border-b border-outline-variant/5 bg-surface-container-low/30">
          <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
            <div className="flex items-center gap-2 mb-5">
              <Star className="w-4 h-4 text-primary" />
              <h2 className="text-base font-black text-on-surface font-headline">منتجات مميزة</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {featured.slice(0, 3).map((product) => (
                <ProductCard key={product.id} product={product} slug={slug!} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* New arrivals */}
      {newArrivals.length > 0 && (
        <section className="border-b border-outline-variant/5">
          <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
            <div className="flex items-center gap-2 mb-5">
              <Clock className="w-4 h-4 text-primary" />
              <h2 className="text-base font-black text-on-surface font-headline">أحدث المنتجات</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {newArrivals.slice(0, 6).map((product) => (
                <ProductCard key={product.id} product={product} slug={slug!} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categories + Search + Filters */}
      <div className="sticky top-0 z-10 bg-surface/95 backdrop-blur-xl border-b border-outline-variant/5 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 space-y-3">
          {/* Search row */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40" />
              <input
                type="text"
                placeholder="ابحث عن منتج..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setActiveCategory(null); }}
                className="w-full pr-10 h-10 bg-surface-container-high border border-outline-variant/10 rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20 transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-on-surface-variant transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`h-10 px-3 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                hasActiveFilters
                  ? "bg-primary/10 border-primary/20 text-primary"
                  : "bg-surface-container-high border-outline-variant/10 text-on-surface-variant/60 hover:bg-surface-container"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {hasActiveFilters ? "مرشّح" : "تصفية"}
            </button>
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="h-10 px-3 rounded-xl bg-surface-container-high border border-outline-variant/10 text-xs font-bold text-on-surface-variant/60 hover:bg-surface-container transition-all flex items-center gap-1.5"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <ChevronDown className="w-3 h-3" />
              </button>
              {showSortMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
                  <div className="absolute left-0 top-full mt-1 z-20 w-40 bg-surface-container-high border border-outline-variant/10 rounded-xl shadow-xl overflow-hidden">
                    {[
                      { value: "newest", label: "الأحدث" },
                      { value: "price-asc", label: "السعر: من الأقل" },
                      { value: "price-desc", label: "السعر: من الأعلى" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => { setSortBy(opt.value as typeof sortBy); setShowSortMenu(false); }}
                        className={`w-full text-right px-4 py-2.5 text-xs font-bold transition-colors ${
                          sortBy === opt.value
                            ? "bg-primary/10 text-primary"
                            : "text-on-surface-variant/70 hover:bg-surface-container"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Category pills */}
          {categories.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setActiveCategory(null)}
                className={`shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  !activeCategory
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                الكل
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                    activeCategory === cat
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Price range filter */}
          {showFilters && (
            <div className="bg-surface-container-high rounded-xl p-4 border border-outline-variant/5 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-on-surface-variant">نطاق السعر</h4>
                <button
                  onClick={() => setPriceRange([0, maxPrice])}
                  className="text-[10px] text-primary hover:underline"
                >
                  إعادة تعيين
                </button>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={maxPrice}
                  step={10}
                  value={priceRange[0]}
                  onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                  className="flex-1 accent-primary h-1.5"
                />
                <input
                  type="range"
                  min={0}
                  max={maxPrice}
                  step={10}
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                  className="flex-1 accent-primary h-1.5"
                />
              </div>
              <div className="flex justify-between text-xs text-on-surface-variant/60">
                <span>{priceRange[0].toLocaleString("ar-SA")} ر.س</span>
                <span>{priceRange[1].toLocaleString("ar-SA")} ر.س</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* All products grid */}
      <main className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
        {products.length === 0 ? (
          <NoProducts />
        ) : filtered.length === 0 ? (
          <EmptyState onReset={resetFilters} />
        ) : (
          <div className="space-y-8">
            {activeCategory ? (
              <section>
                <h2 className="text-lg font-bold text-on-surface font-headline mb-4 flex items-center gap-2">
                  <span className="w-1 h-5 bg-primary rounded-full inline-block" />
                  {activeCategory}
                  <span className="text-xs text-on-surface-variant/40 font-normal">({filtered.length})</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map((product) => (
                    <ProductCard key={product.id} product={product} slug={slug!} />
                  ))}
                </div>
              </section>
            ) : (
              categories.map((category) => {
                const catProducts = filtered.filter((p) => (p.category || "عام") === category);
                if (catProducts.length === 0) return null;
                return (
                  <section key={category}>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold text-on-surface font-headline flex items-center gap-2">
                        <span className="w-1 h-5 bg-primary rounded-full inline-block" />
                        {category}
                        <span className="text-xs text-on-surface-variant/40 font-normal">({catProducts.length})</span>
                      </h2>
                      <button
                        onClick={() => setActiveCategory(category)}
                        className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                      >
                        عرض الكل
                        <ChevronDown className="w-3 h-3 -rotate-90" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {catProducts.map((product) => (
                        <ProductCard key={product.id} product={product} slug={slug!} />
                      ))}
                    </div>
                  </section>
                );
              })
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <StoreFooter store={store} slug={slug!} />
    </div>
  );
}
