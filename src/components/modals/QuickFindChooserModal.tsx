import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Modal, Button } from '../../ui';
import type { OrderBrowseRow, QuickFindMode } from '../../types/order';

interface QuickFindChooserModalProps {
  results: OrderBrowseRow[];
  searchTerm: string;
  searchMode: QuickFindMode;
  onSelect: (order: OrderBrowseRow) => void;
  onClose: () => void;
}

const MODE_LABELS: Record<QuickFindMode, string> = {
  startsWith: 'starts with',
  contains: 'contains',
  endsWith: 'ends with',
};

function formatCurrency(amount: number): string {
  return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function highlightMatch(text: string, term: string, mode: QuickFindMode): React.ReactNode {
  if (!term) return text;

  const lower = text.toLowerCase();
  const lowerTerm = term.toLowerCase();
  let startIdx = -1;

  switch (mode) {
    case 'startsWith':
      if (lower.startsWith(lowerTerm)) startIdx = 0;
      break;
    case 'endsWith':
      if (lower.endsWith(lowerTerm)) startIdx = text.length - term.length;
      break;
    case 'contains':
      startIdx = lower.indexOf(lowerTerm);
      break;
  }

  if (startIdx === -1) return text;

  const before = text.slice(0, startIdx);
  const match = text.slice(startIdx, startIdx + term.length);
  const after = text.slice(startIdx + term.length);

  return (
    <>
      {before}
      <mark className="ob-chooser-highlight">{match}</mark>
      {after}
    </>
  );
}

export const QuickFindChooserModal: React.FC<QuickFindChooserModalProps> = ({
  results,
  searchTerm,
  searchMode,
  onSelect,
  onClose,
}) => {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (results[focusedIndex]) {
          onSelect(results[focusedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [results, focusedIndex, onSelect, onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    const focused = listRef.current?.children[focusedIndex] as HTMLElement | undefined;
    focused?.scrollIntoView({ block: 'nearest' });
  }, [focusedIndex]);

  return (
    <Modal title={`${results.length} Matching Orders`} onCloseClick={onClose}>
      <p className="ob-chooser-subtitle">
        PO number {MODE_LABELS[searchMode]} "<strong>{searchTerm}</strong>"
        &mdash; click a result or use <kbd>&uarr;</kbd><kbd>&darr;</kbd> and <kbd>Enter</kbd>
      </p>
      <div className="ob-chooser-list" ref={listRef} role="listbox">
        {results.map((order, idx) => (
          <div
            key={order.id}
            className={`ob-chooser-row ${idx === focusedIndex ? 'ob-chooser-row--focused' : ''}`}
            role="option"
            aria-selected={idx === focusedIndex}
            onClick={() => onSelect(order)}
            onMouseEnter={() => setFocusedIndex(idx)}
          >
            <div className="ob-chooser-row__left">
              <span className="ob-chooser-row__po">
                {highlightMatch(order.orderNumber, searchTerm, searchMode)}
              </span>
              <span className="ob-chooser-row__retailer">{order.retailerName}</span>
            </div>
            <div className="ob-chooser-row__right">
              <span className="ob-chooser-row__amount">{formatCurrency(order.totalAmount)}</span>
              <span className="ob-chooser-row__date">{order.orderDate}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="ob-chooser-footer">
        <span className="ob-chooser-footer__hint">
          {results.length} result{results.length !== 1 ? 's' : ''}
        </span>
        <Button variant="secondary" onClick={onClose}>Close</Button>
      </div>
    </Modal>
  );
};
