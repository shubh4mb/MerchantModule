// components/ProductPage/DynamicSizesInput.tsx
import React from "react";
import { Plus, X } from "lucide-react";

export interface Size {
  size: string;
  stock: number;
}

interface DynamicSizesInputProps {
  sizes: Size[];
  setSizes: React.Dispatch<React.SetStateAction<Size[]>>;
}

const DynamicSizesInput: React.FC<DynamicSizesInputProps> = ({ sizes, setSizes }) => {
  const addSize = () => {
    setSizes([...sizes, { size: "", stock: 0 }]);
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
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-gray-800">Available Sizes</label>
      <div className="flex flex-col gap-3">
        {sizes.map((sizeData, index) => (
          <div key={index} className="flex gap-3 items-center bg-slate-50 p-3 rounded-lg border border-slate-200 transition-all hover:bg-slate-100 hover:border-slate-300">
            <input
              type="text"
              value={sizeData.size}
              onChange={(e) => updateSize(index, "size", e.target.value)}
              placeholder="Size (e.g., S, M, L)"
              className="flex-[2] min-w-[100px] border border-gray-300 rounded-md p-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="number"
              value={sizeData.stock}
              onChange={(e) => updateSize(index, "stock", parseInt(e.target.value) || 0)}
              placeholder="Stock"
              min={0}
              className="flex-1 min-w-[80px] border border-gray-300 rounded-md p-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {sizes.length > 1 && (
              <button
                type="button"
                onClick={() => removeSize(index)}
                className="bg-gradient-to-br from-red-400 to-red-600 text-white border-none rounded-md p-2 cursor-pointer flex items-center justify-center transition-all shadow-sm hover:scale-105"
              >
                <X size={16} />
              </button>
            )}
          </div>
        ))}

        <button 
          type="button" 
          onClick={addSize} 
          className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white border-none rounded-lg py-3 px-5 cursor-pointer flex items-center gap-2 text-sm font-medium self-start transition-all shadow-md hover:translate-y-[-1px] hover:shadow-lg"
        >
          <Plus size={16} /> Add Size
        </button>
      </div>
    </div>
  );
};

export default DynamicSizesInput;
