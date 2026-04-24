"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Droplets, ShieldCheck, AlertCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ResetLandingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Missing params — link was malformed
  if (!token || !email) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm text-center space-y-4">
          <AlertCircle size={40} className="text-status-error mx-auto" />
          <h1 className="text-h2 text-text-primary">Invalid link</h1>
          <p className="text-body-sm text-text-muted">
            This reset link is missing required information. Please request a
            new one.
          </p>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => router.push("/auth/login")}
          >
            Back to sign in
          </Button>
        </div>
      </div>
    );
  }

  const handleVerify = async () => {
    setError("");
    setLoading(true);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Authentication is not configured");
      setLoading(false);
      return;
    }

    // verifyOtp is called here — on the client, only when the user clicks.
    // Gmail's scanner loads the page HTML but never executes JavaScript,
    // so the token is never consumed by the pre-fetch.
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "recovery",
    });

    setLoading(false);

    if (verifyError) {
      setError(
        "This reset link has expired or already been used. Please request a new one."
      );
      return;
    }

    // Session is now set — send to the password form
    router.push("/auth/reset-password");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Droplets size={32} className="text-primary" />
          </div>
          <h1 className="text-h1 text-text-primary">GlucoScan</h1>
          <p className="text-body-sm text-text-muted mt-1">Password reset</p>
        </div>

        {/* Card */}
        <div className="bg-surface rounded-card shadow-card p-6 space-y-5">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <ShieldCheck size={24} className="text-primary" />
            </div>
            <div>
              <p className="text-body-lg font-semibold text-text-primary">
                Ready to reset your password
              </p>
              <p className="text-body-sm text-text-muted mt-1">
                Click the button below to verify your identity and set a new
                password for{" "}
                <span className="text-primary font-medium break-all">
                  {email}
                </span>
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-status-errorBg border border-status-error/20 rounded-button">
              <p className="text-body-sm text-status-error text-center">
                {error}
              </p>
            </div>
          )}

          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            onClick={handleVerify}
          >
            {loading ? "Verifying…" : "Set new password →"}
          </Button>
        </div>

        <p className="text-center mt-6">
          <button
            type="button"
            onClick={() => router.push("/auth/login")}
            className="text-body-sm text-text-muted hover:text-text-secondary"
          >
            Back to sign in
          </button>
        </p>
      </div>
    </div>
  );
}
