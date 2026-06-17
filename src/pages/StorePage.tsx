import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  Search, X, SlidersHorizontal, Sparkles, ShoppingBag,
  Store, Package, ChevronDown, Phone, Send,
} from "lucide-react";
import { Loader2 } from "lucide-react";
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
      <div className="h-24 bg-gradient-to-l from-blue-600 to-indigo-600 animate-pulse" />
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex gap-3 mb-4">
          <div className="h-10 flex-1 bg-white rounded-xl animate-pulse shadow-sm" />
          <div className="h-10 w-20 bg-white rounded-xl animate-pulse shadow-sm" />
          <div className="h-10 w-20 bg-white rounded-xl animate-pulse shadow-sm" />
        </div>
        <div className="flex gap-2 mb-6">
          {[1,2,3,4,5].map(i => <div key={i} className="h-8 w-20 bg-white rounded-lg animate-pulse shadow-sm" />)}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {[...Array(15)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm">
              <div className="aspect-square bg-gray-50 animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="h-3 w-16 bg-gray-50 rounded animate-pulse" />
                <div className="h-3.5 w-full bg-gray-50 rounded animate-pulse" />
                <div className="h-4 w-20 bg-gray-50 rounded animate-pulse" />
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
      <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
        <Search className="w-6 h-6 text-gray-300" />
      </div>
      <p className="text-gray-600 font-semibold text-sm">لا توجد نتائج</p>
      <p className="text-xs text-gray-400 mt-1 mb-4">حاول تغيير كلمات البحث أو إزالة التصفية</p>
      <button onClick={onReset} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all">
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

  const categories = useMemo(() => {
    const set = new Set(products.map(p => p.category || "عام"));
    return Array.from(set).sort();
  }, [products]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach(p => { const c = p.category || "عام"; counts[c] = (counts[c] || 0) + 1; });
    return counts;
  }, [products]);

  const featuredImage = useMemo(() => {
    return products.find(p => p.image_url)?.image_url;
  }, [products]);

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

  if (isLoading) return <LoadingSkeleton />;

  if (error || !data || !store) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center max-w-sm mx-4">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <Store className="w-7 h-7 text-red-300" />
          </div>
          <p className="text-gray-700 font-bold text-sm">عذراً، حدث خطأ في تحميل المتجر</p>
          <p className="text-xs text-gray-400 mt-1">قد يكون المتجر غير موجود أو حدثت مشكلة</p>
        </div>
      </div>
    );
  }

  return (
    <div className="storefront min-h-screen bg-gray-50" dir="rtl">
      {/* Compact Hero */}
      <HeroBanner store={store} slug={slug!} featuredImage={featuredImage} />

      {/* Search + Controls */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3">
          {/* Search row */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input
                type="text"
                placeholder="ابحث عن منتج..."
                value={search}
                onChange={e => { setSearch(e.target.value); setActiveCategory(null); }}
                className="w-full pr-10 h-9 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowSort(!showSort)}
              className="h-9 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100 transition-all flex items-center gap-1"
            >
              {sortBy === "newest" ? "الأحدث" : sortBy === "price-asc" ? "الأقل سعراً" : "الأعلى سعراً"}
              <ChevronDown className="w-3 h-3" />
            </button>
            {showSort && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowSort(false)} />
                <div className="absolute left-4 top-full mt-1 z-20 w-36 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setSortBy(opt.value as typeof sortBy); setShowSort(false); }}
                      className={`w-full text-right px-4 py-2.5 text-xs font-medium transition-colors ${
                        sortBy === opt.value ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"
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
                  ? "bg-blue-50 border-blue-200 text-blue-600"
                  : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
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
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200"
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
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Price filter (expandable) */}
          {showFilters && (
            <div className="mt-3 bg-gray-50 rounded-xl p-4 border border-gray-200 animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-700">نطاق السعر</span>
                <button onClick={() => setPriceRange([0, maxPrice])} className="text-[10px] text-blue-600 hover:underline">
                  إعادة تعيين
                </button>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 tabular-nums w-16 text-left">{priceRange[0].toLocaleString("ar-SA")}</span>
                <input
                  type="range" min={0} max={maxPrice} step={10}
                  value={priceRange[0]}
                  onChange={e => setPriceRange([Number(e.target.value), priceRange[1]])}
                  className="flex-1 accent-blue-600 h-1"
                />
                <input
                  type="range" min={0} max={maxPrice} step={10}
                  value={priceRange[1]}
                  onChange={e => setPriceRange([priceRange[0], Number(e.target.value)])}
                  className="flex-1 accent-blue-600 h-1"
                />
                <span className="text-xs text-gray-400 tabular-nums w-16">{priceRange[1].toLocaleString("ar-SA")}</span>
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
              <p className="text-xs text-gray-500">
                <span className="font-bold text-gray-800">{filtered.length}</span> {filtered.length === 1 ? "منتج" : "منتجات"}
                {activeCategory && <span className="text-blue-600 font-semibold mr-1">· {activeCategory}</span>}
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
