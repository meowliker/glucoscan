"use client";
import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export default function Input({
  label,
  error,
  helperText,
  className = "",
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-label uppercase text-text-secondary mb-1.5"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full h-12 px-4 rounded-button border ${
          error ? "border-status-error" : "border-border"
        } bg-surface text-text-primary text-body-lg placeholder:text-text-muted focus:outline-none focus:ring-2 ${
          error ? "focus:ring-status-error" : "focus:ring-primary"
        } focus:border-transparent transition-all ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-caption text-status-error">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-caption text-text-muted">{helperText}</p>
      )}
    </div>
  );
}
