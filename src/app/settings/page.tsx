"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  Trash2,
  Info,
  Shield,
  FileText,
  LogOut,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Disclaimer from "@/components/ui/Disclaimer";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store/useAppStore";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { APP_NAME, APP_VERSION, APP_DESCRIPTION } from "@/constants/strings";
import type { BloodSugarUnit } from "@/types";

export default function SettingsPage() {
  const router = useRouter();
  const {
    loadSettings,
    setBloodSugarUnit,
    clearHistory,
    bloodSugarUnit,
  } = useAppStore();
  const { user, signOut } = useAuthStore();

  const [showClearModal, setShowClearModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await signOut();
    router.push("/auth/login");
  };

  const handleChangePassword = async () => {
    setPasswordError("");

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    setPasswordLoading(true);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setPasswordError("Not connected");
      setPasswordLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setPasswordLoading(false);

    if (error) {
      setPasswordError(error.message);
    } else {
      setPasswordSuccess(true);
      setNewPassword("");
      setConfirmNewPassword("");
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess(false);
      }, 1500);
    }
  };

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleUnitChange = (unit: BloodSugarUnit) => {
    setBloodSugarUnit(unit);
  };

  const handleClearHistory = () => {
    clearHistory();
    setShowClearModal(false);
  };

  const units: { value: BloodSugarUnit; label: string }[] = [
    { value: "mg/dL", label: "mg/dL" },
    { value: "mmol/L", label: "mmol/L" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-lg mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={24} className="text-text-primary" />
          </button>
          <h1 className="text-h2 text-text-primary font-bold">Settings</h1>
        </div>

        {/* Units Section */}
        <Card className="mb-4">
          <h2 className="text-body-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">
            Units
          </h2>
          <div>
            <p className="text-body-sm text-text-primary font-medium mb-2">
              Blood Sugar Unit
            </p>
            <div className="flex gap-2">
              {units.map((unit) => (
                <button
                  key={unit.value}
                  onClick={() => handleUnitChange(unit.value)}
                  className={`flex-1 py-2.5 px-4 rounded-button text-body-sm font-semibold transition-colors ${
                    bloodSugarUnit === unit.value
                      ? "bg-primary text-white"
                      : "bg-surface text-text-secondary border border-border hover:bg-gray-50"
                  }`}
                >
                  {unit.label}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Data Management Section */}
        <Card className="mb-4">
          <h2 className="text-body-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">
            Data Management
          </h2>
          <Button
            variant="outline"
            size="md"
            fullWidth
            onClick={() => setShowClearModal(true)}
            className="border-status-error text-status-error hover:bg-status-error/5"
          >
            <Trash2 size={16} className="mr-2" />
            Clear Scan History
          </Button>
        </Card>

        {/* About Section */}
        <Card className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Info size={18} className="text-primary" />
            <h2 className="text-body-sm font-semibold text-text-secondary uppercase tracking-wider">
              About
            </h2>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-body-sm text-text-secondary">App Name</span>
              <span className="text-body-sm text-text-primary font-medium">
                {APP_NAME}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-body-sm text-text-secondary">Version</span>
              <span className="text-body-sm text-text-primary font-medium">
                {APP_VERSION}
              </span>
            </div>
            <p className="text-caption text-text-muted pt-1">
              {APP_DESCRIPTION}
            </p>
          </div>
        </Card>

        {/* Legal Section */}
        <Card className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={18} className="text-primary" />
            <h2 className="text-body-sm font-semibold text-text-secondary uppercase tracking-wider">
              Legal
            </h2>
          </div>
          <div className="divide-y divide-border">
            <Link
              href="/privacy"
              className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-4 px-4 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Shield size={18} className="text-text-secondary" />
                <span className="text-body-sm text-text-primary font-medium">
                  Privacy Policy
                </span>
              </div>
              <ChevronRight size={18} className="text-text-muted" />
            </Link>
            <Link
              href="/terms"
              className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-4 px-4 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-text-secondary" />
                <span className="text-body-sm text-text-primary font-medium">
                  Terms of Service
                </span>
              </div>
              <ChevronRight size={18} className="text-text-muted" />
            </Link>
          </div>
        </Card>

        {/* Account */}
        <Card className="mb-4">
          <h3 className="text-label uppercase text-text-secondary mb-3">
            Account
          </h3>
          {user && (
            <p className="text-body-sm text-text-primary mb-3">
              {user.email}
            </p>
          )}
          <div className="flex flex-col gap-3">
            <Button
              variant="outline"
              fullWidth
              onClick={() => {
                setShowPasswordModal(true);
                setPasswordError("");
                setPasswordSuccess(false);
                setNewPassword("");
                setConfirmNewPassword("");
              }}
            >
              <Lock size={18} className="mr-2" />
              Change Password
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={handleLogout}
              loading={loggingOut}
            >
              <LogOut size={18} className="mr-2" />
              {loggingOut ? "Signing out..." : "Sign Out"}
            </Button>
          </div>
        </Card>

        {/* Disclaimer */}
        <Disclaimer />

        {/* Change Password Modal */}
        <Modal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          title="Change Password"
        >
          {passwordSuccess ? (
            <div className="flex flex-col items-center py-4">
              <CheckCircle size={48} className="text-status-success mb-3" />
              <p className="text-body-sm text-text-primary font-semibold">
                Password updated
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {passwordError && (
                <div className="p-3 bg-status-errorBg border border-status-error/20 rounded-button">
                  <p className="text-body-sm text-status-error">
                    {passwordError}
                  </p>
                </div>
              )}
              <div className="relative">
                <Input
                  label="New Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-[38px] text-text-muted"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <Input
                label="Confirm New Password"
                type={showPassword ? "text" : "password"}
                placeholder="Re-enter password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
              />
              <Button
                variant="primary"
                fullWidth
                loading={passwordLoading}
                onClick={handleChangePassword}
              >
                {passwordLoading ? "Updating..." : "Update Password"}
              </Button>
            </div>
          )}
        </Modal>

        {/* Clear History Confirmation Modal */}
        <Modal
          isOpen={showClearModal}
          onClose={() => setShowClearModal(false)}
          title="Clear Scan History"
        >
          <p className="text-body-sm text-text-secondary mb-6">
            Are you sure? This will permanently delete all scan history. This
            action cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              size="md"
              fullWidth
              onClick={() => setShowClearModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              fullWidth
              onClick={handleClearHistory}
            >
              Delete All
            </Button>
          </div>
        </Modal>
      </div>
    </div>
  );
}
