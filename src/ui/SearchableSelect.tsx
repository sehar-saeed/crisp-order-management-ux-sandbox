import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import './ui.css';

export interface SearchableOption {
  id: string;
  label: string;
  secondary?: string;
  group?: string;
}

interface SearchableSelectProps {
  value: string;
  onChange: (id: string) => void;
  options: SearchableOption[];
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  emptyMessage?: string;
  /** Compact mode for inline-table usage (no label, smaller padding) */
  compact?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = '— Select —',
  disabled = false,
  label,
  emptyMessage = 'No results found',
  compact = false,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightIdx, setHighlightIdx] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(
    () => options.find((o) => o.id === value),
    [options, value],
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.secondary && o.secondary.toLowerCase().includes(q)),
    );
  }, [options, query]);

  const grouped = useMemo(() => {
    const hasGroups = filtered.some((o) => o.group);
    if (!hasGroups) return null;
    const map = new Map<string, SearchableOption[]>();
    for (const o of filtered) {
      const g = o.group || '';
      const arr = map.get(g) ?? [];
      arr.push(o);
      map.set(g, arr);
    }
    return map;
  }, [filtered]);

  const flatList = useMemo(() => {
    if (!grouped) return filtered;
    const flat: SearchableOption[] = [];
    for (const items of grouped.values()) {
      flat.push(...items);
    }
    return flat;
  }, [grouped, filtered]);

  const openDropdown = useCallback(() => {
    if (disabled) return;
    setOpen(true);
    setQuery('');
    setHighlightIdx(0);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [disabled]);

  const closeDropdown = useCallback(() => {
    setOpen(false);
    setQuery('');
  }, []);

  const selectOption = useCallback(
    (id: string) => {
      onChange(id);
      closeDropdown();
    },
    [onChange, closeDropdown],
  );

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeDropdown();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, closeDropdown]);

  useEffect(() => {
    setHighlightIdx(0);
  }, [query]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector('[data-highlighted="true"]');
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [highlightIdx, open]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault();
          openDropdown();
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightIdx((prev) => Math.min(prev + 1, flatList.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightIdx((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (flatList[highlightIdx]) {
            selectOption(flatList[highlightIdx].id);
          }
          break;
        case 'Escape':
          e.preventDefault();
          closeDropdown();
          break;
      }
    },
    [open, flatList, highlightIdx, openDropdown, selectOption, closeDropdown],
  );

  const triggerCls = [
    'ss-trigger',
    compact && 'ss-trigger--compact',
    disabled && 'ss-trigger--disabled',
    open && 'ss-trigger--open',
    !value && 'ss-trigger--placeholder',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={`ss-container${compact ? ' ss-container--compact' : ''}`}
      ref={containerRef}
      onKeyDown={handleKeyDown}
    >
      {label && !compact && (
        <label className="ss-label">{label}</label>
      )}
      <button
        type="button"
        className={triggerCls}
        onClick={() => (open ? closeDropdown() : openDropdown())}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="ss-trigger__text">
          {selected ? selected.label : placeholder}
        </span>
        <span className="ss-trigger__arrow">{open ? '\u25B2' : '\u25BC'}</span>
      </button>

      {open && (
        <div className="ss-dropdown">
          <div className="ss-dropdown__search-wrap">
            <input
              ref={inputRef}
              className="ss-dropdown__search"
              type="text"
              placeholder="Search\u2026"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="ss-dropdown__list" ref={listRef} role="listbox">
            {flatList.length === 0 && (
              <div className="ss-dropdown__empty">{emptyMessage}</div>
            )}
            {grouped
              ? Array.from(grouped.entries()).map(([group, items]) => (
                  <div key={group}>
                    {group && <div className="ss-dropdown__group">{group}</div>}
                    {items.map((opt) => {
                      const idx = flatList.indexOf(opt);
                      return (
                        <OptionRow
                          key={opt.id}
                          option={opt}
                          highlighted={idx === highlightIdx}
                          selected={opt.id === value}
                          onSelect={selectOption}
                          onHover={() => setHighlightIdx(idx)}
                        />
                      );
                    })}
                  </div>
                ))
              : flatList.map((opt, idx) => (
                  <OptionRow
                    key={opt.id}
                    option={opt}
                    highlighted={idx === highlightIdx}
                    selected={opt.id === value}
                    onSelect={selectOption}
                    onHover={() => setHighlightIdx(idx)}
                  />
                ))}
          </div>
        </div>
      )}
    </div>
  );
};

const OptionRow: React.FC<{
  option: SearchableOption;
  highlighted: boolean;
  selected: boolean;
  onSelect: (id: string) => void;
  onHover: () => void;
}> = ({ option, highlighted, selected, onSelect, onHover }) => (
  <div
    className={[
      'ss-option',
      highlighted && 'ss-option--highlighted',
      selected && 'ss-option--selected',
    ]
      .filter(Boolean)
      .join(' ')}
    role="option"
    aria-selected={selected}
    data-highlighted={highlighted}
    onClick={() => onSelect(option.id)}
    onMouseEnter={onHover}
  >
    <span className="ss-option__label">{option.label}</span>
    {option.secondary && (
      <span className="ss-option__secondary">{option.secondary}</span>
    )}
  </div>
);
