import React, { useState, useRef, useEffect } from "react";
import "./ui.css";

interface DatepickerButtonProps {
  label: string;
  selected: { from: Date | undefined; to: Date | undefined };
  onSelect: (range: { from: Date | undefined; to: Date | undefined }) => void;
  mode?: "range";
  dateFormat?: string;
  showWeekNumber?: boolean;
  lastAvailableDate?: Date;
  btnStyle?: string;
}

function formatDate(d: Date | undefined): string {
  if (!d) return "—";
  return d.toLocaleDateString();
}

function toInputValue(d: Date | undefined): string {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

export const DatepickerButton: React.FC<DatepickerButtonProps> = ({
  label,
  selected,
  onSelect,
  lastAvailableDate,
  btnStyle,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const rangeText =
    selected.from || selected.to
      ? `${formatDate(selected.from)} – ${formatDate(selected.to)}`
      : label;

  const maxDate = lastAvailableDate ? toInputValue(lastAvailableDate) : undefined;

  return (
    <div style={{ position: "relative", display: "inline-block" }} ref={ref}>
      <button
        className={`ui-datepicker-btn${btnStyle ? ` ${btnStyle}` : ""}`}
        onClick={() => setOpen(!open)}
      >
        <span className="ui-datepicker-btn__icon">📅</span>
        <span>{rangeText}</span>
      </button>

      {open && (
        <div className="ui-datepicker-dropdown">
          <label>
            From
            <input
              type="date"
              value={toInputValue(selected.from)}
              max={maxDate}
              onChange={(e) =>
                onSelect({
                  from: e.target.value ? new Date(e.target.value + "T00:00:00") : undefined,
                  to: selected.to,
                })
              }
            />
          </label>
          <label>
            To
            <input
              type="date"
              value={toInputValue(selected.to)}
              max={maxDate}
              onChange={(e) =>
                onSelect({
                  from: selected.from,
                  to: e.target.value ? new Date(e.target.value + "T00:00:00") : undefined,
                })
              }
            />
          </label>
        </div>
      )}
    </div>
  );
};
