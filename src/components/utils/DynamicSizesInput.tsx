import { useState, useEffect } from "react";
import "./DynamicSizesInput.css";

export type Size = { size: string; stock: number; merchantSizeCode?: string };

interface DynamicSizesInputProps {
  sizes: Size[];
  setSizes: (sizes: Size[]) => void;
}

const DEFAULT_SIZES: Size[] = [
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
    const isNumeric = entries.some(e => /^\d+$/.test(e.size));
    let next = "";
    if (isNumeric) {
      const nums = entries.map(e => parseInt(e.size, 10)).filter(n => !isNaN(n));
      next = String((nums.length ? Math.max(...nums) : 34) + 2);
    } else {
      const letterRun = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
      const existing = new Set(entries.map(e => e.size.toUpperCase()));
      next = letterRun.find(l => !existing.has(l)) || "";
    }
    setEntries([...entries, { size: next, stock: 0, merchantSizeCode: "" }]);
  };

  const applyPreset = (type: 'letter' | 'numeric') => {
    const defaults = type === 'numeric' ? ['26', '28', '30', '32', '34', '36'] : ['S', 'M', 'L', 'XL'];
    setEntries(defaults.map((sz, idx) => ({
      size: sz,
      stock: entries[idx]?.stock || 0,
      merchantSizeCode: entries[idx]?.merchantSizeCode || '',
    })));
  };

  const removeSize = (index: number) => {
    const updated = entries.filter((_, i) => i !== index);
    setEntries(updated);
  };

  return (
    <div className="dynsizes-root">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
        <h3 className="dynsizes-title" style={{ margin: 0 }}>Size and Stock</h3>
        <div style={{ display: "inline-flex", background: "rgba(0,0,0,0.04)", padding: "2px", borderRadius: "6px", gap: "2px" }}>
          <button
            type="button"
            onClick={() => applyPreset('letter')}
            style={{
              padding: "2px 8px",
              fontSize: "11px",
              fontWeight: 600,
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              background: !entries.some(e => /^\d+$/.test(e.size)) ? "var(--color-primary, #0ea5e9)" : "transparent",
              color: !entries.some(e => /^\d+$/.test(e.size)) ? "#fff" : "var(--color-text, #334155)",
            }}
          >
            Standard (S, M, L, XL)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('numeric')}
            style={{
              padding: "2px 8px",
              fontSize: "11px",
              fontWeight: 600,
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              background: entries.some(e => /^\d+$/.test(e.size)) ? "var(--color-primary, #0ea5e9)" : "transparent",
              color: entries.some(e => /^\d+$/.test(e.size)) ? "#fff" : "var(--color-text, #334155)",
            }}
            title="Numerical (26 - 36)"
          >
            Numerical (26 - 36)
          </button>
        </div>
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
