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
    // Open the WhatsApp tab now, while we still have the click — browsers block pop-ups opened after a network wait.
    const whatsappWindow = openPendingWindow();
    try {
      const images = await Promise.all(items.map(({ product }) => whatsAppImage(product.image)));
      const order = await createOrder({
        customerName: account.name,
        customerEmail: account.email,
        phone: phone.trim(),
        address: address.trim(),
        items: items.map(({ product, size, quantity }, index) => ({
          productId: product.id,
          name: product.name,
          size,
          quantity,
          price: product.price,
          image: images[index],
          artworkUrl: product.artworkUrl,
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
      let whatsappOpened = false;
      if (order.whatsappUrl && whatsappWindow && !whatsappWindow.closed) {
        whatsappWindow.location.href = order.whatsappUrl;
        whatsappOpened = true;
      } else {
        whatsappWindow?.close();
      }
      navigate(`/track?id=${encodeURIComponent(order.trackingId)}&placed=1`, { state: { whatsappUrl: order.whatsappUrl, whatsappOpened } });
    } catch (requestError) {
      whatsappWindow?.close();
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
          <p className="text-center text-xs text-muted-foreground">WhatsApp opens with your order filled in — just tap Send so the store can confirm it.</p>
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

/** A blank tab opened during the click, pointed at WhatsApp once the order is saved. Null if pop-ups are blocked. */
function openPendingWindow(): Window | null {
  const pending = window.open("", "_blank");
  if (!pending) return null;
  pending.opener = null;
  try {
    pending.document.title = "Opening WhatsApp…";
    pending.document.body.innerHTML = '<p style="font-family:system-ui,sans-serif;padding:2rem;text-align:center">Placing your order and opening WhatsApp…</p>';
  } catch {
    // Some browsers don't let us write to the new tab; it simply stays blank until redirected.
  }
  return pending;
}

const WHATSAPP_IMAGE_MAX_SIDE = 1024;

/**
 * The server forwards each item's photo to the store's WhatsApp, which only accepts JPEG/PNG.
 * Re-encoding it here as a JPEG data URL covers WebP/GIF uploads and custom designs, and means the
 * server never has to fetch a URL it may not reach (e.g. a localhost asset). Falls back to the absolute URL.
 */
async function whatsAppImage(image: string): Promise<string | undefined> {
  if (!image) return undefined;
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = image;
    await img.decode();
    const scale = Math.min(1, WHATSAPP_IMAGE_MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas unavailable");
    // JPEG has no transparency; paint white behind transparent PNG designs.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.85);
  } catch {
    if (/^(data|blob):/.test(image)) return undefined;
    try {
      return new URL(image, window.location.origin).href;
    } catch {
      return undefined;
    }
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
