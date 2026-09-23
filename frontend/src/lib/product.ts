import type { Product } from "@/data/products";

/** True when the product cannot be added to the cart. */
export function isOutOfStock(product: Product) {
  return product.inStock === false || (product.stock !== undefined && product.stock < 1);
}

/** Original price only when it is a real markdown (higher than the selling price). */
export function getCompareAtPrice(product: Product) {
  return product.originalPrice && product.originalPrice > product.price ? product.originalPrice : undefined;
}

/** Whole-number discount percentage, or 0 when there is no real markdown. */
export function getDiscountPercent(product: Product) {
  const compareAt = getCompareAtPrice(product);
  return compareAt ? Math.round((1 - product.price / compareAt) * 100) : 0;
}

export function formatPrice(value: number) {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}
