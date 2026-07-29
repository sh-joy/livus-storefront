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
}: InputFieldProps) {
  const [focused, setFocused] = useState(false);

  const isDark = variant === "dark";
  const hasValue = value.length > 0;

  // Border: dark when active or complete, gray when default
  const borderColor = focused || hasValue
    ? isDark ? "#ffffff" : "var(--ink)"
    : isDark ? "#404040" : "var(--border-mid)";

  // Text color when typing
  const textColor = isDark ? "#ffffff" : "var(--ink)";

  // Placeholder color
  const placeholderClass = isDark ? "placeholder-gray" : "placeholder-muted";

  return (
    <div
      className={`relative w-full ${className}`}
      style={{
        borderBottom: `1px solid ${borderColor}`,
        transition: "border-color 0.2s ease",
        ...style,
      }}
    >
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={label}
        autoComplete={autoComplete}
        data-variant={variant}
        className={`livus-input ${placeholderClass}`}
        style={{
          display: "block",
          width: "100%",
          padding: "12px 0",
          fontSize: "17px",
          lineHeight: "24px",
          color: textColor,
          fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
          letterSpacing: "0.17px",
          fontWeight: 400,
        }}
      />
    </div>
  );
}
