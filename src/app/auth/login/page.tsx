"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Droplets, Mail, Eye, EyeOff } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useAuthStore } from "@/lib/store/useAuthStore";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const { signIn } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password");
      return;
    }

    setLoading(true);
    const result = await signIn(email.trim(), password);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      router.push(redirect);
    }
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
          <p className="text-body-sm text-text-muted mt-1">
            Sign in to continue
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
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
            />
            <Mail
              size={18}
              className="absolute right-4 top-[38px] text-text-muted pointer-events-none"
            />
          </div>

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
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
            {loading ? "Signing in..." : "Sign In"}
          </Button>

          {/* Forgot password */}
          <div className="text-right">
            <Link
              href="/auth/forgot-password"
              className="text-body-sm text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </form>

        {/* Info text */}
        <p className="text-center text-body-sm text-text-muted mt-6">
          Access is provided with your purchase. Check your email for login credentials.
        </p>

        {/* Legal links */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <Link
            href="/privacy"
            className="text-caption text-text-muted hover:text-text-secondary"
          >
            Privacy Policy
          </Link>
          <span className="text-text-muted">·</span>
          <Link
            href="/terms"
            className="text-caption text-text-muted hover:text-text-secondary"
          >
            Terms of Service
          </Link>
        </div>
      </div>
    </div>
  );
}
