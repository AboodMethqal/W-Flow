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
    <div className="min-h-screen bg-[#F4F6F9]" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="flex flex-col items-center gap-5 mb-10">
          <div className="w-28 h-28 rounded-2xl bg-white animate-pulse shadow-sm" />
          <div className="h-10 w-72 bg-white rounded-xl animate-pulse shadow-sm" />
          <div className="h-5 w-48 bg-white rounded-lg animate-pulse shadow-sm" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <div className="aspect-square bg-gray-50 animate-pulse" />
              <div className="p-4 space-y-3">
                <div className="h-4 w-3/4 bg-gray-50 rounded animate-pulse" />
                <div className="h-3 w-full bg-gray-50 rounded animate-pulse" />
                <div className="h-5 w-24 bg-gray-50 rounded animate-pulse" />
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
    <div className="text-center py-24 space-y-5">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
        <Search className="w-8 h-8 text-gray-300" />
      </div>
      <div>
        <h3 className="text-gray-700 font-bold text-lg">لا توجد نتائج</h3>
        <p className="text-sm text-gray-400 mt-1">حاول تغيير كلمات البحث أو إزالة التصفية</p>
      </div>
      <button
        onClick={onReset}
        className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20"
      >
        <X className="w-3.5 h-3.5" />
        إعادة تعيين
      </button>
    </div>
  );
}

function NoProducts() {
  return (
    <div className="text-center py-24 space-y-5">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
        <Package className="w-8 h-8 text-gray-300" />
      </div>
      <div>
        <h3 className="text-gray-700 font-bold text-lg">لا توجد منتجات متاحة</h3>
        <p className="text-sm text-gray-400 mt-1">سيتم إضافة منتجات جديدة قريباً</p>
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
      <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center" dir="rtl">
        <div className="text-center space-y-4 bg-white p-10 rounded-2xl shadow-sm border border-gray-100 max-w-sm mx-4">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
            <Store className="w-8 h-8 text-red-300" />
          </div>
          <p className="text-gray-700 font-bold">عذراً، حدث خطأ</p>
          <p className="text-sm text-gray-400">قد يكون المتجر غير موجود أو حدثت مشكلة في الاتصال</p>
        </div>
      </div>
    );
  }

  return (
    <div className="storefront min-h-screen bg-[#F4F6F9]" dir="rtl">
      <HeroBanner
        store={store}
        slug={slug!}
        productCount={products.length}
        categoryCount={categories.length}
      />

      {/* Categories */}
      {categories.length > 0 && (
        <section className="bg-white border-b border-gray-100/50">
          <div className="max-w-6xl mx-auto px-4 py-7">
            <div className="flex items-center gap-2.5 mb-5">
              <span className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                <Grid3X3 className="w-4 h-4 text-blue-600" />
              </span>
              <h2 className="text-lg font-bold text-gray-900">الأقسام</h2>
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

      {/* Featured */}
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
          bgAlt
        />
      )}

      {/* Search + Filter */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl border-b border-gray-100/50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input
                type="text"
                placeholder="ابحث عن منتج..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setActiveCategory(null); }}
                className="w-full pr-11 h-10 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100/50 transition-all"
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
              className={`h-10 px-4 rounded-2xl border text-xs font-semibold transition-all flex items-center gap-1.5 ${
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
      <main className="max-w-6xl mx-auto px-4 py-8 sm:py-10">
        {products.length === 0 ? (
          <NoProducts />
        ) : filtered.length === 0 ? (
          <EmptyState onReset={resetFilters} />
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-white px-5 py-3 rounded-2xl border border-gray-100/80 shadow-sm">
              <p className="text-sm text-gray-500">
                <span className="font-bold text-gray-900">{filtered.length}</span> {filtered.length === 1 ? "منتج" : "منتجات"}
                {activeCategory && <> في <span className="font-semibold text-blue-600">{activeCategory}</span></>}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
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
