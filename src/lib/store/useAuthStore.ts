"use client";
import { create } from "zustand";
import type { User, Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  configured: boolean;

  initialize: () => Promise<void>;
  signUp: (
    email: string,
    password: string,
    fullName?: string
  ) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const initiallyConfigured = isSupabaseConfigured();

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  // If Supabase isn't configured, don't block on loading
  loading: initiallyConfigured,
  configured: initiallyConfigured,

  initialize: async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      set({ loading: false, configured: false });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      set({
        user: session?.user ?? null,
        session,
        loading: false,
        configured: true,
      });

      supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
        set({
          user: session?.user ?? null,
          session,
        });
      });
    } catch (err) {
      console.error("Auth initialization failed:", err);
      set({ loading: false, configured: false });
    }
  },

  signUp: async (email, password, fullName) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return { error: "Supabase not configured" };

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || "",
        },
      },
    });

    if (error) return { error: error.message };
    return { error: null };
  },

  signIn: async (email, password) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return { error: "Supabase not configured" };

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return { error: error.message };

    set({
      user: data.user,
      session: data.session,
    });

    return { error: null };
  },

  signOut: async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    await supabase.auth.signOut();
    set({ user: null, session: null });
  },
}));
