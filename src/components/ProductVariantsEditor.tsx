import React from 'react';
import { Button } from '../ui';
import { FormField } from './common/FormField';
import type { ProductVariantFormData } from '../types/products';

const cellInputStyle: React.CSSProperties = {
  width: '100%',
  minWidth: 0,
  padding: '6px 8px',
  borderRadius: 6,
  border: '1px solid var(--cool-gray-80)',
  fontFamily: 'var(--font-primary)',
  fontSize: 13,
  background: 'var(--input-bg, white)',
};

interface ProductVariantsEditorProps {
  variants: ProductVariantFormData[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onChange: (index: number, field: keyof ProductVariantFormData, value: string) => void;
  disabled?: boolean;
  errorSummary?: string;
  /** `table` is the default: compact nested grid for many SKUs. `cards` is a more spacious stacked layout. */
  layout?: 'table' | 'cards';
}

export const ProductVariantsEditor: React.FC<ProductVariantsEditorProps> = ({
  variants,
  onAdd,
  onRemove,
  onChange,
  disabled = false,
  errorSummary,
  layout = 'table',
}) => {
  if (layout === 'cards') {
    return (
      <div>
        <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 600 }}>SKU variants</h3>
        <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: 'var(--cool-gray-50)' }}>
          Each row is a sellable SKU. Model, size, colour, and style sit with the SKU — not on the parent product.
        </p>
        {errorSummary && (
          <p style={{ color: 'var(--color-error)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>{errorSummary}</p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {variants.map((row, index) => (
            <div
              key={row.id}
              style={{
                border: '1px solid var(--cool-gray-85)',
                borderRadius: 8,
                padding: '1rem',
                background: 'var(--cool-gray-95)',
                borderLeft: '4px solid var(--teal-vivid-50)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.75rem',
                }}
              >
                <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--cool-gray-30)' }}>
                  SKU variant {index + 1}
                </span>
                {variants.length > 1 && (
                  <Button size="S" variant="secondary" disabled={disabled} onClick={() => onRemove(index)}>
                    Remove
                  </Button>
                )}
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                  gap: '0.75rem',
                }}
              >
                <FormField
                  id={`v-${index}-sku`}
                  label="SKU"
                  value={row.sku}
                  onChange={(v) => onChange(index, 'sku', v)}
                  disabled={disabled}
                  required
                />
                <FormField
                  id={`v-${index}-model`}
                  label="Model"
                  value={row.model}
                  onChange={(v) => onChange(index, 'model', v)}
                  disabled={disabled}
                  placeholder="Style / supplier code"
                />
                <FormField
                  id={`v-${index}-size`}
                  label="Size"
                  value={row.size}
                  onChange={(v) => onChange(index, 'size', v)}
                  disabled={disabled}
                  placeholder="S, M, 6-pack…"
                />
                <FormField
                  id={`v-${index}-colour`}
                  label="Colour"
                  value={row.colour}
                  onChange={(v) => onChange(index, 'colour', v)}
                  disabled={disabled}
                />
                <FormField
                  id={`v-${index}-style`}
                  label="Style"
                  value={row.style}
                  onChange={(v) => onChange(index, 'style', v)}
                  disabled={disabled}
                  placeholder="e.g. Graphic tee"
                />
                <FormField
                  id={`v-${index}-upc`}
                  label="UPC"
                  value={row.upc}
                  onChange={(v) => onChange(index, 'upc', v)}
                  disabled={disabled}
                />
                <FormField
                  id={`v-${index}-ean`}
                  label="EAN"
                  value={row.ean}
                  onChange={(v) => onChange(index, 'ean', v)}
                  disabled={disabled}
                />
                <FormField
                  id={`v-${index}-gtin`}
                  label="GTIN"
                  value={row.gtin}
                  onChange={(v) => onChange(index, 'gtin', v)}
                  disabled={disabled}
                />
                <FormField
                  id={`v-${index}-base`}
                  label="Base price"
                  value={row.basePrice}
                  onChange={(v) => onChange(index, 'basePrice', v)}
                  disabled={disabled}
                />
                <FormField
                  id={`v-${index}-list`}
                  label="List price"
                  value={row.listPrice}
                  onChange={(v) => onChange(index, 'listPrice', v)}
                  disabled={disabled}
                />
              </div>
              <div style={{ marginTop: '0.75rem' }}>
                <FormField
                  id={`v-${index}-desc`}
                  label="Variant description (optional)"
                  value={row.description}
                  onChange={(v) => onChange(index, 'description', v)}
                  disabled={disabled}
                />
              </div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginTop: '0.75rem',
                  fontSize: '0.875rem',
                }}
              >
                <input
                  type="checkbox"
                  checked={row.activeYn === 'Y'}
                  onChange={(e) => onChange(index, 'activeYn', e.target.checked ? 'Y' : 'N')}
                  disabled={disabled}
                />
                Active
              </label>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '1rem' }}>
          <Button variant="secondary" size="S" onClick={onAdd} disabled={disabled}>
            + Add variant
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ margin: '0 0 0.35rem', fontSize: '1rem', fontWeight: 600 }}>SKU variants</h3>
      <p style={{ margin: '0 0 0.75rem', fontSize: '0.8125rem', color: 'var(--cool-gray-50)' }}>
        Nested sellable SKUs under this logical product. Edit inline, or use <strong>Remove</strong> to drop a row.
      </p>
      {errorSummary && (
        <p style={{ color: 'var(--color-error)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>{errorSummary}</p>
      )}
      <div
        style={{
          overflowX: 'auto',
          border: '1px solid var(--cool-gray-85)',
          borderRadius: 8,
          background: 'var(--color-surface)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr
              style={{
                background: 'var(--cool-gray-95)',
                borderBottom: '1px solid var(--cool-gray-85)',
                textAlign: 'left',
              }}
            >
              {['SKU', 'Model', 'Size', 'Colour', 'Style', 'UPC', 'EAN', 'GTIN', 'Base $', 'List $', 'Status', ''].map(
                (h) => (
                  <th
                    key={h || 'actions'}
                    style={{
                      padding: '10px 8px',
                      fontWeight: 600,
                      color: 'var(--cool-gray-30)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {variants.map((row, index) => (
              <tr
                key={row.id}
                style={{
                  borderBottom: '1px solid var(--cool-gray-90)',
                  background: index % 2 === 0 ? 'white' : 'var(--cool-gray-95)',
                }}
              >
                <td style={{ padding: 6, verticalAlign: 'middle' }}>
                  <input
                    aria-label={`Variant ${index + 1} SKU`}
                    style={cellInputStyle}
                    value={row.sku}
                    disabled={disabled}
                    onChange={(e) => onChange(index, 'sku', e.target.value)}
                  />
                </td>
                <td style={{ padding: 6, verticalAlign: 'middle', minWidth: 100 }}>
                  <input
                    aria-label={`Variant ${index + 1} model`}
                    style={cellInputStyle}
                    value={row.model}
                    disabled={disabled}
                    onChange={(e) => onChange(index, 'model', e.target.value)}
                  />
                </td>
                <td style={{ padding: 6, verticalAlign: 'middle', minWidth: 72 }}>
                  <input
                    aria-label={`Variant ${index + 1} size`}
                    style={cellInputStyle}
                    value={row.size}
                    disabled={disabled}
                    onChange={(e) => onChange(index, 'size', e.target.value)}
                  />
                </td>
                <td style={{ padding: 6, verticalAlign: 'middle', minWidth: 88 }}>
                  <input
                    aria-label={`Variant ${index + 1} colour`}
                    style={cellInputStyle}
                    value={row.colour}
                    disabled={disabled}
                    onChange={(e) => onChange(index, 'colour', e.target.value)}
                  />
                </td>
                <td style={{ padding: 6, verticalAlign: 'middle', minWidth: 100 }}>
                  <input
                    aria-label={`Variant ${index + 1} style`}
                    style={cellInputStyle}
                    value={row.style}
                    disabled={disabled}
                    onChange={(e) => onChange(index, 'style', e.target.value)}
                  />
                </td>
                <td style={{ padding: 6, verticalAlign: 'middle', minWidth: 110 }}>
                  <input
                    aria-label={`Variant ${index + 1} UPC`}
                    style={cellInputStyle}
                    value={row.upc}
                    disabled={disabled}
                    onChange={(e) => onChange(index, 'upc', e.target.value)}
                  />
                </td>
                <td style={{ padding: 6, verticalAlign: 'middle', minWidth: 110 }}>
                  <input
                    aria-label={`Variant ${index + 1} EAN`}
                    style={cellInputStyle}
                    value={row.ean}
                    disabled={disabled}
                    onChange={(e) => onChange(index, 'ean', e.target.value)}
                  />
                </td>
                <td style={{ padding: 6, verticalAlign: 'middle', minWidth: 110 }}>
                  <input
                    aria-label={`Variant ${index + 1} GTIN`}
                    style={cellInputStyle}
                    value={row.gtin}
                    disabled={disabled}
                    onChange={(e) => onChange(index, 'gtin', e.target.value)}
                  />
                </td>
                <td style={{ padding: 6, verticalAlign: 'middle', width: 88 }}>
                  <input
                    aria-label={`Variant ${index + 1} base price`}
                    style={cellInputStyle}
                    value={row.basePrice}
                    disabled={disabled}
                    onChange={(e) => onChange(index, 'basePrice', e.target.value)}
                  />
                </td>
                <td style={{ padding: 6, verticalAlign: 'middle', width: 88 }}>
                  <input
                    aria-label={`Variant ${index + 1} list price`}
                    style={cellInputStyle}
                    value={row.listPrice}
                    disabled={disabled}
                    onChange={(e) => onChange(index, 'listPrice', e.target.value)}
                  />
                </td>
                <td style={{ padding: 6, verticalAlign: 'middle', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    aria-label={`Variant ${index + 1} active`}
                    checked={row.activeYn === 'Y'}
                    disabled={disabled}
                    onChange={(e) => onChange(index, 'activeYn', e.target.checked ? 'Y' : 'N')}
                  />
                </td>
                <td style={{ padding: 6, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                  {variants.length > 1 ? (
                    <Button size="S" variant="secondary" disabled={disabled} onClick={() => onRemove(index)}>
                      Remove
                    </Button>
                  ) : (
                    <span style={{ color: 'var(--cool-gray-60)', fontSize: 12 }}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: '0.75rem' }}>
        <Button variant="secondary" size="S" onClick={onAdd} disabled={disabled}>
          + Add variant
        </Button>
      </div>
    </div>
  );
};
