import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, LogOut, Package, UserRound } from "lucide-react";
import { useAccount } from "@/contexts/AccountContext";
import { fetchCustomerOrders, type AdminOrder } from "@/lib/api";
import { formatPrice } from "@/lib/product";

const inputClass =
  "mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary";

const statusStyles: Record<string, string> = {
  placed: "bg-secondary text-secondary-foreground",
  confirmed: "bg-primary/10 text-primary",
  shipped: "bg-primary/10 text-primary",
  out_for_delivery: "bg-primary/15 text-primary",
  delivered: "bg-badge-new/15 text-badge-new",
  cancelled: "bg-destructive/10 text-destructive",
};

export default function ProfilePage() {
  const { account, signUp, signIn, signOut } = useAccount();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const redirect = params.get("redirect");
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const ordersQuery = useQuery({
    queryKey: ["customer-orders", account?.email],
    queryFn: () => fetchCustomerOrders(account!.email),
    enabled: Boolean(account),
    refetchInterval: 15000,
  });

  // Came here from checkout: go straight back once signed in.
  useEffect(() => {
    if (account && redirect?.startsWith("/")) navigate(redirect, { replace: true });
  }, [account, redirect, navigate]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const result = mode === "signup" ? signUp({ name, email, phone, password }) : signIn(email, password);
    setError(result || "");
  };

  if (account) {
    const orders = ordersQuery.data ?? [];
    return (
      <div className="container mx-auto max-w-4xl px-4 py-10 sm:py-14">
        <section className="flex flex-wrap items-center justify-between gap-6 rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary font-display text-xl font-bold text-primary-foreground">
              {account.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold sm:text-3xl">Hi, {account.name.split(" ")[0]}</h1>
              <p className="text-sm text-muted-foreground">{account.email}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-secondary"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </section>

        <section className="mt-10">
          <div className="mb-5 flex items-end justify-between">
            <h2 className="font-display text-2xl font-bold">Your orders</h2>
            {orders.length > 0 && <span className="text-sm text-muted-foreground">{orders.length} total</span>}
          </div>

          {ordersQuery.isLoading && (
            <div className="space-y-4">
              {[0, 1].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-secondary" />)}
            </div>
          )}
          {ordersQuery.isError && (
            <p className="rounded-2xl bg-destructive/10 px-5 py-4 text-sm text-destructive">We couldn't load your orders right now. Please try again shortly.</p>
          )}
          {!ordersQuery.isLoading && !ordersQuery.isError && orders.length === 0 && (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-14 text-center">
              <Package size={28} className="text-muted-foreground" />
              <p className="mt-3 font-display text-lg font-semibold">No orders yet</p>
              <p className="mt-1 text-sm text-muted-foreground">When you place an order it will show up here.</p>
              <Link to="/shop" className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
                Start shopping <ArrowRight size={15} />
              </Link>
            </div>
          )}

          <div className="space-y-4">
            {orders.map((order: AdminOrder) => (
              <article key={order.orderId} className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-lg font-bold">{order.orderId}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : ""}
                      {" · "}
                      {order.items.reduce((sum, item) => sum + item.quantity, 0)} item(s)
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyles[order.status] ?? statusStyles.placed}`}>
                    {order.status.replaceAll("_", " ")}
                  </span>
                </div>
                <p className="mt-3 line-clamp-1 text-sm text-muted-foreground">
                  {order.items.map((item) => `${item.name} × ${item.quantity}`).join(", ")}
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                  <Link
                    to={`/track?id=${encodeURIComponent(order.trackingId ?? "")}`}
                    className="group inline-flex items-center gap-2 text-sm font-semibold text-primary"
                  >
                    Track <span className="font-mono">{order.trackingId}</span>
                    <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                  </Link>
                  <p className="font-display text-xl font-bold">{formatPrice(order.total)}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-16">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-card sm:p-10">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary"><UserRound size={26} /></div>
        <h1 className="text-center font-display text-3xl font-bold">{mode === "signup" ? "Create your account" : "Welcome back"}</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {redirect ? "Sign in to continue to checkout." : "Track orders and check out faster."}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-1 rounded-full bg-secondary p-1">
          {(["signup", "signin"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setError(""); }}
              className={`rounded-full py-2 text-sm font-semibold transition-colors ${mode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              {m === "signup" ? "Sign up" : "Sign in"}
            </button>
          ))}
        </div>

        {mode === "signup" && (
          <label className="mt-6 block text-sm font-semibold">Name<input required autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className={inputClass} /></label>
        )}
        <label className="mt-4 block text-sm font-semibold">Email<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} /></label>
        {mode === "signup" && (
          <label className="mt-4 block text-sm font-semibold">Phone<input required type="tel" inputMode="tel" autoComplete="tel" placeholder="10-digit mobile number" value={phone} onChange={(event) => setPhone(event.target.value)} className={inputClass} /></label>
        )}
        <label className="mt-4 block text-sm font-semibold">Password<input required type="password" minLength={6} autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} /></label>
        {error && <p className="mt-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
        <button className="mt-6 w-full rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:shadow-glow">
          {mode === "signup" ? "Create account" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
