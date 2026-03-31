import React from "react";
import "./ui.css";

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { values: string[]; getOptionName?: (v: string) => string };
  disabled?: boolean;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  value,
  onChange,
  options,
  disabled = false,
}) => (
  <div className="ui-select-field">
    <label className="ui-select-field__label">{label}</label>
    <select
      className="ui-select-field__select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    >
      {options.values.map((v) => (
        <option key={v} value={v}>
          {options.getOptionName ? options.getOptionName(v) : v}
        </option>
      ))}
    </select>
  </div>
);
