import type { OrderInput } from "@/lib/api";

/**
 * An order the customer has sent on WhatsApp but not confirmed yet. Kept in localStorage because phones
 * often reload the store's tab while the customer is away in WhatsApp.
 */
export type PendingOrder = {
  order: OrderInput;
  orderId: string;
  trackingId: string;
  whatsappUrl: string;
  /** Product photos for the confirm page, one per item. */
  thumbnails: string[];
};

const PENDING_ORDER_KEY = "coolman-pending-order";

export function readPendingOrder(): PendingOrder | null {
  try {
    const stored = localStorage.getItem(PENDING_ORDER_KEY);
    return stored ? (JSON.parse(stored) as PendingOrder) : null;
  } catch {
    return null;
  }
}

export function savePendingOrder(pending: PendingOrder | null) {
  try {
    if (pending) localStorage.setItem(PENDING_ORDER_KEY, JSON.stringify(pending));
    else localStorage.removeItem(PENDING_ORDER_KEY);
  } catch {
    // Storage full or blocked — the confirm page then can't survive a reload, but works in this tab.
  }
}

/** A blank tab opened during the click, pointed at WhatsApp once the message is ready. Null if pop-ups are blocked. */
export function openPendingWindow(): Window | null {
  const pending = window.open("", "_blank");
  if (!pending) return null;
  pending.opener = null;
  try {
    pending.document.title = "Opening WhatsApp…";
    pending.document.body.innerHTML = '<p style="font-family:system-ui,sans-serif;padding:2rem;text-align:center">Opening WhatsApp with your order…</p>';
  } catch {
    // Some browsers don't let us write to the new tab; it simply stays blank until redirected.
  }
  return pending;
}

const WHATSAPP_IMAGE_MAX_SIDE = 1024;

/**
 * The server links each item's photo in the store's WhatsApp message, which only accepts JPEG/PNG.
 * Re-encoding it here as a JPEG data URL covers WebP/GIF uploads and custom designs, and means the
 * server never has to fetch a URL it may not reach (e.g. a localhost asset). Falls back to the absolute URL.
 */
export async function whatsAppImage(image: string): Promise<string | undefined> {
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
