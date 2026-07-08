import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiRequest } from "@/lib/api";

export interface SafeUser {
  id: number;
  name: string;
  phone: string;
  pkg: string;
  paymentMethod: string;
  transactionImage: string;
  status: string;
  balance: string;
  adsWatchedToday: number;
  lastAdDate: string | null;
  totalAdsWatched: number;
  isAdmin: boolean;
  isBanned: boolean;
  createdAt: string;
}

interface AuthContextValue {
  user: SafeUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setUser: (u: SafeUser | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const data = await apiRequest("/api/auth/me");
      setUser(data.user);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await refresh();
      setLoading(false);
    })();
  }, []);

  const logout = async () => {
    await apiRequest("/api/auth/logout", { method: "POST" });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, refresh, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
