const items = [
  "New Collection 2026",
  "Free shipping over ₹999",
  "7-day easy returns",
  "Limited drops weekly",
  "Custom tees in 48h",
  "Use COOL20 for 20% off",
];

export default function Marquee() {
  // Render the list twice so the -50% loop is seamless
  const loop = [...items, ...items];

  return (
    <div className="group relative overflow-hidden border-y border-primary/30 bg-primary py-3 text-primary-foreground">
      <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused]">
        {loop.map((item, i) => (
          <span
            key={i}
            aria-hidden={i >= items.length}
            className="flex shrink-0 items-center gap-6 pr-6 font-display text-sm font-bold uppercase tracking-[0.06em] sm:text-base"
          >
            {item}
            <span className="text-lg leading-none opacity-60">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
