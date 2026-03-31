import { useState, useCallback } from 'react';
import { notificationService } from '../services/NotificationService';

interface EntityManagementConfig<T, TCreate, TUpdate> {
  entityName: string;
  entityNamePlural: string;
  fetchEntities: () => Promise<T[]>;
  createEntity: (data: TCreate) => Promise<T>;
  updateEntity: (data: TUpdate) => Promise<T>;
  deleteEntity: (id: string) => Promise<void>;
  getEntityDisplayName: (entity: T) => string;
}

export function useEntityManagement<T, TCreate, TUpdate>(
  config: EntityManagementConfig<T, TCreate, TUpdate>,
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entities, setEntities] = useState<T[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const resetError = useCallback(() => setError(null), []);

  const loadEntities = useCallback(async (showNotification = true) => {
    setLoading(true);
    setError(null);
    try {
      const result = await config.fetchEntities();
      setEntities(result);
      setHasSearched(true);
      if (showNotification) {
        notificationService.success(
          `${config.entityNamePlural} loaded successfully`,
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : `Failed to load ${config.entityNamePlural.toLowerCase()}`;
      setError(message);
      notificationService.error(message);
    } finally {
      setLoading(false);
    }
  }, [config]);

  const createEntityAction = useCallback(async (data: TCreate): Promise<T> => {
    try {
      const created = await config.createEntity(data);
      notificationService.success(
        `${config.entityName} "${config.getEntityDisplayName(created)}" created successfully`,
      );
      return created;
    } catch (err) {
      const message = err instanceof Error ? err.message : `Failed to create ${config.entityName.toLowerCase()}`;
      notificationService.error(message);
      throw err;
    }
  }, [config]);

  const updateEntityAction = useCallback(async (data: TUpdate): Promise<T> => {
    try {
      const updated = await config.updateEntity(data);
      notificationService.success(
        `${config.entityName} "${config.getEntityDisplayName(updated)}" updated successfully`,
      );
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : `Failed to update ${config.entityName.toLowerCase()}`;
      notificationService.error(message);
      throw err;
    }
  }, [config]);

  const deleteEntityAction = useCallback(async (id: string): Promise<void> => {
    try {
      await config.deleteEntity(id);
      notificationService.success(
        `${config.entityName} deleted successfully`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : `Failed to delete ${config.entityName.toLowerCase()}`;
      notificationService.error(message);
      throw err;
    }
  }, [config]);

  return {
    loading,
    error,
    entities,
    hasSearched,
    loadEntities,
    createEntityAction,
    updateEntityAction,
    deleteEntityAction,
    resetError,
  };
}
