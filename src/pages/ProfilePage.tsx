import React, { useEffect, useState } from "react";
import { getMerchantById, updateMerchantShopDetails } from "../api/auth";
import { useNotification } from "../context/NotificationContext";

const ProfilePage: React.FC = () => {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const merchantId = localStorage.getItem("merchant_id");

  const [form, setForm] = useState({
    shopName: "",
    shopDescription: "",
    ownerName: "",
    category: "",
    genderCategory: [] as string[],
    logo: null as any,
    backgroundImage: null as any,
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bgPreview, setBgPreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!merchantId) return;
        const data = await getMerchantById();
        setForm({
          shopName: data.shopName || "",
          shopDescription: data.shopDescription || "",
          ownerName: data.ownerName || "",
          category: data.category || "All",
          genderCategory: data.genderCategory || [],
          logo: data.logo || null,
          backgroundImage: data.backgroundImage || null,
        });
      } catch (err) {
        showNotification("Failed to load profile", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [merchantId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'logo' | 'backgroundImage') => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (fieldName === 'logo') {
        setLogoPreview(url);
        setForm({ ...form, logo: file });
      } else {
        setBgPreview(url);
        setForm({ ...form, backgroundImage: file });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantId) return;

    setSaving(true);
    try {
      const payload = new FormData();
      payload.append("shopName", form.shopName);
      payload.append("shopDescription", form.shopDescription);
      payload.append("ownerName", form.ownerName);
      payload.append("category", form.category);
      if (form.genderCategory.length) {
        payload.append("genderCategory", form.genderCategory.join(','));
      }

      if (form.logo instanceof File) {
        payload.append("logo", form.logo);
      }
      if (form.backgroundImage instanceof File) {
        payload.append("backgroundImage", form.backgroundImage);
      }

      // NOTE: `updateMerchantShopDetails` also requires address/location details.
      // We pass dummy location if not provided to pass validation, assuming existing coords are kept
      await updateMerchantShopDetails(merchantId, payload);
      showNotification("Profile updated successfully!", "success");
    } catch (err) {
      showNotification("Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading profile...</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Store Profile</h1>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name</label>
            <input
              type="text"
              name="shopName"
              value={form.shopName}
              onChange={handleChange}
              className="w-full border p-2 rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
            <input
              type="text"
              name="ownerName"
              value={form.ownerName}
              onChange={handleChange}
              className="w-full border p-2 rounded-md"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Shop Description</label>
          <textarea
            name="shopDescription"
            value={form.shopDescription}
            onChange={handleChange}
            className="w-full border p-2 rounded-md h-24"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Store Logo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageChange(e, "logo")}
              className="text-sm"
            />
            <div className="mt-3">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo Preview" className="h-20 w-20 object-cover rounded shadow-sm border" />
              ) : form.logo?.url ? (
                <img src={form.logo.url} alt="Current Logo" className="h-20 w-20 object-cover rounded shadow-sm border" />
              ) : (
                <div className="h-20 w-20 bg-gray-100 flex items-center justify-center rounded text-gray-400 text-xs">No Logo</div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Background Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageChange(e, "backgroundImage")}
              className="text-sm"
            />
            <div className="mt-3">
              {bgPreview ? (
                <img src={bgPreview} alt="Bg Preview" className="h-24 w-full object-cover rounded shadow-sm border" />
              ) : form.backgroundImage?.url ? (
                <img src={form.backgroundImage.url} alt="Current Bg" className="h-24 w-full object-cover rounded shadow-sm border" />
              ) : (
                <div className="h-24 w-full bg-gray-100 flex items-center justify-center rounded text-gray-400 text-xs">No Background</div>
              )}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={saving}
            className="bg-black text-white px-6 py-2 rounded-md font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfilePage;
