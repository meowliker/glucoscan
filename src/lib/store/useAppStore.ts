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
import { fetchUserSettings, updateUserSettings } from "@/lib/db/settings";
import {
  fetchScanHistory,
  addScanToHistory,
  deleteScanFromHistory,
  clearAllHistory,
} from "@/lib/db/history";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

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
  loadHistory: (userId?: string) => void;
  loadSettings: (userId?: string) => void;
  completeOnboarding: (userId?: string) => void;
  loadBloodSugar: () => void;
  resetUserData: () => void;
}

async function getUserId(): Promise<string | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
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
    getUserId().then((userId) => {
      if (userId) updateUserSettings(userId, newSettings);
    });
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
    getUserId().then((userId) => {
      if (userId) updateUserSettings(userId, { bloodSugarUnit: unit });
    });
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
    getUserId().then((userId) => {
      if (userId) {
        addScanToHistory(userId, product, result, assessment).then((dbId) => {
          if (dbId) {
            set({
              history: get().history.map((h) =>
                h.id === item.id ? { ...h, id: dbId } : h
              ),
            });
          }
        });
      }
    });
  },

  removeFromHistory: (id) => {
    const history = get().history.filter((item) => item.id !== id);
    set({ history });
    getUserId().then((userId) => {
      if (userId) deleteScanFromHistory(userId, id);
    });
  },

  clearHistory: () => {
    set({ history: [] });
    getUserId().then((userId) => {
      if (userId) clearAllHistory(userId);
    });
  },

  loadHistory: async (userId?: string) => {
    const uid = userId || (await getUserId());
    if (uid) {
      const history = await fetchScanHistory(uid);
      set({ history });
    }
  },

  loadSettings: async (userId?: string) => {
    const uid = userId || (await getUserId());
    if (uid) {
      const settings = await fetchUserSettings(uid);
      if (settings) {
        set({
          settings,
          bloodSugarUnit: settings.bloodSugarUnit || "mg/dL",
        });
      }
    }
  },

  completeOnboarding: async (userId?: string) => {
    const settings = {
      ...get().settings,
      onboardingComplete: true,
      disclaimerAccepted: true,
    };
    set({ settings });
    const uid = userId || (await getUserId());
    if (uid) {
      updateUserSettings(uid, {
        onboardingComplete: true,
        disclaimerAccepted: true,
      });
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

  resetUserData: () => {
    set({
      history: [],
      settings: {
        bloodSugarUnit: "mg/dL",
        onboardingComplete: false,
        disclaimerAccepted: false,
      },
      currentProduct: null,
      currentResult: null,
      currentAssessment: null,
      bloodSugar: null,
      bloodSugarUnit: "mg/dL",
    });
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("glucoscan_bs");
    }
  },
}));
