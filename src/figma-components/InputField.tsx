'use client';

import { useState } from "react";
import type { CSSProperties } from "react";

export type InputVariant = "light" | "dark";

interface InputFieldProps {
  label: string;
  type?: "text" | "email" | "password" | "tel" | "search";
  value: string;
  onChange: (v: string) => void;
  variant?: InputVariant;
  className?: string;
  style?: CSSProperties;
  autoComplete?: string;
  error?: string;
}

export function InputField({
  label,
  type = "text",
  value,
  onChange,
  variant = "light",
  className = "",
  style,
  autoComplete,
  error,
}: InputFieldProps) {
  const [focused, setFocused] = useState(false);

  const isDark = variant === "dark";
  const hasValue = Boolean(value && String(value).trim().length > 0);
  const isFloating = focused || hasValue;

  const activeColor = isDark ? "#ffffff" : "#0d0d0d";
  const mutedColor = isDark ? "rgba(255, 255, 255, 0.45)" : "#808080";

  const lineBorderColor = error
    ? "#d4183d"
    : isDark
    ? (focused ? "#ffffff" : "rgba(255, 255, 255, 0.25)")
    : (focused ? "#000000" : "rgba(0, 0, 0, 0.2)");

  return (
    <div
      className={`relative w-full pt-4 font-sans ${className}`}
      style={{
        boxSizing: "border-box",
        ...style,
      }}
    >
      {/* Animated Floating Label */}
      <label
        className="absolute left-0 pointer-events-none transition-all duration-200 ease-out origin-top-left select-none"
        style={{
          top: isFloating ? "0px" : "18px",
          transform: isFloating ? "scale(0.82)" : "scale(1)",
          color: error ? "#d4183d" : isFloating ? activeColor : mutedColor,
          fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
          fontSize: "16px",
          lineHeight: "22px",
          fontWeight: isFloating ? 500 : 400,
          letterSpacing: "0.17px",
        }}
      >
        {label}
      </label>

      {/* Single Bottom Border Input Line */}
      <div
        style={{
          borderBottom: `1px solid ${lineBorderColor}`,
          transition: "border-color 0.2s ease",
          background: "transparent",
        }}
      >
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoComplete={autoComplete}
          style={{
            display: "block",
            width: "100%",
            padding: "8px 0 6px 0",
            fontSize: "16px",
            lineHeight: "22px",
            color: activeColor,
            fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
            letterSpacing: "0.17px",
            fontWeight: 400,
            background: "transparent",
            border: "none",
            outline: "none",
            boxShadow: "none",
            WebkitAppearance: "none",
          }}
        />
      </div>

      {/* Error Feedback Message */}
      {error && (
        <p
          style={{
            fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
            fontSize: "12px",
            lineHeight: "16px",
            color: "#d4183d",
            marginTop: "4px",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
