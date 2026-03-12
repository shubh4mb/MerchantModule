import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import {
  getMerchantById,
  updateMerchantShopDetails,
  updateMerchantBankDetails,
  updateMerchantOperatingHours,
  activateMerchant,
} from "../../api/auth";
import LogoCrop from "./LogoCrop/LogoCrop";
import MapSelector from "./MapSelector";
import FlashFitsLogo from '../../assets/fevicon.png';

const steps = [
  { number: 1, title: "Shop Details", subtitle: "Store information & Zone" },
  { number: 2, title: "Bank Details", subtitle: "Payment & settlement info" },
  { number: 3, title: "Final Setup", subtitle: "Operating hours & activation" },
];

const categories = [
  "Grocery & Food",
  "Electronics",
  "Fashion & Clothing",
  "Health & Beauty",
  "Home & Garden",
  "Sports & Fitness",
  "Books & Media",
  "Others",
];

const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const Register = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string | null }>({});
  const [merchantId, setMerchantId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    shopName: "",
    shopDescription: "",
    category: "",
    genderCategory: "",
    logo: null as File | string | null,
    isLogoCropOpen: false,
    address: { street: "", city: "", postalCode: "" },
    ownerName: "",
    latitude: null as number | null,
    longitude: null as number | null,
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    upiId: "",
    openTime: "09:00",
    closeTime: "21:00",
    daysOpen: [] as string[],
  });

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }));
      },
      (err) => console.warn("Location Error:", err.message),
      { enableHighAccuracy: true }
    );
  }, []);

  useEffect(() => {
    const merchant_id = localStorage.getItem("merchant_id");
    if (!merchant_id) return;

    const fetchMerchant = async () => {
      setIsLoading(true);
      try {
        const merchant = await getMerchantById();
        setMerchantId(merchant._id);

        setFormData((prev) => ({
          ...prev,
          shopName: merchant.shopName || "",
          shopDescription: merchant.shopDescription || "",
          category: merchant.category || "",
          genderCategory: merchant.genderCategory || "",
          logo: merchant.logo || null,
          address: {
            street: merchant.address?.street || "",
            city: merchant.address?.city || "",
            postalCode: merchant.address?.postalCode || "",
          },
          ownerName: merchant.ownerName || "",
          latitude: merchant.latitude || null,
          longitude: merchant.longitude || null,
          accountHolderName: merchant.bankDetails?.accountHolderName || "",
          accountNumber: merchant.bankDetails?.accountNumber || "",
          ifscCode: merchant.bankDetails?.ifscCode || "",
          bankName: merchant.bankDetails?.bankName || "",
          upiId: merchant.bankDetails?.upiId || "",
          openTime: merchant.operatingHours?.openTime || "09:00",
          closeTime: merchant.operatingHours?.closeTime || "21:00",
          daysOpen: merchant.operatingHours?.daysOpen || [],
        }));

        if (!merchant.isActive) {
          if (!merchant.shopName || !merchant.category) setCurrentStep(1);
          else if (!merchant.bankDetails?.accountNumber) setCurrentStep(2);
          else setCurrentStep(3);
        } else {
          navigate("/merchant/inventory");
        }
      } catch (error) {
        console.error("Fetch merchant failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMerchant();
  }, [navigate]);

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));
    if (errors.location) {
      setErrors((prev) => ({ ...prev, location: null }));
    }
  };

  const validateStep = (step: number) => {
    const newErrors: { [key: string]: string } = {};

    if (step === 1) {
      if (!formData.shopName.trim()) newErrors.shopName = "Shop name is required";
      if (!formData.category) newErrors.category = "Category is required";
      if (!formData.genderCategory) newErrors.genderCategory = "Gender category is required";
      if (!formData.ownerName.trim()) newErrors.ownerName = "Owner name is required";
      if (!formData.logo) newErrors.logo = "Logo is required";
      if (
        !formData.address.street.trim() ||
        !formData.address.city.trim() ||
        !formData.address.postalCode.trim()
      )
        newErrors.address = "Complete address is required";
      if (!formData.latitude || !formData.longitude)
        newErrors.location = "Please select your shop location on the map";
    }

    if (step === 2) {
      if (!formData.accountHolderName.trim())
        newErrors.accountHolderName = "Account holder name is required";
      if (!formData.accountNumber.trim())
        newErrors.accountNumber = "Account number is required";
      if (!formData.ifscCode.trim()) newErrors.ifscCode = "IFSC code is required";
      if (!formData.bankName.trim()) newErrors.bankName = "Bank name is required";
    }

    if (step === 3) {
      if (!formData.openTime) newErrors.openTime = "Opening time is required";
      if (!formData.closeTime) newErrors.closeTime = "Closing time is required";
      if (formData.daysOpen.length === 0)
        newErrors.daysOpen = "Select at least one working day";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateStep(currentStep) || !merchantId) return;

    setIsLoading(true);
    try {
      if (currentStep === 1) {
        const data = new FormData();
        data.append("shopName", formData.shopName);
        data.append("shopDescription", formData.shopDescription);
        data.append("category", formData.category);
        data.append("genderCategory", formData.genderCategory);
        data.append("ownerName", formData.ownerName);
        data.append("address", JSON.stringify(formData.address));

        if (formData.latitude) data.append("latitude", String(formData.latitude));
        if (formData.longitude) data.append("longitude", String(formData.longitude));

        if (formData.logo instanceof File) {
          data.append("logo", formData.logo);
        }


        await updateMerchantShopDetails(merchantId, data);
        setCurrentStep(2);
      }

      else if (currentStep === 2) {
        await updateMerchantBankDetails(merchantId, {
          accountHolderName: formData.accountHolderName,
          accountNumber: formData.accountNumber,
          ifscCode: formData.ifscCode,
          bankName: formData.bankName,
          upiId: formData.upiId,
        });
        setCurrentStep(3);
      }

      else if (currentStep === 3) {
        await updateMerchantOperatingHours(merchantId, {
          openTime: formData.openTime,
          closeTime: formData.closeTime,
          daysOpen: formData.daysOpen,
        });
        await activateMerchant(merchantId);
        navigate("/merchant/products");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => { if (currentStep > 1) setCurrentStep(prev => prev - 1); };
  const toggleDay = (day: string) => {
    updateFormData(
      "daysOpen",
      formData.daysOpen.includes(day)
        ? formData.daysOpen.filter((d) => d !== day)
        : [...formData.daysOpen, day]
    );
  };

  const fetchCurrectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;

        setFormData((prev) => ({
          ...prev,
          latitude,
          longitude,
        }));

        // Clear location error if any
        setErrors((prev) => ({ ...prev, location: null }));
      },
      (err) => {
        console.error("Location fetch error:", err.message);
        alert("Failed to fetch location. Please enable GPS and try again.");
      },
      { enableHighAccuracy: true }
    );
  };


  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-800 to-black relative overflow-hidden flex-col lg:flex-row">
      {/* Progress Sidebar */}
      <div className="w-full lg:w-[340px] bg-white/10 backdrop-blur-[20px] px-6 py-8 lg:px-10 lg:py-12 flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.5)] border-b lg:border-b-0 lg:border-r border-white/20 relative z-10 lg:fixed lg:top-0 lg:h-screen">
        <div className="flex items-center gap-4 animate-[logoEntrance_1s_cubic-bezier(0.68,-0.55,0.265,1.55)_0.2s_both]">
          <img src={FlashFitsLogo} alt="FlashFits Logo" className="w-40 h-18" />
        </div>

        <div className="mb-12 mt-8 animate-[titleSlide_0.8s_ease-out_0.4s_both]">
          <h3 className="text-2xl font-bold text-white mb-3 drop-shadow-md">Onboarding</h3>
          <p className="text-base text-white/80 leading-relaxed">Complete your registration in 3 steps</p>
        </div>

        <div className="flex flex-row lg:flex-col gap-5 lg:gap-10 overflow-x-auto lg:overflow-visible pb-3 lg:pb-0">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className={`flex items-start gap-5 relative transition-all duration-500 opacity-70 animate-[stepEntrance_0.6s_ease-out_both] flex-col lg:flex-row text-center lg:text-left min-w-[140px] lg:min-w-0 items-center lg:items-start ${currentStep >= step.number ? 'opacity-100 lg:translate-x-2 scale-[1.02]' : ''}`}
              style={{ animationDelay: `${0.6 + index * 0.2}s` }}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-base text-white/90 border-2 border-white/30 backdrop-blur-sm flex-shrink-0 relative z-[2] transition-all duration-700 ${
                currentStep >= step.number ? 'bg-gradient-to-br from-gray-600 to-black text-white shadow-[0_0_30px_rgba(77,77,77,0.6)] scale-[1.15]' : 'bg-white/10'
              }`}>
                {currentStep > step.number ? (
                  <span className="text-xl drop-shadow-md">✓</span>
                ) : (
                  step.number
                )}
              </div>
              <div>
                <h4 className={`text-lg font-bold text-white mb-1.5 drop-shadow-md transition-all duration-500 ${currentStep >= step.number ? 'text-gray-300 drop-shadow-[0_0_20px_rgba(204,204,204,0.5)]' : ''}`}>
                  {step.title}
                </h4>
                <p className="text-sm text-white/70 leading-relaxed">{step.subtitle}</p>
              </div>
              {index < steps.length - 1 && (
                <div className={`hidden lg:block absolute left-[23px] top-[60px] w-0.5 h-10 rounded-full transition-all duration-500 ${
                  currentStep > step.number ? 'bg-gradient-to-b from-gray-600 to-black shadow-[0_0_10px_rgba(77,77,77,0.5)]' : 'bg-gradient-to-b from-white/30 to-white/10'
                }`}></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center p-6 lg:pl-[340px] lg:p-12 relative">
        <div className="max-w-[680px] mx-auto w-full relative">
          {/* Step 1 */}
          {currentStep === 1 && (
            <div className="bg-white/10 backdrop-blur-[20px] rounded-[20px] p-8 lg:p-14 shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-white/20 relative animate-[formEntrance_0.8s_cubic-bezier(0.25,0.46,0.45,0.94)_both]">
              <h3 className="text-3xl font-extrabold text-center mb-10 bg-gradient-to-br from-gray-600 to-black bg-clip-text text-transparent">Store Details</h3>
              <div className="flex flex-col gap-3 mb-8 relative">
                <label className="text-base font-semibold text-white/90 drop-shadow-sm">Shop Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-black bg-white/70 transition-all duration-300 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white placeholder:text-gray-400"
                  value={formData.shopName}
                  onChange={(e) => updateFormData("shopName", e.target.value)}
                  placeholder="Enter shop name"
                />
                {errors.shopName && <p className="text-gray-300 text-sm font-medium mt-2 flex items-center gap-2 animate-[errorSlide_0.3s_ease-out] before:content-['⚠'] before:text-sm">{ errors.shopName}</p>}
              </div>

              <div className="flex flex-col gap-3 mb-8 relative">
                <label className="text-base font-semibold text-white/90 drop-shadow-sm">Description</label>
                <textarea
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-black bg-white/70 transition-all duration-300 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white placeholder:text-gray-400"
                  value={formData.shopDescription}
                  onChange={(e) => updateFormData("shopDescription", e.target.value)}
                  placeholder="Enter shop description"
                  rows={4}
                />
                {errors.shopDescription && <p className="text-gray-300 text-sm font-medium mt-2 flex items-center gap-2 animate-[errorSlide_0.3s_ease-out] before:content-['⚠'] before:text-sm">{errors.shopDescription}</p>}
              </div>

              <div className="flex flex-col gap-3 mb-8 relative">
                <label className="text-base font-semibold text-white/90 drop-shadow-sm">Category</label>
                <select
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-black bg-white/70 transition-all duration-300 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white"
                  value={formData.category}
                  onChange={(e) => updateFormData("category", e.target.value)}
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {errors.category && <p className="text-gray-300 text-sm font-medium mt-2 flex items-center gap-2 animate-[errorSlide_0.3s_ease-out] before:content-['⚠'] before:text-sm">{errors.category}</p>}
              </div>

              <div className="flex flex-col gap-3 mb-8 relative">
                <label className="text-base font-semibold text-white/90 drop-shadow-sm">Gender Category</label>
                <select
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-black bg-white/70 transition-all duration-300 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white"
                  value={formData.genderCategory}
                  onChange={(e) => updateFormData("genderCategory", e.target.value)}
                >
                  <option value="">Select Gender Category</option>
                  <option value="Men">Men</option>
                  <option value="Women">Women</option>
                  <option value="Unisex">Unisex</option>
                  <option value="Kids">Kids</option>
                </select>
                {errors.genderCategory && <p className="text-gray-300 text-sm font-medium mt-2 flex items-center gap-2 animate-[errorSlide_0.3s_ease-out] before:content-['⚠'] before:text-sm">{errors.genderCategory}</p>}
              </div>

              <div className="flex flex-col gap-3 mb-8 relative">
                <label className="text-base font-semibold text-white/90 drop-shadow-sm">Owner Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-black bg-white/70 transition-all duration-300 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white placeholder:text-gray-400"
                  value={formData.ownerName}
                  onChange={(e) => updateFormData("ownerName", e.target.value)}
                  placeholder="Enter owner name"
                />
                {errors.ownerName && <p className="text-gray-300 text-sm font-medium mt-2 flex items-center gap-2 animate-[errorSlide_0.3s_ease-out] before:content-['⚠'] before:text-sm">{errors.ownerName}</p>}
              </div>

              <h4 className="text-lg font-bold text-white mb-4 drop-shadow-md">Shop Address</h4>
              <div className="flex flex-col gap-3 mb-8 relative">
                <label className="text-base font-semibold text-white/90 drop-shadow-sm">Street</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-black bg-white/70 transition-all duration-300 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white placeholder:text-gray-400"
                  value={formData.address.street}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      address: { ...prev.address, street: e.target.value },
                    }))
                  }
                  placeholder="Enter street"
                />
                {errors.address && <p className="text-gray-300 text-sm font-medium mt-2 flex items-center gap-2 animate-[errorSlide_0.3s_ease-out] before:content-['⚠'] before:text-sm">{errors.address}</p>}
              </div>

              <div className="flex flex-col gap-3 mb-8 relative">
                <label className="text-base font-semibold text-white/90 drop-shadow-sm">City</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-black bg-white/70 transition-all duration-300 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white placeholder:text-gray-400"
                  value={formData.address.city}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      address: { ...prev.address, city: e.target.value },
                    }))
                  }
                  placeholder="Enter city"
                />
              </div>

              <div className="flex flex-col gap-3 mb-8 relative">
                <label className="text-base font-semibold text-white/90 drop-shadow-sm">Postal Code</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-black bg-white/70 transition-all duration-300 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white placeholder:text-gray-400"
                  value={formData.address.postalCode}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      address: { ...prev.address, postalCode: e.target.value },
                    }))
                  }
                  placeholder="Enter postal code"
                />
              </div>

              <div className="flex flex-col gap-3 mb-8 relative">
                <label className="text-base font-semibold text-white/90 drop-shadow-sm">Shop Logo</label>
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full text-base font-bold cursor-pointer transition-all duration-700 border-2 border-white/30 bg-white/10 text-white/90 backdrop-blur-sm tracking-wide hover:bg-white/20 hover:border-white/50 hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(255,255,255,0.2)]"
                  onClick={() => updateFormData("isLogoCropOpen", true)}
                >
                  {formData.logo ? "Change Logo" : "Upload Logo"}
                </button>

                {formData.logo && (
                  <div className="mt-2">
                    <img
                      src={typeof formData.logo === "string" ? formData.logo : URL.createObjectURL(formData.logo)}
                      alt="Shop Logo Preview"
                      className="w-20 h-20 object-cover mt-2 rounded-lg"
                    />
                  </div>
                )}

                {errors.logo && <p className="text-gray-300 text-sm font-medium mt-2 flex items-center gap-2 animate-[errorSlide_0.3s_ease-out] before:content-['⚠'] before:text-sm">{errors.logo}</p>}

                <LogoCrop
                  isOpen={!!formData.isLogoCropOpen}
                  onClose={() => updateFormData("isLogoCropOpen", false)}
                  onCrop={(croppedBlob) => {
                    const file = new File([croppedBlob], "logo.png", { type: "image/png" });
                    updateFormData("logo", file);
                    updateFormData("isLogoCropOpen", false);
                  }}
                />
              </div>

              <h4 className="text-lg font-bold text-white/90 mt-8 mb-4">
                Select Shop Location
              </h4>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full text-base font-bold cursor-pointer transition-all duration-700 border-2 border-white/30 bg-white/10 text-white/90 backdrop-blur-sm tracking-wide hover:bg-white/20 hover:border-white/50 hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(255,255,255,0.2)]"
                onClick={fetchCurrectLocation}
              >
                Current Location
              </button>

              <div className="w-full h-[300px] rounded-xl overflow-hidden mt-2.5 border border-gray-300">
                <MapSelector
                  latitude={formData.latitude}
                  longitude={formData.longitude}
                  onLocationSelect={handleLocationSelect}
                />
              </div>

              <div className="mt-4 text-white/80 text-sm">
                <strong>Selected Coordinates:</strong>
                <br />
                Latitude: {formData.latitude ? formData.latitude.toFixed(6) : "Not selected"}
                <br />
                Longitude: {formData.longitude ? formData.longitude.toFixed(6) : "Not selected"}
              </div>

              {errors.location && <p className="text-gray-300 text-sm font-medium mt-2 flex items-center gap-2 animate-[errorSlide_0.3s_ease-out] before:content-['⚠'] before:text-sm">{errors.location}</p>}
            </div>
          )}

          {/* Step 2 */}
          {currentStep === 2 && (
            <div className="bg-white/10 backdrop-blur-[20px] rounded-[20px] p-8 lg:p-14 shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-white/20 relative animate-[formEntrance_0.8s_cubic-bezier(0.25,0.46,0.45,0.94)_both]">
              <h3 className="text-3xl font-extrabold text-center mb-10 bg-gradient-to-br from-gray-600 to-black bg-clip-text text-transparent">Bank Details</h3>
              {[
                { label: "Account Holder Name", field: "accountHolderName", placeholder: "Enter account holder name" },
                { label: "Account Number", field: "accountNumber", placeholder: "Enter account number" },
                { label: "IFSC Code", field: "ifscCode", placeholder: "Enter IFSC code" },
                { label: "Bank Name", field: "bankName", placeholder: "Enter bank name" },
                { label: "UPI ID (Optional)", field: "upiId", placeholder: "Enter UPI ID" },
              ].map(({ label, field, placeholder }) => (
                <div key={field} className="flex flex-col gap-3 mb-8 relative">
                  <label className="text-base font-semibold text-white/90 drop-shadow-sm">{label}</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-black bg-white/70 transition-all duration-300 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white placeholder:text-gray-400"
                    value={(formData as any)[field]}
                    onChange={(e) => updateFormData(field, e.target.value)}
                    placeholder={placeholder}
                  />
                  {(errors as any)[field] && <p className="text-gray-300 text-sm font-medium mt-2 flex items-center gap-2 animate-[errorSlide_0.3s_ease-out] before:content-['⚠'] before:text-sm">{(errors as any)[field]}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Step 3 */}
          {currentStep === 3 && (
            <div className="bg-white/10 backdrop-blur-[20px] rounded-[20px] p-8 lg:p-14 shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-white/20 relative animate-[formEntrance_0.8s_cubic-bezier(0.25,0.46,0.45,0.94)_both]">
              <h3 className="text-3xl font-extrabold text-center mb-10 bg-gradient-to-br from-gray-600 to-black bg-clip-text text-transparent">Operating Hours</h3>
              <div className="flex flex-col gap-3 mb-8 relative">
                <label className="text-base font-semibold text-white/90 drop-shadow-sm">Opening Time</label>
                <input
                  type="time"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-black bg-white/70 transition-all duration-300 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white"
                  value={formData.openTime}
                  onChange={(e) => updateFormData("openTime", e.target.value)}
                />
                {errors.openTime && <p className="text-gray-300 text-sm font-medium mt-2 flex items-center gap-2 animate-[errorSlide_0.3s_ease-out] before:content-['⚠'] before:text-sm">{errors.openTime}</p>}
              </div>

              <div className="flex flex-col gap-3 mb-8 relative">
                <label className="text-base font-semibold text-white/90 drop-shadow-sm">Closing Time</label>
                <input
                  type="time"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-black bg-white/70 transition-all duration-300 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white"
                  value={formData.closeTime}
                  onChange={(e) => updateFormData("closeTime", e.target.value)}
                />
                {errors.closeTime && <p className="text-gray-300 text-sm font-medium mt-2 flex items-center gap-2 animate-[errorSlide_0.3s_ease-out] before:content-['⚠'] before:text-sm">{errors.closeTime}</p>}
              </div>

              <div className="flex flex-col gap-3 mb-8 relative">
                <label className="text-base font-semibold text-white/90 drop-shadow-sm">Days Open</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                  {daysOfWeek.map((day) => (
                    <label key={day} className="flex items-center gap-3 px-5 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl text-white/90 font-semibold cursor-pointer transition-all duration-500 hover:border-gray-300 hover:bg-gray-300/20 hover:-translate-y-0.5">
                      <input
                        type="checkbox"
                        checked={formData.daysOpen.includes(day)}
                        onChange={() => toggleDay(day)}
                        className="w-5 h-5 rounded border-2 border-white/30 cursor-pointer accent-gray-400"
                      />
                      {day}
                    </label>
                  ))}
                </div>
                {errors.daysOpen && <p className="text-gray-300 text-sm font-medium mt-2 flex items-center gap-2 animate-[errorSlide_0.3s_ease-out] before:content-['⚠'] before:text-sm">{errors.daysOpen}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex flex-col-reverse sm:flex-row justify-between items-center mt-12 gap-6 max-w-[680px] mx-auto w-full">
          {currentStep > 1 && (
            <button
              type="button"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full text-base font-bold cursor-pointer transition-all duration-700 border-2 border-white/30 bg-white/10 text-white/90 backdrop-blur-sm tracking-wide min-w-[160px] h-14 w-full sm:w-auto hover:bg-white/20 hover:border-white/50 hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(255,255,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleBack}
              disabled={isLoading}
            >
              ← Back
            </button>
          )}

          <button
            type="button"
            className={`inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full text-base font-bold cursor-pointer transition-all duration-700 bg-gradient-to-br from-gray-600 to-black text-white shadow-[0_8px_30px_rgba(77,77,77,0.4)] min-w-[160px] h-14 ml-auto tracking-wide w-full sm:w-auto hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_15px_50px_rgba(77,77,77,0.5)] active:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${isLoading ? 'pointer-events-none' : ''}`}
            onClick={handleNext}
            disabled={isLoading}
          >
            {isLoading && <div className="w-5 h-5 border-2 border-white/30 border-t-current rounded-full animate-spin"></div>}
            <span>
              {currentStep === 3 ? 'Activate Account' : 'Continue'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;