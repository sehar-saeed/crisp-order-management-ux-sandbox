import { useCallback, useMemo, useState } from 'react';
import type {
  CreateProductRequest,
  Product,
  ProductFormData,
  ProductVariantFormData,
  VariantDimensions,
} from '../types/products';

type FormErrors = Partial<Record<keyof ProductFormData | 'variants', string>>;

export interface UseProductFormReturn {
  formData: ProductFormData;
  formErrors: FormErrors;
  isValid: boolean;
  updateTextField: <K extends keyof ProductFormData>(field: K, value: ProductFormData[K]) => void;
  validateForm: () => boolean;
  resetForm: () => void;
  setFormData: (data: ProductFormData) => void;
  setFormFromProduct: (product: Product) => void;
  prepareFormData: (data: ProductFormData) => CreateProductRequest;
  addVariantRow: () => void;
  removeVariantRow: (index: number) => void;
  updateVariantField: (index: number, field: keyof ProductVariantFormData, value: string) => void;
}

function newVariantId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `v-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function emptyVariantRow(): ProductVariantFormData {
  return {
    id: newVariantId(),
    sku: '',
    model: '',
    upc: '',
    ean: '',
    gtin: '',
    size: '',
    colour: '',
    style: '',
    description: '',
    basePrice: '',
    listPrice: '',
    activeYn: 'Y',
  };
}

const defaultVariantDimensions: VariantDimensions = {
  size: true,
  colour: true,
  style: true,
};

const initialFormData: ProductFormData = {
  supplierUid: '',
  retailerUid: '',
  departmentUid: '',
  classUid: '',
  subclassUid: '',
  categoryUid: '',
  subcategoryUid: '',
  displayName: '',
  parentProductId: '',
  variantDimSizeYn: 'Y',
  variantDimColourYn: 'Y',
  variantDimStyleYn: 'Y',
  sku: '',
  upc: '',
  ean: '',
  gtin: '',
  description: '',
  variants: [emptyVariantRow()],
  basePrice: '',
  listPrice: '',
  priceBy: 'UNIT',
  weightUom: 'LB',
  weight: '',
  dimensionUom: 'IN',
  unitLength: '',
  unitWidth: '',
  unitHeight: '',
  casePack: '',
  uom: 'EA',
  activeYn: 'Y',
  createdDate: '',
  createdBy: '',
  source: 'UI',
  modifiedDate: '',
  modifiedBy: '',
  deletedYn: 'N',
};

const toNullIfBlank = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toNumberOrNull = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
};

const toIntOrNull = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^[-+]?\d+$/.test(trimmed)) return null;
  const parsed = Number(trimmed);
  return Number.isSafeInteger(parsed) ? parsed : null;
};

const variantToForm = (v: Product['variants'][number]): ProductVariantFormData => ({
  id: v.id,
  sku: v.sku || '',
  model: v.model || '',
  upc: v.upc || '',
  ean: v.ean || '',
  gtin: v.gtin || '',
  size: v.size || '',
  colour: v.colour || '',
  style: v.style || '',
  description: v.description || '',
  basePrice: v.basePrice != null ? String(v.basePrice) : '',
  listPrice: v.listPrice != null ? String(v.listPrice) : '',
  activeYn: v.activeYn || 'Y',
});

function dimsToFormFlags(d?: VariantDimensions | null): Pick<ProductFormData, 'variantDimSizeYn' | 'variantDimColourYn' | 'variantDimStyleYn'> {
  const merged = { ...defaultVariantDimensions, ...d };
  return {
    variantDimSizeYn: merged.size ? 'Y' : 'N',
    variantDimColourYn: merged.colour ? 'Y' : 'N',
    variantDimStyleYn: merged.style ? 'Y' : 'N',
  };
}

const toFormData = (product: Product): ProductFormData => ({
  supplierUid: product.supplierUid || '',
  retailerUid: product.retailerUid || '',
  departmentUid: product.departmentUid || '',
  classUid: product.classUid || '',
  subclassUid: product.subclassUid || '',
  categoryUid: product.categoryUid || '',
  subcategoryUid: product.subcategoryUid || '',
  displayName: product.displayName || '',
  parentProductId: product.parentProductId || product.id || '',
  ...dimsToFormFlags(product.variantDimensions),
  sku: product.sku || '',
  upc: product.upc || '',
  ean: product.ean || '',
  gtin: product.gtin || '',
  description: product.description || '',
  variants: product.variants?.length ? product.variants.map(variantToForm) : [emptyVariantRow()],
  basePrice: product.basePrice != null ? String(product.basePrice) : '',
  listPrice: product.listPrice != null ? String(product.listPrice) : '',
  priceBy: product.priceBy || 'UNIT',
  weightUom: product.weightUom || 'LB',
  weight: product.weight != null ? String(product.weight) : '',
  dimensionUom: product.dimensionUom || 'IN',
  unitLength: product.unitLength != null ? String(product.unitLength) : '',
  unitWidth: product.unitWidth != null ? String(product.unitWidth) : '',
  unitHeight: product.unitHeight != null ? String(product.unitHeight) : '',
  casePack: product.casePack != null ? String(product.casePack) : '',
  uom: product.uom || 'EA',
  activeYn: product.activeYn || 'Y',
  createdDate: product.createdDate || '',
  createdBy: product.createdBy || '',
  source: product.source || 'UI',
  modifiedDate: product.modifiedDate || '',
  modifiedBy: product.modifiedBy || '',
  deletedYn: product.deletedYn || 'N',
});

export const useProductForm = (): UseProductFormReturn => {
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const prepareFormData = useCallback((data: ProductFormData): CreateProductRequest => {
    const aggregateModel =
      data.variants.map((v) => v.model.trim()).find((s) => s.length > 0) || undefined;
    return {
      displayName: data.displayName.trim(),
      parentProductId: toNullIfBlank(data.parentProductId),
      variantDimensions: {
        size: data.variantDimSizeYn === 'Y',
        colour: data.variantDimColourYn === 'Y',
        style: data.variantDimStyleYn === 'Y',
      },
      supplierUid: data.supplierUid.trim(),
      retailerUid: data.retailerUid.trim(),
      departmentUid: toNullIfBlank(data.departmentUid),
      classUid: toNullIfBlank(data.classUid),
      subclassUid: toNullIfBlank(data.subclassUid),
      categoryUid: toNullIfBlank(data.categoryUid),
      subcategoryUid: toNullIfBlank(data.subcategoryUid),
      model: aggregateModel,
      sku: data.sku.trim(),
      upc: data.upc.trim(),
      ean: data.ean.trim(),
      gtin: data.gtin.trim(),
      description: data.description.trim(),
      variants: data.variants.map((v) => ({
        id: v.id.trim(),
        sku: v.sku.trim(),
        model: v.model.trim(),
        upc: v.upc.trim(),
        ean: v.ean.trim(),
        gtin: v.gtin.trim(),
        size: v.size.trim(),
        colour: v.colour.trim(),
        style: v.style.trim(),
        description: v.description.trim() || undefined,
        basePrice: toNumberOrNull(v.basePrice),
        listPrice: toNumberOrNull(v.listPrice),
        activeYn: v.activeYn.trim() || 'Y',
      })),
      basePrice: toNumberOrNull(data.basePrice),
      listPrice: toNumberOrNull(data.listPrice),
      priceBy: data.priceBy.trim(),
      weightUom: data.weightUom.trim(),
      weight: toNumberOrNull(data.weight),
      dimensionUom: data.dimensionUom.trim(),
      unitLength: toNumberOrNull(data.unitLength),
      unitWidth: toNumberOrNull(data.unitWidth),
      unitHeight: toNumberOrNull(data.unitHeight),
      casePack: toIntOrNull(data.casePack),
      uom: data.uom.trim(),
      activeYn: data.activeYn.trim() || 'Y',
      createdDate: toNullIfBlank(data.createdDate),
      createdBy: data.createdBy.trim(),
      source: data.source.trim(),
      modifiedDate: toNullIfBlank(data.modifiedDate),
      modifiedBy: data.modifiedBy.trim(),
      deletedYn: data.deletedYn.trim() || 'N',
    };
  }, []);

  const validateForm = useCallback((): boolean => {
    const errors: FormErrors = {};

    if (!formData.supplierUid.trim()) errors.supplierUid = 'Supplier is required';
    if (!formData.retailerUid.trim()) errors.retailerUid = 'Retailer is required';
    if (!formData.displayName.trim()) errors.displayName = 'Product name is required';

    const dimSize = formData.variantDimSizeYn === 'Y';
    const dimColour = formData.variantDimColourYn === 'Y';
    const dimStyle = formData.variantDimStyleYn === 'Y';

    if (!formData.variants.length) {
      errors.variants = 'Add at least one SKU variant.';
    } else {
      let variantErr: string | undefined;
      for (let i = 0; i < formData.variants.length; i++) {
        const v = formData.variants[i];
        if (!v.sku.trim()) {
          variantErr = `Variant row ${i + 1}: SKU is required`;
          break;
        }
        if (dimSize && !v.size.trim()) {
          variantErr = `Variant row ${i + 1}: Size is required (enabled for this product)`;
          break;
        }
        if (dimColour && !v.colour.trim()) {
          variantErr = `Variant row ${i + 1}: Colour is required (enabled for this product)`;
          break;
        }
        if (dimStyle && !v.style.trim()) {
          variantErr = `Variant row ${i + 1}: Style is required (enabled for this product)`;
          break;
        }
      }
      if (variantErr) errors.variants = variantErr;
    }

    const numericFields: Array<{
      key: keyof ProductFormData;
      label: string;
      integerOnly?: boolean;
    }> = [
      { key: 'basePrice', label: 'Base price' },
      { key: 'listPrice', label: 'List price' },
      { key: 'weight', label: 'Weight' },
      { key: 'unitLength', label: 'Unit length' },
      { key: 'unitWidth', label: 'Unit width' },
      { key: 'unitHeight', label: 'Unit height' },
      { key: 'casePack', label: 'Case pack', integerOnly: true },
    ];

    numericFields.forEach(({ key, label, integerOnly }) => {
      const value = formData[key];
      if (typeof value !== 'string' || !value.trim()) return;
      const trimmed = value.trim();
      if (integerOnly) {
        if (!/^[-+]?\d+$/.test(trimmed)) errors[key] = `${label} must be a valid whole number`;
        return;
      }
      const parsed = Number(trimmed);
      if (!Number.isFinite(parsed)) errors[key] = `${label} must be a valid number`;
    });

    if (!errors.variants) {
      for (let i = 0; i < formData.variants.length; i++) {
        const v = formData.variants[i];
        for (const k of ['basePrice', 'listPrice'] as const) {
          const val = v[k];
          if (!val.trim()) continue;
          const n = Number(val.trim());
          if (!Number.isFinite(n)) {
            errors.variants = `Variant ${i + 1}: ${k} must be a number`;
            break;
          }
        }
        if (errors.variants) break;
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const updateTextField = useCallback(
    <K extends keyof ProductFormData>(field: K, value: ProductFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    },
    [],
  );

  const addVariantRow = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      variants: [...prev.variants, emptyVariantRow()],
    }));
  }, []);

  const removeVariantRow = useCallback((index: number) => {
    setFormData((prev) => {
      if (prev.variants.length <= 1) return prev;
      return { ...prev, variants: prev.variants.filter((_, i) => i !== index) };
    });
  }, []);

  const updateVariantField = useCallback(
    (index: number, field: keyof ProductVariantFormData, value: string) => {
      setFormData((prev) => ({
        ...prev,
        variants: prev.variants.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
      }));
    },
    [],
  );

  const resetForm = useCallback(() => {
    setFormData({ ...initialFormData, variants: [emptyVariantRow()] });
    setFormErrors({});
  }, []);

  const setFormFromProduct = useCallback((product: Product) => {
    setFormData(toFormData(product));
    setFormErrors({});
  }, []);

  const isValid = useMemo(() => {
    return (
      Object.keys(formErrors).length === 0 &&
      formData.supplierUid.trim() !== '' &&
      formData.retailerUid.trim() !== '' &&
      formData.displayName.trim() !== ''
    );
  }, [formData, formErrors]);

  return {
    formData,
    formErrors,
    isValid,
    updateTextField,
    validateForm,
    resetForm,
    setFormData,
    setFormFromProduct,
    prepareFormData,
    addVariantRow,
    removeVariantRow,
    updateVariantField,
  };
};
