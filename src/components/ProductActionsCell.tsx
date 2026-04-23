import { forwardRef } from 'react';
import type { ICellRendererParams } from 'ag-grid-community';
import { Button } from '../ui';
import type { Product } from '../types/products';

interface ProductActionsCellProps extends ICellRendererParams<Product> {
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export const ProductActionsCell = forwardRef<HTMLDivElement, ProductActionsCellProps>(
  (props, ref) => {
    const { data, onEdit, onDelete } = props;

    if (!data) return null;

    return (
      <div ref={ref} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', height: '100%' }}>
        <Button size="S" variant="secondary" onClick={() => onEdit(data)}>
          Edit
        </Button>
        <Button
          size="S"
          variant="secondary"
          style={{ color: 'var(--color-error)', borderColor: 'var(--color-error-light)' }}
          onClick={() => onDelete(data)}
        >
          Delete
        </Button>
      </div>
    );
  },
);

ProductActionsCell.displayName = 'ProductActionsCell';
