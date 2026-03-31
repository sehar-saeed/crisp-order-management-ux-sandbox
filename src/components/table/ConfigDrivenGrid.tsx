import React, { useMemo, useRef, useEffect } from 'react';
import { DataGrid } from '../../ui';
import type { GridColumnDef, GridRow } from '../../types/gridContract';

/**
 * Props for the grid component.
 *
 * The grid receives the backend contract: an ordered array of column
 * definitions and positional row data.  It renders by aligning
 * GridColumnDef[i] to GridRow.Cols[i] — no property-name lookups.
 *
 * `rowIds` is a parallel array mapping each row index to a unique ID,
 * used for selection and navigation.
 */
interface ConfigDrivenGridProps {
  columns: GridColumnDef[];
  rows: GridRow[];
  rowIds: string[];
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onToggleSelectAll: () => void;
  onRowClick: (rowId: string) => void;
  onGridReady?: (params: any) => void;
}

/**
 * Format a cell value for display.
 * All formatting happens in the UX layer based on column metadata
 * (data_type, number_format, decimal_places).
 */
export function formatCellValue(
  value: any,
  config: { data_type: string; number_format: string; decimal_places: number },
): string {
  if (value == null) return '';

  switch (config.data_type) {
    case 'number': {
      const num = typeof value === 'number' ? value : parseFloat(value);
      if (isNaN(num)) return String(value);

      const formatted = num.toLocaleString('en-US', {
        minimumFractionDigits: config.decimal_places,
        maximumFractionDigits: config.decimal_places,
      });

      switch (config.number_format) {
        case 'dollars':
          return '$' + formatted;
        case 'percent':
          return formatted + '%';
        case 'number':
        default:
          return formatted;
      }
    }
    case 'date': {
      if (!value) return '';
      const str = String(value);
      const d = new Date(str + (str.includes('T') ? '' : 'T00:00:00'));
      if (isNaN(d.getTime())) return str;
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
    case 'string':
    default:
      return String(value);
  }
}

/* ── Internal cell components ── */

const RowCheckbox: React.FC<{
  rowId: string;
  isSelected: boolean;
  onToggle: (id: string) => void;
}> = ({ rowId, isSelected, onToggle }) => (
  <div className="row-action-button-wrapper">
    <input
      type="checkbox"
      checked={isSelected}
      onChange={() => onToggle(rowId)}
      onClick={(e) => e.stopPropagation()}
    />
  </div>
);

const HeaderCheckbox: React.FC<{
  allSelected: boolean;
  indeterminate: boolean;
  onToggle: () => void;
}> = ({ allSelected, indeterminate, onToggle }) => {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <div className="row-action-button-wrapper">
      <input
        ref={ref}
        type="checkbox"
        checked={allSelected}
        onChange={onToggle}
      />
    </div>
  );
};

function StatusBadgeCell({ value }: { value: string }) {
  if (!value) return null;
  const slug = value.toLowerCase().replace(/\s+/g, '-');
  return <span className={`ob-status ob-status--${slug}`}>{value}</span>;
}

function buildCellRenderer(col: GridColumnDef) {
  if (col.display_style === 'status_badge') {
    return (params: any) => <StatusBadgeCell value={params.value} />;
  }
  return undefined;
}

/**
 * Synthetic field name used by AG Grid for column-index–based rendering.
 * The grid never relies on the original row property names.
 */
function colField(index: number): string {
  return `__col_${index}`;
}

const ROW_ID_FIELD = '__rowId';

export const ConfigDrivenGrid: React.FC<ConfigDrivenGridProps> = ({
  columns,
  rows,
  rowIds,
  selectedIds,
  onToggleSelection,
  onToggleSelectAll,
  onRowClick,
  onGridReady,
}) => {
  const agRows = useMemo(() => {
    return rows.map((row, rowIdx) => {
      const obj: Record<string, any> = { [ROW_ID_FIELD]: rowIds[rowIdx] };
      row.Cols.forEach((val, colIdx) => {
        obj[colField(colIdx)] = val;
      });
      return obj;
    });
  }, [rows, rowIds]);

  const allRowsSelected = agRows.length > 0 && agRows.every((r) => selectedIds.has(r[ROW_ID_FIELD]));
  const someRowsSelected = !allRowsSelected && agRows.some((r) => selectedIds.has(r[ROW_ID_FIELD]));

  const columnDefs = useMemo(() => {
    const defs: any[] = [
      {
        headerName: '',
        field: '__checkbox',
        width: 48,
        maxWidth: 48,
        sortable: false,
        filter: false,
        resizable: false,
        suppressMovable: true,
        cellRenderer: (params: any) => (
          <RowCheckbox
            rowId={params.data[ROW_ID_FIELD]}
            isSelected={selectedIds.has(params.data[ROW_ID_FIELD])}
            onToggle={onToggleSelection}
          />
        ),
        headerComponent: () => (
          <HeaderCheckbox
            allSelected={allRowsSelected}
            indeterminate={someRowsSelected}
            onToggle={onToggleSelectAll}
          />
        ),
      },
    ];

    columns.forEach((col, colIdx) => {
      const field = colField(colIdx);

      const def: any = {
        headerName: col.caption,
        field,
        width: col.width,
        sortable: true,
        filter: true,
        resizable: true,
      };

      if (col.data_type === 'number' || col.data_type === 'date') {
        def.valueFormatter = (params: any) => formatCellValue(params.value, col);
      }

      const renderer = buildCellRenderer(col);
      if (renderer) {
        def.cellRenderer = renderer;
      }

      defs.push(def);
    });

    return defs;
  }, [columns, selectedIds, onToggleSelection, onToggleSelectAll, allRowsSelected, someRowsSelected]);

  const handleRowClicked = (event: any) => {
    if (event.event?.target?.closest('input[type="checkbox"]')) return;
    onRowClick(event.data[ROW_ID_FIELD]);
  };

  const getRowClass = (params: any) => {
    return selectedIds.has(params.data?.[ROW_ID_FIELD]) ? 'ob-grid-row--selected' : '';
  };

  return (
    <div className="ob-grid-wrapper">
      <DataGrid
        rowData={agRows}
        columnDefs={columnDefs}
        onGridReady={onGridReady}
        onRowClicked={handleRowClicked}
        rowStyle={{ cursor: 'pointer' }}
        getRowClass={getRowClass}
      />
    </div>
  );
};
