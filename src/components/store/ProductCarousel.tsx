import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { ProductCard } from "./ProductCard";

type Product = Tables<"products">;

interface ProductCarouselProps {
  title: string;
  icon?: React.ReactNode;
  products: Product[];
  slug: string;
  bgAlt?: boolean;
}

export function ProductCarousel({ title, icon, products, slug, bgAlt }: ProductCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice("ontouchstart" in window);
  }, []);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  const scroll = (direction: "right" | "left") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({ left: direction === "right" ? amount : -amount, behavior: "smooth" });
  };

  if (products.length === 0) return null;

  return (
    <section className={bgAlt ? "bg-[#F4F6F9]" : "bg-white"}>
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-10">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            {icon && <span className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">{icon}</span>}
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">{title}</h2>
          </div>
          {!isTouchDevice && products.length > 3 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => scroll("right")}
                disabled={!canScrollRight}
                className="w-8 h-8 rounded-xl border border-gray-200 bg-white text-gray-400 hover:text-gray-600 hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => scroll("left")}
                disabled={!canScrollLeft}
                className="w-8 h-8 rounded-xl border border-gray-200 bg-white text-gray-400 hover:text-gray-600 hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory -mx-4 px-4"
        >
          {products.map((product) => (
            <div key={product.id} className="snap-start shrink-0 w-[230px] sm:w-[260px]">
              <ProductCard product={product} slug={slug} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
