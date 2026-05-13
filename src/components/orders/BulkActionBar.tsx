import React from 'react';
import { Panel, Flex, Button } from '../../ui';

interface BulkActionBarProps {
  variant?: 'orders' | 'ingestion';
  selectedCount: number;
  pageSelectedCount: number;
  totalCount: number;
  totalFilteredCount: number;
  selectAllPages: boolean;
  onSelectAll: () => void;
  onSelectAllPages: () => void;
  onClearSelection: () => void;
  onDelete: () => void;
  onSend: () => void;
  onPrint: () => void;
  onBulkRequeue?: () => void;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  variant = 'orders',
  selectedCount,
  pageSelectedCount,
  totalCount,
  totalFilteredCount,
  selectAllPages,
  onSelectAll,
  onSelectAllPages,
  onClearSelection,
  onDelete,
  onSend,
  onPrint,
  onBulkRequeue,
}) => {
  if (selectedCount === 0) return null;

  const entity = variant === 'ingestion' ? 'records' : 'orders';
  const pageIsFullySelected = pageSelectedCount >= totalCount && totalCount > 0;
  const canSelectMore = !selectAllPages && totalFilteredCount > totalCount;

  return (
    <Panel className="ob-bulk-bar" style={{ padding: '0.5rem 1rem' }}>
      <Flex spaceBetween style={{ alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <Flex style={{ gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="ob-bulk-bar__count">
            {selectAllPages
              ? `All ${selectedCount} ${entity} selected`
              : `${selectedCount} selected (${pageSelectedCount} on this page)`}
          </span>

          {pageIsFullySelected && canSelectMore && (
            <Button size="S" variant="text" onClick={onSelectAllPages}>
              Select all {totalFilteredCount} {entity}
            </Button>
          )}

          <div className="ob-bulk-bar__divider" />

          {variant === 'orders' ? (
            <>
              <Button
                size="S"
                variant="secondary"
                style={{ color: '#ef4444', borderColor: '#ef4444' }}
                onClick={onDelete}
              >
                Delete
              </Button>
              <Button size="S" variant="secondary" onClick={onSend}>
                Send
              </Button>
              <Button size="S" variant="secondary" onClick={onPrint}>
                Print
              </Button>
            </>
          ) : (
            <Button
              size="S"
              variant="secondary"
              onClick={onBulkRequeue}
              disabled={selectedCount < 2}
              aria-label={selectedCount < 2 ? 'Select at least two records to bulk requeue' : 'Bulk requeue selected records'}
            >
              Bulk requeue
            </Button>
          )}
        </Flex>
        <Flex style={{ gap: '0.5rem' }}>
          {!selectAllPages && (
            <Button size="S" variant="text" onClick={onSelectAll}>
              Select Page
            </Button>
          )}
          <Button size="S" variant="text" onClick={onClearSelection}>
            Clear
          </Button>
        </Flex>
      </Flex>
    </Panel>
  );
};
