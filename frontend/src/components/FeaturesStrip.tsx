import { Truck, RotateCcw, Shield, Headphones } from "lucide-react";

const features = [
  { icon: Truck, label: "Free Shipping", desc: "On orders above ₹999" },
  { icon: RotateCcw, label: "Easy Returns", desc: "7-day return policy" },
  { icon: Shield, label: "Secure Payment", desc: "100% secure checkout" },
  { icon: Headphones, label: "24/7 Support", desc: "We're here to help" },
];

export default function FeaturesStrip() {
  return (
    <section className="border-b border-border/60 bg-card/80 py-6 sm:py-8">
      <div className="container mx-auto grid grid-cols-2 gap-3 px-4 sm:gap-4 lg:grid-cols-4">
        {features.map((f) => (
          <div
            key={f.label}
            className="group flex flex-col items-start gap-3 rounded-2xl border border-border bg-secondary/40 p-4 sm:flex-row sm:items-center sm:gap-4"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
              <f.icon size={20} />
            </div>
            <div>
              <p className="font-display text-base font-semibold leading-tight text-card-foreground">{f.label}</p>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
