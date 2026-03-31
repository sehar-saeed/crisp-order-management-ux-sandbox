import { useState, useCallback } from 'react';
import type { CreateSupplierRequest } from '../types/suppliers';

const EMPTY_FORM: CreateSupplierRequest = {
  name: '',
  shortCode: '',
  email: '',
  phoneNumber: '',
};

export function useSupplierForm() {
  const [formData, setFormData] = useState<CreateSupplierRequest>({ ...EMPTY_FORM });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    if (!formData.shortCode.trim()) {
      errors.shortCode = 'Short code is required';
    }
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const resetForm = useCallback(() => {
    setFormData({ ...EMPTY_FORM });
    setFormErrors({});
  }, []);

  const updateTextField = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setFormErrors(prev => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  return {
    formData,
    formErrors,
    validateForm,
    resetForm,
    setFormData: setFormData as (data: CreateSupplierRequest) => void,
    updateTextField,
  };
}
