"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Droplets,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Step = "email" | "code";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Please enter your email");
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Authentication is not configured");
      return;
    }

    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      trimmedEmail,
      {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      }
    );
    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setInfo(
      "We sent a 6-digit code to your email. Enter it below along with a new password."
    );
    setStep("code");
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedCode = code.trim();
    if (!trimmedCode) {
      setError("Please enter the code from your email");
      return;
    }
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

    // Step 1: verify the OTP — this creates a recovery session if valid
    const { error: otpError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: trimmedCode,
      type: "recovery",
    });

    if (otpError) {
      setLoading(false);
      setError(
        otpError.message.includes("expired") ||
          otpError.message.includes("invalid")
          ? "That code is invalid or expired. Request a new one."
          : otpError.message
      );
      return;
    }

    // Step 2: update the password on the now-authenticated session
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    // User is signed in with the new password — send them to the app
    router.push("/");
    router.refresh();
  };

  const backToEmail = () => {
    setStep("email");
    setCode("");
    setNewPassword("");
    setError("");
    setInfo("");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Droplets size={32} className="text-primary" />
          </div>
          <h1 className="text-h1 text-text-primary">Reset password</h1>
          <p className="text-body-sm text-text-muted mt-1 text-center">
            {step === "email"
              ? "Enter your email and we'll send you a code."
              : "Enter the code from your email and a new password."}
          </p>
        </div>

        {step === "email" ? (
          <form onSubmit={handleRequestCode} className="space-y-4">
            {error && (
              <div className="p-3 bg-status-errorBg border border-status-error/20 rounded-button">
                <p className="text-body-sm text-status-error">{error}</p>
              </div>
            )}

            <div className="relative">
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
              <Mail
                size={18}
                className="absolute right-4 top-[38px] text-text-muted pointer-events-none"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
            >
              {loading ? "Sending..." : "Send code"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {info && (
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-button flex items-start gap-2">
                <CheckCircle2
                  size={16}
                  className="text-primary mt-0.5 flex-shrink-0"
                />
                <p className="text-body-sm text-text-primary">{info}</p>
              </div>
            )}
            {error && (
              <div className="p-3 bg-status-errorBg border border-status-error/20 rounded-button">
                <p className="text-body-sm text-status-error">{error}</p>
              </div>
            )}

            <div className="relative">
              <Input
                label="Reset code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="6-digit code"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                required
                autoFocus
              />
              <KeyRound
                size={18}
                className="absolute right-4 top-[38px] text-text-muted pointer-events-none"
              />
            </div>

            <div className="relative">
              <Input
                label="New password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
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
              {loading ? "Resetting..." : "Reset password"}
            </Button>

            <button
              type="button"
              onClick={backToEmail}
              className="w-full text-center text-body-sm text-text-muted hover:text-text-secondary mt-2"
            >
              Didn&apos;t get a code? Try a different email
            </button>
          </form>
        )}

        <Link
          href="/auth/login"
          className="flex items-center justify-center gap-1.5 mt-8 text-body-sm text-text-muted hover:text-text-secondary"
        >
          <ArrowLeft size={14} />
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
