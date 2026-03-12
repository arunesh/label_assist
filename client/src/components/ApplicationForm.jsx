import { useState } from 'react';
import { FIELD_LABELS, GOVERNMENT_WARNING_TEXT } from '../utils/constants.js';

const FIELDS = [
  { name: 'brandName', type: 'input' },
  { name: 'classType', type: 'input' },
  { name: 'alcoholContent', type: 'input', placeholder: 'e.g., 45% Alc./Vol.' },
  { name: 'netContents', type: 'input', placeholder: 'e.g., 750 mL' },
  { name: 'producerName', type: 'input' },
  { name: 'producerAddress', type: 'input' },
  { name: 'countryOfOrigin', type: 'input', placeholder: 'e.g., USA' },
  { name: 'governmentWarning', type: 'textarea' },
];

export function ApplicationForm({ onSubmit, disabled }) {
  const [formData, setFormData] = useState({
    brandName: '',
    classType: '',
    alcoholContent: '',
    netContents: '',
    governmentWarning: GOVERNMENT_WARNING_TEXT,
    producerName: '',
    producerAddress: '',
    countryOfOrigin: '',
  });

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const canSubmit = !disabled && formData.brandName.trim().length > 0;

  return (
    <div className="space-y-4">
      {FIELDS.map(({ name, type, placeholder }) => (
        <div key={name}>
          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: 'var(--color-slate)' }}
          >
            {FIELD_LABELS[name]}
            {name === 'brandName' && <span style={{ color: 'var(--color-rose)' }}> *</span>}
          </label>
          {type === 'textarea' ? (
            <textarea
              value={formData[name]}
              onChange={(e) => handleChange(name, e.target.value)}
              disabled={disabled}
              rows={4}
              className="w-full px-4 py-3 rounded-lg text-base transition-colors duration-150"
              style={{
                background: 'var(--color-white)',
                border: '1.5px solid var(--color-cloud)',
                color: 'var(--color-navy)',
                resize: 'vertical',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--color-blue)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--color-cloud)')}
            />
          ) : (
            <input
              type="text"
              value={formData[name]}
              onChange={(e) => handleChange(name, e.target.value)}
              disabled={disabled}
              placeholder={placeholder}
              className="w-full px-4 py-3 rounded-lg text-base transition-colors duration-150"
              style={{
                background: 'var(--color-white)',
                border: '1.5px solid var(--color-cloud)',
                color: 'var(--color-navy)',
                height: '48px',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--color-blue)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--color-cloud)')}
            />
          )}
        </div>
      ))}

      <button
        onClick={() => onSubmit(formData)}
        disabled={!canSubmit}
        className="w-full py-4 rounded-xl text-base font-semibold tracking-wide text-white transition-all duration-200 cursor-pointer"
        style={{
          background: canSubmit ? 'var(--color-emerald)' : 'var(--color-mist)',
          height: '56px',
          boxShadow: canSubmit ? '0 4px 14px rgba(5, 150, 105, 0.3)' : 'none',
        }}
      >
        Verify Label
      </button>
    </div>
  );
}
