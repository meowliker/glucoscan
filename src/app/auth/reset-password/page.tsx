"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import { Droplets, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Status = "checking" | "ready" | "invalid" | "success";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("checking");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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
          errDesc?.replace(/\+/g, " ") ||
            "This reset link is invalid or has expired."
        );
        setStatus("invalid");
        return;
      }
    }

    // The Supabase SSR client auto-exchanges the recovery code from the URL
    // into a session. We just need to confirm a session exists.
    const check = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setStatus("ready");
        return;
      }

      // Session may arrive a beat later via onAuthStateChange
      const { data: sub } = supabase.auth.onAuthStateChange(
        (_event: string, s: Session | null) => {
          if (s) {
            setStatus("ready");
            sub.subscription.unsubscribe();
          }
        }
      );

      // If still nothing after 3s, the link didn't carry a valid session
      setTimeout(() => {
        setStatus((prev) => (prev === "checking" ? "invalid" : prev));
        sub.subscription.unsubscribe();
      }, 3000);
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
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match");
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

    setStatus("success");
    // Give the user a moment to see the success state, then redirect
    setTimeout(() => {
      router.push("/");
      router.refresh();
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo + heading */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Droplets size={32} className="text-primary" />
          </div>
          <h1 className="text-h1 text-text-primary">
            {status === "success" ? "Password updated" : "Reset password"}
          </h1>
          <p className="text-body-sm text-text-muted mt-1 text-center">
            {status === "success"
              ? "You're all set. Redirecting you now..."
              : status === "invalid"
              ? "This reset link can't be used anymore."
              : "Create a new password for your account."}
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
                  "This reset link is no longer valid. Request a new one to continue."}
              </p>
            </div>
            <Link href="/auth/login" className="block">
              <Button variant="primary" size="lg" fullWidth>
                Back to sign in
              </Button>
            </Link>
          </div>
        )}

        {status === "success" && (
          <div className="flex items-start gap-3 p-4 bg-primary/10 border border-primary/20 rounded-button">
            <CheckCircle2
              size={20}
              className="text-primary mt-0.5 flex-shrink-0"
            />
            <p className="text-body-sm text-text-primary">
              Your password has been updated. You&apos;re now signed in.
            </p>
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
                type={showNew ? "text" : "password"}
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                autoFocus
              />
              <Lock
                size={18}
                className="absolute left-4 top-[38px] text-text-muted pointer-events-none opacity-0"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-4 top-[38px] text-text-muted hover:text-text-secondary"
                tabIndex={-1}
                aria-label={showNew ? "Hide password" : "Show password"}
              >
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="relative">
              <Input
                label="Confirm new password"
                type={showConfirm ? "text" : "password"}
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 top-[38px] text-text-muted hover:text-text-secondary"
                tabIndex={-1}
                aria-label={
                  showConfirm ? "Hide password" : "Show password"
                }
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
            >
              {loading ? "Saving..." : "Reset password"}
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
