import { useState, useEffect } from "react";
import "./DynamicSizesInput.css";

export type Size = { size: string; stock: number; merchantSizeCode?: string };

interface DynamicSizesInputProps {
  sizes: Size[];
  setSizes: (sizes: Size[]) => void;
}

const DEFAULT_SIZES: Size[] = [
  { size: "FS", stock: 0, merchantSizeCode: "" },
  { size: "S", stock: 0, merchantSizeCode: "" },
  { size: "M", stock: 0, merchantSizeCode: "" },
  { size: "L", stock: 0, merchantSizeCode: "" },
  { size: "XL", stock: 0, merchantSizeCode: "" },
];

export default function DynamicSizesInput({ sizes, setSizes }: DynamicSizesInputProps) {
  const [entries, setEntries] = useState<Size[]>(
    sizes && sizes.length ? sizes : DEFAULT_SIZES
  );

  const [hasCustomSizeSku, setHasCustomSizeSku] = useState<boolean>(() => {
    return Boolean(sizes?.some(s => {
      const code = (s.merchantSizeCode || "").trim();
      return code && !/^(SKU|PRD|WH)-/i.test(code);
    }));
  });

  useEffect(() => {
    if (sizes && sizes.length) {
      setEntries(sizes);
      const hasSku = sizes.some(s => {
        const code = (s.merchantSizeCode || "").trim();
        return code && !/^(SKU|PRD|WH)-/i.test(code);
      });
      if (hasSku) setHasCustomSizeSku(true);
    }
  }, [sizes]);

  useEffect(() => {
    const formatted = entries.map(e => ({
      ...e,
      merchantSizeCode: hasCustomSizeSku ? e.merchantSizeCode : undefined
    }));
    setSizes(formatted);
  }, [entries, hasCustomSizeSku, setSizes]);

  const handleChange = (index: number, field: keyof Size, value: string) => {
    const updated: Size[] = [...entries];
    if (field === "stock") {
      updated[index][field] = Number(value) as any;
    } else {
      updated[index][field] = value as any;
    }
    setEntries(updated);
  };

  const addSize = () => {
    setEntries([...entries, { size: "FS", stock: 0, merchantSizeCode: "" }]);
  };

  const removeSize = (index: number) => {
    const updated = entries.filter((_, i) => i !== index);
    setEntries(updated);
  };

  return (
    <div className="dynsizes-root">
      <h3 className="dynsizes-title">Size and Stock</h3>

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

      {entries.map((entry, index) => (
        <div key={index} className="dynsizes-row">
          <input
            type="text"
            placeholder="Size (e.g. M or 32)"
            value={entry.size}
            onChange={(e) => handleChange(index, "size", e.target.value)}
            className="dynsizes-input"
          />
          <input
            type="number"
            placeholder="Stock"
            value={entry.stock}
            onChange={(e) => handleChange(index, "stock", e.target.value)}
            className="dynsizes-input"
            min={0}
          />
          {hasCustomSizeSku && (
            <input
              type="text"
              placeholder="Code/SKU (Opt)"
              value={entry.merchantSizeCode || ""}
              onChange={(e) => handleChange(index, "merchantSizeCode", e.target.value)}
              className="dynsizes-input"
            />
          )}
          <button
            type="button"
            onClick={() => removeSize(index)}
            className="dynsizes-remove"
            aria-label="Remove size"
          >
            ×
          </button>
        </div>
      ))}
      <button type="button" onClick={addSize} className="dynsizes-add">
        + Add Size
      </button>
    </div>
  );
}
