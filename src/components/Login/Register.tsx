import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// import "./Register.css";
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
          navigate("/merchant/orders");
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
        navigate("/merchant/orders");
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
    <div className="flex min-h-screen bg-primary-gradient relative overflow-hidden animate-float">
      {/* Grain Overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><defs><pattern id=%22grain%22 width=%22100%22 height=%22100%22 patternUnits=%22userSpaceOnUse%22><circle cx=%2250%22 cy=%2250%22 r=%220.5%22 fill=%22rgba(255,255,255,0.03)%22/></pattern></defs><rect width=%22100%22 height=%22100%22 fill=%22url(%23grain)%22/></svg>')] opacity-30 pointer-events-none"></div>

      {/* Progress Sidebar */}
      <div className="w-[340px] bg-glass backdrop-blur-md p-12 flex flex-col shadow-glass border-r border-glass-border relative z-10 lg:fixed lg:top-0 lg:h-screen transition-all duration-400">
        <div className="flex items-center gap-4 animate-logo-in">
          <img src={FlashFitsLogo} alt="FlashFits Logo" className="w-40 h-18" />
        </div>

        <div className="mb-12 animate-title-in mt-12">
          <h3 className="text-2xl font-bold text-white mb-3 text-shadow-md">Onboarding</h3>
          <p className="text-base text-white/80 leading-relaxed">Complete your registration in 3 steps</p>
        </div>

        <div className="flex flex-col gap-10">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className={`flex items-start gap-5 relative transition-all duration-400 animate-step-in ${currentStep >= step.number ? 'opacity-100' : 'opacity-40'}`}
              style={{ animationDelay: `${0.1 * index + 0.5}s` }}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all duration-400 border-2 ${currentStep > step.number ? 'bg-white text-black border-white' : currentStep === step.number ? 'bg-primary-gradient text-white border-white/20 shadow-lg scale-110' : 'bg-transparent text-white/50 border-white/20'}`}>
                {currentStep > step.number ? "✓" : step.number}
              </div>
              <div className="flex-1">
                <h4 className={`text-base font-bold mb-1 ${currentStep >= step.number ? 'text-white' : 'text-white/40'}`}>{step.title}</h4>
                <p className={`text-sm ${currentStep >= step.number ? 'text-white/60' : 'text-white/20'}`}>{step.subtitle}</p>
              </div>
              {index < steps.length - 1 && (
                <div className={`absolute left-5 top-12 w-0.5 h-12 transition-all duration-400 ${currentStep > step.number ? 'bg-white' : 'bg-white/10'}`}></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-12 flex justify-center items-center z-10 overflow-y-auto lg:ml-[340px]">
        <div className="w-full max-w-[600px] bg-white/10 backdrop-blur-lg rounded-2xl p-10 border border-glass-border shadow-glass animate-form-in">
          {/* Step 1 */}
          {currentStep === 1 && (
            <div className="flex flex-col gap-6">
              <h3 className="text-2xl font-bold text-white mb-2">Store Details</h3>
              
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-white/80 ml-1">Shop Name</label>
                <input
                  type="text"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-white text-base transition-all focus:bg-white/10 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/10 placeholder:text-white/20"
                  value={formData.shopName}
                  onChange={(e) => updateFormData("shopName", e.target.value)}
                  placeholder="Enter shop name"
                />
                {errors.shopName && <p className="text-red-400 text-xs mt-1 ml-1">{errors.shopName}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-white/80 ml-1">Description</label>
                <textarea
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-white text-base transition-all focus:bg-white/10 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/10 placeholder:text-white/20"
                  value={formData.shopDescription}
                  onChange={(e) => updateFormData("shopDescription", e.target.value)}
                  placeholder="Enter shop description"
                  rows={4}
                />
                {errors.shopDescription && <p className="text-red-400 text-xs mt-1 ml-1">{errors.shopDescription}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-white/80 ml-1">Category</label>
                <select
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-white text-base transition-all focus:bg-white/10 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/10"
                  value={formData.category}
                  onChange={(e) => updateFormData("category", e.target.value)}
                >
                  <option value="" className="bg-gray-900">Select Category</option>
                  {categories.map((c) => (
                    <option key={c} value={c} className="bg-gray-900">{c}</option>
                  ))}
                </select>
                {errors.category && <p className="text-red-400 text-xs mt-1 ml-1">{errors.category}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-white/80 ml-1">Owner Name</label>
                <input
                  type="text"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-white text-base transition-all focus:bg-white/10 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/10 placeholder:text-white/20"
                  value={formData.ownerName}
                  onChange={(e) => updateFormData("ownerName", e.target.value)}
                  placeholder="Enter owner name"
                />
                {errors.ownerName && <p className="text-red-400 text-xs mt-1 ml-1">{errors.ownerName}</p>}
              </div>

              <h4 className="text-lg font-bold text-white mt-4 border-b border-white/10 pb-2">Shop Address</h4>
              
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-white/80 ml-1">Street</label>
                <input
                  type="text"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-white text-base transition-all focus:bg-white/10 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/10 placeholder:text-white/20"
                  value={formData.address.street}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      address: { ...prev.address, street: e.target.value },
                    }))
                  }
                  placeholder="Enter street"
                />
                {errors.address && <p className="text-red-400 text-xs mt-1 ml-1">{errors.address}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-white/80 ml-1">City</label>
                  <input
                    type="text"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-white text-base transition-all focus:bg-white/10 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/10 placeholder:text-white/20"
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

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-white/80 ml-1">Postal Code</label>
                  <input
                    type="text"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-white text-base transition-all focus:bg-white/10 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/10 placeholder:text-white/20"
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
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-white/80 ml-1">Shop Logo</label>
                <button
                  type="button"
                  className="w-full py-3.5 px-6 rounded-xl font-semibold bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                  onClick={() => updateFormData("isLogoCropOpen", true)}
                >
                  {formData.logo ? "Change Logo" : "Upload Logo"}
                </button>

                {formData.logo && (
                  <div className="mt-2 flex justify-center">
                    <img
                      src={typeof formData.logo === "string" ? formData.logo : URL.createObjectURL(formData.logo)}
                      alt="Shop Logo Preview"
                      className="w-20 h-20 object-cover rounded-xl border-2 border-white/20 shadow-lg"
                    />
                  </div>
                )}

                {errors.logo && <p className="text-red-400 text-xs mt-1 ml-1">{errors.logo}</p>}

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

              <h4 className="text-lg font-bold text-white mt-8 mb-4 border-b border-white/10 pb-2">
                Select Shop Location
              </h4>
              
              <button
                type="button"
                className="w-full py-3.5 px-6 rounded-xl font-semibold bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all flex items-center justify-center gap-2 mb-4"
                onClick={fetchCurrectLocation}
              >
                Use Current Location
              </button>

              <div className="w-full h-[300px] rounded-xl overflow-hidden border border-white/10">
                <MapSelector
                  latitude={formData.latitude}
                  longitude={formData.longitude}
                  onLocationSelect={handleLocationSelect}
                />
              </div>

              <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10 text-sm text-white/70">
                <p><strong>Selected Coordinates:</strong></p>
                <p>Latitude: {formData.latitude ? formData.latitude.toFixed(6) : "Not selected"}</p>
                <p>Longitude: {formData.longitude ? formData.longitude.toFixed(6) : "Not selected"}</p>
              </div>

              {errors.location && <p className="text-red-400 text-xs mt-1 ml-1">{errors.location}</p>}
            </div>
          )}

          {/* Step 2 */}
          {currentStep === 2 && (
            <div className="flex flex-col gap-6">
              <h3 className="text-2xl font-bold text-white mb-2">Bank Details</h3>
              
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-white/80 ml-1">Account Holder Name</label>
                <input
                  type="text"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-white text-base transition-all focus:bg-white/10 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/10 placeholder:text-white/20"
                  value={formData.accountHolderName}
                  onChange={(e) => updateFormData("accountHolderName", e.target.value)}
                  placeholder="Enter account holder name"
                />
                {errors.accountHolderName && <p className="text-red-400 text-xs mt-1 ml-1">{errors.accountHolderName}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-white/80 ml-1">Account Number</label>
                <input
                  type="text"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-white text-base transition-all focus:bg-white/10 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/10 placeholder:text-white/20"
                  value={formData.accountNumber}
                  onChange={(e) => updateFormData("accountNumber", e.target.value)}
                  placeholder="Enter account number"
                />
                {errors.accountNumber && <p className="text-red-400 text-xs mt-1 ml-1">{errors.accountNumber}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-white/80 ml-1">IFSC Code</label>
                  <input
                    type="text"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-white text-base transition-all focus:bg-white/10 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/10 placeholder:text-white/20"
                    value={formData.ifscCode}
                    onChange={(e) => updateFormData("ifscCode", e.target.value)}
                    placeholder="Enter IFSC code"
                  />
                  {errors.ifscCode && <p className="text-red-400 text-xs mt-1 ml-1">{errors.ifscCode}</p>}
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-white/80 ml-1">Bank Name</label>
                  <input
                    type="text"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-white text-base transition-all focus:bg-white/10 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/10 placeholder:text-white/20"
                    value={formData.bankName}
                    onChange={(e) => updateFormData("bankName", e.target.value)}
                    placeholder="Enter bank name"
                  />
                  {errors.bankName && <p className="text-red-400 text-xs mt-1 ml-1">{errors.bankName}</p>}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-white/80 ml-1">UPI ID (Optional)</label>
                <input
                  type="text"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-white text-base transition-all focus:bg-white/10 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/10 placeholder:text-white/20"
                  value={formData.upiId}
                  onChange={(e) => updateFormData("upiId", e.target.value)}
                  placeholder="Enter UPI ID"
                />
              </div>
            </div>
          )}

          {/* Step 3 */}
          {currentStep === 3 && (
            <div className="flex flex-col gap-6">
              <h3 className="text-2xl font-bold text-white mb-2">Operating Hours</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-white/80 ml-1">Opening Time</label>
                  <input
                    type="time"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-white text-base transition-all focus:bg-white/10 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/10"
                    value={formData.openTime}
                    onChange={(e) => updateFormData("openTime", e.target.value)}
                  />
                  {errors.openTime && <p className="text-red-400 text-xs mt-1 ml-1">{errors.openTime}</p>}
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-white/80 ml-1">Closing Time</label>
                  <input
                    type="time"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-white text-base transition-all focus:bg-white/10 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/10"
                    value={formData.closeTime}
                    onChange={(e) => updateFormData("closeTime", e.target.value)}
                  />
                  {errors.closeTime && <p className="text-red-400 text-xs mt-1 ml-1">{errors.closeTime}</p>}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-white/80 ml-1 mb-2">Days Open</label>
                <div className="flex flex-wrap gap-3">
                  {daysOfWeek.map((day) => (
                    <label 
                      key={day}
                      className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all border ${formData.daysOpen.includes(day) ? 'bg-white text-black border-white shadow-lg' : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:text-white'}`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={formData.daysOpen.includes(day)}
                        onChange={() => toggleDay(day)}
                      />
                      {day}
                    </label>
                  ))}
                </div>
                {errors.daysOpen && <p className="text-red-400 text-xs mt-1 ml-1">{errors.daysOpen}</p>}
              </div>
            </div>
          )}
          
          {/* Navigation */}
          <div className="mt-10 flex gap-4 pt-4 border-t border-white/10">
            {currentStep > 1 && (
              <button
                type="button"
                className="flex-1 py-4 px-8 rounded-xl font-semibold bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                onClick={handleBack}
                disabled={isLoading}
              >
                Back
              </button>
            )}

            <button
              type="button"
              className={`flex-[2] py-4 px-8 rounded-xl font-semibold bg-primary-gradient text-white shadow-xl transition-all hover:scale-[1.02] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed ${isLoading ? 'relative' : ''}`}
              onClick={handleNext}
              disabled={isLoading}
            >
              {isLoading && (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              )}
              <span>
                {currentStep === 3 ? 'Activate Account' : 'Continue'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;