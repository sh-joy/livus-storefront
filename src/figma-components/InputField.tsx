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

  const borderColor = error
    ? "#d4183d"
    : isDark
    ? (focused ? "#ffffff" : "rgba(255, 255, 255, 0.25)")
    : (focused ? "#000000" : "rgba(0, 0, 0, 0.25)");

  const textColor = isDark ? "#ffffff" : "#0d0d0d";
  const placeholderClass = isDark ? "placeholder-gray" : "placeholder-muted";

  return (
    <div className={`relative w-full ${className}`} style={{ ...style }}>
      <div
        style={{
          borderBottom: `1px solid ${borderColor}`,
          transition: "border-color 0.2s ease",
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
            padding: "10px 0",
            fontSize: "17px",
            lineHeight: "24px",
            color: isDark ? "#ffffff" : "#0d0d0d",
            fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
            letterSpacing: "0.17px",
            fontWeight: 400,
          }}
        />
      </div>
      {error && (
        <p
          style={{
            fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
            fontSize: "13px",
            lineHeight: "18px",
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
