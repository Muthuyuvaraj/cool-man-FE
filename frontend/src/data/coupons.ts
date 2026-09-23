import type { Product } from "@/data/products";

export type Coupon = {
  code: string;
  /** Short headline shown on the offers page and in the cart, e.g. "20% OFF". */
  label: string;
  description: string;
  validTill: string;
  type: "percent" | "flat";
  value: number;
  minSubtotal?: number;
  /** Only items whose category matches this pattern count towards the discount. */
  appliesTo?: RegExp;
  appliesToLabel?: string;
};

export const COUPONS: Coupon[] = [
  { code: "COOL20", label: "20% OFF", description: "On orders above ₹1499", validTill: "Dec 31, 2026", type: "percent", value: 20, minSubtotal: 1499 },
  { code: "FIRST50", label: "₹50 OFF", description: "First order special", validTill: "Dec 31, 2026", type: "flat", value: 50 },
  { code: "HOODIE30", label: "30% OFF", description: "All hoodies & jackets", validTill: "Dec 31, 2026", type: "percent", value: 30, appliesTo: /hoodie|jacket/i, appliesToLabel: "hoodies & jackets" },
  { code: "FLASH10", label: "Flat ₹100 OFF", description: "No minimum order", validTill: "Limited time", type: "flat", value: 100 },
];

export function findCoupon(code: string) {
  return COUPONS.find((coupon) => coupon.code === code.trim().toUpperCase());
}

type Line = { product: Product; quantity: number };

/**
 * Works out the discount for a cart. Returns the amount (never more than the
 * eligible total) or a reason the coupon does not apply right now.
 */
export function evaluateCoupon(coupon: Coupon, lines: Line[]): { amount: number; error?: string } {
  const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  if (coupon.minSubtotal && subtotal < coupon.minSubtotal) {
    return { amount: 0, error: `Add ₹${coupon.minSubtotal - subtotal} more to use ${coupon.code}` };
  }

  const eligible = coupon.appliesTo
    ? lines.filter((line) => coupon.appliesTo!.test(line.product.category) || coupon.appliesTo!.test(line.product.name))
    : lines;
  const eligibleTotal = eligible.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  if (eligibleTotal === 0) {
    return { amount: 0, error: `${coupon.code} is only valid on ${coupon.appliesToLabel ?? "selected items"}` };
  }

  const raw = coupon.type === "percent" ? Math.round((eligibleTotal * coupon.value) / 100) : coupon.value;
  return { amount: Math.min(raw, eligibleTotal) };
}
