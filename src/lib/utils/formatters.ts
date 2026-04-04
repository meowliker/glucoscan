import type { ImpactLevel } from "@/types";

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTime(timestamp: number): string {
  return `${formatDate(timestamp)} at ${formatTime(timestamp)}`;
}

export function isToday(timestamp: number): boolean {
  const today = new Date();
  const date = new Date(timestamp);
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

export function isThisWeek(timestamp: number): boolean {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return timestamp >= weekAgo.getTime();
}

export function getImpactColor(level: ImpactLevel): string {
  switch (level) {
    case "low":
      return "#43A047";
    case "moderate":
      return "#F4A543";
    case "high":
      return "#E53935";
  }
}

export function getImpactBgColor(level: ImpactLevel): string {
  switch (level) {
    case "low":
      return "#F0FFF4";
    case "moderate":
      return "#FFFBEB";
    case "high":
      return "#FFF5F5";
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}
