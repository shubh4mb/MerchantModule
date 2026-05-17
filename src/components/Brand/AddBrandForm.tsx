import React, { useState } from "react";
import { addBrand } from "../../api/products";
import type { BrandPayload } from "../../api/products";
import LogoCrop from "../../pages/auth/LogoCrop/LogoCrop";
import { Loader2, Upload, CheckCircle, AlertTriangle } from "lucide-react";
import styles from "./AddBrandForm.module.css";

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
  const [form, setForm] = useState<BrandPayload>({
    name: "",
    description: "",
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
        description: "",
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
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Add New Brand</h2>
        <p className={styles.subtitle}>Register your brand in the FlashFits catalog.</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Name Field */}
        <div className={styles.field}>
          <label className={styles.label}>Brand Name <span style={{ color: "var(--color-danger)" }}>*</span></label>
          <input
            className={styles.input}
            type="text"
            name="name"
            value={form.name}
            required
            onChange={(e) =>
              setForm((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="e.g. Urban Edge"
          />
        </div>

        {/* Description Field */}
        <div className={styles.field}>
          <label className={styles.label}>Description</label>
          <textarea
            className={styles.textarea}
            name="description"
            value={form.description}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, description: e.target.value }))
            }
            placeholder="Tell us about your brand (optional)..."
            rows={3}
          />
        </div>

        {/* Logo Field */}
        <div className={styles.field}>
          <label className={styles.label}>Brand Logo <span style={{ color: "var(--color-danger)" }}>*</span></label>
          {form.logo ? (
            <div className={styles.logoPreview}>
              <img
                src={URL.createObjectURL(form.logo)}
                alt="Logo preview"
              />
              <button
                type="button"
                className={styles.changeBtn}
                onClick={() => setIsCropOpen(true)}
              >
                Change Logo
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={styles.uploadBtn}
              onClick={() => setIsCropOpen(true)}
            >
              <Upload size={18} />
              <span>Upload Brand Logo</span>
            </button>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className={styles.submitBtn}
          disabled={loading || !form.logo || !form.name.trim()}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              <span>Adding...</span>
            </>
          ) : (
            "Add Brand"
          )}
        </button>

        {/* Notifications */}
        {success && (
          <div className={styles.successMessage}>
            <CheckCircle size={16} />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className={styles.errorMessage}>
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}
      </form>

      <LogoCrop
        isOpen={isCropOpen}
        onClose={() => setIsCropOpen(false)}
        onCrop={(file: Blob) => {
          const newFile = new File([file], "logo.png", { type: "image/png" });
          setForm((prev) => ({ ...prev, logo: newFile }));
          setIsCropOpen(false);
        }}
      />
    </div>
  );
};

export default AddBrandForm;