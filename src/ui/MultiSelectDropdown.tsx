import React, { useState, useRef, useEffect } from "react";
import "./ui.css";

interface MultiSelectOption {
  label: string;
  value: string;
}

interface MultiSelectDropdownProps {
  label: string;
  options: MultiSelectOption[] | string[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
  features?: { search?: boolean; clear?: boolean; selectAll?: boolean };
}

function normalizeOptions(options: MultiSelectOption[] | string[]): MultiSelectOption[] {
  return options.map((o) =>
    typeof o === "string" ? { label: o, value: o } : o,
  );
}

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  label,
  options: rawOptions,
  selectedValues,
  onChange,
  disabled = false,
  features = {},
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const options = normalizeOptions(rawOptions);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const toggle = (value: string) => {
    onChange(
      selectedValues.includes(value)
        ? selectedValues.filter((v) => v !== value)
        : [...selectedValues, value],
    );
  };

  return (
    <div className="ui-multi-select" ref={ref}>
      <button
        className="ui-multi-select__trigger"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
      >
        <span>{label}</span>
        {selectedValues.length > 0 && (
          <span className="ui-multi-select__badge">{selectedValues.length}</span>
        )}
        <span style={{ fontSize: 10, marginLeft: "auto" }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="ui-multi-select__dropdown">
          {features.search && (
            <input
              className="ui-multi-select__search"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          )}

          {(features.selectAll || features.clear) && (
            <div className="ui-multi-select__actions">
              {features.selectAll && (
                <button
                  className="ui-multi-select__action-btn"
                  onClick={() => onChange(options.map((o) => o.value))}
                >
                  Select all
                </button>
              )}
              {features.clear && (
                <button
                  className="ui-multi-select__action-btn"
                  onClick={() => onChange([])}
                >
                  Clear
                </button>
              )}
            </div>
          )}

          {filtered.map((o) => (
            <label key={o.value} className="ui-multi-select__option">
              <input
                type="checkbox"
                checked={selectedValues.includes(o.value)}
                onChange={() => toggle(o.value)}
              />
              {o.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};
