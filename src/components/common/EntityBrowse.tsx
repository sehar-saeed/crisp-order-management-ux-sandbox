import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { Button, Flex, Panel, Spinner, LettuceAgGrid, Headline, Notification } from '../../ui';
import type { NotificationType } from '../../ui';
import { ErrorState, NoRowsOverlay, CenteredPanel, ForbiddenAccess } from './CommonComponents';
import { GenericDeleteConfirmationModal } from './GenericDeleteConfirmationModal';
import { useNavigate } from 'react-router-dom';

export interface EntityBrowseConfig<T, TCreate, TUpdate> {
  entityName: string;
  entityNamePlural: string;
  pageTitle?: string;
  pageDescription?: string;
  permissionCheck: () => boolean;
  idFieldName: string;
  management: {
    loading: boolean;
    error: string | null;
    entities: T[];
    hasSearched: boolean;
    loadEntities: (showNotification?: boolean) => Promise<void>;
    createEntityAction: (data: TCreate) => Promise<T>;
    updateEntityAction: (data: TUpdate) => Promise<T>;
    deleteEntityAction: (id: string) => Promise<void>;
  };
  form: {
    formData: TCreate;
    formErrors: Record<string, string>;
    validateForm: () => boolean;
    resetForm: () => void;
    setFormData: (data: TCreate) => void;
    updateTextField: (field: string, value: string) => void;
  };
  columnDefs: (handlers: { onEdit: (entity: T) => void; onDelete: (entity: T) => void }) => any[];
  getEntityId: (entity: T) => string;
  getEntityDisplayName: (entity: T) => string;
  renderFormModal: (props: {
    isVisible: boolean;
    mode: 'create' | 'edit';
    isProcessing: boolean;
    formData: TCreate;
    formErrors: Record<string, string>;
    onSave: () => void;
    onClose: () => void;
    onInputChange: (field: string, value: string) => void;
    editingEntity?: T | null;
  }) => ReactNode;
  renderDeleteConfirmationDetails?: (entity: T) => ReactNode;
  getDetailRoute?: (entity: T) => string;
  adminNotification?: { content: ReactNode; title?: string; notificationType?: NotificationType };
  customContentAfterNotification?: ReactNode;
  customToolbarContent?: ReactNode;
  hideDefaultAddButton?: boolean;
  onCreateClick?: () => void;
}

interface ModalState<T> {
  isVisible: boolean;
  mode: 'create' | 'edit';
  editingEntity: T | null;
}

interface DeleteState<T> {
  isVisible: boolean;
  entity: T | null;
  isLoading: boolean;
}

export function EntityBrowse<T, TCreate, TUpdate>(
  { config }: { config: EntityBrowseConfig<T, TCreate, TUpdate> },
) {
  const navigate = useNavigate();
  const hasLoadedRef = useRef(false);

  const [modal, setModal] = useState<ModalState<T>>({
    isVisible: false,
    mode: 'create',
    editingEntity: null,
  });

  const [deleteState, setDeleteState] = useState<DeleteState<T>>({
    isVisible: false,
    entity: null,
    isLoading: false,
  });

  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      config.management.loadEntities(false);
    }
  }, []);

  const hasPermission = config.permissionCheck();
  if (!hasPermission) return <ForbiddenAccess />;

  const openCreateModal = useCallback(() => {
    if (config.onCreateClick) {
      config.onCreateClick();
      return;
    }
    config.form.resetForm();
    setModal({ isVisible: true, mode: 'create', editingEntity: null });
  }, [config]);

  const openEditModal = useCallback((entity: T) => {
    config.form.setFormData(entity as unknown as TCreate);
    setModal({ isVisible: true, mode: 'edit', editingEntity: entity });
  }, [config]);

  const closeModal = useCallback(() => {
    setModal({ isVisible: false, mode: 'create', editingEntity: null });
    config.form.resetForm();
  }, [config]);

  const handleSave = useCallback(async () => {
    if (!config.form.validateForm()) return;

    setIsProcessing(true);
    try {
      if (modal.mode === 'create') {
        await config.management.createEntityAction(config.form.formData);
      } else {
        await config.management.updateEntityAction(config.form.formData as unknown as TUpdate);
      }
      closeModal();
      await config.management.loadEntities(false);
    } finally {
      setIsProcessing(false);
    }
  }, [modal.mode, config, closeModal]);

  const openDeleteConfirmation = useCallback((entity: T) => {
    setDeleteState({ isVisible: true, entity, isLoading: false });
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteState.entity) return;
    setDeleteState(prev => ({ ...prev, isLoading: true }));
    try {
      const id = config.getEntityId(deleteState.entity!);
      await config.management.deleteEntityAction(id);
      setDeleteState({ isVisible: false, entity: null, isLoading: false });
      await config.management.loadEntities(false);
    } catch {
      setDeleteState(prev => ({ ...prev, isLoading: false }));
    }
  }, [deleteState.entity, config]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteState({ isVisible: false, entity: null, isLoading: false });
  }, []);

  const columns = useMemo(
    () => config.columnDefs({ onEdit: openEditModal, onDelete: openDeleteConfirmation }),
    [config, openEditModal, openDeleteConfirmation],
  );

  const handleRowClicked = useCallback((event: any) => {
    if (config.getDetailRoute) {
      navigate(config.getDetailRoute(event.data));
    }
  }, [config, navigate]);

  const title = config.pageTitle ?? `Manage ${config.entityNamePlural}`;

  const renderGridContent = () => {
    const { loading, error, entities, hasSearched } = config.management;

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
        rowData={entities}
        columnDefs={columns}
        noRowsOverlayComponent={() => (
          <NoRowsOverlay hasSearched={hasSearched} entityNamePlural={config.entityNamePlural} />
        )}
        onRowClicked={config.getDetailRoute ? handleRowClicked : undefined}
        rowStyle={config.getDetailRoute ? { cursor: 'pointer' } : undefined}
      />
    );
  };

  return (
    <div>
      <Headline as="h1">{title}</Headline>

      {config.pageDescription && (
        <Panel style={{ marginBottom: '1rem' }}>
          <Flex spaceBetween>
            <p>{config.pageDescription}</p>
            {!config.hideDefaultAddButton && (
              <Button onClick={openCreateModal}>Add New {config.entityName}</Button>
            )}
          </Flex>
        </Panel>
      )}

      {!config.pageDescription && !config.hideDefaultAddButton && (
        <div style={{ marginBottom: '1rem' }}>
          <Button onClick={openCreateModal}>Add New {config.entityName}</Button>
        </div>
      )}

      {config.adminNotification && (
        <div style={{ marginBottom: '1rem' }}>
          <Notification
            notificationType={config.adminNotification.notificationType ?? 'info'}
            content={String(config.adminNotification.content)}
            title={config.adminNotification.title}
          />
        </div>
      )}

      {config.customContentAfterNotification}

      {config.customToolbarContent && (
        <div style={{ marginBottom: '1rem' }}>
          {config.customToolbarContent}
        </div>
      )}

      <Panel>
        {renderGridContent()}
      </Panel>

      {config.renderFormModal({
        isVisible: modal.isVisible,
        mode: modal.mode,
        isProcessing,
        formData: config.form.formData,
        formErrors: config.form.formErrors,
        onSave: handleSave,
        onClose: closeModal,
        onInputChange: config.form.updateTextField,
        editingEntity: modal.editingEntity,
      })}

      <GenericDeleteConfirmationModal
        isVisible={deleteState.isVisible}
        isLoading={deleteState.isLoading}
        entityName={config.entityName}
        entity={deleteState.entity}
        getDisplayName={config.getEntityDisplayName}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        renderEntityDetails={config.renderDeleteConfirmationDetails}
      />
    </div>
  );
}
