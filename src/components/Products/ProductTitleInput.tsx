import React, { useState, ChangeEvent } from 'react';
import { AlertCircle, AlertTriangle } from 'lucide-react';

interface ProductTitleInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string; // External error from form validation
}

export const ProductTitleInput: React.FC<ProductTitleInputProps> = ({ value, onChange, error }) => {
  const [localError, setLocalError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const promotionalWords = [
    'best', 'premium', 'new arrival', 'trending', 'sale', 
    'discount', 'original', 'no.1', 'cheapest'
  ];

  const validate = (val: string) => {
    const trimmedVal = val.trim();
    
    // Warning for promotional words
    const lowerVal = val.toLowerCase();
    const hasPromotional = promotionalWords.some(word => lowerVal.includes(word));
    if (hasPromotional) {
      setWarning('Use descriptive product names instead of promotional words.');
    } else {
      setWarning(null);
    }

    // Error for numbers/symbols only
    const justLetters = val.replace(/[^a-zA-Z]/g, '');
    if (trimmedVal.length > 0 && justLetters.length === 0) {
      setLocalError('Product title cannot consist only of numbers or symbols.');
    } 
    // Error for min length
    else if (trimmedVal.length > 0 && trimmedVal.length < 20) {
      setLocalError('Minimum length is 20 characters.');
    } 
    else {
      setLocalError(null);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.length <= 100) {
      onChange(val);
      validate(val);
    }
  };

  const handleBlur = () => {
    // Trim leading/trailing spaces and collapse multiple consecutive spaces
    const formattedVal = value.trim().replace(/\s+/g, ' ');
    if (formattedVal !== value) {
      onChange(formattedVal);
    }
    validate(formattedVal);
  };

  const displayError = error || localError;

  return (
    <div className="w-full font-sans">
      <div className="flex justify-between items-center mb-1">
        <label className="text-sm font-semibold text-gray-700">Product Title</label>
        <span className={`text-xs font-medium ${value.length >= 100 ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
          ({value.length}/100)
        </span>
      </div>
      
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="e.g. Oversized Cotton T-Shirt with Graphic Print"
        maxLength={100}
        className={`w-full px-4 py-3 border rounded-xl outline-none transition-all focus:ring-2 bg-gray-50 focus:bg-white
          ${displayError 
            ? 'border-red-300 focus:ring-red-200 focus:border-red-500' 
            : warning 
              ? 'border-amber-300 focus:ring-amber-200 focus:border-amber-500'
              : 'border-gray-200 focus:ring-blue-100 focus:border-blue-500'
          }`}
      />
      
      <p className="mt-2 text-xs text-gray-500 font-medium">
        Describe the product using its fit, material, style, or key design feature. Avoid promotional words.
      </p>
      
      {/* Warning message (non-blocking) */}
      {warning && !displayError && (
        <div className="mt-2 flex items-start text-amber-600 text-xs bg-amber-50 p-3 rounded-xl border border-amber-100">
          <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
          <span>{warning}</span>
        </div>
      )}
      
      {/* Error message (blocking submission) */}
      {displayError && (
        <div className="mt-2 flex items-start text-red-600 text-xs bg-red-50 p-3 rounded-xl border border-red-100">
          <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
          <span>{displayError}</span>
        </div>
      )}
    </div>
  );
};
