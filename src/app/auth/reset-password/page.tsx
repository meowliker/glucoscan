"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import { Droplets, Eye, EyeOff } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Status = "checking" | "ready" | "invalid";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("checking");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hashError, setHashError] = useState("");

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setHashError("Authentication is not configured");
      setStatus("invalid");
      return;
    }

    // Supabase puts errors in the URL hash when the token is bad/expired
    if (typeof window !== "undefined" && window.location.hash) {
      const params = new URLSearchParams(window.location.hash.substring(1));
      const errCode = params.get("error_code");
      const errDesc = params.get("error_description");
      if (errCode || errDesc) {
        setHashError(
          errDesc?.replace(/\+/g, " ") || "Reset link invalid or expired"
        );
        setStatus("invalid");
        return;
      }
    }

    // Supabase SSR client auto-exchanges the recovery code in the URL for a session.
    // We only need to confirm a session exists before showing the form.
    const check = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setStatus("ready");
      } else {
        // Sometimes the session shows up a moment later via onAuthStateChange
        const { data: sub } = supabase.auth.onAuthStateChange(
          (_event: string, s: Session | null) => {
            if (s) {
              setStatus("ready");
              sub.subscription.unsubscribe();
            }
          }
        );
        // If nothing arrives within 3s, treat as invalid
        setTimeout(() => {
          setStatus((prev) => (prev === "checking" ? "invalid" : prev));
          sub.subscription.unsubscribe();
        }, 3000);
      }
    };
    check();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Authentication is not configured");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Droplets size={32} className="text-primary" />
          </div>
          <h1 className="text-h1 text-text-primary">Choose a new password</h1>
          <p className="text-body-sm text-text-muted mt-1 text-center">
            Pick something you&apos;ll remember.
          </p>
        </div>

        {status === "checking" && (
          <div className="text-center text-body-sm text-text-muted py-8">
            Verifying your link...
          </div>
        )}

        {status === "invalid" && (
          <div className="space-y-4">
            <div className="p-3 bg-status-errorBg border border-status-error/20 rounded-button">
              <p className="text-body-sm text-status-error">
                {hashError ||
                  "This reset link is no longer valid. Request a new code to continue."}
              </p>
            </div>
            <Link href="/auth/forgot-password" className="block">
              <Button variant="primary" size="lg" fullWidth>
                Request a new code
              </Button>
            </Link>
          </div>
        )}

        {status === "ready" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-status-errorBg border border-status-error/20 rounded-button">
                <p className="text-body-sm text-status-error">{error}</p>
              </div>
            )}

            <div className="relative">
              <Input
                label="New password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-[38px] text-text-muted hover:text-text-secondary"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
            >
              {loading ? "Saving..." : "Save new password"}
            </Button>
          </form>
        )}

        <Link
          href="/auth/login"
          className="block text-center text-body-sm text-text-muted hover:text-text-secondary mt-8"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
