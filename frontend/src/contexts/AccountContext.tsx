import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type CustomerAccount = { name: string; email: string; phone: string; password: string };
type AccountContextType = { account: CustomerAccount | null; signUp: (account: CustomerAccount) => string | null; signIn: (email: string, password: string) => string | null; signOut: () => void };

const ACCOUNTS_KEY = "coolman-customer-accounts";
/** Older builds stored a single account here; read it so existing sign-ups keep working. */
const LEGACY_ACCOUNT_KEY = "coolman-customer-account";
const SESSION_KEY = "coolman-customer-session";
const AccountContext = createContext<AccountContextType | null>(null);

export function useAccount() {
  const context = useContext(AccountContext);
  if (!context) throw new Error("useAccount must be used within AccountProvider");
  return context;
}

function readJson<T>(key: string): T | null {
  try {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : null;
  } catch {
    return null;
  }
}

function loadAccounts(): Record<string, CustomerAccount> {
  const accounts = readJson<Record<string, CustomerAccount>>(ACCOUNTS_KEY) ?? {};
  const legacy = readJson<CustomerAccount>(LEGACY_ACCOUNT_KEY);
  if (legacy?.email && !accounts[legacy.email]) accounts[legacy.email] = legacy;
  return accounts;
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<CustomerAccount | null>(() => readJson<CustomerAccount>(SESSION_KEY));

  useEffect(() => {
    try {
      if (account) localStorage.setItem(SESSION_KEY, JSON.stringify(account));
      else localStorage.removeItem(SESSION_KEY);
    } catch {
      // Storage blocked — session lasts until reload.
    }
  }, [account]);

  const signUp = (newAccount: CustomerAccount) => {
    const normalizedEmail = newAccount.email.trim().toLowerCase();
    if (!newAccount.name.trim() || !normalizedEmail || newAccount.password.length < 6) return "Enter your name, email, and a password of at least 6 characters.";
    if (newAccount.phone.replace(/\D/g, "").length < 10) return "Enter a valid 10-digit phone number.";
    const accounts = loadAccounts();
    if (accounts[normalizedEmail]) return "An account already exists for this email. Sign in instead.";
    const saved = { ...newAccount, name: newAccount.name.trim(), phone: newAccount.phone.trim(), email: normalizedEmail };
    try {
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify({ ...accounts, [normalizedEmail]: saved }));
    } catch {
      return "Could not save your account in this browser. Check that site storage is allowed.";
    }
    setAccount(saved);
    return null;
  };

  const signIn = (email: string, password: string) => {
    const saved = loadAccounts()[email.trim().toLowerCase()];
    if (!saved || saved.password !== password) return "Incorrect email or password. Create an account first if you are new here.";
    setAccount(saved);
    return null;
  };

  return <AccountContext.Provider value={{ account, signUp, signIn, signOut: () => setAccount(null) }}>{children}</AccountContext.Provider>;
}
