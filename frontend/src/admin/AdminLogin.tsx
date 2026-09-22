import { FormEvent, useState } from "react";
import { LockKeyhole } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ADMIN_SESSION_KEY = "coolman-admin-session";
const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || "admin@coolman.in";
const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || "admin123";

export function isAdminSignedIn() {
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === "active";
}

export function signOutAdmin() {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
}

export default function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (email.trim().toLowerCase() !== adminEmail.toLowerCase() || password !== adminPassword) {
      setError("Incorrect admin email or password.");
      return;
    }
    sessionStorage.setItem(ADMIN_SESSION_KEY, "active");
    onSuccess();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <form onSubmit={submit} className="w-full max-w-md space-y-5 rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold">Admin Login</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to manage the Coolman store.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="admin-email">Email</Label>
          <Input id="admin-email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="admin-password">Password</Label>
          <Input id="admin-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </div>
        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
        <Button type="submit" className="w-full">Sign in</Button>
        <Button type="button" variant="ghost" className="w-full" onClick={() => navigate("/")}>Back to store</Button>
      </form>
    </main>
  );
}