import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Star, Clock, Grid3X3, Search, X, SlidersHorizontal, Store, Package, Sparkles } from "lucide-react";
import { Loader2 } from "lucide-react";
import { usePublicProducts, type StoreInfo } from "@/hooks/usePublicProducts";
import { ProductCard } from "@/components/store/ProductCard";
import { HeroBanner } from "@/components/store/HeroBanner";
import { ProductCarousel } from "@/components/store/ProductCarousel";
import { CategoryCard } from "@/components/store/CategoryCard";
import { StoreFooter } from "@/components/store/StoreFooter";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="w-24 h-24 rounded-2xl bg-gray-100 animate-pulse" />
          <div className="h-8 w-64 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-4 w-48 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl overflow-hidden border border-gray-100">
              <div className="aspect-[4/3] bg-gray-50 animate-pulse" />
              <div className="p-4 space-y-3">
                <div className="h-4 w-3/4 bg-gray-50 rounded animate-pulse" />
                <div className="h-3 w-full bg-gray-50 rounded animate-pulse" />
                <div className="h-5 w-20 bg-gray-50 rounded animate-pulse" />
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
    <div className="text-center py-20 space-y-4">
      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
        <Search className="w-7 h-7 text-gray-300" />
      </div>
      <h3 className="text-gray-600 font-semibold">لا توجد نتائج</h3>
      <p className="text-sm text-gray-400">حاول تغيير كلمات البحث أو إزالة التصفية</p>
      <button
        onClick={onReset}
        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg text-sm font-medium transition-all"
      >
        <X className="w-3.5 h-3.5" />
        إعادة تعيين
      </button>
    </div>
  );
}

function NoProducts() {
  return (
    <div className="text-center py-20 space-y-4">
      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
        <Package className="w-7 h-7 text-gray-300" />
      </div>
      <h3 className="text-gray-600 font-semibold">لا توجد منتجات متاحة</h3>
      <p className="text-sm text-gray-400">سيتم إضافة منتجات جديدة قريباً</p>
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

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category || "عام"));
    return Array.from(set).sort();
  }, [products]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      const cat = p.category || "عام";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [products]);

  const featured = useMemo(() => {
    return products.filter((p) => p.image_url).slice(0, 10);
  }, [products]);

  const newArrivals = useMemo(() => {
    return [...products].slice(0, 10);
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
    return list;
  }, [products, search, activeCategory]);

  const resetFilters = () => {
    setSearch("");
    setActiveCategory(null);
  };

  const hasActiveFilters = search || activeCategory;

  if (isLoading) return <LoadingSkeleton />;

  if (error || !data || !store) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center" dir="rtl">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
            <Store className="w-8 h-8 text-red-300" />
          </div>
          <p className="text-gray-600 font-semibold text-sm">عذراً، حدث خطأ في تحميل المتجر</p>
          <p className="text-xs text-gray-400">قد يكون المتجر غير موجود أو حدثت مشكلة</p>
        </div>
      </div>
    );
  }

  return (
    <div className="storefront min-h-screen bg-white" dir="rtl">
      <HeroBanner
        store={store}
        slug={slug!}
        productCount={products.length}
        categoryCount={categories.length}
      />

      {/* Categories Grid */}
      {categories.length > 0 && (
        <section className="border-b border-gray-100 bg-gray-50/50">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="flex items-center gap-2 mb-4">
              <Grid3X3 className="w-4 h-4 text-blue-600" />
              <h2 className="text-base font-bold text-gray-900">الأقسام</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory -mx-4 px-4">
              <CategoryCard
                name="الكل"
                count={products.length}
                isActive={!activeCategory}
                onClick={() => setActiveCategory(null)}
              />
              {categories.map((cat) => (
                <CategoryCard
                  key={cat}
                  name={cat}
                  count={categoryCounts[cat] || 0}
                  isActive={activeCategory === cat}
                  onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featured.length > 0 && (
        <ProductCarousel
          title="منتجات مميزة"
          icon={<Star className="w-4 h-4 text-blue-600" />}
          products={featured}
          slug={slug!}
        />
      )}

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <ProductCarousel
          title="أحدث المنتجات"
          icon={<Clock className="w-4 h-4 text-blue-600" />}
          products={newArrivals}
          slug={slug!}
        />
      )}

      {/* Search + Filter Bar */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input
                type="text"
                placeholder="ابحث عن منتج..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setActiveCategory(null); }}
                className="w-full pr-10 h-10 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`h-10 px-3 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 ${
                hasActiveFilters
                  ? "bg-blue-50 border-blue-200 text-blue-600"
                  : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {hasActiveFilters ? "مصفى" : "تصفية"}
            </button>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <main className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        {products.length === 0 ? (
          <NoProducts />
        ) : filtered.length === 0 ? (
          <EmptyState onReset={resetFilters} />
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                <span className="font-semibold text-gray-900">{filtered.length}</span> {filtered.length === 1 ? "منتج" : "منتجات"}
                {activeCategory && <> في <span className="font-semibold text-blue-600">{activeCategory}</span></>}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  إزالة التصفية
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} slug={slug!} />
              ))}
            </div>
          </div>
        )}
      </main>

      <StoreFooter store={store} slug={slug!} />
    </div>
  );
}
