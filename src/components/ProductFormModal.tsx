import React, { useEffect, useState } from 'react';
import { Button, Modal, SelectField, Spinner } from '../ui';
import { FormField } from './common/FormField';
import type { Retailer } from '../types/retailers';
import type { Supplier } from '../types/suppliers';
import type { Department, DepartmentClass, Subclass } from '../types/retailerProductHierarchy';
import type { Category, Subcategory } from '../types/categoryHierarchy';
import type { ProductFormData, ProductVariantFormData } from '../types/products';
import { ProductVariantsEditor } from './ProductVariantsEditor';

interface ProductFormModalProps {
  isVisible: boolean;
  mode: 'create' | 'edit';
  isProcessing: boolean;
  formData: ProductFormData;
  formErrors: Record<string, string>;
  onSave: () => void;
  onClose: () => void;
  onInputChange: (field: string, value: string) => void;
  onAddVariantRow: () => void;
  onRemoveVariantRow: (index: number) => void;
  onVariantFieldChange: (index: number, field: keyof ProductVariantFormData, value: string) => void;
  retailers: Retailer[];
  suppliers: Supplier[];
  departments: Department[];
  classes: DepartmentClass[];
  subclasses: Subclass[];
  categories: Category[];
  subcategories: Subcategory[];
}

const PRICE_BY_OPTIONS = ['UNIT', 'CASE', 'WEIGHT', 'CUBE', 'PALLET'];
const WEIGHT_UOM_OPTIONS = ['LB', 'KG'];
const DIMENSION_UOM_OPTIONS = ['IN', 'FT', 'CM', 'M'];
const UOM_OPTIONS = ['EA', 'CA', 'PK'];

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isVisible,
  mode,
  isProcessing,
  formData,
  formErrors,
  onSave,
  onClose,
  onInputChange,
  onAddVariantRow,
  onRemoveVariantRow,
  onVariantFieldChange,
  retailers,
  suppliers,
  departments,
  classes,
  subclasses,
  categories,
  subcategories,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'variants'>('details');

  useEffect(() => {
    if (isVisible) setActiveTab('details');
  }, [isVisible]);

  if (!isVisible) return null;

  const retailerOptions = [
    '',
    ...Array.from(
      new Set([formData.retailerUid, ...retailers.map(retailer => retailer.retailerUid)]),
    ),
  ];

  const supplierOptions = [
    '',
    ...Array.from(
      new Set([formData.supplierUid, ...suppliers.map(supplier => supplier.supplierUid)]),
    ),
  ];

  const selectedRetailerUid = formData.retailerUid.trim();
  const selectedDepartmentUid = formData.departmentUid.trim();
  const selectedClassUid = formData.classUid.trim();
  const selectedSupplierUid = formData.supplierUid.trim();
  const selectedCategoryUid = formData.categoryUid.trim();

  const filteredDepartments = selectedRetailerUid
    ? departments.filter(department => department.retailerUid === selectedRetailerUid)
    : [];
  const filteredClasses =
    selectedRetailerUid && selectedDepartmentUid
      ? classes.filter(
          departmentClass =>
            departmentClass.retailerUid === selectedRetailerUid &&
            departmentClass.departmentUid === selectedDepartmentUid,
        )
      : [];
  const filteredSubclasses =
    selectedRetailerUid && selectedClassUid
      ? subclasses.filter(
          subclass =>
            subclass.retailerUid === selectedRetailerUid && subclass.classUid === selectedClassUid,
        )
      : [];
  const filteredCategories = selectedSupplierUid
    ? categories.filter(category => category.supplierUid === selectedSupplierUid)
    : [];
  const filteredSubcategories =
    selectedSupplierUid && selectedCategoryUid
      ? subcategories.filter(
          subcategory =>
            subcategory.supplierUid === selectedSupplierUid &&
            subcategory.categoryUid === selectedCategoryUid,
        )
      : [];

  const departmentOptions = [
    '',
    ...Array.from(new Set(filteredDepartments.map(department => department.id))),
  ];

  const classOptions = [
    '',
    ...Array.from(new Set(filteredClasses.map(departmentClass => departmentClass.id))),
  ];

  const subclassOptions = [
    '',
    ...Array.from(new Set(filteredSubclasses.map(subclass => subclass.id))),
  ];

  const categoryOptions = [
    '',
    ...Array.from(new Set(filteredCategories.map(category => category.id))),
  ];

  const subcategoryOptions = [
    '',
    ...Array.from(new Set(filteredSubcategories.map(subcategory => subcategory.id))),
  ];

  const handleRetailerChange = (value: string) => {
    onInputChange('retailerUid', value);
    if (value !== formData.retailerUid) {
      onInputChange('departmentUid', '');
      onInputChange('classUid', '');
      onInputChange('subclassUid', '');
    }
  };

  const handleSupplierChange = (value: string) => {
    onInputChange('supplierUid', value);
    if (value !== formData.supplierUid) {
      onInputChange('categoryUid', '');
      onInputChange('subcategoryUid', '');
    }
  };

  const handleDepartmentChange = (value: string) => {
    onInputChange('departmentUid', value);
    if (value !== formData.departmentUid) {
      onInputChange('classUid', '');
      onInputChange('subclassUid', '');
    }
  };

  const handleClassChange = (value: string) => {
    onInputChange('classUid', value);
    if (value !== formData.classUid) {
      onInputChange('subclassUid', '');
    }
  };

  const handleCategoryChange = (value: string) => {
    onInputChange('categoryUid', value);
    if (value !== formData.categoryUid) {
      onInputChange('subcategoryUid', '');
    }
  };

  const tabBtn = (id: 'details' | 'variants', label: string) => (
    <button
      key={id}
      type="button"
      role="tab"
      aria-selected={activeTab === id}
      onClick={() => setActiveTab(id)}
      disabled={isProcessing}
      style={{
        padding: '10px 16px',
        border: 'none',
        borderBottom: activeTab === id ? '2px solid var(--teal-vivid-40)' : '2px solid transparent',
        marginBottom: -1,
        background: 'transparent',
        cursor: isProcessing ? 'not-allowed' : 'pointer',
        fontWeight: activeTab === id ? 600 : 500,
        fontSize: 14,
        color: activeTab === id ? 'var(--teal-vivid-20)' : 'var(--cool-gray-40)',
        fontFamily: 'var(--font-primary)',
      }}
    >
      {label}
    </button>
  );

  return (
    <Modal
      extraWide
      title={mode === 'create' ? 'Add logical product' : 'Edit logical product'}
      onCloseClick={onClose}
    >
      {isProcessing && (
        <div className="confirm-modal-spinner-overlay">
          <Spinner />
        </div>
      )}

      <div
        role="tablist"
        style={{
          display: 'flex',
          gap: '0.25rem',
          padding: '0 var(--space-m)',
          borderBottom: '1px solid var(--cool-gray-90)',
          marginTop: 'var(--space-s)',
        }}
      >
        {tabBtn('details', 'Product details')}
        {tabBtn('variants', `Variants (${formData.variants.length})`)}
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          margin: '1rem var(--space-m) 2rem',
          maxHeight: '62vh',
          overflowY: 'auto',
        }}
      >
        {activeTab === 'variants' ? (
          <ProductVariantsEditor
            layout="table"
            variants={formData.variants}
            onAdd={onAddVariantRow}
            onRemove={onRemoveVariantRow}
            onChange={onVariantFieldChange}
            disabled={isProcessing}
            errorSummary={formErrors.variants}
          />
        ) : (
          <>
        <h3 style={{ marginLeft: 'var(--space-m)' }}>Context</h3>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <SelectField
              label="Retailer"
              value={formData.retailerUid}
              onChange={handleRetailerChange}
              disabled={isProcessing}
              options={{
                values: retailerOptions,
                getOptionName: (value: string) => {
                  if (!value) return '— Select retailer —';
                  const retailer = retailers.find(r => r.retailerUid === value);
                  return retailer ? `${retailer.name} (${retailer.shortCode})` : value;
                },
              }}
              error={formErrors.retailerUid}
            />
          </div>

          <div style={{ flex: 1 }}>
            <SelectField
              label="Supplier"
              value={formData.supplierUid}
              onChange={handleSupplierChange}
              disabled={isProcessing}
              options={{
                values: supplierOptions,
                getOptionName: (value: string) => {
                  if (!value) return '— Select supplier —';
                  const supplier = suppliers.find(s => s.supplierUid === value);
                  return supplier ? `${supplier.name} (${supplier.shortCode})` : value;
                },
              }}
              error={formErrors.supplierUid}
            />
          </div>
        </div>
        <h3 style={{ marginLeft: 'var(--space-m)' }}>Logical product</h3>
        <FormField
          id="product-display-name"
          label="Product name"
          value={formData.displayName}
          error={formErrors.displayName}
          onChange={(value) => onInputChange('displayName', value)}
          disabled={isProcessing}
          placeholder="e.g. Buc-ee's Logo T-Shirt – Heather Grey"
          required
        />
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
          <div style={{ flex: '1 1 240px' }}>
            <FormField
              id="product-parent-id"
              label="Parent product ID"
              value={formData.parentProductId}
              error={formErrors.parentProductId}
              onChange={(value) => onInputChange('parentProductId', value)}
              disabled={isProcessing}
              placeholder="Retailer or MDM id (optional until assigned)"
            />
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <FormField
              id="product-family-sku"
              label="Internal range code (optional)"
              value={formData.sku}
              error={formErrors.sku}
              onChange={(value) => onInputChange('sku', value)}
              disabled={isProcessing}
              placeholder="Shared PO / planning code"
            />
          </div>
        </div>
        <FormField
          id="product-description-input"
          label="Product description"
          value={formData.description}
          error={formErrors.description}
          onChange={(value) => onInputChange('description', value)}
          disabled={isProcessing}
          placeholder="What buyers see for the whole style"
        />

        <h3 style={{ marginLeft: 'var(--space-m)' }}>Variant dimensions used</h3>
        <p style={{ margin: '0 0 0.5rem var(--space-m)', fontSize: '0.8125rem', color: 'var(--cool-gray-50)' }}>
          Controls which columns are required on each SKU row (e.g. apparel uses all three; multipacks may only use size + colour).
        </p>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1.25rem',
            marginLeft: 'var(--space-m)',
            marginBottom: '0.5rem',
          }}
        >
          {(
            [
              ['variantDimSizeYn', 'Size'],
              ['variantDimColourYn', 'Colour'],
              ['variantDimStyleYn', 'Style'],
            ] as const
          ).map(([field, label]) => (
            <label
              key={field}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}
            >
              <input
                type="checkbox"
                checked={formData[field] === 'Y'}
                disabled={isProcessing}
                onChange={(e) => onInputChange(field, e.target.checked ? 'Y' : 'N')}
              />
              {label}
            </label>
          ))}
        </div>

        <h3 style={{ marginLeft: 'var(--space-m)' }}>Optional parent barcodes</h3>
        <p style={{ margin: '0 0 0.75rem var(--space-m)', fontSize: '0.8125rem', color: 'var(--cool-gray-50)' }}>
          Sellable barcodes usually live on each SKU on the <strong>Variants</strong> tab. Use these only for a single corporate barcode at the style level.
        </p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <FormField
              id="product-upc-input"
              label="UPC"
              value={formData.upc}
              error={formErrors.upc}
              onChange={(value) => onInputChange('upc', value)}
              disabled={isProcessing}
              placeholder="Optional"
            />
          </div>
          <div style={{ flex: 1 }}>
            <FormField
              id="product-ean-input"
              label="EAN"
              value={formData.ean}
              error={formErrors.ean}
              onChange={(value) => onInputChange('ean', value)}
              disabled={isProcessing}
              placeholder="Optional"
            />
          </div>
          <div style={{ flex: 1 }}>
            <FormField
              id="product-gtin-input"
              label="GTIN"
              value={formData.gtin}
              error={formErrors.gtin}
              onChange={(value) => onInputChange('gtin', value)}
              disabled={isProcessing}
              placeholder="Optional"
            />
          </div>
        </div>
        <h3 style={{ marginLeft: 'var(--space-m)' }}>Classification</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <SelectField
              label="Department"
              value={formData.departmentUid}
              onChange={handleDepartmentChange}
              disabled={isProcessing}
              options={{
                values: departmentOptions,
                getOptionName: (value: string) => {
                  if (!value) return '— None —';
                  const department =
                    filteredDepartments.find(d => d.id === value) ||
                    departments.find(d => d.id === value);
                  return department?.displayName || value;
                },
              }}
              error={formErrors.departmentUid}
            />
          </div>
          <div style={{ flex: 1 }}>
            <SelectField
              label="Class"
              value={formData.classUid}
              onChange={handleClassChange}
              disabled={isProcessing || !selectedDepartmentUid}
              options={{
                values: classOptions,
                getOptionName: (value: string) => {
                  if (!value) return '— None —';
                  const departmentClass =
                    filteredClasses.find(c => c.id === value) || classes.find(c => c.id === value);
                  return departmentClass?.displayName || value;
                },
              }}
              error={formErrors.classUid}
            />
          </div>
          <div style={{ flex: 1 }}>
            <SelectField
              label="Subclass"
              value={formData.subclassUid}
              onChange={(value: string) => onInputChange('subclassUid', value)}
              disabled={isProcessing || !selectedClassUid}
              options={{
                values: subclassOptions,
                getOptionName: (value: string) => {
                  if (!value) return '— None —';
                  const subclass =
                    filteredSubclasses.find(s => s.id === value) ||
                    subclasses.find(s => s.id === value);
                  return subclass?.displayName || value;
                },
              }}
              error={formErrors.subclassUid}
            />
          </div>
        </div>
        <h3 style={{ marginLeft: 'var(--space-m)' }}>Category</h3>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <SelectField
              label="Category"
              value={formData.categoryUid}
              onChange={handleCategoryChange}
              disabled={isProcessing || !selectedSupplierUid}
              options={{
                values: categoryOptions,
                getOptionName: (value: string) => {
                  if (!value) return '— None —';
                  const category = categories.find(c => c.id === value);
                  return category ? `${category.code} - ${category.name}` : value;
                },
              }}
              error={formErrors.categoryUid}
            />
          </div>
          <div style={{ flex: 1 }}>
            <SelectField
              label="Subcategory"
              value={formData.subcategoryUid}
              onChange={(value: string) => onInputChange('subcategoryUid', value)}
              disabled={isProcessing || !selectedCategoryUid || !selectedSupplierUid}
              options={{
                values: subcategoryOptions,
                getOptionName: (value: string) => {
                  if (!value) return '— None —';
                  const subcategory =
                    filteredSubcategories.find(s => s.id === value) ||
                    subcategories.find(s => s.id === value);
                  return subcategory ? `${subcategory.code} - ${subcategory.name}` : value;
                },
              }}
              error={formErrors.subcategoryUid}
            />
          </div>
        </div>
        <h3 style={{ marginLeft: 'var(--space-m)' }}>Pricing</h3>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <FormField
              id="product-base-price-input"
              label="Base Price"
              value={formData.basePrice}
              error={formErrors.basePrice}
              onChange={value => onInputChange('basePrice', value)}
              disabled={isProcessing}
              placeholder="0.00"
            />
          </div>
          <div style={{ flex: 1 }}>
            <FormField
              id="product-list-price-input"
              label="List Price"
              value={formData.listPrice}
              error={formErrors.listPrice}
              onChange={value => onInputChange('listPrice', value)}
              disabled={isProcessing}
              placeholder="0.00"
            />
          </div>
          <div style={{ flex: 1 }}>
            <SelectField
              label="Price By"
              value={formData.priceBy}
              onChange={(value: string) => onInputChange('priceBy', value)}
              disabled={isProcessing}
              options={{ values: PRICE_BY_OPTIONS, getOptionName: (value: string) => value }}
              error={formErrors.priceBy}
            />
          </div>
        </div>
        <h3 style={{ marginLeft: 'var(--space-m)' }}>Dimensions & Weight</h3>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <FormField
              id="product-weight-input"
              label="Weight"
              value={formData.weight}
              error={formErrors.weight}
              onChange={value => onInputChange('weight', value)}
              disabled={isProcessing}
              placeholder="0.00"
            />
          </div>
          <div style={{ flex: 1 }}>
            <SelectField
              label="Weight UOM"
              value={formData.weightUom}
              onChange={(value: string) => onInputChange('weightUom', value)}
              disabled={isProcessing}
              options={{ values: WEIGHT_UOM_OPTIONS, getOptionName: (value: string) => value }}
              error={formErrors.weightUom}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <FormField
              id="product-unit-length-input"
              label="Unit Length"
              value={formData.unitLength}
              error={formErrors.unitLength}
              onChange={value => onInputChange('unitLength', value)}
              disabled={isProcessing}
              placeholder="0.00"
            />
          </div>
          <div style={{ flex: 1 }}>
            <FormField
              id="product-unit-width-input"
              label="Unit Width"
              value={formData.unitWidth}
              error={formErrors.unitWidth}
              onChange={value => onInputChange('unitWidth', value)}
              disabled={isProcessing}
              placeholder="0.00"
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <FormField
              id="product-unit-height-input"
              label="Unit Height"
              value={formData.unitHeight}
              error={formErrors.unitHeight}
              onChange={value => onInputChange('unitHeight', value)}
              disabled={isProcessing}
              placeholder="0.00"
            />
          </div>
          <div style={{ flex: 1 }}>
            <SelectField
              label="Dimension UOM"
              value={formData.dimensionUom}
              onChange={(value: string) => onInputChange('dimensionUom', value)}
              disabled={isProcessing}
              options={{ values: DIMENSION_UOM_OPTIONS, getOptionName: (value: string) => value }}
              error={formErrors.dimensionUom}
            />
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '1rem',
          }}
        >
          <div style={{ flex: 1 }}>
            <FormField
              id="product-case-pack-input"
              label="Case Pack"
              value={formData.casePack}
              error={formErrors.casePack}
              onChange={value => onInputChange('casePack', value)}
              disabled={isProcessing}
              placeholder="0"
            />
          </div>
          <div style={{ flex: 1 }}>
            <SelectField
              label="Casepack UOM"
              value={formData.uom}
              onChange={(value: string) => onInputChange('uom', value)}
              disabled={isProcessing}
              options={{ values: UOM_OPTIONS, getOptionName: (value: string) => value }}
              error={formErrors.uom}
            />
          </div>
        </div>

        <h3 style={{ marginLeft: 'var(--space-m)' }}>Default Settings</h3>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                margin: 'var(--space-m)',
              }}
            >
              <label htmlFor="product-active-switch" style={{ fontWeight: 500 }}>
                Active Status
              </label>
              <input
                id="product-active-switch"
                type="checkbox"
                checked={formData.activeYn === 'Y'}
                onChange={(e) => onInputChange('activeYn', e.target.checked ? 'Y' : 'N')}
                disabled={isProcessing}
                style={{ width: 18, height: 18, cursor: isProcessing ? 'not-allowed' : 'pointer' }}
              />
              <span style={{ color: formData.activeYn === 'Y' ? '#28a745' : '#6c757d' }}>
                {formData.activeYn === 'Y' ? 'Active' : 'Inactive'}
              </span>
            </div>
            {formErrors.activeYn && (
              <div
                style={{ color: 'var(--color-error)', fontSize: '0.875rem', marginTop: '0.5rem' }}
              >
                {formErrors.activeYn}
              </div>
            )}
          </div>
        </div>
          </>
        )}
      </div>

      <div className="modal-button-block">
        <Button onClick={onSave} disabled={isProcessing} variant="primary">
          {isProcessing
            ? mode === 'create'
              ? 'Creating...'
              : 'Updating...'
            : mode === 'create'
              ? 'Save Product'
              : 'Update Product'}
        </Button>
        <Button onClick={onClose} variant="secondary" disabled={isProcessing}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
};
