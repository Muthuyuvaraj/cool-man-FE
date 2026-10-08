import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Check, CheckCircle2, Loader2, MessageCircle, ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { createOrder, fetchTrackedOrder } from "@/lib/api";
import { formatPrice } from "@/lib/product";
import { readPendingOrder, savePendingOrder } from "@/lib/whatsappOrder";

const steps = ["Review cart", "Send on WhatsApp", "Confirm order"];

export default function ConfirmOrderPage() {
  const [pending] = useState(readPendingOrder);
  const { clearCart } = useCart();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // Set by the cart: whether it managed to open WhatsApp in a new tab.
  const whatsappOpened = (useLocation().state as { whatsappOpened?: boolean } | null)?.whatsappOpened;
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);

  if (!pending) {
    return (
      <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 py-20 text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary"><ShoppingBag size={28} /></div>
        <h1 className="font-display text-3xl font-bold">No order to confirm</h1>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">Add your details in the cart and send your order on WhatsApp first.</p>
        <Link
          to="/cart"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:shadow-glow"
        >
          Go to cart
          <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  const { order, orderId, trackingId, whatsappUrl, thumbnails } = pending;

  const placed = () => {
    savePendingOrder(null);
    clearCart();
    // Stock changed on the server — refresh product listings.
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
    navigate(`/track?id=${encodeURIComponent(trackingId)}&placed=1`);
  };

  const confirm = async () => {
    if (confirming) return;
    setError("");
    setConfirming(true);
    try {
      await createOrder({ ...order, orderId, trackingId });
      placed();
    } catch (requestError) {
      // A double tap, or a reply lost on a flaky connection, may already have placed it.
      const alreadyPlaced = await fetchTrackedOrder(trackingId).then(() => true, () => false);
      if (alreadyPlaced) return placed();
      setError(
        requestError instanceof TypeError
          ? "We couldn't reach the store right now. Please try again in a moment."
          : requestError instanceof Error
            ? requestError.message
            : "Could not place order.",
      );
      setConfirming(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10 sm:py-14">
      <span className="eyebrow mb-3">Last step</span>
      <h1 className="section-heading">Confirm your order</h1>
      <ol className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
        {steps.map((step, index) => {
          const done = index < steps.length - 1;
          return (
            <li key={step} className="flex items-center gap-2">
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${done ? "bg-badge-new text-white" : "bg-primary text-primary-foreground"}`}>
                {done ? <Check size={14} /> : index + 1}
              </span>
              <span className={done ? "text-muted-foreground" : "font-semibold"}>{step}</span>
              {index < steps.length - 1 && <span className="hidden h-px w-6 bg-border sm:block" />}
            </li>
          );
        })}
      </ol>

      <div className="mt-8 grid gap-8 lg:grid-cols-5">
        <section className="h-fit space-y-5 rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8 lg:col-span-3">
          <div>
            <h2 className="font-display text-xl font-bold">Sent it on WhatsApp?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {whatsappOpened
                ? "We opened WhatsApp with your order filled in. Once you've tapped Send there, confirm here to place your order."
                : "Open WhatsApp and send the order message to the store, then confirm here to place your order."}
            </p>
          </div>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-full border border-[#25D366] py-3 text-sm font-semibold text-[#128C7E] transition-colors hover:bg-[#25D366]/10 dark:text-[#25D366]"
          >
            <MessageCircle size={16} />
            {whatsappOpened ? "Open WhatsApp again" : "Open WhatsApp"}
          </a>
          {error && <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
          <button
            onClick={confirm}
            disabled={confirming}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:shadow-glow disabled:cursor-wait disabled:opacity-70"
          >
            {confirming ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            {confirming ? "Placing order…" : `Confirm order · ${formatPrice(order.total)}`}
          </button>
          <div className="rounded-xl bg-secondary/60 px-4 py-3 text-sm">
            <p className="font-semibold">Delivering to {order.customerName}</p>
            <p className="text-muted-foreground">{order.phone}</p>
            <p className="whitespace-pre-line text-muted-foreground">{order.address}</p>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            Order reference <span className="font-mono font-semibold text-foreground">{orderId}</span> — it's in your WhatsApp message too.
          </p>
        </section>

        <aside className="h-fit rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8 lg:sticky lg:top-24 lg:col-span-2">
          <h2 className="font-display text-xl font-bold">Order summary</h2>
          <ul className="mt-5 space-y-4">
            {order.items.map((item, index) => (
              <li key={`${item.productId}-${item.size}`} className="flex gap-3">
                <div className="relative shrink-0">
                  <img src={thumbnails[index]} alt={item.name} className="h-16 w-14 rounded-lg object-cover" />
                  <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1 text-[11px] font-bold text-background">
                    {item.quantity}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{item.name}</p>
                  <p className="text-xs text-muted-foreground">Size {item.size}</p>
                </div>
                <p className="font-display text-sm font-semibold">{formatPrice(item.price * item.quantity)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-6 space-y-2.5 border-t border-border pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="font-semibold">{formatPrice(order.subtotal)}</dd></div>
            {order.discount > 0 && (
              <div className="flex justify-between text-primary"><dt>Discount ({order.couponCode})</dt><dd className="font-semibold">-{formatPrice(order.discount)}</dd></div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Delivery</dt>
              <dd className={`font-semibold ${order.deliveryFee === 0 ? "text-badge-new" : ""}`}>{order.deliveryFee === 0 ? "FREE" : formatPrice(order.deliveryFee)}</dd>
            </div>
          </dl>
          <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
            <span className="font-display text-lg font-bold">Total</span>
            <span className="font-display text-2xl font-bold">{formatPrice(order.total)}</span>
          </div>
          <Link to="/cart" className="mt-4 block text-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            Change something? Back to cart
          </Link>
        </aside>
      </div>
    </div>
  );
}
