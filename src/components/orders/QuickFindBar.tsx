import React, { useRef, useEffect } from 'react';
import { Panel, Flex, Button, TextField, SelectField } from '../../ui';
import type { QuickFindMode } from '../../types/order';

interface QuickFindBarProps {
  mode: QuickFindMode;
  value: string;
  onModeChange: (mode: QuickFindMode) => void;
  onValueChange: (value: string) => void;
  onGo: () => void;
  onToggleFilters: () => void;
  activeFilterCount: number;
  onCustomizeColumns: () => void;
}

const MODE_LABELS: Record<QuickFindMode, string> = {
  startsWith: 'PO number starts with',
  contains: 'PO number contains',
  endsWith: 'PO number ends with',
};

export const QuickFindBar: React.FC<QuickFindBarProps> = ({
  mode,
  value,
  onModeChange,
  onValueChange,
  onGo,
  onToggleFilters,
  activeFilterCount,
  onCustomizeColumns,
}) => {
  const inputWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const input = inputWrapperRef.current?.querySelector('input');
    if (input) input.focus();
  }, []);

  return (
    <Panel style={{ padding: '0.75rem 1rem' }}>
      <Flex spaceBetween style={{ alignItems: 'flex-end', flexWrap: 'wrap', gap: '0.75rem' }}>
        <Flex style={{ gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <SelectField
            label="Quick Find"
            value={mode}
            onChange={(v) => onModeChange(v as QuickFindMode)}
            options={{
              values: ['startsWith', 'contains', 'endsWith'] as QuickFindMode[],
              getOptionName: (v) => MODE_LABELS[v as QuickFindMode] ?? v,
            }}
          />
          <div ref={inputWrapperRef}>
            <TextField
              label="PO Number"
              value={value}
              onChange={onValueChange}
              placeholder="Enter PO number..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onGo();
                }
              }}
            />
          </div>
          <Button onClick={onGo}>Go</Button>
        </Flex>
        <Flex style={{ gap: '0.75rem' }}>
          <Button variant="secondary" onClick={onToggleFilters}>
            Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </Button>
          <Button variant="secondary" onClick={onCustomizeColumns}>
            Customize Columns
          </Button>
        </Flex>
      </Flex>
    </Panel>
  );
};
