import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Panel, Card, Headline, Button, Flex, Spinner, Modal } from '../ui';
import { fetchSupplierById, updateSupplier, deleteSupplier } from '../mock/api';
import { useSupplierForm } from '../hooks/useSupplierForm';
import { FormField } from '../components/common/FormField';
import { GenericDeleteConfirmationModal } from '../components/common/GenericDeleteConfirmationModal';
import { ErrorState } from '../components/common/CommonComponents';
import { notificationService } from '../services/NotificationService';
import type { Supplier } from '../types/suppliers';

const InfoRow: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
  <div style={{ marginBottom: '0.75rem' }}>
    <div style={{ fontSize: '12px', color: 'var(--cool-gray-50)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
    <div style={{ fontSize: '15px', marginTop: '2px' }}>{value || '—'}</div>
  </div>
);

const StatusBadge: React.FC<{ active: boolean }> = ({ active }) => (
  <span style={{
    display: 'inline-block', padding: '2px 10px', borderRadius: '12px',
    fontSize: '12px', fontWeight: 600, color: '#fff',
    background: active ? '#22c55e' : '#ef4444',
  }}>
    {active ? 'Active' : 'Inactive'}
  </span>
);

export const SupplierDetail: React.FC = () => {
  const { supplierId } = useParams<{ supplierId: string }>();
  const navigate = useNavigate();

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { formData, formErrors, validateForm, resetForm, setFormData, updateTextField } = useSupplierForm();

  const loadSupplier = async () => {
    if (!supplierId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchSupplierById(supplierId);
      if (!result) {
        setSupplier(null);
      } else {
        setSupplier(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load supplier');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSupplier();
  }, [supplierId]);

  const handleOpenEdit = () => {
    if (!supplier) return;
    setFormData({
      name: supplier.name,
      shortCode: supplier.shortCode,
      email: supplier.email,
      phoneNumber: supplier.phoneNumber,
    });
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (!supplier || !validateForm()) return;
    setIsProcessing(true);
    try {
      const updated = await updateSupplier({ ...formData, supplierUid: supplier.supplierUid });
      setSupplier(updated);
      setShowEditModal(false);
      resetForm();
      notificationService.success(`Supplier "${updated.name}" updated successfully`);
    } catch (err) {
      notificationService.error(err instanceof Error ? err.message : 'Failed to update supplier');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!supplier) return;
    setIsDeleting(true);
    try {
      await deleteSupplier(supplier.supplierUid);
      notificationService.success(`Supplier "${supplier.name}" deleted successfully`);
      navigate('/suppliers');
    } catch (err) {
      notificationService.error(err instanceof Error ? err.message : 'Failed to delete supplier');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <Panel style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <Spinner />
      </Panel>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem' }}>
        <ErrorState message={error} />
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <Button variant="secondary" onClick={() => navigate('/suppliers')}>Back to Suppliers</Button>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div style={{ padding: '2rem' }}>
        <ErrorState message="Supplier not found" />
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <Button variant="secondary" onClick={() => navigate('/suppliers')}>Back to Suppliers</Button>
        </div>
      </div>
    );
  }

  const formatDate = (d?: string) => d ? new Date(d).toLocaleString() : '—';

  return (
    <div style={{ padding: '2rem' }}>
      <Flex spaceBetween>
        <Headline as="h1">Supplier Details</Headline>
        <Button variant="secondary" onClick={() => navigate('/suppliers')}>← Back</Button>
      </Flex>

      <Card style={{ marginTop: '1.5rem', padding: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div>
            <Headline as="h3">Basic Info</Headline>
            <div style={{ marginTop: '1rem' }}>
              <InfoRow label="UID" value={supplier.supplierUid} />
              <InfoRow label="Short Code" value={supplier.shortCode} />
              <InfoRow label="Name" value={supplier.name} />
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '12px', color: 'var(--cool-gray-50)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</div>
                <div style={{ marginTop: '4px' }}><StatusBadge active={supplier.activeYn === 'Y'} /></div>
              </div>
            </div>
          </div>
          <div>
            <Headline as="h3">Contact Info</Headline>
            <div style={{ marginTop: '1rem' }}>
              <InfoRow label="Email" value={supplier.email} />
              <InfoRow label="Phone" value={supplier.phoneNumber} />
            </div>
          </div>
        </div>
      </Card>

      <Card style={{ marginTop: '1.5rem', padding: '1.5rem' }}>
        <Headline as="h3">Record Info</Headline>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
          <InfoRow label="Created Date" value={formatDate(supplier.createdDate)} />
          <InfoRow label="Created By" value={supplier.createdBy} />
          <InfoRow label="Modified Date" value={formatDate(supplier.modifiedDate)} />
          <InfoRow label="Modified By" value={supplier.modifiedBy} />
        </div>
      </Card>

      <Flex style={{ gap: '1rem', marginTop: '1.5rem' }}>
        <Button onClick={handleOpenEdit}>Edit Supplier</Button>
        <Button
          variant="secondary"
          style={{ color: '#ef4444', borderColor: '#ef4444' }}
          onClick={() => setShowDeleteModal(true)}
        >
          Delete Supplier
        </Button>
        <Button variant="secondary" onClick={() => navigate('/suppliers')}>Back to List</Button>
      </Flex>

      {showEditModal && (
        <Modal title="Edit Supplier" onCloseClick={() => { setShowEditModal(false); resetForm(); }}>
          <div style={{ position: 'relative' }}>
            {isProcessing && (
              <div className="confirm-modal-spinner-overlay">
                <Spinner />
              </div>
            )}
            <FormField id="name" label="Name" value={formData.name} error={formErrors.name} onChange={(v) => updateTextField('name', v)} required />
            <FormField id="shortCode" label="Short Code" value={formData.shortCode} error={formErrors.shortCode} onChange={(v) => updateTextField('shortCode', v)} required />
            <FormField id="email" label="Email" type="email" value={formData.email} error={formErrors.email} onChange={(v) => updateTextField('email', v)} required />
            <FormField id="phoneNumber" label="Phone Number" value={formData.phoneNumber} onChange={(v) => updateTextField('phoneNumber', v)} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
              <Button variant="secondary" onClick={() => { setShowEditModal(false); resetForm(); }} disabled={isProcessing}>Cancel</Button>
              <Button onClick={handleSave} disabled={isProcessing}>Update</Button>
            </div>
          </div>
        </Modal>
      )}

      <GenericDeleteConfirmationModal<Supplier>
        isVisible={showDeleteModal}
        isLoading={isDeleting}
        entityName="Supplier"
        entity={supplier}
        getDisplayName={(s) => s.name}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteModal(false)}
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
