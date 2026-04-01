import React, { useState, useMemo } from 'react';
import { Panel, Flex, Button, SelectField } from '../../ui';
import type { OrderBrowseRow } from '../../types/order';

export interface OrderFilters {
  invoiceStatus: string;
  shipmentStatus: string;
  retailer: string;
  dateFrom: string;
  dateTo: string;
}

const EMPTY_FILTERS: OrderFilters = {
  invoiceStatus: '',
  shipmentStatus: '',
  retailer: '',
  dateFrom: '',
  dateTo: '',
};

interface FilterPanelProps {
  orders: OrderBrowseRow[];
  filters: OrderFilters;
  onFiltersChange: (filters: OrderFilters) => void;
  onClose: () => void;
}

export function applyOrderFilters(orders: OrderBrowseRow[], filters: OrderFilters): OrderBrowseRow[] {
  let result = orders;

  if (filters.invoiceStatus) {
    result = result.filter((o) => o.invoiceStatus === filters.invoiceStatus);
  }
  if (filters.shipmentStatus) {
    result = result.filter((o) => o.shipmentStatus === filters.shipmentStatus);
  }
  if (filters.retailer) {
    result = result.filter((o) => o.retailerName === filters.retailer);
  }
  if (filters.dateFrom) {
    result = result.filter((o) => o.orderDate >= filters.dateFrom);
  }
  if (filters.dateTo) {
    result = result.filter((o) => o.orderDate <= filters.dateTo);
  }

  return result;
}

export function hasActiveFilters(filters: OrderFilters): boolean {
  return Object.values(filters).some((v) => v !== '');
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  orders,
  filters,
  onFiltersChange,
  onClose,
}) => {
  const [draft, setDraft] = useState<OrderFilters>({ ...filters });

  const invoiceStatuses = useMemo(
    () => [...new Set(orders.map((o) => o.invoiceStatus))].sort(),
    [orders]
  );
  const shipmentStatuses = useMemo(
    () => [...new Set(orders.map((o) => o.shipmentStatus))].sort(),
    [orders]
  );
  const retailers = useMemo(
    () => [...new Set(orders.map((o) => o.retailerName))].sort(),
    [orders]
  );

  const update = (key: keyof OrderFilters, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onFiltersChange(draft);
    onClose();
  };

  const handleClear = () => {
    setDraft({ ...EMPTY_FILTERS });
    onFiltersChange({ ...EMPTY_FILTERS });
    onClose();
  };

  return (
    <Panel className="ob-filter-panel">
      <div className="ob-filter-panel__header">
        <span className="ob-filter-panel__title">Filters</span>
        <button className="ob-filter-panel__close" onClick={onClose} aria-label="Close filters">
          &times;
        </button>
      </div>

      <div className="ob-filter-panel__body">
        <SelectField
          label="Invoice Status"
          value={draft.invoiceStatus}
          onChange={(v) => update('invoiceStatus', v)}
          options={{
            values: ['', ...invoiceStatuses],
            getOptionName: (v) => (v === '' ? 'All' : v),
          }}
        />

        <SelectField
          label="Shipment Status"
          value={draft.shipmentStatus}
          onChange={(v) => update('shipmentStatus', v)}
          options={{
            values: ['', ...shipmentStatuses],
            getOptionName: (v) => (v === '' ? 'All' : v),
          }}
        />

        <SelectField
          label="Retailer"
          value={draft.retailer}
          onChange={(v) => update('retailer', v)}
          options={{
            values: ['', ...retailers],
            getOptionName: (v) => (v === '' ? 'All' : v),
          }}
        />

        <div className="ob-filter-panel__date-group">
          <label className="ob-filter-panel__date-label">Order Date Range</label>
          <Flex style={{ gap: '0.5rem' }}>
            <input
              type="date"
              className="ob-filter-panel__date-input"
              value={draft.dateFrom}
              onChange={(e) => update('dateFrom', e.target.value)}
            />
            <span className="ob-filter-panel__date-sep">to</span>
            <input
              type="date"
              className="ob-filter-panel__date-input"
              value={draft.dateTo}
              onChange={(e) => update('dateTo', e.target.value)}
            />
          </Flex>
        </div>
      </div>

      <div className="ob-filter-panel__footer">
        <Button size="S" variant="text" onClick={handleClear}>
          Clear All
        </Button>
        <Flex style={{ gap: '0.5rem' }}>
          <Button size="S" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button size="S" onClick={handleApply}>Apply Filters</Button>
        </Flex>
      </div>
    </Panel>
  );
};

export { EMPTY_FILTERS };
