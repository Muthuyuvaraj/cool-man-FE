import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { SlidersHorizontal } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { useProducts } from "@/hooks/useProducts";

export default function ShopPage() {
  const { data: products = [], isLoading, isError, refetch } = useProducts();
  const [params, setParams] = useSearchParams();
  const category = params.get("category") ?? "All";
  const [sortBy, setSortBy] = useState("featured");

  const categories = useMemo(
    // Keep the selected category visible even when it currently has no products (e.g. from a homepage link).
    () => ["All", ...Array.from(new Set([...products.map((p) => p.category), category].filter((c) => c && c !== "All"))).sort()],
    [products, category],
  );

  const setCategory = (next: string) => {
    setParams(next === "All" ? {} : { category: next }, { replace: true });
  };

  const filtered = useMemo(() => {
    const result =
      category === "All"
        ? [...products]
        : products.filter((p) => p.category === category);

    switch (sortBy) {
      case "price-low":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        result.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
    }
    return result;
  }, [category, sortBy, products]);

  return (
    <div className="pb-16">
      {/* Header */}
      <section className="border-b border-border/60 bg-secondary/40">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="container mx-auto px-4 py-10 sm:py-14"
        >
          <span className="eyebrow mb-3">The collection</span>
          <h1 className="section-heading">Shop All</h1>
          <p className="mt-2 max-w-lg text-muted-foreground">
            Everyday essentials and statement pieces, built to move with you.
          </p>
        </motion.div>
      </section>

      {/* Filters */}
      <div className="sticky top-20 z-30 border-b border-border/60 bg-background/85 glass-surface">
        <div className="container mx-auto flex items-center gap-3 px-4 py-3">
          <div className="-mx-1 flex flex-1 gap-2 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                  category === cat
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-card text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <label className="relative flex shrink-0 items-center">
            <SlidersHorizontal size={15} className="pointer-events-none absolute left-3 text-muted-foreground" />
            <span className="sr-only">Sort products</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none rounded-full border border-border bg-card py-2 pl-9 pr-4 text-sm font-medium text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </label>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-6">
        <p className="mb-5 text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
          {filtered.length === 1 ? "product" : "products"}
          {category !== "All" && <> in <span className="font-semibold text-foreground">{category}</span></>}
        </p>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-border/60 bg-card">
                <div className="aspect-[3/4] animate-pulse bg-secondary" />
                <div className="space-y-2 p-4">
                  <div className="h-3 w-1/3 animate-pulse rounded bg-secondary" />
                  <div className="h-4 w-3/4 animate-pulse rounded bg-secondary" />
                  <div className="h-5 w-1/4 animate-pulse rounded bg-secondary" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-20 text-center">
            <p className="font-display text-xl font-semibold">We couldn't load the collection</p>
            <p className="mt-1 text-sm text-muted-foreground">Check your connection and try again.</p>
            <button
              onClick={() => refetch()}
              className="mt-5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:shadow-glow"
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-20 text-center">
            <p className="font-display text-xl font-semibold">Nothing here yet</p>
            <p className="mt-1 text-sm text-muted-foreground">No products found in this category.</p>
            <button
              onClick={() => setCategory("All")}
              className="mt-5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:shadow-glow"
            >
              View all products
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
