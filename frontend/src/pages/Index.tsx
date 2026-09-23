import HeroSection from "@/components/HeroSection";
import CategorySection from "@/components/CategorySection";
import ProductGrid from "@/components/ProductGrid";
import FeaturesStrip from "@/components/FeaturesStrip";
import Marquee from "@/components/Marquee";
import NewsletterSection from "@/components/NewsletterSection";
import { useProducts } from "@/hooks/useProducts";

const Index = () => {
  const { data: products = [] } = useProducts();
  const featured = products.filter((p) => p.badge === "trending" || p.rating >= 4.5);
  const newArrivals = products.filter((p) => p.badge === "new");
  const onSale = products.filter((p) => p.badge === "sale");

  return (
    <div>
      <HeroSection />
      <Marquee />
      <FeaturesStrip />
      <ProductGrid
        eyebrow="Bestsellers"
        title="Featured Products"
        subtitle="Our most loved styles, picked by the community."
        products={featured}
      />
      <CategorySection />
      <ProductGrid
        eyebrow="Just dropped"
        title="New Arrivals"
        subtitle="Fresh drops that just landed."
        products={newArrivals}
      />
      <ProductGrid
        eyebrow="On sale"
        title="Limited Time Offers"
        subtitle="Grab them before they're gone."
        viewAllHref="/offers"
        products={onSale}
      />
      <NewsletterSection />
    </div>
  );
};

export default Index;
