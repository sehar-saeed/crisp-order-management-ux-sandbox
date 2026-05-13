import React, { useRef, useEffect } from 'react';
import { Button } from '../../ui';

interface QuickFindBarProps {
  value: string;
  onValueChange: (value: string) => void;
  onToggleFilters: () => void;
  activeFilterCount: number;
  onCustomizeColumns: () => void;
  placeholder?: string;
}

export const QuickFindBar: React.FC<QuickFindBarProps> = ({
  value,
  onValueChange,
  onToggleFilters,
  activeFilterCount,
  onCustomizeColumns,
  placeholder = 'Search orders, PO numbers, retailers, suppliers...',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="ob-search-row">
      <label className="ob-search-row__label" htmlFor="orders-unified-search">
        Search
      </label>
      <input
        ref={inputRef}
        id="orders-unified-search"
        className="ob-search-row__input"
        type="search"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={placeholder}
      />
      <div className="ob-search-row__actions">
        <Button variant="secondary" onClick={onToggleFilters}>
          Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
        </Button>
        <Button variant="secondary" onClick={onCustomizeColumns}>
          Customize Columns
        </Button>
      </div>
    </div>
  );
};
