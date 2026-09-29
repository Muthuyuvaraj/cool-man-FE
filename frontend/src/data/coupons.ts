import type { Product } from "@/data/products";

/** A coupon the admin has created and switched on (served by /api/coupons). */
export type Coupon = {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  /** YYYY-MM-DD */
  expiryDate: string;
};

/** Short headline shown on the offers page and in the cart, e.g. "20% OFF". */
export function couponLabel(coupon: Coupon) {
  return coupon.discountType === "percentage" ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`;
}

export function couponValidTill(coupon: Coupon) {
  const date = new Date(`${coupon.expiryDate}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? coupon.expiryDate
    : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

type Line = { product: Product; quantity: number };

/**
 * Works out the discount for a cart. Returns the amount (never more than the
 * cart total) or a reason the coupon does not apply right now.
 */
export function evaluateCoupon(coupon: Coupon, lines: Line[]): { amount: number; error?: string } {
  const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  if (subtotal === 0) {
    return { amount: 0, error: `Add items to use ${coupon.code}` };
  }

  const raw = coupon.discountType === "percentage" ? Math.round((subtotal * coupon.discountValue) / 100) : coupon.discountValue;
  return { amount: Math.min(raw, subtotal) };
}
