import React, { useState } from "react";
import { addBrand } from "../../api/products";
import type { BrandPayload } from "../../api/products";
import LogoCrop from "../Login/LogoCrop/LogoCrop";

interface AddBrandFormProps {
  createdById: string;
  createdByType: "Merchant" | "Admin";
  onSuccess?: () => void;
}

const AddBrandForm: React.FC<AddBrandFormProps> = ({
  createdById,
  createdByType,
  onSuccess,
}) => {
  const [form, setForm] = useState<Omit<BrandPayload, "description">>({
    name: "",
    logo: null,
    createdById,
    createdByType,
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [isCropOpen, setIsCropOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
    setError("");

    try {
      await addBrand({
        ...form,
        createdById,
        createdByType,
      });

      setSuccess("Brand added successfully!");
      setForm({
        name: "",
        logo: null,
        createdById,
        createdByType,
      });

      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Failed to add brand. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[380px] !my-8 !mx-auto !px-6 !py-7 bg-white rounded-xl shadow-[0_2px_24px_rgba(45,50,60,0.12)]">
      <div className="text-[1.35rem] font-medium tracking-[0.01em] !mb-4 text-[#2a3551] text-center">
        Add New Brand
      </div>

      <form onSubmit={handleSubmit} encType="multipart/form-data">
        {/* Name Field */}
        <div className="flex flex-col gap-1 !mb-4">
          <label className="text-[0.98rem] text-[#363c50] !mb-0.5">
            Name:
          </label>
          <input
            className="text-base !px-3 !py-2 border-[1.2px] border-[#d4daf9] rounded-[7px] bg-[#f5f7fb] text-[#2a3551] transition-all duration-200 focus:border-[#5576e7] focus:outline-none"
            type="text"
            name="name"
            value={form.name}
            required
            onChange={(e) =>
              setForm((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Enter brand name"
          />
        </div>

        {/* Logo Field */}
        <div className="flex flex-col gap-1 !mb-4">
          <label className="text-[0.98rem] text-[#363c50] !mb-0.5">
            Logo:
          </label>
          {form.logo ? (
            <div className="flex flex-col items-center gap-3 !p-4 bg-[#f5f7fb] rounded-[7px] border-[1.2px] border-[#d4daf9]">
              <img
                src={URL.createObjectURL(form.logo)}
                alt="Logo preview"
                className="w-32 h-32 object-cover rounded-lg border-2 border-[#d4daf9] shadow-sm"
              />
              <button
                type="button"
                className="!px-6 !py-2 text-sm bg-gradient-to-r from-indigo-500 to-indigo-600 text-white border-0 rounded-[7px] font-medium cursor-pointer transition-all duration-200 hover:from-indigo-600 hover:to-indigo-700 hover:shadow-md"
                onClick={() => setIsCropOpen(true)}
              >
                Change Logo
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="w-full !py-2.5 text-[1.05rem] bg-gradient-to-r from-[#5576e7] via-[#5576e7] to-[#53b9b2] text-white border-0 rounded-[7px] font-medium cursor-pointer !mt-3 transition-all duration-200 hover:shadow-lg hover:opacity-90"
              onClick={() => setIsCropOpen(true)}
            >
              Upload Logo
            </button>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full !py-2.5 text-[1.05rem] bg-gradient-to-r from-[#5576e7] via-[#5576e7] to-[#53b9b2] text-white border-0 rounded-[7px] font-medium cursor-pointer !mt-3 transition-all duration-200 hover:shadow-lg hover:opacity-90 disabled:bg-[#a7b8e0] disabled:cursor-wait disabled:opacity-100"
          disabled={loading || !form.logo}
        >
          {loading ? "Saving..." : "Add Brand"}
        </button>

        {/* Success Message */}
        {success && (
          <div className="!mt-3 text-[#1b9450] font-medium text-center">
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="!mt-3 text-[#dc3741] font-medium text-center">
            {error}
          </div>
        )}
      </form>

      <LogoCrop
        isOpen={isCropOpen}
        onClose={() => setIsCropOpen(false)}
        onCrop={(file) => {
          setForm((prev) => ({ ...prev, logo: file }));
          setIsCropOpen(false);
        }}
      />
    </div>
  );
};

export default AddBrandForm;