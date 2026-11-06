// components/ProductPage/DynamicSizesInput.tsx
import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import "./DynamicSizesInput.css";

export interface Size {
  size: string;
  stock: number;
  merchantSizeCode?: string;
}

interface DynamicSizesInputProps {
  sizes: Size[];
  setSizes: React.Dispatch<React.SetStateAction<Size[]>>;
}

const DynamicSizesInput: React.FC<DynamicSizesInputProps> = ({ sizes, setSizes }) => {
  const [hasCustomSizeSku, setHasCustomSizeSku] = useState<boolean>(() => {
    return Boolean(sizes?.some(s => {
      const code = (s.merchantSizeCode || "").trim();
      return code && !/^(SKU|PRD|WH)-/i.test(code);
    }));
  });

  const addSize = () => {
    setSizes([...sizes, { size: "FS", stock: 0, merchantSizeCode: "" }]);
  };

  const removeSize = (index: number) => {
    setSizes(sizes.filter((_, i) => i !== index));
  };

  const updateSize = (index: number, field: keyof Size, value: string | number) => {
    const updatedSizes = sizes.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    setSizes(updatedSizes);
  };

  return (
    <div className="form-group">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <label className="form-label" style={{ margin: 0 }}>Available Sizes</label>
      </div>

      {/* Toggle for Custom Size SKU */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(0,0,0,0.02)", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--color-border, #e5e7eb)", marginBottom: "12px" }}>
        <div>
          <div style={{ fontSize: "12px", fontWeight: 700 }}>Different SKU for each size</div>
          <div style={{ fontSize: "11px", color: "var(--color-text-secondary, #6b7280)" }}>Enable only if you assign distinct barcodes / SKUs per size</div>
        </div>
        <label style={{ display: "flex", alignItems: "center", cursor: "pointer", gap: "6px", fontSize: "12px", fontWeight: 600 }}>
          <input
            type="checkbox"
            checked={hasCustomSizeSku}
            onChange={(e) => setHasCustomSizeSku(e.target.checked)}
            style={{ width: "16px", height: "16px", cursor: "pointer" }}
          />
          <span>Custom SKU</span>
        </label>
      </div>

      <div className="sizes-input-container">
        {sizes.map((sizeData, index) => (
          <div key={index} className="size-input-row">
            <input
              type="text"
              value={sizeData.size}
              onChange={(e) => updateSize(index, "size", e.target.value)}
              placeholder="Size (e.g., S, M, L)"
              className="size-input"
            />
            <input
              type="number"
              value={sizeData.stock}
              onChange={(e) => updateSize(index, "stock", parseInt(e.target.value) || 0)}
              placeholder="Stock"
              min={0}
              className="stock-input"
            />
            {hasCustomSizeSku && (
              <input
                type="text"
                value={sizeData.merchantSizeCode || ""}
                onChange={(e) => updateSize(index, "merchantSizeCode", e.target.value)}
                placeholder="Code/SKU (Opt)"
                className="size-input"
              />
            )}
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

        <button type="button" onClick={addSize} className="add-size-btn">
          <Plus size={16} /> Add Size
        </button>
      </div>
    </div>
  );
};

export default DynamicSizesInput;
