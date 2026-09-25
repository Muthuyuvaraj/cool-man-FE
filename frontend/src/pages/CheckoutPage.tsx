import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Loader2, Lock, ShoppingBag, UserRound } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAccount } from "@/contexts/AccountContext";
import { createOrder } from "@/lib/api";
import { formatPrice } from "@/lib/product";

const inputClass =
  "mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary";

export default function CheckoutPage() {
  const { account } = useAccount();
  const { items, subtotal, discountAmount, total, appliedCoupon, clearCart } = useCart();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [phone, setPhone] = useState(account?.phone || "");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const deliveryFee = subtotal >= 999 ? 0 : 79;
  const grandTotal = total + deliveryFee;

  if (!account) {
    return (
      <EmptyState
        icon={<UserRound size={28} />}
        title="Sign in to checkout"
        body="Your account keeps your orders and delivery details together."
        cta="Create account or sign in"
        to="/profile?redirect=/checkout"
      />
    );
  }

  if (!items.length) {
    return (
      <EmptyState
        icon={<ShoppingBag size={28} />}
        title="Your cart is empty"
        body="Add a few pieces to your bag before checking out."
        cta="Shop products"
        to="/shop"
      />
    );
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    if (phone.replace(/\D/g, "").length < 10) {
      setError("Enter a valid 10-digit phone number.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const order = await createOrder({
        customerName: account.name,
        customerEmail: account.email,
        phone: phone.trim(),
        address: address.trim(),
        items: items.map(({ product, size, quantity }) => ({
          productId: product.id,
          name: product.name,
          size,
          quantity,
          price: product.price,
          image: absoluteImageUrl(product.image),
        })),
        subtotal,
        deliveryFee,
        discount: discountAmount,
        total: grandTotal,
        couponCode: discountAmount > 0 ? appliedCoupon?.code : undefined,
      });
      clearCart();
      // Stock changed on the server — refresh product listings.
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
      navigate(`/track?id=${encodeURIComponent(order.trackingId)}&placed=1`);
    } catch (requestError) {
      setError(
        requestError instanceof TypeError
          ? "We couldn't reach the store right now. Please try again in a moment."
          : requestError instanceof Error
            ? requestError.message
            : "Could not place order.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10 sm:py-14">
      <span className="eyebrow mb-3">Almost there</span>
      <h1 className="section-heading">Checkout</h1>
      <p className="mt-2 text-muted-foreground">Signed in as {account.email}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-5">
        <form onSubmit={submit} className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8 lg:col-span-3">
          <h2 className="font-display text-xl font-bold">Delivery details</h2>
          <label className="block text-sm font-semibold">
            Full name
            <input value={account.name} disabled className={`${inputClass} cursor-not-allowed opacity-70`} />
          </label>
          <label className="block text-sm font-semibold">
            Phone
            <input
              required
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="10-digit mobile number"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-sm font-semibold">
            Delivery address
            <textarea
              required
              minLength={10}
              autoComplete="street-address"
              placeholder="House no., street, area, city, PIN code"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              className={`${inputClass} min-h-28 resize-y`}
            />
          </label>
          {error && <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
          <button
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:shadow-glow disabled:cursor-wait disabled:opacity-70"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Lock size={15} />}
            {submitting ? "Placing order…" : `Place order · ${formatPrice(grandTotal)}`}
          </button>
          <p className="text-center text-xs text-muted-foreground">You'll get a tracking number, and the store is notified on WhatsApp right away.</p>
        </form>

        <aside className="h-fit rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8 lg:sticky lg:top-24 lg:col-span-2">
          <h2 className="font-display text-xl font-bold">Order summary</h2>
          <ul className="mt-5 space-y-4">
            {items.map(({ product, size, quantity }) => (
              <li key={`${product.id}-${size}`} className="flex gap-3">
                <div className="relative shrink-0">
                  <img src={product.image} alt={product.name} className="h-16 w-14 rounded-lg object-cover" />
                  <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1 text-[11px] font-bold text-background">
                    {quantity}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{product.name}</p>
                  <p className="text-xs text-muted-foreground">Size {size}</p>
                </div>
                <p className="font-display text-sm font-semibold">{formatPrice(product.price * quantity)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-6 space-y-2.5 border-t border-border pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="font-semibold">{formatPrice(subtotal)}</dd></div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-primary"><dt>Discount ({appliedCoupon?.code})</dt><dd className="font-semibold">-{formatPrice(discountAmount)}</dd></div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Delivery</dt>
              <dd className={`font-semibold ${deliveryFee === 0 ? "text-badge-new" : ""}`}>{deliveryFee === 0 ? "FREE" : formatPrice(deliveryFee)}</dd>
            </div>
          </dl>
          <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
            <span className="font-display text-lg font-bold">Total</span>
            <span className="font-display text-2xl font-bold">{formatPrice(grandTotal)}</span>
          </div>
          <Link to="/cart" className="mt-4 block text-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            Edit cart
          </Link>
        </aside>
      </div>
    </div>
  );
}

/** The server sends product photos to the store's WhatsApp by link, so bundled asset paths must be absolute. */
function absoluteImageUrl(image: string): string | undefined {
  if (!image || /^(data|blob):/.test(image)) return undefined;
  try {
    return new URL(image, window.location.origin).href;
  } catch {
    return undefined;
  }
}

function EmptyState({ icon, title, body, cta, to }: { icon: React.ReactNode; title: string; body: string; cta: string; to: string }) {
  return (
    <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 py-20 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">{icon}</div>
      <h1 className="font-display text-3xl font-bold">{title}</h1>
      <p className="mx-auto mt-3 max-w-md text-muted-foreground">{body}</p>
      <Link
        to={to}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:shadow-glow"
      >
        {cta}
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}
