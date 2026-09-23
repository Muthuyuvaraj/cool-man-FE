import { motion, type Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import heroBanner from "@/assets/hero-banner.jpg";

const ease = [0.22, 1, 0.36, 1] as const;

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
};

const lineReveal: Variants = {
  hidden: { y: "110%" },
  show: { y: "0%", transition: { duration: 0.8, ease } },
};

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#0b0b0b]">
      <div className="absolute inset-0">
        <img
          src={heroBanner}
          alt="Coolman streetwear"
          className="h-full w-full animate-ken-burns object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,162,93,0.24),transparent_30%),linear-gradient(90deg,rgba(8,8,8,0.86)_0%,rgba(8,8,8,0.72)_42%,rgba(8,8,8,0.28)_100%)]" />
      </div>

      <div className="container relative mx-auto flex min-h-[78vh] items-center px-4 pb-10 pt-10 sm:min-h-[88vh] sm:pt-12">
        <motion.div variants={container} initial="hidden" animate="show" className="max-w-xl">
          <motion.span
            variants={fadeUp}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-white/90 backdrop-blur"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            New Collection 2026
          </motion.span>

          <h1 className="font-display text-5xl font-extrabold leading-[0.95] tracking-[-0.035em] text-white sm:text-7xl lg:text-8xl">
            <span className="block overflow-hidden pb-[0.08em]">
              <motion.span variants={lineReveal} className="block">
                Define Your
              </motion.span>
            </span>
            <span className="block overflow-hidden pb-[0.08em]">
              <motion.span variants={lineReveal} className="block text-gradient">
                Street Style
              </motion.span>
            </span>
          </h1>

          <motion.p variants={fadeUp} className="mt-6 max-w-md text-base leading-relaxed text-white/70 sm:text-lg">
            Premium streetwear crafted for confidence, comfort, and all-day movement.
            Discover limited drops engineered for everyday expression.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
            <Link
              to="/shop"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold uppercase tracking-[0.08em] text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-glow sm:w-auto"
            >
              Shop Now
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/customize"
              className="inline-flex w-full items-center justify-center rounded-full border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-semibold uppercase tracking-[0.08em] text-white backdrop-blur transition-colors hover:bg-white/10 sm:w-auto"
            >
              Customize
            </Link>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="mt-12 grid max-w-md grid-cols-3 divide-x divide-white/15 border-t border-white/15 pt-6 text-sm"
          >
            <div className="px-4 first:pl-0">
              <span className="block font-display text-2xl font-bold text-white sm:text-3xl">25k+</span>
              <span className="text-xs text-white/60 sm:text-sm">happy customers</span>
            </div>
            <div className="px-4 first:pl-0">
              <span className="block font-display text-2xl font-bold text-white sm:text-3xl">4.9/5</span>
              <span className="text-xs text-white/60 sm:text-sm">average rating</span>
            </div>
            <div className="px-4 first:pl-0">
              <span className="block font-display text-2xl font-bold text-white sm:text-3xl">48h</span>
              <span className="text-xs text-white/60 sm:text-sm">dispatch time</span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 sm:block"
        aria-hidden="true"
      >
        <div className="flex h-9 w-6 justify-center rounded-full border-2 border-white/30 pt-1.5">
          <span className="h-2 w-1 animate-scroll-hint rounded-full bg-white/80" />
        </div>
      </motion.div>
    </section>
  );
}
