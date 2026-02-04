/**
 * Form validation result.
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Form field definition.
 */
export interface FormField {
  name: string;
  type: string;
  label: string;
  value?: string;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
}

/**
 * Form errors mapping.
 */
export interface FormErrors {
  [key: string]: string;
}
