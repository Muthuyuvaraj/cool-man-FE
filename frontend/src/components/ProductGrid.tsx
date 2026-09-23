import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import ProductCard from "./ProductCard";
import type { Product } from "@/data/products";

interface Props {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  viewAllHref?: string;
  products: Product[];
}

export default function ProductGrid({ title, subtitle, eyebrow = "Curated picks", viewAllHref = "/shop", products }: Props) {
  if (!products.length) return null;

  return (
    <section className="py-14 sm:py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <span className="eyebrow mb-3">{eyebrow}</span>
            <h2 className="section-heading text-foreground">{title}</h2>
            {subtitle && (
              <p className="mt-2 max-w-xl text-base text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <Link
            to={viewAllHref}
            className="group inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-foreground transition-colors hover:text-primary"
          >
            View all
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
        <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
