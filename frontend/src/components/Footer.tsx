import { Link } from "react-router-dom";

const shopLinks = [
  { label: "All Products", to: "/shop" },
  { label: "T-Shirts", to: "/shop?category=Plain%20T-Shirts" },
  { label: "Hoodies", to: "/shop?category=Hoodies" },
  { label: "Track Pants", to: "/shop?category=Track%20Pants" },
];

const helpLinks = [
  { label: "Track Order", to: "/track" },
  { label: "Offers", to: "/offers" },
  { label: "My Account", to: "/profile" },
  { label: "Wishlist", to: "/wishlist" },
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card py-12">
      <div className="container mx-auto grid gap-8 px-4 sm:grid-cols-3">
        <div>
          <h3 className="font-display text-2xl font-extrabold tracking-[-0.03em]">
            COOL<span className="text-primary">MAN</span>
          </h3>
          <p className="mt-3 text-sm text-muted-foreground">
            Premium streetwear for the confident man. Comfort meets style.
          </p>
        </div>

        {[
          { title: "Shop", links: shopLinks },
          { title: "Help", links: helpLinks },
        ].map((column) => (
          <div key={column.title}>
            <h4 className="mb-4 font-display text-base font-semibold">{column.title}</h4>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              {column.links.map((link) => (
                <Link key={link.label} to={link.to} className="hover:text-primary">{link.label}</Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="container mx-auto mt-10 border-t border-border px-4 pt-6 text-center text-xs text-muted-foreground">
        <span>© 2026 Coolman. All rights reserved.</span>
      </div>
    </footer>
  );
}
