"use client";
import React from "react";
import type { ImpactLevel } from "@/types";

interface TrafficLightProps {
  level: ImpactLevel;
  score: number;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}

export default function TrafficLight({
  level,
  score,
  size = "lg",
  animated = true,
}: TrafficLightProps) {
  const colors = {
    low: {
      ring: "border-impact-low",
      bg: "bg-status-successBg",
      text: "text-impact-low",
      glow: "shadow-[0_0_30px_rgba(67,160,71,0.3)]",
    },
    moderate: {
      ring: "border-impact-moderate",
      bg: "bg-status-warningBg",
      text: "text-impact-moderate",
      glow: "shadow-[0_0_30px_rgba(244,165,67,0.3)]",
    },
    high: {
      ring: "border-impact-high",
      bg: "bg-status-errorBg",
      text: "text-impact-high",
      glow: "shadow-[0_0_30px_rgba(229,57,53,0.3)]",
    },
  };

  const sizes = {
    sm: { container: "w-16 h-16", text: "text-lg", border: "border-3" },
    md: { container: "w-24 h-24", text: "text-2xl", border: "border-4" },
    lg: { container: "w-36 h-36", text: "text-4xl", border: "border-[6px]" },
  };

  const style = colors[level];
  const sizeStyle = sizes[size];

  return (
    <div
      className={`${sizeStyle.container} rounded-full ${style.bg} ${style.ring} ${sizeStyle.border} ${style.glow} flex flex-col items-center justify-center ${
        animated ? "animate-pulse-slow" : ""
      }`}
    >
      <span className={`${sizeStyle.text} font-bold ${style.text}`}>
        {score.toFixed(1)}
      </span>
      <span className={`text-caption ${style.text} font-medium`}>/ 10</span>
    </div>
  );
}
