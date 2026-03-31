import React from "react";
import "./ui.css";

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  type?: string;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  error?: string;
}

export const TextField: React.FC<TextFieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
  className,
  type = "text",
  onKeyDown,
  error,
}) => (
  <div className={`ui-text-field${className ? ` ${className}` : ""}`}>
    <label className="ui-text-field__label">{label}</label>
    <input
      className={`ui-text-field__input${error ? " ui-text-field__input--error" : ""}`}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      onKeyDown={onKeyDown}
    />
    {error && <p className="ui-text-field__error">{error}</p>}
  </div>
);
