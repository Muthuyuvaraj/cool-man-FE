import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { CartProvider, useCart } from "@/contexts/CartContext";
import { evaluateCoupon, type Coupon } from "@/data/coupons";
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

const percent20: Coupon = { code: "SAVE20", discountType: "percentage", discountValue: 20, expiryDate: "2099-12-31" };
const flat100: Coupon = { code: "FLAT100", discountType: "fixed", discountValue: 100, expiryDate: "2099-12-31" };

describe("coupons", () => {
  it("takes a percentage off the cart", () => {
    expect(evaluateCoupon(percent20, [{ product: make(), quantity: 3 }])).toEqual({ amount: 300 });
  });

  it("gives a flat amount off", () => {
    expect(evaluateCoupon(flat100, [{ product: make(), quantity: 1 }])).toEqual({ amount: 100 });
  });

  it("never discounts more than the cart is worth", () => {
    expect(evaluateCoupon(flat100, [{ product: make({ price: 60 }), quantity: 1 }])).toEqual({ amount: 60 });
  });
});

describe("CartProvider", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.unstubAllGlobals());

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

  it("applies a coupon the store returns and rejects unknown codes", async () => {
    const fetchMock = vi.fn(async (url: string) =>
      url.endsWith("/SAVE20")
        ? new Response(JSON.stringify(percent20), { status: 200 })
        : new Response(JSON.stringify({ detail: "Invalid or expired coupon code" }), { status: 404 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.addItem(make({ stock: 10 }), "M", 3);
    });

    let error: string | null = "";
    await act(async () => {
      error = await result.current.applyCoupon("NOPE");
    });
    expect(error).toMatch(/invalid/i);

    await act(async () => {
      error = await result.current.applyCoupon("save20");
    });
    expect(error).toBeNull();
    expect(result.current.discountAmount).toBe(300);
  });
});
