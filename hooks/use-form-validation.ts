import { useState, useCallback } from 'react';
import { z, ZodSchema } from 'zod';

export interface ValidationError {
  field: string;
  message: string;
}

export interface UseFormValidationOptions<T> {
  schema: ZodSchema<T>;
  initialValues: T;
  onSubmit: (values: T) => Promise<void> | void;
}

export function useFormValidation<T>({
  schema,
  initialValues,
  onSubmit,
}: UseFormValidationOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = useCallback((data: T): boolean => {
    try {
      schema.parse(data);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          const field = err.path.join('.');
          newErrors[field] = err.message;
        });
        setErrors(newErrors);
        return false;
      }
      return false;
    }
  }, [schema]);

  const handleChange = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[field as string]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }
  }, [errors]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!validate(values)) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validate, onSubmit]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setIsSubmitting(false);
  }, [initialValues]);

  const setError = useCallback((field: string, message: string) => {
    setErrors(prev => ({ ...prev, [field]: message }));
  }, []);

  const clearError = useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  return {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    reset,
    setError,
    clearError,
    validate,
  };
}

export function useFieldValidation<T>(
  schema: ZodSchema<T>,
  field: keyof T,
  value: any
) {
  const [error, setError] = useState<string>('');

  const validateField = useCallback(() => {
    try {
      // Create a partial schema for just this field
      const fieldSchema = (schema as any).pick({ [field]: true });
      fieldSchema.parse({ [field]: value });
      setError('');
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldError = err.issues.find(e => e.path[0] === field);
        if (fieldError) {
          setError(fieldError.message);
          return false;
        }
      }
      return false;
    }
  }, [schema, field, value]);

  return {
    error,
    validateField,
    setError,
  };
}
