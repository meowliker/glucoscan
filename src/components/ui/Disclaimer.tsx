"use client";
import React from "react";
import { Info } from "lucide-react";
import { RESULT_DISCLAIMER } from "@/constants/strings";

interface DisclaimerProps {
  text?: string;
  className?: string;
}

export default function Disclaimer({ text, className = "" }: DisclaimerProps) {
  return (
    <div
      className={`flex items-start gap-2 p-3 bg-gray-50 rounded-button border border-border ${className}`}
    >
      <Info size={16} className="text-text-muted mt-0.5 flex-shrink-0" />
      <p className="text-caption text-text-muted leading-relaxed">
        {text || RESULT_DISCLAIMER}
      </p>
    </div>
  );
}
