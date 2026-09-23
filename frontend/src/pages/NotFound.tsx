import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="container mx-auto flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center">
      <span className="eyebrow mb-4">Error 404</span>
      <h1 className="font-display text-[5rem] font-extrabold leading-none tracking-[-0.05em] text-gradient sm:text-[8rem]">
        404
      </h1>
      <p className="mt-4 font-display text-2xl font-bold">This page went off the grid</p>
      <p className="mt-2 max-w-sm text-muted-foreground">
        The link may be broken or the page may have moved. Let's get you back to the good stuff.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:shadow-glow"
        >
          <ArrowLeft size={16} />
          Back to home
        </Link>
        <Link
          to="/shop"
          className="inline-flex items-center justify-center rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold transition-colors hover:bg-secondary"
        >
          Browse the shop
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
