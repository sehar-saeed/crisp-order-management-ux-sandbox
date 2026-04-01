import React from 'react';
import { Panel, Flex, Button } from '../../ui';

interface OrderFooterProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  pageSizeOptions: readonly number[];
  totalOrders: number;
  totalAmount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

function formatCurrency(amount: number): string {
  return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const OrderFooter: React.FC<OrderFooterProps> = ({
  currentPage,
  totalPages,
  pageSize,
  pageSizeOptions,
  totalOrders,
  totalAmount,
  onPageChange,
  onPageSizeChange,
}) => (
  <Panel className="ob-footer" style={{ padding: '0.625rem 1rem' }}>
    <Flex spaceBetween style={{ alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
      <Flex style={{ gap: '1rem', alignItems: 'center' }}>
        <span className="ob-footer__summary">
          <strong>{totalOrders}</strong> orders &middot; {formatCurrency(totalAmount)} total
        </span>
      </Flex>

      <Flex style={{ gap: '0.5rem', alignItems: 'center' }}>
        <span className="ob-footer__label">Rows per page:</span>
        <select
          className="ob-footer__page-size"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>

        <div className="ob-footer__divider" />

        <span className="ob-footer__page-info">
          Page {currentPage} of {totalPages}
        </span>

        <Button
          size="S"
          variant="text"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(1)}
          aria-label="First page"
        >
          ««
        </Button>
        <Button
          size="S"
          variant="text"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Previous page"
        >
          «
        </Button>
        <Button
          size="S"
          variant="text"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Next page"
        >
          »
        </Button>
        <Button
          size="S"
          variant="text"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(totalPages)}
          aria-label="Last page"
        >
          »»
        </Button>
      </Flex>
    </Flex>
  </Panel>
);
