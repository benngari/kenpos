import { create } from "zustand";

interface ThemeState {
  dark: boolean;
  setDark: (value: boolean) => void;
  toggleDark: () => void;
}

const STORAGE_KEY = "kenpos_dark_mode";

function applyDarkClass(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
}

const initialDark = localStorage.getItem(STORAGE_KEY) === "true";
applyDarkClass(initialDark);

export const useThemeStore = create<ThemeState>((set, get) => ({
  dark: initialDark,

  setDark: (value) => {
    localStorage.setItem(STORAGE_KEY, String(value));
    applyDarkClass(value);
    set({ dark: value });
  },

  toggleDark: () => {
    const next = !get().dark;
    localStorage.setItem(STORAGE_KEY, String(next));
    applyDarkClass(next);
    set({ dark: next });
  },
}));
