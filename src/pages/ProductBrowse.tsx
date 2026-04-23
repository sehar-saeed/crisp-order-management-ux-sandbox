import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Button,
  TextField,
  Panel,
  Headline,
  LettuceAgGrid,
  Spinner,
  Flex,
} from '../ui';
import {
  ErrorState,
  NoRowsOverlay,
  CenteredPanel,
  ForbiddenAccess,
} from '../components/common/CommonComponents';
import { GenericDeleteConfirmationModal } from '../components/common/GenericDeleteConfirmationModal';
import { useEntityManagement } from '../hooks/useEntityManagement';
import { useProductForm } from '../hooks/useProductForm';
import type {
  CreateProductRequest,
  Product,
  ProductFormData,
  ProductGridRowProduct,
  ProductManagementGridRow,
  ProductVariant,
  UpdateProductRequest,
} from '../types/products';
import {
  createProduct,
  deleteProduct,
  deleteProductVariant,
  fetchProducts,
  updateProduct,
  fetchRetailers,
  fetchSuppliers,
  fetchDepartments,
  fetchClasses,
  fetchSubclasses,
  fetchCategories,
  fetchSubcategories,
} from '../mock/api';
import { useSession } from '../mock/SessionProvider';
import type { Retailer } from '../types/retailers';
import type { Supplier } from '../types/suppliers';
import type { Department, DepartmentClass, Subclass } from '../types/retailerProductHierarchy';
import type { Category, Subcategory } from '../types/categoryHierarchy';
import { ProductFormModal } from '../components/ProductFormModal';
import { createLogicalProductColumnDefs } from '../config/ProductGridConfig';
import {
  buildProductGridRows,
  useProductSearchFilter,
} from '../components/product-management/ProductGridCells';

const checkProductManagementPermission = (): boolean => true;

type PendingVariantDelete = { product: Product; variant: ProductVariant };

export default function ProductBrowse() {
  const { clientShortCode } = useSession();
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [classes, setClasses] = useState<DepartmentClass[]>([]);
  const [subclasses, setSubclasses] = useState<Subclass[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [partSearchTerm, setPartSearchTerm] = useState('');
  const [expandedProductIds, setExpandedProductIds] = useState<Set<string>>(() => new Set());
  /** Parents the user explicitly collapsed while search would still auto-expand variants. */
  const [collapsedWhileSearchIds, setCollapsedWhileSearchIds] = useState<Set<string>>(() => new Set());

  const [modal, setModal] = useState<{
    isVisible: boolean;
    mode: 'create' | 'edit';
    editingEntity: Product | null;
  }>({ isVisible: false, mode: 'create', editingEntity: null });

  const [deleteProductState, setDeleteProductState] = useState<{
    isVisible: boolean;
    entity: Product | null;
    isLoading: boolean;
  }>({ isVisible: false, entity: null, isLoading: false });

  const [deleteVariantState, setDeleteVariantState] = useState<{
    isVisible: boolean;
    pending: PendingVariantDelete | null;
    isLoading: boolean;
  }>({ isVisible: false, pending: null, isLoading: false });

  const [isProcessing, setIsProcessing] = useState(false);
  const hasLoadedRef = useRef(false);

  const form = useProductForm();

  useEffect(() => {
    if (!clientShortCode) return;

    Promise.all([
      fetchRetailers(),
      fetchSuppliers(),
      fetchCategories(clientShortCode),
      fetchSubcategories(clientShortCode),
    ])
      .then(([retailerData, supplierData, categoryData, subcategoryData]) => {
        setRetailers(retailerData);
        setSuppliers(supplierData);
        setCategories(categoryData);
        setSubcategories(subcategoryData);
      })
      .catch((error) => {
        console.error('Failed to load product lookup data:', error);
      });
  }, [clientShortCode]);

  useEffect(() => {
    if (!clientShortCode) return;

    const retailerUid = form.formData.retailerUid.trim();
    if (!retailerUid) {
      setDepartments([]);
      setClasses([]);
      setSubclasses([]);
      return;
    }

    let isActive = true;

    Promise.all([
      fetchDepartments(clientShortCode, retailerUid),
      fetchClasses(clientShortCode, retailerUid),
      fetchSubclasses(clientShortCode, retailerUid),
    ])
      .then(([departmentData, classData, subclassData]) => {
        if (!isActive) return;
        setDepartments(departmentData);
        setClasses(classData);
        setSubclasses(subclassData);
      })
      .catch((error) => {
        if (!isActive) return;
        console.error('Failed to load retailer hierarchy data:', error);
      });

    return () => {
      isActive = false;
    };
  }, [clientShortCode, form.formData.retailerUid]);

  const management = useEntityManagement<
    Product,
    ProductFormData,
    ProductFormData & { id: string }
  >({
    entityName: 'Product',
    entityNamePlural: 'Products',
    fetchEntities: () => {
      if (!clientShortCode) throw new Error('Session not ready — missing client context');
      return fetchProducts();
    },
    createEntity: (data: ProductFormData) => {
      if (!clientShortCode) throw new Error('Session not ready — missing client context');
      const preparedData: CreateProductRequest = form.prepareFormData(data);
      return createProduct(preparedData);
    },
    updateEntity: (data: ProductFormData & { id: string }) => {
      if (!clientShortCode) throw new Error('Session not ready — missing client context');
      const preparedData = form.prepareFormData(data);
      return updateProduct({ ...preparedData, id: data.id } as UpdateProductRequest);
    },
    deleteEntity: (id: string) => {
      if (!clientShortCode) throw new Error('Session not ready — missing client context');
      return deleteProduct(id);
    },
    getEntityDisplayName: (product: Product) =>
      product.displayName?.trim() ||
      product.parentProductId?.trim() ||
      product.id ||
      'Product',
  });

  const managementRef = useRef(management);
  managementRef.current = management;

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    void managementRef.current.loadEntities(false);
  }, []);

  const enrichedProducts = useMemo<ProductGridRowProduct[]>(() => {
    return management.entities.map((product) => {
      const retailer = retailers.find((r) => r.retailerUid === product.retailerUid);
      const supplier = suppliers.find((s) => s.supplierUid === product.supplierUid);
      const department = departments.find((d) => d.id === product.departmentUid);
      const departmentClass = classes.find((c) => c.id === product.classUid);
      const subclass = subclasses.find((s) => s.id === product.subclassUid);
      const category = categories.find((c) => c.id === product.categoryUid);
      const subcategory = subcategories.find((s) => s.id === product.subcategoryUid);

      return {
        ...product,
        retailerName: retailer ? `${retailer.name} (${retailer.shortCode})` : product.retailerUid,
        supplierName: supplier ? `${supplier.name} (${supplier.shortCode})` : product.supplierUid,
        departmentName: department?.displayName || '',
        className: departmentClass?.displayName || '',
        subclassName: subclass?.displayName || '',
        categoryName: category ? `${category.code} - ${category.name}` : '',
        subcategoryName: subcategory ? `${subcategory.code} - ${subcategory.name}` : '',
      };
    });
  }, [
    management.entities,
    retailers,
    suppliers,
    departments,
    classes,
    subclasses,
    categories,
    subcategories,
  ]);

  const { filtered, expandForSearch } = useProductSearchFilter(
    enrichedProducts,
    partSearchTerm,
  );

  useEffect(() => {
    setCollapsedWhileSearchIds(new Set());
  }, [partSearchTerm]);

  const effectiveExpandedIds = useMemo(() => {
    const merged = new Set<string>();
    expandedProductIds.forEach((id) => merged.add(id));
    expandForSearch.forEach((id) => {
      if (!collapsedWhileSearchIds.has(id)) merged.add(id);
    });
    return merged;
  }, [expandedProductIds, expandForSearch, collapsedWhileSearchIds]);

  const rowData = useMemo(
    () => buildProductGridRows(filtered as ProductGridRowProduct[], effectiveExpandedIds),
    [filtered, effectiveExpandedIds],
  );

  const productDisplayName = useCallback(
    (product: Product) =>
      product.displayName?.trim() ||
      product.parentProductId?.trim() ||
      product.id ||
      'Product',
    [],
  );

  const handleOpenCreateModal = useCallback(() => {
    form.resetForm();
    setModal({ isVisible: true, mode: 'create', editingEntity: null });
  }, [form]);

  const openEditModal = useCallback(
    (entity: Product) => {
      form.setFormFromProduct(entity);
      setModal({ isVisible: true, mode: 'edit', editingEntity: entity });
    },
    [form],
  );

  const closeModal = useCallback(() => {
    setModal({ isVisible: false, mode: 'create', editingEntity: null });
    form.resetForm();
  }, [form]);

  const handleSave = useCallback(async () => {
    if (!form.validateForm()) return;

    setIsProcessing(true);
    try {
      if (modal.mode === 'create') {
        await management.createEntityAction(form.formData);
      } else if (modal.editingEntity?.id) {
        await management.updateEntityAction({
          ...form.formData,
          id: modal.editingEntity.id,
        });
      }
      closeModal();
      await management.loadEntities(false);
    } finally {
      setIsProcessing(false);
    }
  }, [modal.mode, modal.editingEntity, form, management, closeModal]);

  const openDeleteProduct = useCallback((entity: Product) => {
    setDeleteProductState({ isVisible: true, entity, isLoading: false });
  }, []);

  const handleDeleteProductConfirm = useCallback(async () => {
    if (!deleteProductState.entity?.id) return;
    setDeleteProductState((prev) => ({ ...prev, isLoading: true }));
    try {
      await management.deleteEntityAction(deleteProductState.entity.id);
      setDeleteProductState({ isVisible: false, entity: null, isLoading: false });
      setExpandedProductIds((prev) => {
        const next = new Set(prev);
        next.delete(deleteProductState.entity!.id!);
        return next;
      });
      setCollapsedWhileSearchIds((prev) => {
        const next = new Set(prev);
        next.delete(deleteProductState.entity!.id!);
        return next;
      });
      await management.loadEntities(false);
    } catch {
      setDeleteProductState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [deleteProductState.entity, management]);

  const handleDeleteProductCancel = useCallback(() => {
    setDeleteProductState({ isVisible: false, entity: null, isLoading: false });
  }, []);

  const openDeleteVariant = useCallback((product: Product, variant: ProductVariant) => {
    setDeleteVariantState({ isVisible: true, pending: { product, variant }, isLoading: false });
  }, []);

  const handleDeleteVariantConfirm = useCallback(async () => {
    const { pending } = deleteVariantState;
    if (!pending?.product.id || !pending.variant.id) return;
    setDeleteVariantState((prev) => ({ ...prev, isLoading: true }));
    try {
      await deleteProductVariant(pending.product.id, pending.variant.id);
      setDeleteVariantState({ isVisible: false, pending: null, isLoading: false });
      await management.loadEntities(false);
    } catch {
      setDeleteVariantState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [deleteVariantState.pending, management]);

  const handleDeleteVariantCancel = useCallback(() => {
    setDeleteVariantState({ isVisible: false, pending: null, isLoading: false });
  }, []);

  const onToggleExpand = useCallback(
    (productId: string) => {
      const searchWantsOpen = expandForSearch.has(productId);
      const userOpen = expandedProductIds.has(productId);
      const visible = effectiveExpandedIds.has(productId);

      if (visible) {
        if (userOpen) {
          setExpandedProductIds((prev) => {
            const next = new Set(prev);
            next.delete(productId);
            return next;
          });
        }
        if (searchWantsOpen) {
          setCollapsedWhileSearchIds((prev) => new Set(prev).add(productId));
        }
        return;
      }

      setCollapsedWhileSearchIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
      setExpandedProductIds((prev) => new Set(prev).add(productId));
    },
    [expandForSearch, expandedProductIds, effectiveExpandedIds],
  );

  const columnDefs = useMemo(
    () =>
      createLogicalProductColumnDefs({
        expandedProductIds: effectiveExpandedIds,
        onToggleExpand,
        onEditProduct: openEditModal,
        onEditVariant: (p, _v) => openEditModal(p),
        onDeleteProduct: openDeleteProduct,
        onDeleteVariant: openDeleteVariant,
      }),
    [effectiveExpandedIds, onToggleExpand, openEditModal, openDeleteProduct, openDeleteVariant],
  );

  const updateTextField = useCallback(
    (field: string, value: string) => {
      if (!(field in form.formData)) {
        console.warn(`Invalid field name: ${field}`);
        return;
      }

      const typedField = field as keyof ProductFormData;
      const previousValue = form.formData[typedField];

      form.updateTextField(typedField, value as ProductFormData[keyof ProductFormData]);

      if (typedField === 'retailerUid' && previousValue !== value) {
        form.updateTextField('departmentUid', '');
        form.updateTextField('classUid', '');
        form.updateTextField('subclassUid', '');
      }

      if (typedField === 'departmentUid' && previousValue !== value) {
        form.updateTextField('classUid', '');
        form.updateTextField('subclassUid', '');
      }

      if (typedField === 'classUid' && previousValue !== value) {
        form.updateTextField('subclassUid', '');
      }
    },
    [form],
  );

  const getRowClass = useCallback((params: { data?: ProductManagementGridRow }) => {
    const d = params.data;
    if (!d) return '';
    return d.rowKind === 'product' ? 'pm-row--product' : 'pm-row--variant';
  }, []);

  const getRowId = useCallback((params: { data: ProductManagementGridRow }) => {
    const d = params.data;
    if (d.rowKind === 'product') return d.product.id ?? 'product-unknown';
    return `${d.product.id ?? 'p'}::${d.variant.id ?? 'v'}`;
  }, []);

  if (!checkProductManagementPermission()) {
    return <ForbiddenAccess />;
  }

  const title = 'Product Management';
  const pageDescription =
    'Browse logical products first, then expand to see SKU variants (size, colour, style). Use quick search across product names and variant attributes.';

  const renderGridContent = () => {
    const { loading, error, hasSearched } = management;

    if (loading) {
      return (
        <CenteredPanel>
          <Spinner size={48} />
        </CenteredPanel>
      );
    }

    if (error) {
      return <ErrorState message={error} />;
    }

    return (
      <LettuceAgGrid
        rowData={rowData}
        columnDefs={columnDefs}
        getRowClass={getRowClass}
        getRowHeight={(p) => {
          const d = p.data as ProductManagementGridRow | undefined;
          if (d?.rowKind === 'variant') return 52;
          return undefined;
        }}
        getRowId={getRowId}
        noRowsOverlayComponent={() => (
          <NoRowsOverlay hasSearched={hasSearched} entityNamePlural="Products" />
        )}
      />
    );
  };

  return (
    <div style={{ padding: '2rem' }}>
      <Headline as="h1">{title}</Headline>

      <Panel style={{ marginBottom: '1rem' }}>
        <Flex spaceBetween>
          <p style={{ margin: 0, maxWidth: '52rem' }}>{pageDescription}</p>
        </Flex>
      </Panel>

      <div style={{ marginBottom: '1rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ minWidth: '320px', flex: '1 1 320px' }}>
            <TextField
              label="Quick search"
              value={partSearchTerm}
              onChange={(value: string) => setPartSearchTerm(value)}
              placeholder="Product name, model, or variant SKU / size / colour / style"
            />
          </div>
          <Button onClick={handleOpenCreateModal} variant="primary" size="M">
            + New product
          </Button>
        </div>
      </div>

      <Panel>{renderGridContent()}</Panel>

      <ProductFormModal
        isVisible={modal.isVisible}
        mode={modal.mode}
        isProcessing={isProcessing}
        formData={form.formData}
        formErrors={form.formErrors}
        onSave={handleSave}
        onClose={closeModal}
        onInputChange={updateTextField}
        onAddVariantRow={form.addVariantRow}
        onRemoveVariantRow={form.removeVariantRow}
        onVariantFieldChange={form.updateVariantField}
        retailers={retailers}
        suppliers={suppliers}
        departments={departments}
        classes={classes}
        subclasses={subclasses}
        categories={categories}
        subcategories={subcategories}
      />

      <GenericDeleteConfirmationModal<Product>
        isVisible={deleteProductState.isVisible}
        isLoading={deleteProductState.isLoading}
        entityName="product"
        entity={deleteProductState.entity}
        getDisplayName={productDisplayName}
        onConfirm={handleDeleteProductConfirm}
        onCancel={handleDeleteProductCancel}
        renderEntityDetails={(product: Product) => (
          <>
            <p>
              <strong>Display name:</strong> {product.displayName || '—'}
            </p>
            <p>
              <strong>Parent product ID:</strong> {product.parentProductId || product.id || '—'}
            </p>
            <p>
              <strong>Retailer UID:</strong> {product.retailerUid}
            </p>
            <p>
              <strong>Supplier UID:</strong> {product.supplierUid}
            </p>
            <p>
              <strong>SKU variants:</strong> {product.variants?.length ?? 0}
            </p>
          </>
        )}
      />

      <GenericDeleteConfirmationModal<PendingVariantDelete>
        isVisible={deleteVariantState.isVisible}
        isLoading={deleteVariantState.isLoading}
        entityName="SKU variant"
        entity={deleteVariantState.pending}
        getDisplayName={(x) =>
          `${x.variant.sku || '(No SKU)'} — ${x.product.displayName || x.product.parentProductId || 'Product'}`}
        onConfirm={handleDeleteVariantConfirm}
        onCancel={handleDeleteVariantCancel}
        renderEntityDetails={(x) => (
          <>
            <p>
              <strong>Parent product:</strong> {x.product.displayName || x.product.parentProductId}
            </p>
            <p>
              <strong>Size:</strong> {x.variant.size || '—'}
            </p>
            <p>
              <strong>Colour:</strong> {x.variant.colour || '—'}
            </p>
            <p>
              <strong>Style:</strong> {x.variant.style || '—'}
            </p>
          </>
        )}
      />
    </div>
  );
}
