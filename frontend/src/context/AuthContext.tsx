import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "../api/authApi";
import { fetchMe, logout as logoutApi } from "../api/authApi";
import {
  isAuthenticated,
  clearTokens,
  saveTokens,
} from "../lib/authStorage";
import type { TokenResponse } from "../api/authApi";

type AuthState = {
  user: User | null;
  loading: boolean;
  login: (tokens: TokenResponse) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      setLoading(false);
      return;
    }

    fetchMe()
      .then((res) => {
        if (res.data) {
          setUser(res.data);
        } else {
          clearTokens();
        }
      })
      .catch(() => {
        clearTokens();
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleLogin(tokens: TokenResponse) {
    saveTokens(tokens);
    const res = await fetchMe();
    if (res.data) {
      setUser(res.data);
    }
  }

  async function handleLogout() {
    try {
      await logoutApi();
    } catch {
      // Logout endpoint may fail, still clear locally
    }
    clearTokens();
    setUser(null);
    window.location.href = "/login";
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login: handleLogin, logout: handleLogout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
