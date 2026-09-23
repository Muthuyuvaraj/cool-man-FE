import { describe, it, expect, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { CartProvider, useCart } from "@/contexts/CartContext";
import { evaluateCoupon, findCoupon } from "@/data/coupons";
import { getCompareAtPrice, getDiscountPercent, isOutOfStock } from "@/lib/product";
import type { Product } from "@/data/products";

const make = (overrides: Partial<Product> = {}): Product => ({
  id: "p1",
  name: "Plain Tee",
  price: 500,
  image: "",
  rating: 4,
  reviews: 1,
  sizes: ["M"],
  fabric: "Cotton",
  category: "Plain T-Shirts",
  inStock: true,
  stock: 5,
  ...overrides,
});

const wrapper = ({ children }: { children: ReactNode }) => <CartProvider>{children}</CartProvider>;

describe("product helpers", () => {
  it("ignores an 'original price' that is lower than the selling price", () => {
    const product = make({ price: 524, originalPrice: 500 });
    expect(getCompareAtPrice(product)).toBeUndefined();
    expect(getDiscountPercent(product)).toBe(0);
  });

  it("computes a real markdown", () => {
    expect(getDiscountPercent(make({ price: 750, originalPrice: 1000 }))).toBe(25);
  });

  it("treats zero stock as sold out", () => {
    expect(isOutOfStock(make({ stock: 0 }))).toBe(true);
    expect(isOutOfStock(make({ inStock: false }))).toBe(true);
    expect(isOutOfStock(make())).toBe(false);
  });
});

describe("coupons", () => {
  it("enforces the COOL20 minimum", () => {
    const coupon = findCoupon("cool20")!;
    expect(evaluateCoupon(coupon, [{ product: make(), quantity: 2 }]).error).toMatch(/₹499 more/);
    expect(evaluateCoupon(coupon, [{ product: make(), quantity: 3 }])).toEqual({ amount: 300 });
  });

  it("gives FLASH10 a flat ₹100", () => {
    expect(evaluateCoupon(findCoupon("FLASH10")!, [{ product: make(), quantity: 1 }])).toEqual({ amount: 100 });
  });

  it("limits HOODIE30 to hoodies", () => {
    const coupon = findCoupon("HOODIE30")!;
    expect(evaluateCoupon(coupon, [{ product: make(), quantity: 1 }]).error).toBeDefined();
    const lines = [
      { product: make(), quantity: 1 },
      { product: make({ id: "h", name: "Zip Hoodie", category: "Hoodies", price: 1000 }), quantity: 1 },
    ];
    expect(evaluateCoupon(coupon, lines)).toEqual({ amount: 300 });
  });

  it("never discounts more than the cart is worth", () => {
    expect(evaluateCoupon(findCoupon("FLASH10")!, [{ product: make({ price: 60 }), quantity: 1 }])).toEqual({ amount: 60 });
  });
});

describe("CartProvider", () => {
  beforeEach(() => localStorage.clear());

  it("refuses sold-out products", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    let added = true;
    act(() => {
      added = result.current.addItem(make({ stock: 0 }), "M");
    });
    expect(added).toBe(false);
    expect(result.current.items).toHaveLength(0);
  });

  it("caps quantity at available stock and persists across reloads", () => {
    const { result, unmount } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.addItem(make({ stock: 2 }), "M", 5);
    });
    expect(result.current.totalItems).toBe(2);
    unmount();

    const reloaded = renderHook(() => useCart(), { wrapper });
    expect(reloaded.result.current.totalItems).toBe(2);
  });

  it("drops a coupon's discount when the cart no longer qualifies", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.addItem(make({ stock: 10 }), "M", 3);
    });
    act(() => {
      expect(result.current.applyCoupon("COOL20")).toBeNull();
    });
    expect(result.current.discountAmount).toBe(300);

    act(() => result.current.updateQuantity("p1", "M", 1));
    expect(result.current.discountAmount).toBe(0);
    expect(result.current.couponError).toMatch(/more to use COOL20/);
  });
});
