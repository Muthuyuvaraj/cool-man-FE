import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { Product } from "@/data/products";
import { evaluateCoupon, findCoupon, type Coupon } from "@/data/coupons";

export interface CartItem {
  product: Product;
  size: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, size: string, quantity?: number) => boolean;
  removeItem: (productId: string, size: string) => void;
  updateQuantity: (productId: string, size: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  appliedCoupon: Coupon | null;
  /** Set when the applied coupon no longer qualifies (e.g. subtotal dropped below its minimum). */
  couponError: string | null;
  applyCoupon: (code: string) => string | null; // returns error or null
  removeCoupon: () => void;
  discountAmount: number;
  total: number;
}

const CartContext = createContext<CartContextType | null>(null);
const CART_KEY = "coolman-cart";
const COUPON_KEY = "coolman-cart-coupon";

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

function readStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked — the cart still works for this session.
  }
}

const stockLimitOf = (product: Product) => product.stock ?? Number.POSITIVE_INFINITY;

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => readStorage<CartItem[]>(CART_KEY, []));
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(() => {
    const code = readStorage<string | null>(COUPON_KEY, null);
    return code ? findCoupon(code) ?? null : null;
  });

  useEffect(() => writeStorage(CART_KEY, items), [items]);
  useEffect(() => writeStorage(COUPON_KEY, appliedCoupon?.code ?? null), [appliedCoupon]);

  const addItem = useCallback((product: Product, size: string, quantity = 1) => {
    const stockLimit = stockLimitOf(product);
    if (product.inStock === false || stockLimit < 1) return false;
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id && i.size === size);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id && i.size === size
            ? { ...i, product, quantity: Math.min(stockLimit, i.quantity + quantity) }
            : i
        );
      }
      return [...prev, { product, size, quantity: Math.min(stockLimit, Math.max(1, quantity)) }];
    });
    return true;
  }, []);

  const removeItem = useCallback((productId: string, size: string) => {
    setItems((prev) => prev.filter((i) => !(i.product.id === productId && i.size === size)));
  }, []);

  const updateQuantity = useCallback((productId: string, size: string, quantity: number) => {
    if (quantity < 1) return;
    setItems((prev) =>
      prev.map((i) =>
        i.product.id === productId && i.size === size
          ? { ...i, quantity: Math.min(stockLimitOf(i.product), quantity) }
          : i
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setAppliedCoupon(null);
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  const applyCoupon = useCallback(
    (code: string): string | null => {
      if (!code.trim()) return "Enter a coupon code";
      const coupon = findCoupon(code);
      if (!coupon) return "Invalid coupon code";
      const { error } = evaluateCoupon(coupon, items);
      if (error) return error;
      setAppliedCoupon(coupon);
      return null;
    },
    [items],
  );

  const removeCoupon = useCallback(() => setAppliedCoupon(null), []);

  const evaluation = appliedCoupon ? evaluateCoupon(appliedCoupon, items) : { amount: 0 };
  const discountAmount = evaluation.amount;
  const couponError = appliedCoupon ? evaluation.error ?? null : null;
  const total = Math.max(0, subtotal - discountAmount);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        appliedCoupon,
        couponError,
        applyCoupon,
        removeCoupon,
        discountAmount,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
