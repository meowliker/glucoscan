"use client";
import React from "react";
import type { ImpactLevel } from "@/types";

interface BadgeProps {
  level: ImpactLevel;
  size?: "sm" | "md";
  children: React.ReactNode;
}

export default function Badge({ level, size = "sm", children }: BadgeProps) {
  const colors = {
    low: "bg-status-successBg text-status-success",
    moderate: "bg-status-warningBg text-status-warning",
    high: "bg-status-errorBg text-status-error",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-caption",
    md: "px-3 py-1 text-body-sm",
  };

  return (
    <span
      className={`inline-flex items-center rounded-badge font-semibold ${colors[level]} ${sizes[size]}`}
    >
      {children}
    </span>
  );
}
