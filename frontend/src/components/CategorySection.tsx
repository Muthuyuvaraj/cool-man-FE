import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import plainTshirtBlack from "@/assets/products/plain-tshirt-black.jpg";
import hoodieWhite from "@/assets/products/hoodie-white.jpg";
import trackPantsOlive from "@/assets/products/track-pants-olive.jpg";
import customTshirt from "@/assets/products/custom-tshirt.jpg";
import shortsGrey from "@/assets/products/shorts-grey.jpg";
import jerseyRed from "@/assets/products/jersey-red.jpg";

const cats = [
  { name: "Plain T-Shirts", category: "Plain T-Shirts", image: plainTshirtBlack },
  { name: "Hoodies", category: "Hoodies", image: hoodieWhite },
  { name: "Track Pants", category: "Track Pants", image: trackPantsOlive },
  { name: "Custom Tees", to: "/customize", image: customTshirt },
  { name: "Shorts", category: "Shorts", image: shortsGrey },
  { name: "Sportswear", category: "Jersey Sportswear", image: jerseyRed },
];

export default function CategorySection() {
  return (
    <section className="bg-secondary/40 py-14 sm:py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 sm:mb-10"
        >
          <span className="eyebrow mb-3">Browse styles</span>
          <h2 className="section-heading text-foreground">Shop by Category</h2>
          <p className="mt-2 text-base text-muted-foreground">Find your perfect fit.</p>
        </motion.div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-6">
          {cats.map((cat, i) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <Link
                to={cat.to ?? `/shop?category=${encodeURIComponent(cat.category ?? "")}`}
                className="group flex flex-col items-center gap-3"
              >
                <div className="aspect-square w-full overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-card-hover">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                </div>
                <span className="font-display text-base font-semibold text-foreground transition-colors group-hover:text-primary">
                  {cat.name}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
