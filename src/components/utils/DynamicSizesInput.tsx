import { useState, useEffect } from "react";
import "./DynamicSizesInput.css";

export type Size = { size: string; stock: number };

interface DynamicSizesInputProps {
  sizes: Size[];
  setSizes: (sizes: Size[]) => void;
}

export default function DynamicSizesInput({ sizes, setSizes }: DynamicSizesInputProps) {
  const [entries, setEntries] = useState<Size[]>(
    sizes && sizes.length ? sizes : [{ size: "", stock: 0 }]
  );

  useEffect(() => {
    setEntries(sizes && sizes.length ? sizes : [{ size: "", stock: 0 }]);
  }, [sizes]);

  useEffect(() => {
    setSizes(entries);
  }, [entries, setSizes]);

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
    setEntries([...entries, { size: "", stock: 0 }]);
  };

  const removeSize = (index: number) => {
    const updated = entries.filter((_, i) => i !== index);
    setEntries(updated);
  };

  return (
    <div className="dynsizes-root">
      <h3 className="dynsizes-title">Size and Stock</h3>
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
