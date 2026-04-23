import React, { forwardRef, useMemo } from 'react';
import type { ICellRendererParams } from 'ag-grid-community';
import { Button } from '../../ui';
import type {
  Product,
  ProductGridRowProduct,
  ProductManagementGridRow,
  ProductVariant,
} from '../../types/products';

/** Size · colour · style (only populated parts). */
export function variantDescriptorParts(v: ProductVariant): string {
  return [v.size, v.colour, v.style]
    .map((x) => (typeof x === 'string' ? x.trim() : ''))
    .filter(Boolean)
    .join(' · ');
}

/** Single-line value for sorting, filtering, and tooltip (descriptor first, then SKU). */
export function formatVariantFirstColumnText(v: ProductVariant): string {
  const sku = v.sku?.trim() ?? '';
  const descriptor = variantDescriptorParts(v);
  if (descriptor && sku) return `${descriptor} — ${sku}`;
  if (descriptor) return descriptor;
  if (sku) return sku;
  return (
    v.description?.trim() ||
    v.model?.trim() ||
    v.upc?.trim() ||
    v.ean?.trim() ||
    v.gtin?.trim() ||
    'Variant'
  );
}

export const ProductNameCellRenderer = forwardRef<
  HTMLDivElement,
  ICellRendererParams<ProductManagementGridRow>
>((props, ref) => {
  const { data } = props;
  if (!data) return null;

  if (data.rowKind === 'product') {
    const text = data.product.displayName ?? '';
    return (
      <div
        ref={ref}
        title={text}
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          minWidth: 0,
          overflow: 'hidden',
          fontWeight: 600,
          color: 'var(--cool-gray-10)',
        }}
      >
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            minWidth: 0,
            width: '100%',
          }}
        >
          {text}
        </span>
      </div>
    );
  }

  const v = data.variant;
  const sku = v.sku?.trim() ?? '';
  const descriptor = variantDescriptorParts(v);
  const primary =
    descriptor ||
    sku ||
    v.description?.trim() ||
    v.model?.trim() ||
    v.upc?.trim() ||
    v.ean?.trim() ||
    'Variant';
  const title = formatVariantFirstColumnText(v);
  const showSecondarySku = Boolean(descriptor && sku);

  if (!showSecondarySku) {
    return (
      <div
        ref={ref}
        title={title}
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          minWidth: 0,
          overflow: 'hidden',
          fontWeight: 500,
          color: 'var(--cool-gray-30)',
        }}
      >
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            minWidth: 0,
            width: '100%',
          }}
        >
          {primary}
        </span>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      title={title}
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 2,
        minWidth: 0,
        overflow: 'hidden',
        padding: '2px 0',
      }}
    >
      <div
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontWeight: 600,
          fontSize: 13,
          color: 'var(--cool-gray-30)',
          lineHeight: 1.25,
        }}
      >
        {descriptor}
      </div>
      <div
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
          fontSize: 12,
          color: 'var(--cool-gray-50)',
          lineHeight: 1.25,
        }}
      >
        {sku}
      </div>
    </div>
  );
});
ProductNameCellRenderer.displayName = 'ProductNameCellRenderer';

export const ExpandCellRenderer = forwardRef<
  HTMLDivElement,
  ICellRendererParams<ProductManagementGridRow> & {
    expandedProductIds: Set<string>;
    onToggleExpand: (productId: string) => void;
  }
>((props, ref) => {
  const { data, expandedProductIds, onToggleExpand } = props;
  if (!data || data.rowKind !== 'product') {
    return <div ref={ref} />;
  }
  const id = data.product.id;
  if (!id) return <div ref={ref} />;
  const open = expandedProductIds.has(id);
  if (!(data.product.variants?.length)) return <div ref={ref} />;

  return (
    <div
      ref={ref}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-label={open ? 'Collapse variants' : 'Expand variants'}
        onClick={(e) => {
          e.stopPropagation();
          onToggleExpand(id);
        }}
        style={{
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          padding: '4px 6px',
          margin: 0,
          color: 'var(--teal-vivid-30)',
          fontSize: '14px',
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            display: 'inline-block',
            transform: open ? 'rotate(90deg)' : 'none',
            transition: 'transform 0.15s',
          }}
        >
          ▸
        </span>
      </button>
    </div>
  );
});
ExpandCellRenderer.displayName = 'ExpandCellRenderer';

export const ProductActionsRenderer = forwardRef<
  HTMLDivElement,
  ICellRendererParams<ProductManagementGridRow> & {
    onEditProduct: (p: Product) => void;
    onEditVariant: (p: Product, v: ProductVariant) => void;
    onDeleteProduct: (p: Product) => void;
    onDeleteVariant: (p: Product, v: ProductVariant) => void;
  }
>((props, ref) => {
  const { data, onEditProduct, onEditVariant, onDeleteProduct, onDeleteVariant } = props;
  if (!data) return null;

  if (data.rowKind === 'product') {
    const p = data.product;
    return (
      <div ref={ref} style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', height: '100%' }}>
        <Button size="S" variant="secondary" onClick={() => onEditProduct(p)}>
          Edit product
        </Button>
        <Button
          size="S"
          variant="secondary"
          style={{ color: 'var(--color-error)', borderColor: 'var(--color-error-light)' }}
          onClick={() => onDeleteProduct(p)}
        >
          Delete
        </Button>
      </div>
    );
  }

  const { product, variant } = data;
  return (
    <div ref={ref} style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', height: '100%' }}>
      <Button size="S" variant="secondary" onClick={() => onEditVariant(product, variant)}>
        Edit SKU
      </Button>
      <Button
        size="S"
        variant="secondary"
        style={{ color: 'var(--color-error)', borderColor: 'var(--color-error-light)' }}
        onClick={() => onDeleteVariant(product, variant)}
      >
        Delete
      </Button>
    </div>
  );
});
ProductActionsRenderer.displayName = 'ProductActionsRenderer';

export function buildProductGridRows(
  products: ProductGridRowProduct[],
  expandedProductIds: Set<string>,
): ProductManagementGridRow[] {
  const rows: ProductManagementGridRow[] = [];
  for (const p of products) {
    rows.push({ rowKind: 'product', product: p });
    const id = p.id;
    if (id && expandedProductIds.has(id) && p.variants?.length) {
      for (const v of p.variants) {
        rows.push({ rowKind: 'variant', product: p, variant: v });
      }
    }
  }
  return rows;
}

export function useProductSearchFilter(
  products: Product[],
  term: string,
): { filtered: Product[]; expandForSearch: Set<string> } {
  return useMemo(() => {
    const q = term.trim().toLowerCase();
    if (!q) return { filtered: products, expandForSearch: new Set<string>() };

    const expandForSearch = new Set<string>();
    const filtered = products.filter((p) => {
      const parentHay = [
        p.displayName,
        p.parentProductId,
        p.model,
        p.description,
        p.sku,
        p.upc,
        p.gtin,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (parentHay.includes(q)) return true;
      const hitVariant = p.variants?.some((v) =>
        [v.sku, v.model, v.size, v.colour, v.style, v.upc, v.gtin, v.description]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q),
      );
      if (hitVariant && p.id) expandForSearch.add(p.id);
      return !!hitVariant;
    });

    return { filtered, expandForSearch };
  }, [products, term]);
}
