"use client";
import { create } from "zustand";
import type {
  ScanHistoryItem,
  FoodProduct,
  GlycemicResult,
  PersonalizedAssessment,
  BloodSugarUnit,
  UserSettings,
} from "@/types";
import { generateId, formatDate } from "@/lib/utils/formatters";

interface AppState {
  settings: UserSettings;
  history: ScanHistoryItem[];
  currentProduct: FoodProduct | null;
  currentResult: GlycemicResult | null;
  currentAssessment: PersonalizedAssessment | null;
  bloodSugar: number | null;
  bloodSugarUnit: BloodSugarUnit;

  setSettings: (settings: Partial<UserSettings>) => void;
  setCurrentProduct: (product: FoodProduct | null) => void;
  setCurrentResult: (result: GlycemicResult | null) => void;
  setCurrentAssessment: (assessment: PersonalizedAssessment | null) => void;
  setBloodSugar: (value: number | null) => void;
  setBloodSugarUnit: (unit: BloodSugarUnit) => void;
  addToHistory: (
    product: FoodProduct,
    result: GlycemicResult,
    assessment?: PersonalizedAssessment
  ) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
  loadHistory: () => void;
  loadSettings: () => void;
  completeOnboarding: () => void;
  loadBloodSugar: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  settings: {
    bloodSugarUnit: "mg/dL",
    onboardingComplete: false,
    disclaimerAccepted: false,
  },
  history: [],
  currentProduct: null,
  currentResult: null,
  currentAssessment: null,
  bloodSugar: null,
  bloodSugarUnit: "mg/dL",

  setSettings: (newSettings) => {
    const current = get().settings;
    const updated = { ...current, ...newSettings };
    set({ settings: updated });
    if (typeof window !== "undefined") {
      localStorage.setItem("glucoscan_settings", JSON.stringify(updated));
    }
  },

  setCurrentProduct: (product) => set({ currentProduct: product }),
  setCurrentResult: (result) => set({ currentResult: result }),
  setCurrentAssessment: (assessment) => set({ currentAssessment: assessment }),

  setBloodSugar: (value) => {
    set({ bloodSugar: value });
    if (typeof window !== "undefined") {
      if (value !== null) {
        sessionStorage.setItem("glucoscan_bs", value.toString());
      } else {
        sessionStorage.removeItem("glucoscan_bs");
      }
    }
  },

  setBloodSugarUnit: (unit) => {
    set({ bloodSugarUnit: unit });
    const settings = get().settings;
    const updated = { ...settings, bloodSugarUnit: unit };
    set({ settings: updated });
    if (typeof window !== "undefined") {
      localStorage.setItem("glucoscan_settings", JSON.stringify(updated));
    }
  },

  addToHistory: (product, result, assessment) => {
    const item: ScanHistoryItem = {
      id: generateId(),
      product,
      result,
      assessment,
      timestamp: Date.now(),
      date: formatDate(Date.now()),
    };
    const history = [item, ...get().history].slice(0, 100);
    set({ history });
    if (typeof window !== "undefined") {
      localStorage.setItem("glucoscan_history", JSON.stringify(history));
    }
  },

  removeFromHistory: (id) => {
    const history = get().history.filter((item) => item.id !== id);
    set({ history });
    if (typeof window !== "undefined") {
      localStorage.setItem("glucoscan_history", JSON.stringify(history));
    }
  },

  clearHistory: () => {
    set({ history: [] });
    if (typeof window !== "undefined") {
      localStorage.removeItem("glucoscan_history");
    }
  },

  loadHistory: () => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("glucoscan_history");
        if (stored) {
          set({ history: JSON.parse(stored) });
        }
      } catch {
        // ignore corrupt data
      }
    }
  },

  loadSettings: () => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("glucoscan_settings");
        if (stored) {
          const settings = JSON.parse(stored);
          set({
            settings,
            bloodSugarUnit: settings.bloodSugarUnit || "mg/dL",
          });
        }
      } catch {
        // ignore corrupt data
      }
    }
  },

  completeOnboarding: () => {
    const settings = {
      ...get().settings,
      onboardingComplete: true,
      disclaimerAccepted: true,
    };
    set({ settings });
    if (typeof window !== "undefined") {
      localStorage.setItem("glucoscan_settings", JSON.stringify(settings));
    }
  },

  loadBloodSugar: () => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("glucoscan_bs");
      if (stored) {
        const val = parseFloat(stored);
        if (!isNaN(val)) {
          set({ bloodSugar: val });
        }
      }
    }
  },
}));
