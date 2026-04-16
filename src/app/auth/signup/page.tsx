"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  useEffect(() => {
    // Signup is disabled — users are created via Shopify webhook
    router.replace("/auth/login");
  }, [router]);

  return null;
}
