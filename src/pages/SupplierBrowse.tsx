import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Panel, Card, Headline, Button, Flex, Spinner, Modal, DataGrid } from '../ui';
import { useEntityManagement } from '../hooks/useEntityManagement';
import { useSupplierForm } from '../hooks/useSupplierForm';
import { fetchSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../mock/api';
import { GenericDeleteConfirmationModal } from '../components/common/GenericDeleteConfirmationModal';
import { FormField } from '../components/common/FormField';
import { ErrorState } from '../components/common/CommonComponents';
import type { Supplier, CreateSupplierRequest, UpdateSupplierRequest } from '../types/suppliers';

const SupplierFormModal: React.FC<{
  isVisible: boolean;
  isEditing: boolean;
  isProcessing: boolean;
  formData: CreateSupplierRequest;
  formErrors: Record<string, string>;
  onFieldChange: (field: string, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}> = ({ isVisible, isEditing, isProcessing, formData, formErrors, onFieldChange, onSave, onCancel }) => {
  if (!isVisible) return null;

  return (
    <Modal title={isEditing ? 'Edit Supplier' : 'Add New Supplier'} onCloseClick={onCancel}>
      <div style={{ position: 'relative' }}>
        {isProcessing && (
          <div className="confirm-modal-spinner-overlay">
            <Spinner />
          </div>
        )}
        <FormField id="name" label="Name" value={formData.name} error={formErrors.name} onChange={(v) => onFieldChange('name', v)} required />
        <FormField id="shortCode" label="Short Code" value={formData.shortCode} error={formErrors.shortCode} onChange={(v) => onFieldChange('shortCode', v)} required />
        <FormField id="email" label="Email" type="email" value={formData.email} error={formErrors.email} onChange={(v) => onFieldChange('email', v)} required />
        <FormField id="phoneNumber" label="Phone Number" value={formData.phoneNumber} onChange={(v) => onFieldChange('phoneNumber', v)} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
          <Button variant="secondary" onClick={onCancel} disabled={isProcessing}>Cancel</Button>
          <Button onClick={onSave} disabled={isProcessing}>{isEditing ? 'Update' : 'Create'}</Button>
        </div>
      </div>
    </Modal>
  );
};

export const SupplierBrowse: React.FC = () => {
  const navigate = useNavigate();
  const {
    loading, error, entities: suppliers, hasSearched,
    loadEntities, createEntityAction, updateEntityAction, deleteEntityAction,
  } = useEntityManagement<Supplier, CreateSupplierRequest, UpdateSupplierRequest>({
    entityName: 'Supplier',
    entityNamePlural: 'Suppliers',
    fetchEntities: fetchSuppliers,
    createEntity: createSupplier,
    updateEntity: updateSupplier,
    deleteEntity: deleteSupplier,
    getEntityDisplayName: (s) => s.name,
  });

  const { formData, formErrors, validateForm, resetForm, setFormData, updateTextField } = useSupplierForm();

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadEntities(false);
  }, []);

  const handleCreate = () => {
    resetForm();
    setEditingSupplier(null);
    setShowFormModal(true);
  };

  const handleEdit = (supplier: Supplier) => {
    setFormData({
      name: supplier.name,
      shortCode: supplier.shortCode,
      email: supplier.email,
      phoneNumber: supplier.phoneNumber,
    });
    setEditingSupplier(supplier);
    setShowFormModal(true);
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setIsProcessing(true);
    try {
      if (editingSupplier) {
        await updateEntityAction({ ...formData, supplierUid: editingSupplier.supplierUid });
      } else {
        await createEntityAction(formData);
      }
      setShowFormModal(false);
      resetForm();
      await loadEntities(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteEntityAction(deleteTarget.supplierUid);
      setDeleteTarget(null);
      await loadEntities(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const columnDefs = useMemo(() => [
    { headerName: 'Name', field: 'name', flex: 2 },
    { headerName: 'Short Code', field: 'shortCode', flex: 1 },
    { headerName: 'Email', field: 'email', flex: 2 },
    { headerName: 'Phone Number', field: 'phoneNumber', flex: 1.5 },
    {
      headerName: 'Status',
      field: 'activeYn',
      flex: 1,
      cellRenderer: (params: any) => {
        const active = params.value === 'Y';
        return `<span style="display:inline-block;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:600;color:#fff;background:${active ? '#22c55e' : '#ef4444'}">${active ? 'Active' : 'Inactive'}</span>`;
      },
    },
    {
      headerName: 'Actions',
      field: 'supplierUid',
      flex: 1.5,
      cellRenderer: () => '',
      onCellClicked: () => {},
    },
  ], []);

  const ActionCellRenderer: React.FC<{ data: Supplier }> = ({ data }) => (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', height: '100%' }}>
      <Button size="S" variant="secondary" onClick={(e) => { e.stopPropagation(); handleEdit(data); }}>Edit</Button>
      <Button size="S" variant="secondary" style={{ color: '#ef4444', borderColor: '#ef4444' }} onClick={(e) => { e.stopPropagation(); setDeleteTarget(data); }}>Delete</Button>
    </div>
  );

  const gridColumnDefs = useMemo(() => [
    { headerName: 'Name', field: 'name', flex: 2 },
    { headerName: 'Short Code', field: 'shortCode', flex: 1 },
    { headerName: 'Email', field: 'email', flex: 2 },
    { headerName: 'Phone Number', field: 'phoneNumber', flex: 1.5 },
    {
      headerName: 'Status',
      field: 'activeYn',
      flex: 1,
      cellRenderer: (params: any) => {
        const active = params.value === 'Y';
        return (
          <span style={{
            display: 'inline-block', padding: '2px 10px', borderRadius: '12px',
            fontSize: '12px', fontWeight: 600, color: '#fff',
            background: active ? '#22c55e' : '#ef4444',
          }}>
            {active ? 'Active' : 'Inactive'}
          </span>
        );
      },
    },
    {
      headerName: 'Actions',
      field: 'supplierUid',
      flex: 1.5,
      cellRenderer: ActionCellRenderer,
    },
  ], []);

  return (
    <div style={{ padding: '2rem' }}>
      <Flex spaceBetween>
        <div>
          <Headline as="h1">Supplier Management</Headline>
          <p style={{ color: 'var(--cool-gray-50)', margin: '0.25rem 0 0' }}>
            Browse and add new suppliers to manage your supply chain.
          </p>
        </div>
        <Button onClick={handleCreate}>+ Add Supplier</Button>
      </Flex>

      {error && <div style={{ marginTop: '1rem' }}><ErrorState message={error} /></div>}

      {loading && !hasSearched ? (
        <Panel style={{ marginTop: '2rem', textAlign: 'center', padding: '3rem' }}>
          <Spinner />
        </Panel>
      ) : (
        <div style={{ marginTop: '1.5rem' }}>
          <DataGrid
            rowData={suppliers}
            columnDefs={gridColumnDefs}
            onRowClicked={(e) => navigate(`/suppliers/${e.data.supplierUid}`)}
            rowStyle={{ cursor: 'pointer' }}
          />
        </div>
      )}

      <SupplierFormModal
        isVisible={showFormModal}
        isEditing={!!editingSupplier}
        isProcessing={isProcessing}
        formData={formData}
        formErrors={formErrors}
        onFieldChange={updateTextField}
        onSave={handleSave}
        onCancel={() => { setShowFormModal(false); resetForm(); }}
      />

      <GenericDeleteConfirmationModal<Supplier>
        isVisible={!!deleteTarget}
        isLoading={isDeleting}
        entityName="Supplier"
        entity={deleteTarget}
        getDisplayName={(s) => s.name}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        renderEntityDetails={(s) => (
          <div style={{ fontSize: '14px', color: 'var(--cool-gray-40)' }}>
            <p><strong>Name:</strong> {s.name}</p>
            <p><strong>Email:</strong> {s.email}</p>
            <p><strong>Status:</strong> {s.activeYn === 'Y' ? 'Active' : 'Inactive'}</p>
          </div>
        )}
      />
    </div>
  );
};
