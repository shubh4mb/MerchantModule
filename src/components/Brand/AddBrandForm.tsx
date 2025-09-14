import React, { useState } from "react";
import { addBrand } from "../../api/products";
import type { BrandPayload } from "../../api/products";
import styles from "./AddBrandForm.module.css";
import LogoCrop from "../Login/LogoCrop/LogoCrop";

interface AddBrandFormProps {
  createdById: string;
  createdByType: "Merchant" | "Admin";
  onSuccess?: () => void; // callback to parent
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

      if (onSuccess) onSuccess(); // 👈 notify parent
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Failed to add brand. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <div className={styles.formHeading}>Add New Brand</div>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <div className={styles.formField}>
          <label className={styles.formLabel}>Name:</label>
          <input
            className={styles.formInput}
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

        <div className={styles.formField}>
          <label className={styles.formLabel}>Logo:</label>
          {form.logo ? (
            <div className={styles.previewWrapper}>
              <img
                src={URL.createObjectURL(form.logo)}
                alt="Logo preview"
                className={styles.logoPreview}
              />
              <button
                type="button"
                className={styles.changeLogoBtn}
                onClick={() => setIsCropOpen(true)}
              >
                Change Logo
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={styles.formButton}
              onClick={() => setIsCropOpen(true)}
            >
              Upload Logo
            </button>
          )}
        </div>

        <button
          type="submit"
          className={styles.formButton}
          disabled={loading || !form.logo}
        >
          {loading ? "Saving..." : "Add Brand"}
        </button>

        {success && <div className={styles.successMessage}>{success}</div>}
        {error && <div className={styles.errorMessage}>{error}</div>}
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
