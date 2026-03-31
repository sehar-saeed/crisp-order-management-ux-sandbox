import React from 'react';
import { Modal, Button, Spinner } from '../../ui';

interface GenericDeleteConfirmationModalProps<T> {
  isVisible: boolean;
  isLoading: boolean;
  entityName: string;
  entity: T | null;
  getDisplayName: (entity: T) => string;
  onConfirm: () => void;
  onCancel: () => void;
  renderEntityDetails?: (entity: T) => React.ReactNode;
}

export function GenericDeleteConfirmationModal<T>({
  isVisible,
  isLoading,
  entityName,
  entity,
  getDisplayName,
  onConfirm,
  onCancel,
  renderEntityDetails,
}: GenericDeleteConfirmationModalProps<T>) {
  if (!isVisible || !entity) return null;

  const displayName = getDisplayName(entity);

  return (
    <Modal title={`Delete ${entityName}`} onCloseClick={onCancel}>
      <div style={{ position: 'relative' }}>
        {isLoading && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            background: 'rgba(255,255,255,0.8)', zIndex: 1,
          }}>
            <Spinner />
          </div>
        )}

        <p style={{ marginBottom: '1rem' }}>
          Are you sure you want to delete <strong>{displayName}</strong>? This action cannot be undone.
        </p>

        {renderEntityDetails && (
          <div style={{ marginBottom: '1rem' }}>
            {renderEntityDetails(entity)}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
          <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={onConfirm} disabled={isLoading}>
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
}
