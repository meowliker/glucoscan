"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Droplets, Mail, Eye, EyeOff, CheckCircle, User } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useAuthStore } from "@/lib/store/useAuthStore";

export default function SignupPage() {
  const router = useRouter();
  const { signUp, signIn } = useAuthStore();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    const result = await signUp(email.trim(), password, fullName.trim());
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    // Auto sign-in after signup (if email confirmation disabled in Supabase)
    const signInResult = await signIn(email.trim(), password);
    if (!signInResult.error) {
      router.push("/onboarding");
      return;
    }

    // If auto sign-in failed, show confirmation message
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-full bg-status-successBg flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-status-success" />
          </div>
          <h1 className="text-h2 text-text-primary mb-2">Check your email</h1>
          <p className="text-body-sm text-text-secondary mb-6">
            We&apos;ve sent a confirmation link to <strong>{email}</strong>.
            Click the link to activate your account.
          </p>
          <Button
            variant="primary"
            fullWidth
            onClick={() => router.push("/auth/login")}
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Droplets size={32} className="text-primary" />
          </div>
          <h1 className="text-h1 text-text-primary">Create Account</h1>
          <p className="text-body-sm text-text-muted mt-1">
            Sign up to start using GlucoScan
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
              label="Full Name"
              type="text"
              placeholder="Your name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <User
              size={18}
              className="absolute right-4 top-[38px] text-text-muted pointer-events-none"
            />
          </div>

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
              placeholder="Min 6 characters"
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

          <Input
            label="Confirm Password"
            type={showPassword ? "text" : "password"}
            placeholder="Re-enter password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
          >
            {loading ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        {/* Login link */}
        <p className="text-center text-body-sm text-text-muted mt-6">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="text-primary font-semibold hover:underline"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
