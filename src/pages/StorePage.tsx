import { useState, useMemo, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  Search, X, SlidersHorizontal, Sparkles,
  Store, Package, ChevronDown, ShoppingBag,
} from "lucide-react";
import { usePublicProducts, type StoreInfo } from "@/hooks/usePublicProducts";
import { ProductCard } from "@/components/store/ProductCard";
import { HeroBanner } from "@/components/store/HeroBanner";
import { StoreFooter } from "@/components/store/StoreFooter";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;

const SORT_OPTIONS = [
  { value: "newest", label: "الأحدث" },
  { value: "price-asc", label: "السعر: من الأقل" },
  { value: "price-desc", label: "السعر: من الأعلى" },
] as const;

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="h-20 bg-gradient-to-l from-blue-600 to-indigo-600 animate-pulse" />
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex gap-2 mb-3">
          <div className="h-9 flex-1 bg-white rounded-xl animate-pulse shadow-sm" />
          <div className="h-9 w-16 bg-white rounded-xl animate-pulse shadow-sm" />
          <div className="h-9 w-16 bg-white rounded-xl animate-pulse shadow-sm" />
        </div>
        <div className="flex gap-1.5 mb-5">
          {[1,2,3,4,5].map(i => <div key={i} className="h-7 w-16 bg-white rounded-lg animate-pulse shadow-sm" />)}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {[...Array(15)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm">
              <div className="aspect-square bg-gray-50 animate-pulse" />
              <div className="p-2.5 space-y-1.5">
                <div className="h-2.5 w-12 bg-gray-50 rounded animate-pulse" />
                <div className="h-3 w-full bg-gray-50 rounded animate-pulse" />
                <div className="h-3.5 w-16 bg-gray-50 rounded animate-pulse" />
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
    <div className="col-span-full text-center py-16">
      <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
        <Search className="w-6 h-6 text-muted-foreground/30" />
      </div>
      <p className="text-card-foreground font-semibold text-sm">لا توجد نتائج</p>
      <p className="text-xs text-muted-foreground mt-1 mb-4">حاول تغيير كلمات البحث أو إزالة التصفية</p>
      <button onClick={onReset} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-all">
        <X className="w-3 h-3 inline-block ml-1" />
        إعادة تعيين
      </button>
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
  const [sortBy, setSortBy] = useState<"newest" | "price-asc" | "price-desc">("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 99999]);
  const [showSort, setShowSort] = useState(false);
  const [isDark, setIsDark] = useState(() => localStorage.getItem("store-theme") === "dark");

  useEffect(() => {
    localStorage.setItem("store-theme", isDark ? "dark" : "light");
  }, [isDark]);

  const toggleTheme = useCallback(() => setIsDark(prev => !prev), []);

  const categories = useMemo(() => {
    const set = new Set(products.map(p => p.category || "عام"));
    return Array.from(set).sort();
  }, [products]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach(p => { const c = p.category || "عام"; counts[c] = (counts[c] || 0) + 1; });
    return counts;
  }, [products]);

  const featuredImage = useMemo(() => products.find(p => p.image_url)?.image_url, [products]);

  const maxPrice = useMemo(() => Math.max(...products.map(p => p.price), 1000), [products]);

  const filtered = useMemo(() => {
    let list = products;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      );
    }
    if (activeCategory) list = list.filter(p => (p.category || "عام") === activeCategory);
    list = list.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);
    if (sortBy === "price-asc") list.sort((a, b) => a.price - b.price);
    if (sortBy === "price-desc") list.sort((a, b) => b.price - a.price);
    return list;
  }, [products, search, activeCategory, priceRange, sortBy]);

  const hasActiveFilters = search || activeCategory || sortBy !== "newest" || priceRange[0] > 0 || priceRange[1] < maxPrice;

  const resetFilters = () => {
    setSearch(""); setActiveCategory(null); setPriceRange([0, 99999]); setSortBy("newest");
  };

  const scrollToProducts = useCallback(() => {
    const el = document.getElementById("store-products");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const themeClass = isDark ? "dark bg-gray-950" : "bg-gray-50";

  if (isLoading) return <LoadingSkeleton />;

  if (error || !data || !store) {
    return (
      <div className={`min-h-screen ${themeClass} flex items-center justify-center`} dir="rtl">
        <div className="bg-card p-8 rounded-2xl shadow-sm border border-border text-center max-w-sm mx-4">
          <div className="w-14 h-14 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <Store className="w-7 h-7 text-destructive/50" />
          </div>
          <p className="text-card-foreground font-bold text-sm">عذراً، حدث خطأ في تحميل المتجر</p>
          <p className="text-xs text-muted-foreground mt-1">قد يكون المتجر غير موجود أو حدثت مشكلة</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`storefront min-h-screen ${themeClass}`} dir="rtl" data-theme={isDark ? "dark" : "light"}>
      <HeroBanner
        store={store}
        slug={slug!}
        featuredImage={featuredImage}
        onShopNow={scrollToProducts}
        onToggleTheme={toggleTheme}
        isDark={isDark}
        productCount={products.length}
      />

      {/* Search + Controls */}
      <div id="store-products" className="sticky top-0 z-20 bg-card/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
              <input
                type="text"
                placeholder="ابحث عن منتج..."
                value={search}
                onChange={e => { setSearch(e.target.value); setActiveCategory(null); }}
                className="w-full pr-10 h-9 bg-muted border border-border rounded-xl text-sm text-card-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowSort(!showSort)}
              className="h-9 px-3 bg-muted border border-border rounded-xl text-xs font-medium text-muted-foreground hover:bg-accent transition-all flex items-center gap-1"
            >
              {sortBy === "newest" ? "الأحدث" : sortBy === "price-asc" ? "الأقل سعراً" : "الأعلى سعراً"}
              <ChevronDown className="w-3 h-3" />
            </button>
            {showSort && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowSort(false)} />
                <div className="absolute left-4 top-full mt-1 z-20 w-36 bg-popover border border-border rounded-xl shadow-xl overflow-hidden">
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setSortBy(opt.value as typeof sortBy); setShowSort(false); }}
                      className={`w-full text-right px-4 py-2.5 text-xs font-medium transition-colors ${
                        sortBy === opt.value ? "bg-primary/10 text-primary" : "text-popover-foreground hover:bg-accent"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`h-9 px-3 rounded-xl border text-xs font-medium transition-all flex items-center gap-1 ${
                showFilters || hasActiveFilters
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "bg-muted border-border text-muted-foreground hover:bg-accent"
              }`}
            >
              <SlidersHorizontal className="w-3 h-3" />
            </button>
          </div>

          {/* Category pills */}
          {categories.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto mt-2 pb-1 scrollbar-none">
              <button
                onClick={() => setActiveCategory(null)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                  !activeCategory
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-accent border border-border"
                }`}
              >
                <Sparkles className="w-3 h-3 inline-block ml-1" />
                الكل
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                    activeCategory === cat
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-accent border border-border"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Price filter */}
          {showFilters && (
            <div className="mt-3 bg-muted rounded-xl p-4 border border-border animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-card-foreground">نطاق السعر</span>
                <button onClick={() => setPriceRange([0, maxPrice])} className="text-[10px] text-primary hover:underline">
                  إعادة تعيين
                </button>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground tabular-nums w-16 text-left">{priceRange[0].toLocaleString("ar-SA")}</span>
                <input
                  type="range" min={0} max={maxPrice} step={10}
                  value={priceRange[0]}
                  onChange={e => setPriceRange([Number(e.target.value), priceRange[1]])}
                  className="flex-1 accent-primary h-1"
                />
                <input
                  type="range" min={0} max={maxPrice} step={10}
                  value={priceRange[1]}
                  onChange={e => setPriceRange([priceRange[0], Number(e.target.value)])}
                  className="flex-1 accent-primary h-1"
                />
                <span className="text-xs text-muted-foreground tabular-nums w-16">{priceRange[1].toLocaleString("ar-SA")}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Product Grid */}
      <main className="max-w-6xl mx-auto px-4 py-4 sm:py-6">
        {products.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Package className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-gray-600 font-semibold text-sm">لا توجد منتجات متاحة</p>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState onReset={resetFilters} />
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground">
                <span className="font-bold text-card-foreground">{filtered.length}</span> {filtered.length === 1 ? "منتج" : "منتجات"}
                {activeCategory && <span className="text-primary font-semibold mr-1">· {activeCategory}</span>}
              </p>
              {hasActiveFilters && (
                <button onClick={resetFilters} className="text-[10px] text-blue-600 font-semibold flex items-center gap-0.5 hover:underline">
                  <X className="w-2.5 h-2.5" />
                  مسح الكل
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filtered.map(product => (
                <ProductCard key={product.id} product={product} slug={slug!} />
              ))}
            </div>
          </>
        )}
      </main>

      <StoreFooter store={store} slug={slug!} />
    </div>
  );
}
