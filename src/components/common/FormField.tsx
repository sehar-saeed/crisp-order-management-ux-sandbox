import React from 'react';
import { TextField } from '../../ui';

interface FormFieldProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  required?: boolean;
  className?: string;
  maxLength?: number;
}

export const FormField: React.FC<FormFieldProps> = ({
  id, label, type = 'text', value, error, onChange, disabled, placeholder, required,
}) => (
  <div>
    <TextField
      label={`${label}${required ? ' *' : ''}`}
      type={type}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      error={error}
    />
  </div>
);
