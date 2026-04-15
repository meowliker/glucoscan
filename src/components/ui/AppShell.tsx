"use client";
import React from "react";
import AuthGuard from "./AuthGuard";
import BottomNav from "./BottomNav";
import DataSync from "./DataSync";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <DataSync />
      <main className="min-h-screen pb-20">{children}</main>
      <BottomNav />
    </AuthGuard>
  );
}
