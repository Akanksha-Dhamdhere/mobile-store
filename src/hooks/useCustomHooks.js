/**
 * Custom hooks for common data fetching patterns
 * Reduces code duplication and improves error handling
 */

import { useState, useEffect, useCallback } from 'react';
import { devError } from '../utils/logger';

/**
 * Hook for fetching data with loading and error states
 * @param {Function} fetchFn - Async function that returns the data
 * @param {Array} dependencies - Dependencies array for useEffect
 * @param {*} initialValue - Initial value for the data state
 * @returns {Object} { data, loading, error, refetch }
 */
export const useFetch = (fetchFn, dependencies = [], initialValue = null) => {
  const [data, setData] = useState(initialValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = err?.message || 'An error occurred';
      setError(errorMessage);
      devError('Fetch error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    refetch().catch(() => {
      // Error already logged in refetch
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return { data, loading, error, refetch };
};

/**
 * Hook for managing form state with validation
 * @param {Object} initialState - Initial form values
 * @param {Function} onSubmit - Callback function when form is submitted
 * @param {Object} validators - Validation functions for each field
 * @returns {Object} { formData, setFormData, handleChange, handleSubmit, errors, setErrors, isSubmitting }
 */
export const useForm = (initialState = {}, onSubmit = null, validators = {}) => {
  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors = {};
    Object.entries(validators).forEach(([field, validator]) => {
      const error = validator(formData[field]);
      if (error) newErrors[field] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    
    if (!validate()) return;
    
    if (onSubmit) {
      setIsSubmitting(true);
      try {
        await onSubmit(formData);
      } catch (err) {
        devError('Form submission error:', err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return {
    formData,
    setFormData,
    handleChange,
    handleSubmit,
    errors,
    setErrors,
    isSubmitting,
    validate
  };
};

const hooks = {
  useFetch,
  useForm,
};

export default hooks;
