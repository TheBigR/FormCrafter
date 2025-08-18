'use client';

import { useState } from 'react';

interface FormField {
  id: string;
  type: 'text' | 'email' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'number' | 'date';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export default function CreateForm() {
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [fields, setFields] = useState<FormField[]>([]);
  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const fieldTypes = [
    { type: 'text', label: 'Text Input', icon: '📝' },
    { type: 'email', label: 'Email Input', icon: '📧' },
    { type: 'textarea', label: 'Text Area', icon: '📄' },
    { type: 'select', label: 'Dropdown', icon: '📋' },
    { type: 'checkbox', label: 'Checkbox', icon: '☑️' },
    { type: 'radio', label: 'Radio Buttons', icon: '🔘' },
    { type: 'number', label: 'Number Input', icon: '🔢' },
    { type: 'date', label: 'Date Picker', icon: '📅' },
  ];

  const addField = (fieldType: string) => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type: fieldType as FormField['type'],
      label: `New ${fieldType} field`,
      required: false,
      placeholder: '',
      options: fieldType === 'select' || fieldType === 'radio' ? ['Option 1', 'Option 2'] : undefined,
    };
    setFields([...fields, newField]);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map(field => 
      field.id === id ? { ...field, ...updates } : field
    ));
  };

  const removeField = (id: string) => {
    setFields(fields.filter(field => field.id !== id));
    if (selectedField?.id === id) {
      setSelectedField(null);
    }
  };

  const moveField = (id: string, direction: 'up' | 'down') => {
    const index = fields.findIndex(field => field.id === id);
    if (index === -1) return;

    const newFields = [...fields];
    if (direction === 'up' && index > 0) {
      [newFields[index], newFields[index - 1]] = [newFields[index - 1], newFields[index]];
    } else if (direction === 'down' && index < fields.length - 1) {
      [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
    }
    setFields(newFields);
  };

  const saveForm = async () => {
    if (!formTitle.trim()) {
      setSaveMessage('Please enter a form title');
      return;
    }

    if (fields.length === 0) {
      setSaveMessage('Please add at least one field to your form');
      return;
    }

    setIsSaving(true);
    setSaveMessage('');

    try {
      const response = await fetch('/api/forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formTitle,
          description: formDescription,
          fields,
        }),
      });

      if (response.ok) {
        const savedForm = await response.json();
        setSaveMessage(`Form saved successfully! Public URL: ${window.location.origin}/form/${savedForm.slug}`);
        
        // Clear form after successful save
        setTimeout(() => {
          setFormTitle('');
          setFormDescription('');
          setFields([]);
          setSelectedField(null);
          setSaveMessage('');
        }, 5000);
      } else {
        const errorData = await response.json();
        setSaveMessage(`Error: ${errorData.error}`);
      }
    } catch (error) {
      setSaveMessage('Failed to save form. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderFieldEditor = () => {
    if (!selectedField) return null;

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Field Settings</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Field Label</label>
            <input
              type="text"
              value={selectedField.label}
              onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Placeholder</label>
            <input
              type="text"
              value={selectedField.placeholder || ''}
              onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="required"
              checked={selectedField.required}
              onChange={(e) => updateField(selectedField.id, { required: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="required" className="ml-2 block text-sm text-gray-900">
              Required field
            </label>
          </div>

          {(selectedField.type === 'select' || selectedField.type === 'radio') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
              <div className="space-y-2">
                {selectedField.options?.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...(selectedField.options || [])];
                        newOptions[index] = e.target.value;
                        updateField(selectedField.id, { options: newOptions });
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => {
                        const newOptions = selectedField.options?.filter((_, i) => i !== index);
                        updateField(selectedField.id, { options: newOptions });
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newOptions = [...(selectedField.options || []), `Option ${(selectedField.options?.length || 0) + 1}`];
                    updateField(selectedField.id, { options: newOptions });
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  + Add Option
                </button>
              </div>
            </div>
          )}

          <div className="flex space-x-2">
            <button
              onClick={() => removeField(selectedField.id)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Delete Field
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderFieldPreview = (field: FormField) => {
    const baseClasses = "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500";
    
    switch (field.type) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <input
            type={field.type}
            placeholder={field.placeholder}
            className={baseClasses}
            disabled
          />
        );
      case 'textarea':
        return (
          <textarea
            placeholder={field.placeholder}
            className={baseClasses}
            rows={3}
            disabled
          />
        );
      case 'select':
        return (
          <select className={baseClasses} disabled>
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
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled
                />
                <label className="ml-2 block text-sm text-gray-900">{option}</label>
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
                  name={`radio_${field.id}`}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  disabled
                />
                <label className="ml-2 block text-sm text-gray-900">{option}</label>
              </div>
            ))}
          </div>
        );
      case 'date':
        return (
          <input
            type="date"
            className={baseClasses}
            disabled
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create New Form</h1>
            <p className="mt-2 text-gray-600">Build your dynamic form with our drag-and-drop builder</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              {isPreviewMode ? 'Edit Mode' : 'Preview Mode'}
            </button>
                         <button 
               onClick={saveForm}
               disabled={isSaving}
               className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
             >
               {isSaving ? 'Saving...' : 'Save Form'}
             </button>
          </div>
        </div>
             </div>

       {saveMessage && (
         <div className={`mb-6 p-4 rounded-lg ${
           saveMessage.includes('Error') || saveMessage.includes('Please') 
             ? 'bg-red-50 border border-red-200 text-red-700' 
             : 'bg-green-50 border border-green-200 text-green-700'
         }`}>
           {saveMessage}
         </div>
       )}

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Builder Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Form Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Form Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Form Title</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Enter form title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Enter form description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Field Types */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Fields</h3>
            <div className="grid grid-cols-2 gap-3">
              {fieldTypes.map((fieldType) => (
                <button
                  key={fieldType.type}
                  onClick={() => addField(fieldType.type)}
                  className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-center"
                >
                  <div className="text-2xl mb-1">{fieldType.icon}</div>
                  <div className="text-xs text-gray-600">{fieldType.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Field Editor */}
          {renderFieldEditor()}
        </div>

        {/* Form Preview */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Form Preview</h3>
            
            {formTitle && (
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{formTitle}</h2>
                {formDescription && (
                  <p className="mt-2 text-gray-600">{formDescription}</p>
                )}
              </div>
            )}

            <div className="space-y-4">
              {fields.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-4">📝</div>
                  <p>No fields added yet. Use the sidebar to add form fields.</p>
                </div>
              ) : (
                fields.map((field, index) => (
                  <div
                    key={field.id}
                    className={`p-4 border rounded-lg transition-colors ${
                      selectedField?.id === field.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">#{index + 1}</span>
                        <span className="text-sm font-medium text-gray-700">{field.label}</span>
                        {field.required && <span className="text-red-500">*</span>}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => moveField(field.id, 'up')}
                          disabled={index === 0}
                          className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveField(field.id, 'down')}
                          disabled={index === fields.length - 1}
                          className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => setSelectedField(field)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                    {renderFieldPreview(field)}
                  </div>
                ))
              )}
            </div>

            {fields.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                  Submit Form
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
