'use client';

import { useState, useEffect } from 'react';
import { FormField } from '@/lib/forms';

interface Form {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  slug: string;
}

export default function PublicForm({ params }: { params: { slug: string } }) {
  const [form, setForm] = useState<Form | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchForm();
  }, [params.slug]);

  const fetchForm = async () => {
    try {
      const response = await fetch(`/api/forms/${params.slug}`);
      if (response.ok) {
        const formData = await response.json();
        setForm(formData);
        
        // Initialize form data with empty values
        const initialData: Record<string, any> = {};
        formData.fields.forEach((field: FormField) => {
          if (field.type === 'checkbox') {
            initialData[field.id] = [];
          } else {
            initialData[field.id] = '';
          }
        });
        setFormData(initialData);
      } else {
        setSubmitMessage('Form not found or is no longer active.');
      }
    } catch (error) {
      setSubmitMessage('Failed to load form. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleCheckboxChange = (fieldId: string, option: string, checked: boolean) => {
    setFormData(prev => {
      const currentValues = prev[fieldId] || [];
      if (checked) {
        return {
          ...prev,
          [fieldId]: [...currentValues, option]
        };
      } else {
        return {
          ...prev,
          [fieldId]: currentValues.filter((val: string) => val !== option)
        };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form) return;

    // Validate required fields
    const errors: string[] = [];
    form.fields.forEach(field => {
      if (field.required) {
        const value = formData[field.id];
        if (!value || (Array.isArray(value) && value.length === 0) || value === '') {
          errors.push(`${field.label} is required`);
        }
      }
    });

    if (errors.length > 0) {
      setSubmitMessage(`Please fill in all required fields: ${errors.join(', ')}`);
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const response = await fetch(`/api/forms/${params.slug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: formData }),
      });

      if (response.ok) {
        setSubmitMessage('Thank you! Your form has been submitted successfully.');
        // Clear form data
        const initialData: Record<string, any> = {};
        form.fields.forEach((field: FormField) => {
          if (field.type === 'checkbox') {
            initialData[field.id] = [];
          } else {
            initialData[field.id] = '';
          }
        });
        setFormData(initialData);
      } else {
        const error = await response.json();
        setSubmitMessage(`Error: ${error.error}`);
      }
    } catch (error) {
      setSubmitMessage('Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const baseClasses = "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
    
    switch (field.type) {
      case 'text':
      case 'email':
      case 'number':
      case 'date':
        return (
          <input
            type={field.type}
            id={field.id}
            value={formData[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={baseClasses}
            required={field.required}
          />
        );
      case 'textarea':
        return (
          <textarea
            id={field.id}
            value={formData[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={baseClasses}
            rows={4}
            required={field.required}
          />
        );
      case 'select':
        return (
          <select
            id={field.id}
            value={formData[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className={baseClasses}
            required={field.required}
          >
            <option value="">Select an option</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        );
      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <div key={index} className="flex items-center">
                <input
                  type="checkbox"
                  id={`${field.id}_${index}`}
                  checked={(formData[field.id] || []).includes(option)}
                  onChange={(e) => handleCheckboxChange(field.id, option, e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  required={field.required && (formData[field.id] || []).length === 0}
                />
                <label htmlFor={`${field.id}_${index}`} className="ml-2 block text-sm text-gray-900">
                  {option}
                </label>
              </div>
            ))}
          </div>
        );
      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <div key={index} className="flex items-center">
                <input
                  type="radio"
                  id={`${field.id}_${index}`}
                  name={field.id}
                  value={option}
                  checked={formData[field.id] === option}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  required={field.required}
                />
                <label htmlFor={`${field.id}_${index}`} className="ml-2 block text-sm text-gray-900">
                  {option}
                </label>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading form...</p>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">📝</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Form Not Found</h1>
          <p className="text-gray-600">This form may have been removed or is no longer active.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Form Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{form.title}</h1>
            {form.description && (
              <p className="text-gray-600">{form.description}</p>
            )}
          </div>

          {/* Submit Message */}
          {submitMessage && (
            <div className={`mb-6 p-4 rounded-lg ${
              submitMessage.includes('Error') || submitMessage.includes('Please') 
                ? 'bg-red-50 border border-red-200 text-red-700' 
                : 'bg-green-50 border border-green-200 text-green-700'
            }`}>
              {submitMessage}
            </div>
          )}

          {/* Form Fields */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {form.fields.map((field, index) => (
              <div key={field.id} className="space-y-2">
                <label htmlFor={field.id} className="block text-sm font-medium text-gray-700">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {renderField(field)}
              </div>
            ))}

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Form'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
