import type { ColDef } from 'ag-grid-community';
import type { Product, ProductManagementGridRow, ProductVariant } from '../types/products';
import {
  ExpandCellRenderer,
  formatVariantFirstColumnText,
  ProductActionsRenderer,
  ProductNameCellRenderer,
} from '../components/product-management/ProductGridCells';

export interface LogicalProductGridDeps {
  expandedProductIds: Set<string>;
  onToggleExpand: (productId: string) => void;
  onEditProduct: (p: Product) => void;
  onEditVariant: (p: Product, v: ProductVariant) => void;
  onDeleteProduct: (p: Product) => void;
  onDeleteVariant: (p: Product, v: ProductVariant) => void;
}

function statusLabel(activeYn: string | undefined): string {
  return activeYn === 'Y' ? 'Active' : 'Inactive';
}

export function createLogicalProductColumnDefs({
  expandedProductIds,
  onToggleExpand,
  onEditProduct,
  onEditVariant,
  onDeleteProduct,
  onDeleteVariant,
}: LogicalProductGridDeps): ColDef<ProductManagementGridRow>[] {
  return [
    {
      headerName: '',
      colId: 'expand',
      width: 56,
      minWidth: 56,
      maxWidth: 56,
      flex: 0,
      resizable: false,
      sortable: false,
      filter: false,
      suppressSizeToFit: true,
      cellClass: 'pm-cell--expand',
      cellStyle: {
        overflow: 'hidden',
        paddingLeft: 0,
        paddingRight: 0,
      },
      cellRenderer: ExpandCellRenderer,
      cellRendererParams: { expandedProductIds, onToggleExpand },
    },
    {
      headerName: 'Product name',
      colId: 'productName',
      flex: 1.4,
      minWidth: 200,
      cellClass: (p) =>
        p.data?.rowKind === 'variant'
          ? ['pm-cell--product-name', 'pm-cell--product-name--variant']
          : 'pm-cell--product-name',
      valueGetter: (p) => {
        const d = p.data;
        if (!d) return '';
        return d.rowKind === 'product' ? d.product.displayName : formatVariantFirstColumnText(d.variant);
      },
      cellRenderer: ProductNameCellRenderer,
      cellStyle: (p) => {
        const d = p.data;
        if (d?.rowKind === 'variant') {
          return {
            paddingLeft: 28,
            paddingRight: 8,
          };
        }
        return {
          paddingLeft: 10,
          paddingRight: 8,
        };
      },
    },
    {
      headerName: 'Supplier',
      minWidth: 150,
      valueGetter: (p) => p.data?.product.supplierName ?? '',
    },
    {
      headerName: 'Department',
      minWidth: 110,
      valueGetter: (p) => p.data?.product.departmentName ?? '',
    },
    {
      headerName: 'Class',
      minWidth: 120,
      valueGetter: (p) => p.data?.product.className ?? '',
    },
    {
      headerName: 'Subclass',
      minWidth: 120,
      valueGetter: (p) => p.data?.product.subclassName ?? '',
    },
    {
      headerName: 'SKU',
      minWidth: 140,
      valueGetter: (p) => {
        const d = p.data;
        if (!d) return '';
        return d.rowKind === 'variant' ? d.variant.sku : '';
      },
      cellStyle: (p) =>
        p.data?.rowKind === 'variant'
          ? { fontWeight: 600, fontFamily: 'monospace', fontSize: '13px' }
          : { fontWeight: 400, fontFamily: 'inherit', fontSize: 'inherit' },
    },
    {
      headerName: 'Size',
      minWidth: 88,
      valueGetter: (p) => {
        const d = p.data;
        if (!d) return '';
        return d.rowKind === 'variant' ? d.variant.size : '';
      },
    },
    {
      headerName: 'Colour',
      minWidth: 100,
      valueGetter: (p) => {
        const d = p.data;
        if (!d) return '';
        return d.rowKind === 'variant' ? d.variant.colour : '';
      },
    },
    {
      headerName: 'Style',
      minWidth: 120,
      valueGetter: (p) => {
        const d = p.data;
        if (!d) return '';
        return d.rowKind === 'variant' ? d.variant.style : '';
      },
    },
    {
      headerName: 'UPC',
      minWidth: 120,
      valueGetter: (p) => {
        const d = p.data;
        if (!d) return '';
        return d.rowKind === 'variant' ? d.variant.upc : '';
      },
    },
    {
      headerName: 'GTIN',
      minWidth: 120,
      valueGetter: (p) => {
        const d = p.data;
        if (!d) return '';
        return d.rowKind === 'variant' ? d.variant.gtin : '';
      },
    },
    {
      headerName: 'Variants',
      colId: 'variantCount',
      width: 108,
      minWidth: 108,
      valueGetter: (p) => {
        const d = p.data;
        if (!d || d.rowKind !== 'product') return '';
        const n = d.product.variants?.length ?? 0;
        if (n === 0) return '0 variants';
        if (n === 1) return '1 variant';
        return `${n} variants`;
      },
    },
    {
      headerName: 'Status',
      width: 92,
      minWidth: 92,
      valueGetter: (p) => {
        const d = p.data;
        if (!d) return '';
        if (d.rowKind === 'product') return statusLabel(d.product.activeYn);
        return statusLabel(d.variant.activeYn);
      },
    },
    {
      headerName: 'Actions',
      minWidth: 200,
      sortable: false,
      filter: false,
      pinned: 'right',
      cellRenderer: ProductActionsRenderer,
      cellRendererParams: {
        onEditProduct,
        onEditVariant,
        onDeleteProduct,
        onDeleteVariant,
      },
      suppressSizeToFit: true,
      lockPinned: true,
    },
  ];
}
