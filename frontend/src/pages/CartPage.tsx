import { FormEvent, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Minus, Plus, ShoppingBag, Tag, X, PackageOpen, Loader2, MessageCircle } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAccount } from "@/contexts/AccountContext";
import { fetchCoupons, prepareWhatsAppOrder, type OrderInput } from "@/lib/api";
import { formatPrice } from "@/lib/product";
import { openPendingWindow, readPendingOrder, savePendingOrder, whatsAppImage } from "@/lib/whatsappOrder";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary";

export default function CartPage() {
  const {
    items, removeItem, updateQuantity, clearCart,
    subtotal, appliedCoupon, applyCoupon, removeCoupon,
    discountAmount, total, totalItems, couponError: appliedCouponError,
  } = useCart();

  const { account } = useAccount();
  const navigate = useNavigate();
  // Prefill from an order sent earlier but not confirmed, then from the signed-in account.
  const [details, setDetails] = useState(() => {
    const previous = readPendingOrder()?.order;
    return {
      name: previous?.customerName ?? account?.name ?? "",
      phone: previous?.phone ?? account?.phone ?? "",
      address: previous?.address ?? "",
      email: previous?.customerEmail ?? account?.email ?? "",
    };
  });
  const [orderError, setOrderError] = useState("");
  const [sending, setSending] = useState(false);
  const setDetail = (field: keyof typeof details) => (event: { target: { value: string } }) =>
    setDetails((current) => ({ ...current, [field]: event.target.value }));

  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [applying, setApplying] = useState(false);
  const { data: coupons = [] } = useQuery({ queryKey: ["coupons"], queryFn: fetchCoupons, staleTime: 30_000, retry: false });

  const handleApplyCoupon = async () => {
    if (applying) return;
    setApplying(true);
    const err = await applyCoupon(couponInput);
    setApplying(false);
    if (err) {
      setCouponError(err);
    } else {
      setCouponError("");
      setCouponInput("");
    }
  };

  const deliveryFee = subtotal >= 999 ? 0 : 79;
  const grandTotal = total + deliveryFee;

  const sendOnWhatsApp = async (event: FormEvent) => {
    event.preventDefault();
    if (sending) return;
    if (details.phone.replace(/\D/g, "").length < 10) {
      setOrderError("Enter a valid 10-digit phone number.");
      return;
    }
    setOrderError("");
    setSending(true);
    // Open the WhatsApp tab now, while we still have the click — browsers block pop-ups opened after a network wait.
    const whatsappWindow = openPendingWindow();
    try {
      const order: OrderInput = {
        customerName: details.name.trim(),
        customerEmail: details.email.trim() || undefined,
        phone: details.phone.trim(),
        address: details.address.trim(),
        items: items.map(({ product, size, quantity }) => ({
          productId: product.id,
          name: product.name,
          size,
          quantity,
          price: product.price,
          artworkUrl: product.artworkUrl,
        })),
        subtotal,
        deliveryFee,
        discount: discountAmount,
        total: grandTotal,
        couponCode: discountAmount > 0 ? appliedCoupon?.code : undefined,
      };
      const images = await Promise.all(items.map(({ product }) => whatsAppImage(product.image)));
      const prepared = await prepareWhatsAppOrder({ ...order, items: order.items.map((item, index) => ({ ...item, image: images[index] })) });
      savePendingOrder({ ...prepared, order, thumbnails: items.map(({ product }) => product.image) });
      let whatsappOpened = false;
      if (whatsappWindow && !whatsappWindow.closed) {
        whatsappWindow.location.href = prepared.whatsappUrl;
        whatsappOpened = true;
      }
      navigate("/confirm-order", { state: { whatsappOpened } });
    } catch (requestError) {
      whatsappWindow?.close();
      setOrderError(
        requestError instanceof TypeError
          ? "We couldn't reach the store right now. Please try again in a moment."
          : requestError instanceof Error
            ? requestError.message
            : "Could not prepare your order.",
      );
    } finally {
      setSending(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto flex flex-col items-center justify-center px-4 py-20 text-center">
        <PackageOpen size={64} className="mb-4 text-muted-foreground" />
        <h1 className="font-display text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-muted-foreground">Looks like you haven't added anything yet.</p>
        <Link
          to="/shop"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:shadow-glow"
        >
          <ShoppingBag size={16} /> Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 sm:py-14">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <span className="eyebrow mb-3">Your bag</span>
            <h1 className="section-heading">Shopping Cart</h1>
            <p className="mt-1 text-muted-foreground">{totalItems} item{totalItems !== 1 ? "s" : ""}</p>
          </div>
          <button
            onClick={clearCart}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-destructive"
          >
            Clear All
          </button>
        </div>
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={`${item.product.id}-${item.size}`}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20, height: 0 }}
                className="flex gap-3 rounded-2xl border border-border/50 bg-card p-3 shadow-card sm:gap-6 sm:p-4"
              >
                {/* Image */}
                <Link to={`/product/${item.product.id}`} className="shrink-0">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="h-24 w-20 rounded-xl object-cover sm:h-32 sm:w-28"
                  />
                </Link>

                {/* Info */}
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <Link to={`/product/${item.product.id}`} className="font-display text-sm font-bold hover:text-primary transition-colors sm:text-base">
                      {item.product.name}
                    </Link>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>Size: <strong className="text-foreground">{item.size}</strong></span>
                      <span>•</span>
                      <span>{item.product.fabric}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {/* Quantity */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.size, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        aria-label="Decrease quantity"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background transition-colors hover:bg-secondary disabled:opacity-40"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-6 text-center font-display text-sm font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.size, item.quantity + 1)}
                        disabled={item.product.stock !== undefined && item.quantity >= item.product.stock}
                        aria-label={item.product.stock !== undefined && item.quantity >= item.product.stock ? "Maximum available stock reached" : "Increase quantity"}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    {/* Price + Delete */}
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-display text-base font-bold">{formatPrice(item.product.price * item.quantity)}</p>
                        {item.quantity > 1 && (
                          <p className="text-[11px] text-muted-foreground">₹{item.product.price} each</p>
                        )}
                      </div>
                      <button
                        onClick={() => removeItem(item.product.id, item.size)}
                        aria-label={`Remove ${item.product.name}`}
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  {item.product.stock !== undefined && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {item.product.stock - item.quantity > 0
                        ? `${item.product.stock - item.quantity} left in stock`
                        : "Maximum available stock reached"}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-2xl border border-border/50 bg-card p-6 shadow-card">
            <h2 className="font-display text-lg font-bold">Order Summary</h2>

            {/* Coupon */}
            <div className="mt-5">
              {appliedCoupon ? (
                <div>
                  <div className="flex items-center justify-between rounded-xl bg-primary/10 px-4 py-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Tag size={14} className="text-primary" />
                      <span className="font-mono font-bold text-primary">{appliedCoupon.code}</span>
                      <span className="text-muted-foreground">{appliedCouponError ? "not applied" : "applied"}</span>
                    </div>
                    <button onClick={removeCoupon} aria-label="Remove coupon" className="text-muted-foreground hover:text-destructive">
                      <X size={16} />
                    </button>
                  </div>
                  {appliedCouponError && <p className="mt-2 text-xs text-destructive">{appliedCouponError}</p>}
                </div>
              ) : (
                <div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Coupon code"
                      value={couponInput}
                      onChange={(e) => { setCouponInput(e.target.value); setCouponError(""); }}
                      onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                      className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={applying}
                      className="rounded-xl bg-secondary px-4 py-2.5 text-sm font-bold text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                    >
                      {applying ? "Checking..." : "Apply"}
                    </button>
                  </div>
                  {couponError && <p className="mt-2 text-xs text-destructive">{couponError}</p>}
                  {coupons.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">
                    {coupons.map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => { setCouponInput(c.code); setCouponError(""); }}
                        className="rounded-full border border-dashed border-border px-2.5 py-1 font-mono text-[11px] font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                      >
                        {c.code}
                      </button>
                    ))}
                  </div>}
                </div>
              )}
            </div>

            {/* Breakdown */}
            <div className="mt-6 space-y-3 border-t border-border/50 pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">{formatPrice(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-primary">
                  <span>Discount ({appliedCoupon?.code})</span>
                  <span className="font-semibold">-{formatPrice(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span className={`font-semibold ${deliveryFee === 0 ? "text-badge-new" : ""}`}>
                  {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
                </span>
              </div>
              {deliveryFee > 0 && (
                <p className="text-[11px] text-muted-foreground">Free delivery on orders above ₹999</p>
              )}
            </div>

            {/* Total */}
            <div className="mt-4 flex items-baseline justify-between border-t border-border/50 pt-4">
              <span className="font-display text-lg font-bold">Total</span>
              <span className="font-display text-2xl font-bold">{formatPrice(grandTotal)}</span>
            </div>

            {/* Delivery details, then WhatsApp */}
            <form onSubmit={sendOnWhatsApp} className="mt-6 space-y-3 border-t border-border/50 pt-5">
              <h3 className="font-display text-base font-bold">Delivery details</h3>
              <label className="block text-xs font-semibold">
                Full name
                <input required autoComplete="name" value={details.name} onChange={setDetail("name")} className={inputClass} />
              </label>
              <label className="block text-xs font-semibold">
                Phone
                <input
                  required
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="10-digit mobile number"
                  value={details.phone}
                  onChange={setDetail("phone")}
                  className={inputClass}
                />
              </label>
              <label className="block text-xs font-semibold">
                Delivery address
                <textarea
                  required
                  minLength={10}
                  autoComplete="street-address"
                  placeholder="House no., street, area, city, PIN code"
                  value={details.address}
                  onChange={setDetail("address")}
                  className={`${inputClass} min-h-20 resize-y`}
                />
              </label>
              <label className="block text-xs font-semibold">
                Email <span className="font-normal text-muted-foreground">(optional, to see this order in your profile)</span>
                <input type="email" autoComplete="email" value={details.email} onChange={setDetail("email")} className={inputClass} />
              </label>
              {orderError && <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{orderError}</p>}
              <button
                disabled={sending}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] py-3.5 text-sm font-semibold text-white transition-all hover:brightness-95 disabled:cursor-wait disabled:opacity-70"
              >
                {sending ? <Loader2 size={16} className="animate-spin" /> : <MessageCircle size={16} />}
                {sending ? "Opening WhatsApp…" : "Send order on WhatsApp"}
              </button>
              <p className="text-center text-xs text-muted-foreground">
                WhatsApp opens with your order filled in. Tap Send, then come back here to confirm your order.
              </p>
            </form>

            <Link
              to="/shop"
              className="mt-3 block text-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
