"use client";
import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { isPublicRoute } from "@/lib/auth/routes";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const configured = useAuthStore((s) => s.configured);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    useAuthStore.getState().initialize();
  }, []);

  // Still loading auth state
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 size={32} className="text-primary animate-spin mb-4" />
        <p className="text-body-sm text-text-muted">Loading...</p>
      </div>
    );
  }

  // Supabase not configured — show setup message
  if (!configured) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
        <div className="max-w-md text-center">
          <h1 className="text-h2 text-text-primary mb-4">Setup Required</h1>
          <p className="text-body-sm text-text-secondary mb-6">
            GlucoScan needs Supabase to be configured. Add your Supabase URL and
            anon key to <code className="bg-gray-100 px-1.5 py-0.5 rounded text-primary text-caption">.env.local</code>:
          </p>
          <div className="bg-gray-900 text-green-400 rounded-card p-4 text-left text-caption font-mono mb-6">
            <p>NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co</p>
            <p>NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...</p>
          </div>
          <p className="text-caption text-text-muted">
            Get these from{" "}
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              supabase.com/dashboard
            </a>{" "}
            → Project Settings → API
          </p>
        </div>
      </div>
    );
  }

  // Public routes — always accessible
  if (isPublicRoute(pathname)) {
    return <>{children}</>;
  }

  // Not authenticated — redirect to login
  if (!user) {
    router.replace("/auth/login");
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 size={32} className="text-primary animate-spin mb-4" />
        <p className="text-body-sm text-text-muted">Redirecting to login...</p>
      </div>
    );
  }

  // Authenticated — render page
  return <>{children}</>;
}
