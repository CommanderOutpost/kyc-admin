import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api/client";
import { MeResponse, User } from "../types";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  registerUser: (input: {
    name: string;
    email: string;
    phone: string;
    address: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = async () => {
    const me = await apiRequest<MeResponse>("/auth/me");
    setUser({ id: me.id, email: me.email, role: me.role });
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    refreshMe()
      .catch(() => {
        localStorage.removeItem("token");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiRequest<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });

    localStorage.setItem("token", response.token);
    setUser(response.user);
  };

  const registerUser = async (input: {
    name: string;
    email: string;
    phone: string;
    address: string;
    password: string;
  }) => {
    await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        ...input,
        email: input.email.toLowerCase(),
        role: "USER"
      })
    });

    await login(input.email.toLowerCase(), input.password);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      registerUser,
      logout,
      refreshMe
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};
