import { useState, useEffect } from "react";

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
    <div className="mt-6 max-w-md w-full bg-white rounded-xl p-4 shadow-[0_2px_12px_0_rgba(60,64,67,.08)]">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Size and Stock</h3>
      {entries.map((entry, index) => (
        <div
          key={index}
          className="flex gap-3 items-center mb-3 animate-[dynsizesFadeIn_0.2s] sm:flex-row flex-col sm:items-center items-stretch"
        >
          <input
            type="text"
            placeholder="Size (e.g. M or 32)"
            value={entry.size}
            onChange={(e) => handleChange(index, "size", e.target.value)}
            className="flex-[1_1_0] px-4 py-2 border border-gray-300 rounded-md text-base transition-colors duration-200 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 sm:min-w-0 min-w-0"
          />
          <input
            type="number"
            placeholder="Stock"
            value={entry.stock}
            onChange={(e) => handleChange(index, "stock", e.target.value)}
            className="flex-[1_1_0] px-4 py-2 border border-gray-300 rounded-md text-base transition-colors duration-200 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 sm:min-w-0 min-w-0"
            min={0}
          />
          <button
            type="button"
            onClick={() => removeSize(index)}
            className="bg-red-500 text-white border-0 rounded-md font-bold text-xl px-3 py-1 cursor-pointer transition-colors duration-200 hover:bg-red-600 sm:self-auto self-end sm:w-auto w-9 sm:mt-0 mt-1"
            aria-label="Remove size"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addSize}
        className="block w-full bg-blue-600 text-white border-0 rounded-md text-base py-2.5 mt-2 font-semibold cursor-pointer transition-colors duration-200 tracking-wide hover:bg-blue-700"
      >
        + Add Size
      </button>
    </div>
  );
}
