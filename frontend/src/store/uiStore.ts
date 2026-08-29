import { create } from "zustand";

interface UiState {
  /** True = touch/tablet mode: bigger tap targets, numeric keypad for quantity, no keyboard-shortcut hints. */
  touchMode: boolean;
  setTouchMode: (value: boolean) => void;
  toggleTouchMode: () => void;
}

const STORAGE_KEY = "kenpos_touch_mode";

export const useUiStore = create<UiState>((set, get) => ({
  touchMode: localStorage.getItem(STORAGE_KEY) === "true",

  setTouchMode: (value) => {
    localStorage.setItem(STORAGE_KEY, String(value));
    set({ touchMode: value });
  },

  toggleTouchMode: () => {
    const next = !get().touchMode;
    localStorage.setItem(STORAGE_KEY, String(next));
    set({ touchMode: next });
  },
}));