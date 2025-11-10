import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Trash2, Plus, Upload, X, Save, ArrowLeft, AlertCircle } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { getBaseProductById } from "../../api/products";

/* ----------- Types ------------ */
interface Size {
  size: string;
  stock: number;
  _id?: string;
}

interface Color {
  name: string;
  hex: string;
}

interface Image {
  public_id: string;
  url: string;
  _id?: string;
}

interface Variant {
  color: Color;
  sizes: Size[];
  mrp: number;
  price: number;
  images: Image[];
  discount: number;
  _id?: string;
}

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  subCategory: string;
  subSubCategory: string;
  gender: string;
  description: string;
  tags: string[];
  isTriable: boolean;
  isActive: boolean;
  variants: Variant[];
}

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);

  const [form, setForm] = useState<Partial<Product>>({
    name: "",
    brand: "",
    category: "",
    subCategory: "",
    subSubCategory: "",
    gender: "women",
    description: "",
    tags: [],
    isTriable: true,
    isActive: true,
    variants: [],
  });

  const [tagInput, setTagInput] = useState("");

  /* -------- LOAD PRODUCT -------- */
  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        const data: Product = await getBaseProductById(id);

        setProduct(data);

        setForm({
          ...data,
          variants: data.variants.map((v) => ({
            ...v,
            _id: v._id ?? uuidv4(),
            sizes: v.sizes.map((s) => ({ ...s, _id: s._id ?? uuidv4() })),
            images: v.images.map((i) => ({ ...i, _id: i._id ?? uuidv4() })),
          })),
        });
      } catch (error) {
        console.error(error);
        alert("Failed to load product.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  /* -------- SAVE PRODUCT -------- */
  const handleSave = async () => {
    if (!product) return;
    setSaving(true);

    try {
    //   await updateProduct(product.id, form);
      alert("Product updated successfully.");
      navigate(-1);
    } catch (error) {
      console.error(error);
      alert("Failed to update product.");
    } finally {
      setSaving(false);
    }
  };

  /* -------- TAGS -------- */
  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !form.tags?.includes(tag)) {
      setForm((p) => ({ ...p, tags: [...(p.tags ?? []), tag] }));
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setForm((p) => ({ ...p, tags: p.tags?.filter((t) => t !== tag) }));
  };

  /* -------- VARIANTS -------- */
  const addVariant = () => {
    const nv: Variant = {
      color: { name: "New Color", hex: "#000000" },
      sizes: [{ size: "M", stock: 0, _id: uuidv4() }],
      mrp: 0,
      price: 0,
      images: [],
      discount: 0,
      _id: uuidv4(),
    };
    setForm((p) => ({ ...p, variants: [...(p.variants ?? []), nv] }));
  };

  const removeVariant = (vid: string) => {
    setForm((p) => ({
      ...p,
      variants: p.variants?.filter((v) => v._id !== vid),
    }));
  };

  const updateVariant = (vid: string, upd: Partial<Variant>) => {
    setForm((p) => ({
      ...p,
      variants: p.variants?.map((v) => (v._id === vid ? { ...v, ...upd } : v)),
    }));
  };

  /* -------- SIZES -------- */
  const addSize = (vid: string) => {
    setForm((p) => ({
      ...p,
      variants: p.variants?.map((v) =>
        v._id === vid
          ? { ...v, sizes: [...v.sizes, { size: "S", stock: 0, _id: uuidv4() }] }
          : v
      ),
    }));
  };

  const removeSize = (vid: string, sid: string) => {
    setForm((p) => ({
      ...p,
      variants: p.variants?.map((v) =>
        v._id === vid ? { ...v, sizes: v.sizes.filter((s) => s._id !== sid) } : v
      ),
    }));
  };

  const updateSize = (vid: string, sid: string, field: keyof Size, val: string | number) => {
    setForm((p) => ({
      ...p,
      variants: p.variants?.map((v) =>
        v._id === vid
          ? {
              ...v,
              sizes: v.sizes.map((s) => (s._id === sid ? { ...s, [field]: val } : s)),
            }
          : v
      ),
    }));
  };

  /* -------- IMAGES -------- */
  const handleImageUpload = (vid: string, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const public_id = `tmp_${Date.now()}`;
    const url = URL.createObjectURL(file);

    setForm((p) => ({
      ...p,
      variants: p.variants?.map((v) =>
        v._id === vid
          ? { ...v, images: [...v.images, { public_id, url, _id: uuidv4() }] }
          : v
      ),
    }));
  };

  const removeImage = (vid: string, iid: string) => {
    setForm((p) => ({
      ...p,
      variants: p.variants?.map((v) =>
        v._id === vid ? { ...v, images: v.images.filter((i) => i._id !== iid) } : v
      ),
    }));
  };

    /* ------------------------------------------------------------------ */
    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto !p-6 sm:!p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
            {/* ----- Header ----- */}
            <div className="flex items-center justify-between !mb-8 bg-white/80 backdrop-blur-sm !p-5 rounded-2xl shadow-lg border border-gray-100">
                <div className="flex items-center !gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="group !p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all duration-200 hover:shadow-md"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-700 group-hover:text-gray-900 transition-colors" />
                    </button>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Edit Product</h1>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center !gap-2.5 !px-6 !py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                    <Save className="w-4.5 h-4.5" />
                    {saving ? "Saving…" : "Save Changes"}
                </button>
            </div>

            {/* ----- Basic Info ----- */}
            <section className="bg-white/90 backdrop-blur-md !p-7 rounded-2xl shadow-xl border border-gray-100 !mb-8">
                <h2 className="text-xl font-bold text-gray-900 !mb-6 flex items-center !gap-2">
                    <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold">1</span>
                    Basic Information
                </h2>

                <div className="!grid grid-cols-1 md:grid-cols-2 !gap-6">
                    {([
                        { label: "Product Name", key: "name" as const, placeholder: "e.g. Classic Leather Jacket" },
                    ]).map((f) => (
                        <div key={f.key} className="group">
                            <label className="block text-sm font-semibold text-gray-700 !mb-2 tracking-wide">
                                {f.label}
                            </label>
                            <input
                                type="text"
                                value={form[f.key] ?? ""}
                                onChange={(e) =>
                                    setForm((p) => ({ ...p, [f.key]: e.target.value }))
                                }
                                placeholder={f.placeholder}
                                className="w-full !px-4 !py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 group-hover:bg-white transition-all duration-200 placeholder:text-gray-400 text-gray-900 font-medium"
                            />
                        </div>
                    ))}

                    <div className="group">
                        <label className="block text-sm font-semibold text-gray-700 !mb-2 tracking-wide">
                            Gender
                        </label>
                        <select
                            value={form.gender ?? "women"}
                            onChange={(e) =>
                                setForm((p) => ({ ...p, gender: e.target.value }))
                            }
                            className="w-full !px-4 !py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 group-hover:bg-white transition-all duration-200 text-gray-900 font-medium appearance-none cursor-pointer"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em' }}
                        >
                            <option value="men">Men</option>
                            <option value="women">Women</option>
                            <option value="kids">Kids</option>
                            <option value="unisex">Unisex</option>
                        </select>
                    </div>



                </div>
                <div className="!mt-6 !p-4 !rounded-lg !bg-amber-50 !border !border-amber-200 !flex !items-start !gap-3">
                    <AlertCircle className="!w-5 !h-5 !text-amber-600 !flex-shrink-0 !mt-0.5" />
                    <p className="!text-sm !text-amber-800 !leading-relaxed">
                        <strong>Note:</strong> Once the product is created, you cannot edit brand and categories.
                        Please make sure the information is correct before submitting.
                    </p>
                </div>

                <div className="!mt-6 group">
                    <label className="block text-sm font-semibold text-gray-700 !mb-2 tracking-wide">
                        Description
                    </label>
                    <textarea
                        rows={5}
                        value={form.description ?? ""}
                        onChange={(e) =>
                            setForm((p) => ({ ...p, description: e.target.value }))
                        }
                        placeholder="Describe the product in detail..."
                        className="w-full !px-4 !py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 group-hover:bg-white transition-all duration-200 resize-none placeholder:text-gray-400 text-gray-900 font-medium"
                    />
                </div>

                {/* Tags */}
                <div className="!mt-6">
                    <label className="block text-sm font-semibold text-gray-700 !mb-2 tracking-wide">
                        Tags
                    </label>
                    <div className="flex flex-wrap !gap-2 !mb-3">
                        {form.tags?.map((t) => (
                            <span
                                key={t}
                                className="inline-flex items-center !gap-1.5 !px-3 !py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-sm font-medium shadow-sm hover:shadow transition-shadow"
                            >
                                {t}
                                <button
                                    type="button"
                                    onClick={() => removeTag(t)}
                                    className="!ml-1 hover:scale-110 transition-transform"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </span>
                        ))}
                    </div>
                    <div className="flex !gap-3">
                        <input
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addTag()}
                            placeholder="Type tag and press Enter..."
                            className="flex-1 !px-4 !py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/70 transition-all placeholder:text-gray-400 font-medium"
                        />
                        <button
                            onClick={addTag}
                            className="!px-5 !py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 font-medium flex items-center !gap-2"
                        >
                            <Plus className="w-4.5 h-4.5" />
                            Add
                        </button>
                    </div>
                </div>

                {/* Checkboxes */}
                <div className="!mt-6 flex !gap-8">
                    <label className="flex items-center !gap-3 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={form.isTriable ?? false}
                            onChange={(e) =>
                                setForm((p) => ({ ...p, isTriable: e.target.checked }))
                            }
                            className="w-5 h-5 text-blue-600 rounded-lg border-gray-300 focus:ring-blue-500 focus:ring-offset-0 transition-all"
                        />
                        <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900">Triable</span>
                    </label>
                    <label className="flex items-center !gap-3 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={form.isActive ?? false}
                            onChange={(e) =>
                                setForm((p) => ({ ...p, isActive: e.target.checked }))
                            }
                            className="w-5 h-5 text-green-600 rounded-lg border-gray-300 focus:ring-green-500 focus:ring-offset-0 transition-all"
                        />
                        <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900">Active</span>
                    </label>
                </div>
            </section>

            {/* ----- Variants ----- */}
            <section className="bg-white/90 backdrop-blur-md !p-7 rounded-2xl shadow-xl border border-gray-100">
                <div className="flex items-center justify-between !mb-6">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center !gap-2">
                        <span className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center text-sm font-bold">2</span>
                        Product Variants
                    </h2>
                    <button
                        onClick={addVariant}
                        className="flex items-center !gap-2 !px-5 !py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 font-medium text-sm"
                    >
                        <Plus className="w-4.5 h-4.5" />
                        Add Variant
                    </button>
                </div>

                <div className="!space-y-8">
                    {form.variants?.map((variant, idx) => (
                        <div
                            key={variant._id}
                            className="border border-gray-200 rounded-2xl !p-6 bg-gradient-to-br from-gray-50 to-white shadow-md hover:shadow-lg transition-all duration-300 relative group/card"
                        >
                            <button
                                onClick={() => removeVariant(variant._id!)}
                                className="absolute top-4 right-4 !p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 hover:scale-110 transition-all duration-200 opacity-0 group-hover/card:opacity-100"
                            >
                                <Trash2 className="w-4.5 h-4.5" />
                            </button>

                            {/* Variant Header */}
                            <div className="flex items-center !gap-3 !mb-5">
                                <div className="w-10 h-10 rounded-full" style={{ backgroundColor: variant.color.hex || '#ccc' }} />
                                <h3 className="text-lg font-bold text-gray-900">Variant {idx + 1} — {variant.color.name || 'Unnamed'}</h3>
                            </div>

                            {/* Color */}
                            <div className="!grid grid-cols-1 md:grid-cols-3 !gap-5 !mb-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 !mb-2">Color Name</label>
                                    <input
                                        type="text"
                                        value={variant.color.name}
                                        onChange={(e) =>
                                            updateVariant(variant._id!, {
                                                color: { ...variant.color, name: e.target.value },
                                            })
                                        }
                                        className="w-full !px-4 !py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/70 transition-all font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 !mb-2">Hex Code</label>
                                    <div className="flex !gap-2">
                                        <input
                                            type="text"
                                            value={variant.color.hex}
                                            onChange={(e) =>
                                                updateVariant(variant._id!, {
                                                    color: { ...variant.color, hex: e.target.value },
                                                })
                                            }
                                            className="flex-1 !px-4 !py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/70 transition-all font-medium"
                                        />
                                        <input
                                            type="color"
                                            value={variant.color.hex}
                                            onChange={(e) =>
                                                updateVariant(variant._id!, {
                                                    color: { ...variant.color, hex: e.target.value },
                                                })
                                            }
                                            className="w-14 h-11 rounded-lg cursor-pointer border border-gray-300"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 !mb-2">Discount (%)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={variant.discount}
                                        onChange={(e) =>
                                            updateVariant(variant._id!, {
                                                discount: Number(e.target.value),
                                            })
                                        }
                                        className="w-full !px-4 !py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/70 transition-all font-medium"
                                    />
                                </div>
                            </div>

                            {/* Pricing */}
                            <div className="!grid grid-cols-1 md:grid-cols-2 !gap-5 !mb-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 !mb-2">MRP (Max Retail Price)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={variant.mrp}
                                        onChange={(e) =>
                                            updateVariant(variant._id!, {
                                                mrp: Number(e.target.value),
                                            })
                                        }
                                        className="w-full !px-4 !py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/70 transition-all font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 !mb-2">Selling Price</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={variant.price}
                                        onChange={(e) =>
                                            updateVariant(variant._id!, {
                                                price: Number(e.target.value),
                                            })
                                        }
                                        className="w-full !px-4 !py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/70 transition-all font-medium"
                                    />
                                </div>
                            </div>

                            {/* Sizes */}
                            <div className="!mb-5">
                                <div className="flex items-center justify-between !mb-3">
                                    <label className="text-sm font-semibold text-gray-700">Sizes & Stock</label>
                                    <button
                                        onClick={() => addSize(variant._id!)}
                                        className="text-green-600 hover:text-green-700 flex items-center !gap-1.5 text-sm font-medium"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Size
                                    </button>
                                </div>
                                <div className="!space-y-3">
                                    {variant.sizes.map((sz) => (
                                        <div
                                            key={sz._id}
                                            className="flex items-center !gap-3 bg-white !p-3 rounded-xl border border-gray-200 shadow-sm"
                                        >
                                            <input
                                                type="text"
                                                placeholder="Size"
                                                value={sz.size}
                                                onChange={(e) =>
                                                    updateSize(
                                                        variant._id!,
                                                        sz._id!,
                                                        "size",
                                                        e.target.value.toUpperCase()
                                                    )
                                                }
                                                className="w-24 !px-3 !py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-center uppercase"
                                            />
                                            <input
                                                type="number"
                                                min="0"
                                                placeholder="Stock"
                                                value={sz.stock}
                                                onChange={(e) =>
                                                    updateSize(
                                                        variant._id!,
                                                        sz._id!,
                                                        "stock",
                                                        Number(e.target.value)
                                                    )
                                                }
                                                className="flex-1 !px-3 !py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                            />
                                            <button
                                                onClick={() => removeSize(variant._id!, sz._id!)}
                                                className="text-red-600 hover:text-red-700 !p-2 rounded-lg hover:bg-red-50 transition-colors"
                                            >
                                                <Trash2 className="w-4.5 h-4.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Images */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 !mb-3">Product Images</label>
                                <div className="flex flex-wrap !gap-3 !mb-3">
                                    {variant.images.map((img) => (
                                        <div
                                            key={img._id}
                                            className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-gray-200 shadow-md group/img"
                                        >
                                            <img
                                                src={img.url}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                onClick={() => removeImage(variant._id!, img._id!)}
                                                className="absolute top-1 right-1 !p-1.5 bg-red-600 text-white rounded-lg opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-red-700"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                    <label className="flex items-center justify-center w-24 h-24 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-all group/upload">
                                        <Upload className="w-6 h-6 text-gray-500 group-hover/upload:text-blue-600 transition-colors" />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => handleImageUpload(variant._id!, e)}
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}