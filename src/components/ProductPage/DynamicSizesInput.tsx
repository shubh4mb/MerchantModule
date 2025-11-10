// components/ProductPage/DynamicSizesInput.jsx
import React from 'react';
import { Plus, X } from 'lucide-react';
import './DynamicSizesInput.css';


const DynamicSizesInput = ({ sizes, setSizes }) => {
  const addSize = () => {
    setSizes([...sizes, { size: '', stock: 0 }]);
  };

  const removeSize = (index) => {
    setSizes(sizes.filter((_, i) => i !== index));
  };

  const updateSize = (index, field, value) => {
    const updatedSizes = sizes.map((size, i) => 
      i === index ? { ...size, [field]: value } : size
    );
    setSizes(updatedSizes);
  };

  return (
    <div className="form-group">
      <label className="form-label">Available Sizes</label>
      <div className="sizes-input-container">
        {sizes.map((sizeData, index) => (
          <div key={index} className="size-input-row">
            <input
              type="text"
              value={sizeData.size}
              onChange={(e) => updateSize(index, 'size', e.target.value)}
              placeholder="Size (e.g., S, M, L)"
              className="size-input"
            />
            <input
              type="number"
              value={sizeData.stock}
              onChange={(e) => updateSize(index, 'stock', parseInt(e.target.value) || 0)}
              placeholder="Stock"
              min="0"
              className="stock-input"
            />
            {sizes.length > 1 && (
              <button 
                type="button" 
                onClick={() => removeSize(index)}
                className="remove-size-btn"
              >
                <X size={16} />
              </button>
            )}
          </div>
        ))}
        <button 
          type="button" 
          onClick={addSize}
          className="add-size-btn"
        >
          <Plus size={16} />
          Add Size
        </button>
      </div>
    </div>
  );
};

export default DynamicSizesInput;