import { describe, it, expect, beforeEach, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CartProvider, useCart } from "@/contexts/CartContext";
import CustomizePage from "@/pages/CustomizePage";

function CartProbe() {
  const { items, subtotal } = useCart();
  return (
    <>
      <output data-testid="cart">
        {items.map((item) => `${item.product.name} | ${item.product.fabric} | ${item.size}`).join("\n")}
        {` | total ${subtotal}`}
      </output>
      <output data-testid="artwork">{items.map((item) => item.product.artworkUrl ?? "").join("")}</output>
    </>
  );
}

const renderPage = () =>
  render(
    <CartProvider>
      <CustomizePage />
      <CartProbe />
    </CartProvider>,
  );

describe("CustomizePage", () => {
  beforeEach(() => localStorage.clear());

  it("lets every fabric be selected", () => {
    renderPage();
    for (const label of ["Jersey Material 280 GSM", "Tri-Blend 200 GSM", "Premium Cotton 220 GSM"]) {
      const radio = screen.getByRole("radio", { name: new RegExp(label) });
      fireEvent.click(radio);
      expect(radio).toBeChecked();
    }
  });

  it("carries colour, fabric, text style and size into the cart", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /navy/i }));
    fireEvent.click(screen.getByRole("radio", { name: /Tri-Blend/ }));

    fireEvent.click(screen.getByRole("button", { name: /^text$/i }));
    fireEvent.change(screen.getByPlaceholderText(/type your text/i), { target: { value: "  Hello  " } });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Impact" } });
    fireEvent.change(screen.getByRole("slider"), { target: { value: "36" } });
    fireEvent.click(screen.getByRole("button", { name: "Bold" }));
    fireEvent.click(screen.getByRole("button", { name: "Italic" }));
    fireEvent.click(screen.getByRole("button", { name: "Align left" }));
    fireEvent.click(screen.getByRole("button", { name: /gold/i }));

    fireEvent.click(screen.getByRole("button", { name: /add to cart/i }));
    expect(screen.getByText(/please pick a size/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "XL" }));
    fireEvent.click(screen.getByRole("button", { name: /add to cart/i }));

    // The design is rendered to an image before the item is added.
    await waitFor(() => expect(screen.getByTestId("cart").textContent).toContain("XL"));
    const cart = screen.getByTestId("cart").textContent ?? "";
    expect(cart).toContain("Navy · Tri-Blend 200 GSM");
    expect(cart).toContain('"Hello" (Impact, 36px, bold, italic, left-aligned, Gold text)');
    expect(cart).toContain("| Tri-Blend 200 GSM | XL");
    expect(cart).toContain("total 1499");
  });

  it("uploads the customer's picture and keeps its link on the cart item", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ url: "https://api.test/api/order-images/abc" }), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    const { container } = renderPage();
    fireEvent.click(screen.getByRole("button", { name: /^upload$/i }));
    const file = new File([new Uint8Array([137, 80, 78, 71])], "art.png", { type: "image/png" });
    fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [file] } });
    await screen.findByAltText("Uploaded design");

    fireEvent.click(screen.getByRole("button", { name: "M" }));
    fireEvent.click(screen.getByRole("button", { name: /add to cart/i }));

    await waitFor(() => expect(screen.getByTestId("artwork").textContent).toBe("https://api.test/api/order-images/abc"));
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toMatch(/\/api\/design-uploads$/);
    expect(JSON.parse(init.body as string).image).toMatch(/^data:image\/png;base64,/);
    vi.unstubAllGlobals();
  });

  it("does not charge for text that is only spaces", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /^text$/i }));
    fireEvent.change(screen.getByPlaceholderText(/type your text/i), { target: { value: "   " } });
    expect(screen.getAllByText("₹1299").length).toBeGreaterThan(0);
  });
});
