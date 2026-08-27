import { create } from "zustand";
import { User } from "../types";
import { api } from "../lib/api";

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem("kenpos_user") || "null"),
  token: localStorage.getItem("kenpos_token"),
  loading: false,

  login: async (email, password) => {
    set({ loading: true });
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("kenpos_token", data.token);
      localStorage.setItem("kenpos_user", JSON.stringify(data.user));
      set({ user: data.user, token: data.token, loading: false });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem("kenpos_token");
    localStorage.removeItem("kenpos_user");
    set({ user: null, token: null });
  },

  hydrate: async () => {
    const token = localStorage.getItem("kenpos_token");
    if (!token) return;
    try {
      const { data } = await api.get("/auth/me");
      set({ user: data, token });
      localStorage.setItem("kenpos_user", JSON.stringify(data));
    } catch {
      // token invalid/expired - interceptor already redirects on 401
    }
  },
}));

/** Simple permission helper: admin can do everything. */
export function can(role: string | undefined, ...allowed: string[]): boolean {
  if (!role) return false;
  return role === "admin" || allowed.includes(role);
}
