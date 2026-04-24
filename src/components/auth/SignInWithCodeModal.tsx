"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface SignInWithCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectTo?: string;
}

type Step = "email" | "otp";

export default function SignInWithCodeModal({
  isOpen,
  onClose,
  redirectTo = "/",
}: SignInWithCodeModalProps) {
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const startCooldown = useCallback(() => {
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    setResendCooldown(60);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!);
          cooldownRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const sendOtp = useCallback(async (targetEmail: string): Promise<boolean> => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Authentication is not configured");
      return false;
    }

    // shouldCreateUser: false — only sends code to existing GlucoScan users.
    // We don't surface the error to avoid leaking whether an email is registered.
    // emailRedirectTo ensures {{ .ConfirmationURL }} uses the live domain,
    // not whatever Site URL is set in Supabase dashboard.
    await supabase.auth.signInWithOtp({
      email: targetEmail,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    return true;
  }, []);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmed = email.trim();
    if (!trimmed) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    const ok = await sendOtp(trimmed);
    setLoading(false);

    if (!ok) return;

    setStep("otp");
    startCooldown();
    // Focus first OTP box after the DOM updates
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  };

  const handleVerify = useCallback(
    async (code: string) => {
      if (code.length !== 6) return;
      setError("");
      setVerifying(true);

      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setError("Authentication is not configured");
        setVerifying(false);
        return;
      }

      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code,
        type: "email",
      });

      setVerifying(false);

      if (verifyError) {
        setError("Invalid or expired code. Please try again.");
        // Clear boxes and refocus so user can re-enter
        setOtp(["", "", "", "", "", ""]);
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
        return;
      }

      // onAuthStateChange fires and updates the store automatically.
      // We just close the modal and navigate.
      handleClose();
      router.push(redirectTo);
      router.refresh();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [email, redirectTo, router]
  );

  // ── OTP box handlers ────────────────────────────────────────────────────────

  const handleOtpChange = (index: number, value: string) => {
    // Accept only the last digit typed (handles Android/iOS inserting full string)
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when the last box is filled
    if (index === 5 && digit) {
      const complete = next.every((d) => d !== "");
      if (complete) handleVerify(next.join(""));
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace") {
      if (otp[index] === "" && index > 0) {
        const next = [...otp];
        next[index - 1] = "";
        setOtp(next);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const raw = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (raw.length === 0) return;

    const next = [...otp];
    for (let i = 0; i < raw.length && i < 6; i++) {
      next[i] = raw[i];
    }
    setOtp(next);
    inputRefs.current[Math.min(raw.length, 5)]?.focus();

    if (raw.length === 6) handleVerify(raw);
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || loading) return;
    setError("");
    setOtp(["", "", "", "", "", ""]);
    setLoading(true);
    await sendOtp(email.trim());
    setLoading(false);
    startCooldown();
    setTimeout(() => inputRefs.current[0]?.focus(), 50);
  };

  const handleClose = () => {
    setStep("email");
    setEmail("");
    setOtp(["", "", "", "", "", ""]);
    setError("");
    setLoading(false);
    setVerifying(false);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = null;
    setResendCooldown(0);
    onClose();
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={step === "email" ? "Sign in with a code" : "Enter verification code"}
    >
      {step === "email" ? (
        /* ── Step 1: email entry ── */
        <form onSubmit={handleSendCode} className="space-y-4">
          <p className="text-body-sm text-text-muted">
            We&apos;ll send a 6-digit code to your email address.
          </p>

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

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              size="lg"
              fullWidth
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
            >
              {loading ? "Sending..." : "Send Code"}
            </Button>
          </div>
        </form>
      ) : (
        /* ── Step 2: OTP entry ── */
        <div className="space-y-5">
          <p className="text-body-sm text-text-muted text-center">
            We&apos;ve sent a 6-digit code to{" "}
            <span className="text-primary font-medium break-all">{email}</span>
          </p>

          {error && (
            <div className="p-3 bg-status-errorBg border border-status-error/20 rounded-button">
              <p className="text-body-sm text-status-error text-center">
                {error}
              </p>
            </div>
          )}

          {/* 6-box OTP input */}
          <div
            className="flex justify-center gap-2"
            onPaste={handlePaste}
          >
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={verifying}
                aria-label={`Digit ${index + 1}`}
                className={`w-11 h-14 text-center text-2xl font-bold rounded-button border-2 bg-surface text-text-primary transition-all focus:outline-none select-none
                  ${digit ? "border-primary text-primary" : "border-border"}
                  focus:border-primary focus:ring-2 focus:ring-primary/30
                  ${verifying ? "opacity-50 cursor-not-allowed" : ""}
                `}
              />
            ))}
          </div>

          <p className="text-caption text-text-muted text-center">
            Code expires in 10 minutes
          </p>

          {/* Resend / cooldown */}
          <div className="text-center min-h-[1.5rem]">
            {loading ? (
              <p className="text-body-sm text-text-muted">Sending a new code…</p>
            ) : resendCooldown > 0 ? (
              <p className="text-body-sm text-text-muted">
                Resend in{" "}
                <span className="text-primary font-medium">
                  {resendCooldown}s
                </span>
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="text-body-sm text-primary hover:underline focus:outline-none focus:underline"
              >
                Didn&apos;t receive code? Send again
              </button>
            )}
          </div>

          {verifying && (
            <p className="text-body-sm text-text-muted text-center animate-pulse">
              Verifying…
            </p>
          )}

          {/* Back link */}
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setOtp(["", "", "", "", "", ""]);
                setError("");
              }}
              className="text-caption text-text-muted hover:text-text-secondary focus:outline-none"
            >
              ← Use a different email
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
