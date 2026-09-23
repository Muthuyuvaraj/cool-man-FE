import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingBag, Check, Star, Truck, RotateCcw, Shield, ChevronRight, Minus, Plus } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { products } from "@/data/products";
import { useCart } from "@/contexts/CartContext";
import { useProducts } from "@/hooks/useProducts";
import { useWishlist } from "@/contexts/WishlistContext";
import { formatPrice, getCompareAtPrice, getDiscountPercent, isOutOfStock } from "@/lib/product";

const sizeGuide: Record<string, string> = {
  S: "36\" Chest, 27\" Length",
  M: "38\" Chest, 28\" Length",
  L: "40\" Chest, 29\" Length",
  XL: "42\" Chest, 30\" Length",
  XXL: "44\" Chest, 31\" Length",
};

const mockReviews = [
  { name: "Arjun K.", rating: 5, date: "Feb 12, 2026", comment: "Fabric quality is insane for this price. Super comfortable and fits perfectly." },
  { name: "Rohan M.", rating: 4, date: "Jan 28, 2026", comment: "Great product! Slightly tight around the shoulders but overall amazing." },
  { name: "Priya S.", rating: 5, date: "Jan 15, 2026", comment: "Bought this for my brother and he loved it. Colors don't fade after wash." },
];

export default function ProductDetailPage() {
  const { addItem } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { id } = useParams<{ id: string }>();
  const productsQuery = useProducts();
  const availableProducts = productsQuery.data?.length ? productsQuery.data : products;
  const product = availableProducts.find((item) => String(item.id) === id);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [activeTab, setActiveTab] = useState<"description" | "reviews" | "size-guide">("description");

  if (productsQuery.isLoading && !product) {
    return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading product...</div>;
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Product not found</h1>
        <Link to="/shop" className="mt-4 inline-block text-primary underline">Back to Shop</Link>
      </div>
    );
  }

  const discount = getDiscountPercent(product);
  const compareAt = getCompareAtPrice(product);
  const soldOut = isOutOfStock(product);
  const liked = isWishlisted(product.id);

  const others = availableProducts.filter((p) => p.id !== product.id);
  const related = [
    ...others.filter((p) => p.category === product.category),
    ...others.filter((p) => p.category !== product.category),
  ].slice(0, 4);

  const handleAddToCart = () => {
    const size = selectedSize || product.sizes[0] || "Free Size";
    if (!addItem(product, size, quantity)) return;
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
        <ChevronRight size={14} />
        <Link to="/shop" className="hover:text-primary transition-colors">Shop</Link>
        <ChevronRight size={14} />
        <span className="text-foreground font-medium">{product.name}</span>
      </nav>

      {/* Main */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Image */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative overflow-hidden rounded-2xl border border-border/50 bg-surface-sunken"
        >
          <img
            src={product.image}
            alt={product.name}
            className={`aspect-square w-full object-cover ${soldOut ? "opacity-60 grayscale" : ""}`}
          />
          {product.badge && (
            <span className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-primary-foreground ${
              product.badge === "new" ? "bg-badge-new" : product.badge === "sale" ? "bg-badge-sale" : "bg-badge-trending"
            }`}>
              {product.badge}
            </span>
          )}
          {discount > 0 && (
            <span className="absolute right-4 top-4 rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background">
              -{discount}%
            </span>
          )}
        </motion.div>

        {/* Details */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col gap-5"
        >
          <div>
            <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-secondary-foreground">
              {product.fabric}
            </span>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-[-0.03em] sm:text-4xl lg:text-5xl">
              {product.name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{product.category}</p>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  className={i < Math.floor(product.rating) ? "fill-primary text-primary" : "fill-muted text-muted"}
                />
              ))}
            </div>
            <span className="text-sm font-medium">{product.rating}</span>
            <span className="text-sm text-muted-foreground">({product.reviews} reviews)</span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="font-display text-3xl font-bold">{formatPrice(product.price)}</span>
            {compareAt && (
              <>
                <span className="text-lg text-muted-foreground line-through">{formatPrice(compareAt)}</span>
                <span className="rounded-full bg-badge-sale/10 px-2.5 py-0.5 text-xs font-bold text-badge-sale">
                  Save {formatPrice(compareAt - product.price)}
                </span>
              </>
            )}
          </div>

          {/* Sizes */}
          <div>
            <p className="mb-2 text-sm font-semibold">Select Size</p>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  disabled={soldOut}
                  aria-pressed={selectedSize === size}
                  className={`h-11 min-w-[2.75rem] rounded-xl border px-2 disabled:cursor-not-allowed disabled:opacity-50 text-sm font-semibold transition-all ${
                    selectedSize === size
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-card text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <p className="mb-2 text-sm font-semibold">Quantity</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={soldOut || quantity <= 1}
                aria-label="Decrease quantity"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Minus size={16} />
              </button>
              <span className="w-8 text-center font-display text-lg font-bold">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.stock ?? Number.POSITIVE_INFINITY, quantity + 1))}
                disabled={soldOut || (product.stock !== undefined && quantity >= product.stock)}
                aria-label={product.stock !== undefined && quantity >= product.stock ? "Maximum available stock reached" : "Increase quantity"}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus size={16} />
              </button>
            </div>
            {soldOut ? (
              <p className="mt-2 text-xs font-semibold text-destructive">Out of stock — check back soon</p>
            ) : product.stock !== undefined && product.stock <= 10 ? (
              <p className="mt-2 text-xs font-semibold text-badge-sale">Only {product.stock} left</p>
            ) : null}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleAddToCart}
              disabled={soldOut}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all ${
                soldOut
                  ? "cursor-not-allowed bg-muted text-muted-foreground"
                  : addedToCart
                  ? "bg-badge-new text-primary-foreground"
                  : "bg-primary text-primary-foreground hover:shadow-glow"
              }`}
            >
              <AnimatePresence mode="wait">
                {soldOut ? (
                  <span key="soldout">Out of stock</span>
                ) : addedToCart ? (
                  <motion.span key="done" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-2">
                    <Check size={16} /> Added to Cart!
                  </motion.span>
                ) : (
                  <motion.span key="add" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-2">
                    <ShoppingBag size={16} /> Add to Cart
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
            <button
              onClick={() => toggleWishlist(product)}
              aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
              aria-pressed={liked}
              className={`flex h-[52px] w-[52px] items-center justify-center rounded-xl border transition-all ${
                liked ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/50"
              }`}
            >
              <Heart size={20} className={liked ? "fill-current" : ""} />
            </button>
          </div>

          {/* Perks */}
          <div className="grid grid-cols-3 gap-3 rounded-2xl border border-border/50 bg-card p-4">
            <div className="flex flex-col items-center gap-1 text-center">
              <Truck size={18} className="text-primary" />
              <span className="text-[11px] font-semibold">Free Delivery</span>
              <span className="text-[11px] text-muted-foreground">Above ₹999</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <RotateCcw size={18} className="text-primary" />
              <span className="text-[11px] font-semibold">Easy Returns</span>
              <span className="text-[11px] text-muted-foreground">7 days</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <Shield size={18} className="text-primary" />
              <span className="text-[11px] font-semibold">Quality Check</span>
              <span className="text-[11px] text-muted-foreground">Verified</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="mx-auto mt-16 max-w-3xl">
        <div className="flex gap-1 rounded-xl bg-secondary p-1">
          {(["description", "reviews", "size-guide"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-lg py-2.5 text-sm font-semibold capitalize transition-all ${
                activeTab === tab ? "bg-card text-card-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "size-guide" ? "Size Guide" : tab}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {activeTab === "description" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 text-sm leading-relaxed text-muted-foreground">
              {product.description && <p className="text-foreground">{product.description}</p>}
              <p>
                The <strong className="text-foreground">{product.name}</strong> is crafted from premium {product.fabric.toLowerCase()} for
                ultimate comfort and durability. Designed for the modern streetwear enthusiast who values both style and substance.
              </p>
              <p>
                Features a relaxed fit with reinforced stitching, pre-shrunk fabric, and a tagless neck label for all-day comfort.
                Available in sizes {product.sizes.join(", ")}.
              </p>
              <ul className="list-inside list-disc space-y-1">
                <li>Material: {product.fabric}</li>
                <li>Fit: Regular / Relaxed</li>
                <li>Care: Machine wash cold, tumble dry low</li>
                <li>Made in India 🇮🇳</li>
              </ul>
            </motion.div>
          )}

          {activeTab === "reviews" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {mockReviews.map((review, i) => (
                <div key={i} className="rounded-xl border border-border/50 bg-card p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {review.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{review.name}</p>
                        <p className="text-[11px] text-muted-foreground">{review.date}</p>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} size={12} className={j < review.rating ? "fill-primary text-primary" : "fill-muted text-muted"} />
                      ))}
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{review.comment}</p>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === "size-guide" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="overflow-hidden rounded-xl border border-border/50">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-secondary">
                      <th className="px-4 py-3 text-left font-semibold">Size</th>
                      <th className="px-4 py-3 text-left font-semibold">Measurements</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(sizeGuide).map(([size, measurement]) => (
                      <tr key={size} className="border-t border-border/50">
                        <td className="px-4 py-3 font-bold">{size}</td>
                        <td className="px-4 py-3 text-muted-foreground">{measurement}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <div className="mt-16">
          <h2 className="section-heading mb-8 !text-2xl sm:!text-3xl">You May Also Like</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
