import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Clock, Copy, Check, Percent, Tag, Flame, Snowflake, Layers, ArrowRight } from "lucide-react";
import { couponLabel, couponValidTill } from "@/data/coupons";
import { fetchCoupons } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import { useProducts } from "@/hooks/useProducts";
import { getCompareAtPrice } from "@/lib/product";

const deals = [
  { title: "Buy 2 Get 1 Free", subtitle: "On all plain T-shirts", icon: Flame, featured: true },
  { title: "Flat 40% OFF", subtitle: "Hoodies collection", icon: Snowflake, featured: false },
  { title: "Combo Offer", subtitle: "Track Pants + Tee @ ₹1999", icon: Layers, featured: false },
];

export default function OffersPage() {
  const { data: products = [] } = useProducts();
  const { data: coupons = [] } = useQuery({ queryKey: ["coupons"], queryFn: fetchCoupons, staleTime: 30_000, retry: false });
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const saleProducts = products.filter((p) => p.badge === "sale" || getCompareAtPrice(p));

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // Clipboard can be blocked (e.g. non-HTTPS); still show the code as "copied" so users can type it.
    }
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="container mx-auto px-4 py-10 sm:py-14">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <span className="eyebrow mb-3">Save more</span>
        <h1 className="section-heading">
          Offers &amp; <span className="text-gradient">Deals</span>
        </h1>
        <p className="mt-2 max-w-lg text-muted-foreground">
          Exclusive deals, coupon codes, and limited-time offers curated just for you.
        </p>
      </motion.div>

      {/* Banner Deals */}
      <div className="mb-14 grid gap-4 md:grid-cols-3">
        {deals.map((deal, i) => (
          <motion.div
            key={deal.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Link
              to="/shop"
              className={`group relative flex h-full flex-col justify-between gap-8 overflow-hidden rounded-2xl border p-6 transition-all hover:-translate-y-1 hover:shadow-card-hover ${
                deal.featured
                  ? "border-transparent bg-[#111111] text-white"
                  : "border-border bg-card text-card-foreground shadow-card"
              }`}
            >
              {deal.featured && (
                <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/30 blur-3xl" />
              )}
              <div
                className={`relative flex h-11 w-11 items-center justify-center rounded-xl ${
                  deal.featured ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                }`}
              >
                <deal.icon size={20} />
              </div>
              <div className="relative">
                <h3 className="font-display text-2xl font-bold">{deal.title}</h3>
                <p className={`mt-1 text-sm ${deal.featured ? "text-white/65" : "text-muted-foreground"}`}>{deal.subtitle}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                  Shop now
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Coupon Codes — only what the admin has switched on */}
      {coupons.length > 0 && (
      <section className="mb-14">
        <h2 className="mb-6 font-display text-2xl font-bold sm:text-3xl">Coupon Codes</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {coupons.map((coupon, i) => {
            const Icon = coupon.discountType === "percentage" ? Percent : Tag;
            return (
            <motion.div
              key={coupon.code}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card"
            >
              <div className="flex flex-1 items-center gap-4 p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon size={20} />
                </div>
                <div className="min-w-0">
                  <p className="font-display text-xl font-bold">{couponLabel(coupon)}</p>
                  <p className="text-sm text-muted-foreground">On your whole order</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock size={11} />
                    Valid till {couponValidTill(coupon)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleCopy(coupon.code)}
                aria-label={`Copy coupon code ${coupon.code}`}
                className="flex w-28 shrink-0 flex-col items-center justify-center gap-1.5 border-l-2 border-dashed border-border bg-secondary/50 px-3 text-primary transition-colors hover:bg-primary/10 sm:w-32"
              >
                {copiedCode === coupon.code ? <Check size={16} /> : <Copy size={16} />}
                <span className="font-mono text-xs font-bold tracking-[0.06em]">
                  {copiedCode === coupon.code ? "Copied" : coupon.code}
                </span>
              </button>
            </motion.div>
            );
          })}
        </div>
      </section>
      )}

      {/* Sale Products */}
      {saleProducts.length > 0 && (
        <section>
          <h2 className="mb-6 font-display text-2xl font-bold sm:text-3xl">On Sale Now</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
            {saleProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
