import { useEffect, useState, useCallback } from "react";
import {
  getBaseProductById,
  addVariant,
  updateVariant,
} from "../../../api/products";
import DynamicSizesInput, { type Size } from "../../utils/DynamicSizesInput";
import CropperModal from "../../utils/CropperModal";
import { Plus, Package, Info, Tag, CheckCircle, PackageCheck, Camera, Edit2, ChevronRight, X, Loader2 } from "lucide-react";

interface Color {
  name: string;
  hex: string;
}

interface ImageObj {
  url: string;
  file?: Blob;
  public_id?: string;
}

export interface VariantForm {
  color: Color;
  sizes: Size[];
  images: ImageObj[];
  mainImage: ImageObj | null;
  discount: number;
  mrp: number;
  price: number;
}

interface VariantResponse extends VariantForm {
  _id: string;
}

interface Product {
  _id: string;
  name: string;
  gender?: string;
  description?: string;
  tags?: string[];
  features?: Record<string, string>;
  isTriable?: boolean;
  isActive?: boolean;
  variants: VariantResponse[];
}

interface AddVariantProps {
  createdProductId: string;
}

function getEmptyVariantForm(): VariantForm {
  return {
    color: { name: "", hex: "#000000" },
    sizes: [{ size: "", stock: 0 }],
    images: [],
    mainImage: null,
    discount: 0,
    mrp: 0,
    price: 0,
  };
}

const AddVariant: React.FC<AddVariantProps> = ({ createdProductId }) => {
  const productId = createdProductId;

  const [product, setProduct] = useState<Product | null>(null);
  const [variantForm, setVariantForm] = useState<VariantForm>(getEmptyVariantForm());
  const [previewQueue, setPreviewQueue] = useState<string[]>([]);
  const [showCropper, setShowCropper] = useState(false);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const res: Product = await getBaseProductById(productId);
      setProduct(res);

      if (res.variants?.length) {
        setSelectedVariantIndex(0);
        setVariantForm(res.variants[0]);
      } else {
        setSelectedVariantIndex(null);
        setVariantForm(getEmptyVariantForm());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const setSizes = useCallback((updatedSizes: Size[]) => {
    setVariantForm((prev) => ({ ...prev, sizes: updatedSizes }));
  }, []);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const handleSelectVariant = (index: number) => {
    if (!product) return;
    setSelectedVariantIndex(index);
    setVariantForm(product.variants[index]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, files } = e.target;

    const numericFields = ["mrp", "price", "discount"];
    const parsedValue = numericFields.includes(name) ? Number(value) : value;

    setVariantForm((prev) => ({
      ...prev,
      [name]: parsedValue,
    }));

    if (type === "file" && files) {
      const fileList = Array.from(files);
      const previews = fileList.map(
        (file) =>
          new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          })
      );

      Promise.all(previews).then((urls) => {
        setPreviewQueue(urls);
        setShowCropper(true);
      });
    }
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setVariantForm((prev) => ({
      ...prev,
      color: { ...prev.color, [name]: value },
    }));
  };

  const handleCropComplete = (blob: Blob) => {
    if (!(blob instanceof Blob)) return;

    const objectUrl = URL.createObjectURL(blob);

    setVariantForm((prev) => {
      const updatedImages = [
        ...(prev.images || []),
        { url: objectUrl, file: blob },
      ];

      return {
        ...prev,
        images: updatedImages,
        mainImage: updatedImages[0],
      };
    });

    setPreviewQueue((prev) => {
      const [, ...rest] = prev;
      if (rest.length === 0) setShowCropper(false);
      return rest;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    try {
      const formData = new FormData();
      formData.append("color", JSON.stringify(variantForm.color));
      formData.append("sizes", JSON.stringify(variantForm.sizes));
      formData.append("mrp", String(variantForm.mrp));
      formData.append("price", String(variantForm.price));
      formData.append("discount", String(variantForm.discount));

      variantForm.images.forEach((imgObj) => {
        if (imgObj.file) {
          formData.append("images", imgObj.file);
        }
      });

      if (selectedVariantIndex !== null) {
        const variantId = product.variants[selectedVariantIndex]._id;
        await updateVariant(product._id, variantId, formData);
      } else {
        await addVariant(product._id, formData);
      }

      await fetchProduct();
      setPreviewQueue([]);
      setShowCropper(false);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 text-black animate-spin" />
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans">
      {/* Header Section */}
      <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white/20 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div>
          <div className="flex items-center gap-3 text-sm font-bold text-gray-400 uppercase tracking-[0.2em] mb-3">
            <PackageCheck className="w-4 h-4" />
            <span>Product Master</span>
            <ChevronRight className="w-4 h-4 opacity-50" />
            <span className="text-gray-900">Variant Engine</span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 leading-tight">
            Managing: <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-500">{product.name}</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-3 shadow-sm ${product.isActive ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
            <div className={`w-2.5 h-2.5 rounded-full ${product.isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            {product.isActive ? "Store Live" : "Offline"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Product Synopsis & Variant List */}
        <div className="lg:col-span-4 space-y-8">
          {/* Product Info Card */}
          <div className="bg-white p-8 rounded-[2rem] shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-gray-100 space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-black"></div>
            <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
              <Info className="w-5 h-5 text-black" />
              Synopsis
            </h3>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Gender</label>
                  <p className="text-gray-900 font-bold capitalize">{product.gender || "—"}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Triable</label>
                  <p className="text-gray-900 font-bold">{product.isTriable ? "Enabled" : "Disabled"}</p>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Categories</label>
                <div className="flex flex-wrap gap-2">
                  {product.tags?.map(tag => (
                    <span key={tag} className="px-3 py-1.5 bg-white text-gray-900 text-[10px] font-black uppercase rounded-lg border border-gray-200">
                      {tag}
                    </span>
                  )) || <span className="text-gray-400 text-xs italic">No tags</span>}
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Description</label>
                <p className="text-sm text-gray-600 font-medium leading-relaxed italic">
                  "{product.description || "No description available"}"
                </p>
              </div>
            </div>
          </div>

          {/* Variant Selector List */}
          <div className="bg-white p-8 rounded-[2rem] shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-gray-100">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
                <Tag className="w-5 h-5 text-black" />
                Collection
              </h3>
              <button
                type="button"
                className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg"
                onClick={() => {
                  setSelectedVariantIndex(null);
                  setVariantForm(getEmptyVariantForm());
                }}
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {product.variants.length > 0 ? (
                product.variants.map((variant, i) => (
                  <button
                    key={variant._id}
                    onClick={() => handleSelectVariant(i)}
                    className={`w-full text-left p-5 rounded-[1.5rem] border-2 transition-all duration-300 flex items-center gap-4 group ${
                      selectedVariantIndex === i 
                      ? 'border-black bg-black text-white shadow-2xl shadow-black/20 translate-x-2' 
                      : 'border-gray-50 hover:border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div 
                      className={`w-12 h-12 rounded-full border-4 flex-shrink-0 transition-transform duration-500 ${selectedVariantIndex === i ? 'border-white/20 scale-110 rotate-12' : 'border-gray-100'}`}
                      style={{ backgroundColor: variant.color.hex }}
                    ></div>
                    <div className="flex-grow">
                      <p className={`font-black uppercase tracking-tighter text-sm ${selectedVariantIndex === i ? 'text-white' : 'text-gray-900'}`}>
                        {variant.color.name || "Default"}
                      </p>
                      <p className={`text-[10px] font-bold ${selectedVariantIndex === i ? 'text-gray-400' : 'text-gray-500'}`}>
                        {variant.sizes.length} SIZES • ₹{variant.price}
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-20 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
                  <Package className="w-10 h-10 text-gray-300 mx-auto mb-4 opacity-50" />
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Empty Collection</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Deployment Form */}
        <div className="lg:col-span-8">
          <form onSubmit={handleSubmit} className="space-y-8 h-full">
            <div className="bg-white p-10 rounded-[3rem] shadow-[0_30px_60px_rgba(0,0,0,0.06)] border border-gray-100 relative overflow-hidden h-full flex flex-col">
              <div className="absolute top-0 right-0 w-96 h-96 bg-gray-50 rounded-full blur-[100px] -mr-48 -mt-48 opacity-50"></div>
              
              <div className="relative flex-grow space-y-12">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-black text-gray-900 tracking-tighter">
                    {selectedVariantIndex !== null ? "Edit Configuration" : "New Configuration"}
                  </h2>
                  <div className="px-4 py-2 bg-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Step 1 of 3
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {/* Aesthetics */}
                  <div className="space-y-6">
                    <label className="text-xs font-black text-gray-900 uppercase tracking-[0.2em] ml-2">I. Visual Identity</label>
                    <div className="flex items-center gap-6 bg-gray-50 p-6 rounded-[2rem] border border-gray-100 group transition-all hover:bg-white hover:shadow-xl hover:border-transparent">
                      <div className="relative">
                        <input
                          type="color"
                          name="hex"
                          value={variantForm.color.hex}
                          onChange={handleColorChange}
                          className="w-16 h-16 rounded-full border-4 border-white shadow-xl cursor-pointer appearance-none overflow-hidden hover:scale-110 transition-transform"
                        />
                      </div>
                      <div className="flex-grow">
                        <input
                          type="text"
                          name="name"
                          value={variantForm.color.name}
                          onChange={(e) =>
                            setVariantForm({
                              ...variantForm,
                              color: { ...variantForm.color, name: e.target.value },
                            })
                          }
                          placeholder="Variant Name"
                          className="w-full bg-transparent border-none focus:ring-0 font-black text-gray-900 placeholder:text-gray-300 text-2xl uppercase tracking-tighter"
                        />
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Color Persona</p>
                      </div>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="space-y-6">
                    <label className="text-xs font-black text-gray-900 uppercase tracking-[0.2em] ml-2">II. Market Value</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-5 rounded-[1.5rem] border border-gray-100">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block text-center">MRP (₹)</label>
                        <input
                          type="number"
                          name="mrp"
                          value={variantForm.mrp}
                          onChange={handleChange}
                          className="w-full bg-transparent border-none text-center font-black text-xl text-gray-900 focus:ring-0 p-0"
                          placeholder="00"
                        />
                      </div>
                      <div className="bg-gray-900 p-5 rounded-[1.5rem] border border-gray-800 shadow-xl shadow-black/10">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block text-center">Sell (₹)</label>
                        <input
                          type="number"
                          name="price"
                          value={variantForm.price}
                          onChange={handleChange}
                          className="w-full bg-transparent border-none text-center font-black text-xl text-white focus:ring-0 p-0"
                          placeholder="00"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Growth/Discount Banner */}
                <div className="p-8 bg-gradient-to-br from-gray-50 to-white rounded-[2.5rem] border border-gray-100 flex flex-col md:flex-row items-center gap-8 shadow-sm">
                  <div className="w-20 h-20 bg-black text-white rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-black/20 flex-shrink-0">
                    <Tag className="w-10 h-10" />
                  </div>
                  <div className="flex-grow text-center md:text-left">
                    <h3 className="text-2xl font-black text-gray-900 tracking-tighter">Strategic Pricing</h3>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                      Current Profit Margin Optimization Strategy
                    </p>
                  </div>
                  <div className="flex items-center gap-4 bg-white px-8 py-5 rounded-[2rem] border border-gray-100 shadow-xl">
                    <input
                      type="number"
                      name="discount"
                      value={variantForm.discount}
                      onChange={handleChange}
                      className="w-16 bg-transparent border-none text-center font-black text-3xl text-gray-900 focus:ring-0 p-0"
                      max="100"
                    />
                    <span className="text-2xl font-black text-gray-200">%</span>
                    <div className="w-px h-10 bg-gray-100 mx-2"></div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-gray-400 uppercase">OFF</p>
                      <p className="text-sm font-black text-green-600">APPLIED</p>
                    </div>
                  </div>
                </div>

                {/* Inventory Block */}
                <div className="space-y-6">
                  <label className="text-xs font-black text-gray-900 uppercase tracking-[0.2em] ml-2">III. Capability matrix</label>
                  <div className="bg-gray-50 p-10 rounded-[2.5rem] border border-gray-100 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gray-100/50 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none"></div>
                    <DynamicSizesInput sizes={variantForm.sizes} setSizes={setSizes} />
                  </div>
                </div>

                {/* Media Archive */}
                <div className="space-y-6">
                  <label className="text-xs font-black text-gray-900 uppercase tracking-[0.2em] ml-2">IV. Visual archive</label>
                  <div className="bg-white rounded-[2.5rem] border-2 border-dashed border-gray-200 p-8 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {variantForm.images?.map((img, i) => (
                      <div key={i} className="group relative aspect-[3/4] rounded-2xl overflow-hidden shadow-sm transition-all hover:scale-105 hover:shadow-2xl">
                        <img src={img.url} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                          <button 
                            type="button"
                            className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-2xl"
                            onClick={() => {
                              setVariantForm(prev => ({
                                ...prev,
                                images: prev.images.filter((_, idx) => idx !== i)
                              }));
                            }}
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        {i === 0 && (
                          <div className="absolute top-3 left-3 px-2 py-1 bg-black text-white text-[8px] font-black uppercase tracking-widest rounded-md shadow-2xl border border-white/20">
                            Hero
                          </div>
                        )}
                      </div>
                    ))}

                    <label className="aspect-[3/4] rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-gray-50 hover:border-gray-400 transition-all group">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Camera className="w-6 h-6 text-gray-400" />
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Upload Media</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Deployment CTA */}
              <div className="mt-16 flex flex-col md:flex-row gap-6">
                <button
                  type="submit"
                  disabled={!variantForm.price}
                  className="flex-grow bg-black text-white p-6 rounded-[2rem] font-black text-lg uppercase tracking-widest flex items-center justify-center gap-4 shadow-[0_20px_40px_rgba(0,0,0,0.2)] hover:shadow-[0_25px_50px_rgba(0,0,0,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30 disabled:grayscale"
                >
                  <Package className="w-6 h-6" />
                  {selectedVariantIndex !== null ? "Deploy Update" : "Deploy Variant"}
                </button>
                
                {selectedVariantIndex !== null && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedVariantIndex(null);
                      setVariantForm(getEmptyVariantForm());
                    }}
                    className="md:w-auto px-10 bg-gray-100 text-gray-900 p-6 rounded-[2rem] font-black uppercase tracking-widest text-sm hover:bg-gray-200 transition-colors"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Media Cropper Portal */}
      {showCropper && previewQueue.length > 0 && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-8 animate-in fade-in duration-500">
          <div className="w-full max-w-4xl animate-in zoom-in-95 duration-500">
            <CropperModal
              imageSrcs={previewQueue}
              onClose={() => {
                setShowCropper(false);
                setPreviewQueue([]);
              }}
              onCropComplete={handleCropComplete}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AddVariant;
