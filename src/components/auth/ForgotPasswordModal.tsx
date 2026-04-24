"use client";

import React, { useState } from "react";
import { Mail, CheckCircle2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ForgotPasswordModal({
  isOpen,
  onClose,
}: ForgotPasswordModalProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

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
        // redirectTo is required by Supabase but we don't use
        // {{ .ConfirmationURL }} in our email template — the template links
        // directly to /auth/reset-landing with {{ .Token }} and {{ .Email }},
        // so Gmail's scanner can never pre-fetch the Supabase verify endpoint.
        redirectTo: `${window.location.origin}/auth/reset-landing`,
      }
    );
    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSent(true);
  };

  const handleClose = () => {
    setEmail("");
    setSent(false);
    setError("");
    setLoading(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={sent ? "Check your email" : "Reset your password"}
    >
      {sent ? (
        <div className="space-y-5">
          <div className="flex items-start gap-3 p-3 bg-primary/10 border border-primary/20 rounded-button">
            <CheckCircle2
              size={18}
              className="text-primary mt-0.5 flex-shrink-0"
            />
            <p className="text-body-sm text-text-primary">
              If an account exists for <strong>{email}</strong>, we&apos;ve
              sent a password reset link. Check your inbox (and spam folder)
              within the next few minutes.
            </p>
          </div>
          <Button variant="primary" size="lg" fullWidth onClick={handleClose}>
            Got it
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-body-sm text-text-muted">
            Enter the email associated with your account and we&apos;ll send
            you a link to set a new password.
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
              {loading ? "Sending..." : "Send link"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
