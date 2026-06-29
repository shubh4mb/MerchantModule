import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Register.css"; // Ensure the new CSS is imported
import LogoCrop from "./LogoCrop/LogoCrop";
import BannerCrop from "./BannerCrop/BannerCrop";

import {
  getMerchantById,
  updateMerchantShopDetails,
  updateMerchantBankDetails,
  updateMerchantKYC,
  updateMerchantOperatingHours,
  activateMerchant,
} from "../../api/auth";
import MapSelector from "./MapSelector";
import FlashFitsLogo from '../../assets/fevicon.png';
import { useAuth } from "../../context/AuthContext";

const steps = [
  { number: 1, title: "Shop Details", subtitle: "Store information & Zone" },
  { number: 2, title: "Bank Details", subtitle: "Payment & settlement info" },
  { number: 3, title: "KYC Documents", subtitle: "PAN, GST & Legal proof" },
  { number: 4, title: "Final Setup", subtitle: "Operating hours & activation" },
];

/*
const businessTypes = [
  "Individual",
  "Sole Proprietor",
  "Partnership",
  "Company",
];

const businessProofTypes = [
  { id: 'shop_license', label: 'Shop & Establishment License' },
  { id: 'gst_cert', label: 'GST Certificate' },
  { id: 'udyam', label: 'Udyam Registration (MSME)' },
  { id: 'rent_agreement', label: 'Rental Agreement' },
];
*/

const genderCategories = ["Men", "Women", "Kids"];


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
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [tempLogo, setTempLogo] = useState<File | null>(null);
  const [tempBanner, setTempBanner] = useState<File | null>(null);
  const { merchant, token, login, logout } = useAuth();
  const isPending = merchant?.status === 'pending_verification';
  const isRejected = merchant?.status === 'rejected';
  const [rejectionReason, setRejectionReason] = useState("");

  const [formData, setFormData] = useState({
    shopName: "",
    shopDescription: "",
    genderCategory: [] as string[],
    storeMobileNumber: "",
    pickupContactNumber: "",
    confirmAccountNumber: "",
    logo: null as File | string | null,
    isLogoCropOpen: false,
    backgroundImage: null as File | string | null,
    isBannerCropOpen: false,
    address: { street: "", city: "", state: "", postalCode: "", landmark: "", note: "" },
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
    isOutOfZone: false,
    enableCourierDelivery: false,
    shipsWithinHours: "24",
    acceptsReturns: true,
    managerName: "",
    managerPhoneNumber: "",
    managerEmail: "",
    // KYC
    panNumber: "",
    panImage: null as File | string | null,
    gstNumber: "",
    gstImage: null as File | string | null,
    businessProofType: "",
    businessProofImage: null as File | string | null,
    bankProofImage: null as File | string | null,
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
        setRejectionReason(merchant.rejectionReason || "");
        login({
          id: merchant._id,
          shopName: merchant.shopName || "",
          email: merchant.email || "",
          phoneNumber: merchant.phoneNumber || "",
          isActive: merchant.isActive,
          status: merchant.status,
          zoneId: merchant.zoneId,
          rejectionReason: merchant.rejectionReason,
        } as any, token!);
        setMerchantId(merchant._id);

        setFormData((prev) => ({
          ...prev,
          shopName: (merchant.shopName && merchant.shopName !== "New Shop") ? merchant.shopName : "",
          shopDescription: merchant.shopDescription || "",
          storeMobileNumber: merchant.storeMobileNumber || "",
          pickupContactNumber: merchant.pickupContactNumber || "",
          genderCategory: Array.isArray(merchant.genderCategory) ? merchant.genderCategory : [],
          logo: merchant.logo?.url || null,
          backgroundImage: merchant.backgroundImage?.url || null,
          address: {
            street: merchant.address?.street || "",
            city: merchant.address?.city || "",
            state: merchant.address?.state || "",
            postalCode: merchant.address?.postalCode || "",
            landmark: merchant.address?.landmark || "",
            note: merchant.address?.note || "",
          },
          ownerName: merchant.ownerName || "",
          latitude: merchant.address?.latitude || null,
          longitude: merchant.address?.longitude || null,
          accountHolderName: merchant.bankDetails?.accountHolderName || "",
          accountNumber: merchant.bankDetails?.accountNumber || "",
          confirmAccountNumber: merchant.bankDetails?.accountNumber || "",
          ifscCode: merchant.bankDetails?.ifscCode || "",
          bankName: merchant.bankDetails?.bankName || "",
          managerName: merchant.managerName || "",
          managerPhoneNumber: merchant.managerPhoneNumber || "",
          managerEmail: merchant.managerEmail || "",
          upiId: merchant.bankDetails?.upiId || "",
          // KYC
          panNumber: merchant.kyc?.pan?.number || "",
          panImage: merchant.kyc?.pan?.image?.url || null,
          gstNumber: merchant.kyc?.gst?.number || "",
          gstImage: merchant.kyc?.gst?.image?.url || null,
          businessProofType: merchant.kyc?.businessProof?.proofType || "",
          businessProofImage: merchant.kyc?.businessProof?.image?.url || null,
          bankProofImage: merchant.kyc?.bankProof?.image?.url || null,
          daysOpen: merchant.operatingHours?.daysOpen || [],
          enableCourierDelivery: merchant.enableCourierDelivery || false,
          shipsWithinHours: String(merchant.shipsWithinHours || "24"),
          acceptsReturns: merchant.acceptsReturns !== false,
          isOutOfZone: !!merchant.zoneName && merchant.zoneName.includes("Courier Only"),
        }));

        if (!merchant.isActive) {
          if (!merchant.shopName || merchant.shopName === "New Shop") setCurrentStep(1);
          else if (!merchant.bankDetails?.accountNumber) setCurrentStep(2);
          else if (!merchant.kyc?.pan?.number) setCurrentStep(3);
          else setCurrentStep(4);
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

  const handleLocationSelect = async (lat: number, lng: number) => {
    setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      if (data && data.address) {
        setFormData((prev) => ({
          ...prev,
          address: {
            ...prev.address,
            street: data.address.road || data.address.suburb || data.address.neighbourhood || prev.address.street,
            city: data.address.city || data.address.town || data.address.county || prev.address.city,
            state: data.address.state || prev.address.state,
            postalCode: data.address.postcode || prev.address.postalCode,
          }
        }));
      }
    } catch (err) { console.warn("Reverse geocode failed:", err); }
  };

  const validateStep = (step: number) => {
    const newErrors: { [key: string]: string } = {};

    if (step === 1) {
      if (!formData.shopName.trim()) newErrors.shopName = "Shop name is required";
      if (!formData.ownerName.trim()) newErrors.ownerName = "Owner name is required";
      if (!formData.storeMobileNumber || !formData.storeMobileNumber.trim()) newErrors.storeMobileNumber = "Store mobile number is required";
      if (!formData.pickupContactNumber || !formData.pickupContactNumber.trim()) newErrors.pickupContactNumber = "Pickup contact number is required";
      if (!formData.logo) newErrors.logo = "Logo is required";
      if (!formData.address.street.trim() || !formData.address.postalCode.trim()) newErrors.address = "Address and Pincode are required";
      if (!formData.latitude || !formData.longitude) newErrors.location = "Select shop location on map";
      if (formData.isOutOfZone && !formData.enableCourierDelivery) {
        newErrors.courier = "Courier service is mandatory for shops outside our delivery zones.";
      }
    }

    if (step === 2) {
      if (!formData.accountNumber.trim()) newErrors.accountNumber = "Account number is required";
      if (!formData.confirmAccountNumber || !formData.confirmAccountNumber.trim()) newErrors.confirmAccountNumber = "Please confirm your account number";
      if (formData.accountNumber !== formData.confirmAccountNumber) newErrors.confirmAccountNumber = "Account numbers do not match";
      if (!formData.ifscCode.trim()) newErrors.ifscCode = "IFSC code is required";
    }

    if (step === 3) {
      if (!formData.panNumber.trim()) newErrors.panNumber = "PAN number is required";
      if (!formData.panImage) newErrors.panImage = "PAN card image is required";
    }

    if (step === 4) {
      if (formData.daysOpen.length === 0) newErrors.daysOpen = "Select working days";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (isPending) {
      if (currentStep < 4) setCurrentStep(prev => prev + 1);
      return;
    }
    if (!validateStep(currentStep) || !merchantId) return;

    setIsLoading(true);
    try {
      if (currentStep === 1) {
        const data = new FormData();
        data.append("shopName", formData.shopName);
        data.append("shopDescription", formData.shopDescription);
        data.append("genderCategory", formData.genderCategory.join(','));
        data.append("pickupContactNumber", formData.pickupContactNumber);
        data.append("storeMobileNumber", formData.storeMobileNumber);
        data.append("ownerName", formData.ownerName);
        data.append("managerName", formData.managerName);
        data.append("managerPhoneNumber", formData.managerPhoneNumber);
        data.append("managerEmail", formData.managerEmail);
        data.append("address", JSON.stringify(formData.address));
        if (formData.latitude) data.append("latitude", String(formData.latitude));
        if (formData.longitude) data.append("longitude", String(formData.longitude));
        if (formData.logo instanceof File) data.append("logo", formData.logo);
        if (formData.backgroundImage instanceof File) data.append("backgroundImage", formData.backgroundImage);
        data.append("enableCourierDelivery", String(formData.enableCourierDelivery));
        data.append("shipsWithinHours", formData.shipsWithinHours);
        data.append("acceptsReturns", String(formData.acceptsReturns));

        await updateMerchantShopDetails(merchantId, data);
        setCurrentStep(2);
      } else if (currentStep === 2) {
        await updateMerchantBankDetails(merchantId, {
          accountHolderName: formData.accountHolderName,
          accountNumber: formData.accountNumber,
          ifscCode: formData.ifscCode,
          bankName: formData.bankName,
          upiId: formData.upiId,
        });
        setCurrentStep(3);
      } else if (currentStep === 3) {
        const data = new FormData();
        data.append("panNumber", formData.panNumber);
        data.append("gstNumber", formData.gstNumber);
        data.append("businessProofType", formData.businessProofType);
        if (formData.panImage instanceof File) data.append("panImage", formData.panImage);
        if (formData.gstImage instanceof File) data.append("gstImage", formData.gstImage);
        if (formData.businessProofImage instanceof File) data.append("businessProofImage", formData.businessProofImage);
        if (formData.bankProofImage instanceof File) data.append("bankProofImage", formData.bankProofImage);

        await updateMerchantKYC(merchantId, data);
        setCurrentStep(4);
      } else if (currentStep === 4) {
        await updateMerchantOperatingHours(merchantId, {
          openTime: formData.openTime,
          closeTime: formData.closeTime,
          daysOpen: formData.daysOpen,
        });

        const activateRes = await activateMerchant(merchantId!);
        if (activateRes.success) {
          alert("Registration details submitted! Pending verification.");
          login({ ...merchant!, isActive: activateRes.merchant.isActive, status: activateRes.merchant.status }, token!);
          navigate("/merchant/pending-verification");
        } else {
          throw new Error(activateRes.message || "Failed to submit verification request");
        }
      }
    } catch (error: any) {
      if (error.response?.data?.requiresOutOfZoneDetails) {
        setFormData(prev => ({ ...prev, isOutOfZone: true, enableCourierDelivery: true }));
        setErrors(prev => ({ ...prev, courier: error.response.data.message }));
      } else {
        alert(error.response?.data?.message || "An error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => { if (currentStep > 1) setCurrentStep(prev => prev - 1); };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (file) {
      if (field === "logo") {
        setTempLogo(file);
        updateFormData("isLogoCropOpen", true);
      } else if (field === "backgroundImage") {
        setTempBanner(file);
        updateFormData("isBannerCropOpen", true);
      } else {
        updateFormData(field, file);
      }
    }
  };

  const onLogoCrop = (file: File) => {
    updateFormData("logo", file);
    updateFormData("isLogoCropOpen", false);
    setTempLogo(null);
  };

  const onBannerCrop = (file: File) => {
    updateFormData("backgroundImage", file);
    updateFormData("isBannerCropOpen", false);
    setTempBanner(null);
  };

  return (
    <div className="onboarding-container">
      {/* Progress Sidebar */}
      <div className="progress-sidebar">
        <div className="logo">
          <img src={FlashFitsLogo} alt="FlashFits Logo" />
        </div>
        <div className="onboarding-title">
          <h3>Merchant Onboarding</h3>
          <p>Complete these steps to activate your store</p>
        </div>
        <div className="progress-steps">
          {steps.map((step) => (
            <div
              key={step.number}
              className={`step ${currentStep === step.number ? "active" : currentStep > step.number ? "completed" : ""} cursor-pointer hover:opacity-90`}
              onClick={() => setCurrentStep(step.number)}
            >
              <div className="step-number">
                {currentStep > step.number ? "✓" : step.number}
              </div>
              <div className="step-content">
                <h4>{step.title}</h4>
                <p>{step.subtitle}</p>
              </div>
              {step.number < steps.length && <div className="step-indicator" />}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {isPending && (
          <div className="bg-amber-50 border-2 border-amber-200 text-amber-900 p-6 rounded-2xl mb-6 flex items-center justify-between shadow-sm">
            <div>
              <h4 className="text-lg font-black tracking-tight mb-1">⏳ Verification Pending</h4>
              <p className="text-xs font-semibold text-amber-700">Your shop registration details are currently undergoing compliance review. You can review your details below.</p>
            </div>
            <button onClick={logout} className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95">Log Out</button>
          </div>
        )}

        {isRejected && (
          <div className="bg-rose-50 border-2 border-rose-200 text-rose-900 p-6 rounded-2xl mb-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-lg font-black tracking-tight mb-1">❌ Correction Required</h4>
                <p className="text-xs font-semibold text-rose-700">Please correct the flagged details in the steps below. Once corrected, proceed to Step 4 and click "Complete Activation" to resubmit.</p>
              </div>
              <button onClick={logout} className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95">Log Out</button>
            </div>
            <div className="bg-white border border-rose-100 p-4 rounded-xl whitespace-pre-line text-sm font-semibold text-rose-900 shadow-inner">
              {rejectionReason || "Details not specified."}
            </div>
          </div>
        )}

        <div className="form-container" style={{ opacity: isPending ? 0.85 : 1 }}>
          <div style={{ pointerEvents: isPending ? 'none' : 'auto' }}>
            {currentStep === 1 && (
            <div className="step-form">
              <h3>Shop & Owner Details</h3>
              <div className="form-group">
                <label>Shop Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.shopName}
                  onChange={(e) => updateFormData("shopName", e.target.value)}
                  placeholder="Official Shop Name"
                />
                {errors.shopName && <p className="error">{errors.shopName}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                <div className="form-group">
                  <label>Owner Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.ownerName}
                    onChange={(e) => updateFormData("ownerName", e.target.value)}
                    placeholder="Full Name"
                  />
                  {errors.ownerName && <p className="error">{errors.ownerName}</p>}
                </div>
                {/* Business Type hidden for now
            <div className="form-group">
              <label>Business Type</label>
              <select
                className="form-input"
                value={formData.businessType}
                onChange={(e) => updateFormData("businessType", e.target.value)}
              >
                <option value="">Select Type</option>
                {businessTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {errors.businessType && <p className="error">{errors.businessType}</p>}
            </div>
            */}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                <div className="form-group">
                  <label>Manager Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.managerName}
                    onChange={(e) => updateFormData("managerName", e.target.value)}
                    placeholder="Optional"
                  />
                </div>
                <div className="form-group">
                  <label>Manager Phone</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.managerPhoneNumber}
                    onChange={(e) => updateFormData("managerPhoneNumber", e.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                <div className="form-group">
                  <label>Store Mobile Number *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.storeMobileNumber}
                    onChange={(e) => updateFormData("storeMobileNumber", e.target.value)}
                    placeholder="Store phone number for customer contact"
                  />
                  {errors.storeMobileNumber && <p className="error">{errors.storeMobileNumber}</p>}
                </div>
                <div className="form-group">
                  <label>Pickup Contact Number *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.pickupContactNumber}
                    onChange={(e) => updateFormData("pickupContactNumber", e.target.value)}
                    placeholder="Contact number for courier pickup"
                  />
                  {errors.pickupContactNumber && <p className="error">{errors.pickupContactNumber}</p>}
                </div>
              </div>

              <div className="form-group">
                <label>Store Location</label>
                <div className="h-[400px] border border-gray-200 rounded-xl overflow-hidden shadow-inner bg-gray-50 mb-6">
                  <MapSelector latitude={formData.latitude} longitude={formData.longitude} onLocationSelect={handleLocationSelect} />
                </div>
                {errors.location && <p className="error">{errors.location}</p>}
              </div>

              <div className="form-group">
                <label>Street Address</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.address.street}
                  onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
                  placeholder="Building, Street, Area"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.address.city}
                    onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
                    placeholder="e.g. New York"
                  />
                </div>
                <div className="form-group">
                  <label>Pincode</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.address.postalCode}
                    onChange={(e) => setFormData({ ...formData, address: { ...formData.address, postalCode: e.target.value } })}
                    placeholder="6-digit ZIP code"
                  />
                  {errors.address && <p className="error">{errors.address}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                <div className="form-group">
                  <label>Landmark</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.address.landmark}
                    onChange={(e) => setFormData({ ...formData, address: { ...formData.address, landmark: e.target.value } })}
                    placeholder="e.g. Near Central Park"
                  />
                </div>
                <div className="form-group">
                  <label>Address Note</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.address.note}
                    onChange={(e) => setFormData({ ...formData, address: { ...formData.address, note: e.target.value } })}
                    placeholder="e.g. Apartment, Suite, Floor"
                  />
                </div>
              </div>


              <div className="form-group">
                <label>Gender Focus</label>
                <div className="selection-grid">
                  {genderCategories.map(g => (
                    <div
                      key={g}
                      className={`selection-pill ${formData.genderCategory.includes(g) ? 'active' : ''}`}
                      onClick={() => {
                        const newG = formData.genderCategory.includes(g) ? formData.genderCategory.filter(x => x !== g) : [...formData.genderCategory, g];
                        updateFormData("genderCategory", newG);
                      }}
                    >
                      {g}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="form-group">
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Shop Logo (1:1)</label>
                  <div
                    className="clickable-upload-container logo-upload"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    <input
                      type="file"
                      ref={logoInputRef}
                      onChange={(e) => handleFileChange(e, "logo")}
                      className="hidden"
                      accept="image/*"
                    />
                    {formData.logo ? (
                      <div className="upload-preview-wrapper">
                        <img
                          src={typeof formData.logo === 'string' ? formData.logo : URL.createObjectURL(formData.logo)}
                          alt="Logo Preview"
                          className="upload-preview-img"
                        />
                        <div className="upload-overlay">
                          <span>Change Logo</span>
                        </div>
                      </div>
                    ) : (
                      <div className="upload-placeholder">
                        <div className="upload-icon">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                        </div>
                        <span>Upload Logo</span>
                        <p className="text-[10px] text-gray-400">Square ratio works best</p>
                      </div>
                    )}
                  </div>
                  {errors.logo && <p className="error">{errors.logo}</p>}
                </div>

                <div className="form-group">
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Background Banner (16:9)</label>
                  <div
                    className="clickable-upload-container banner-upload"
                    onClick={() => bannerInputRef.current?.click()}
                  >
                    <input
                      type="file"
                      ref={bannerInputRef}
                      onChange={(e) => handleFileChange(e, "backgroundImage")}
                      className="hidden"
                      accept="image/*"
                    />
                    {formData.backgroundImage ? (
                      <div className="upload-preview-wrapper banner-preview">
                        <img
                          src={typeof formData.backgroundImage === 'string' ? formData.backgroundImage : URL.createObjectURL(formData.backgroundImage)}
                          alt="Banner Preview"
                          className="upload-preview-img banner-img"
                        />
                        <div className="upload-overlay">
                          <span>Change Banner</span>
                        </div>
                      </div>
                    ) : (
                      <div className="upload-placeholder">
                        <div className="upload-icon">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        </div>
                        <span>Upload Banner</span>
                        <p className="text-[10px] text-gray-400">Horizontal 16:9 recommended</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <LogoCrop
                isOpen={formData.isLogoCropOpen}
                onClose={() => updateFormData("isLogoCropOpen", false)}
                onCrop={onLogoCrop}
                initialImage={tempLogo}
              />
              <BannerCrop
                isOpen={formData.isBannerCropOpen}
                onClose={() => updateFormData("isBannerCropOpen", false)}
                onCrop={onBannerCrop}
                initialImage={tempBanner}
              />


              <div className="p-6 bg-gray-50 border border-gray-200 rounded-xl space-y-4 mt-8 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-900">Courier Delivery Service</span>
                    <span className="text-[11px] text-gray-500">Handle long-distance shipping outside delivery zones</span>
                  </div>
                  <div
                    className={`toggle ${formData.enableCourierDelivery ? 'active' : ''}`}
                    onClick={() => !formData.isOutOfZone && updateFormData("enableCourierDelivery", !formData.enableCourierDelivery)}
                  >
                    <span className="toggle-knob" />
                  </div>
                </div>

                {formData.isOutOfZone && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2">
                    <span className="text-[11px] text-red-600 font-bold uppercase tracking-tight">
                      ⚠️ Mandatory: Shop is outside standard delivery radial.
                    </span>
                  </div>
                )}

                {(formData.enableCourierDelivery || formData.isOutOfZone) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                    <div className="form-group border-0 !mb-0">
                      <label className="text-[11px] text-gray-500 font-semibold uppercase">Ships Within (Hours)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.shipsWithinHours}
                        onChange={(e) => updateFormData("shipsWithinHours", e.target.value)}
                        placeholder="24"
                      />
                    </div>
                    <div className="flex items-center gap-3 pt-6">
                      <input
                        type="checkbox"
                        className="w-4 h-4 cursor-pointer accent-black"
                        checked={formData.acceptsReturns}
                        onChange={(e) => updateFormData("acceptsReturns", e.target.checked)}
                      />
                      <label className="text-sm font-semibold text-gray-700">Accept Returns</label>
                    </div>
                  </div>
                )}
                {errors.courier && <p className="error">{errors.courier}</p>}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="step-form">
              <h3>Bank Details</h3>
              <div className="space-y-6">
                <div className="form-group">
                  <label>Bank Name</label>
                  <input className="form-input" value={formData.bankName} onChange={(e) => updateFormData("bankName", e.target.value)} placeholder="e.g. HDFC Bank" />
                </div>
                <div className="form-group">
                  <label>Account Number</label>
                  <input className="form-input" value={formData.accountNumber} onChange={(e) => updateFormData("accountNumber", e.target.value)} placeholder="0000 0000 0000 0000" />
                  {errors.accountNumber && <p className="error">{errors.accountNumber}</p>}
                </div>
                <div className="form-group">
                  <label>Confirm Account Number</label>
                  <input className="form-input" value={formData.confirmAccountNumber} onChange={(e) => updateFormData("confirmAccountNumber", e.target.value)} placeholder="Re-enter account number" />
                  {errors.confirmAccountNumber && <p className="error">{errors.confirmAccountNumber}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                  <div className="form-group">
                    <label>IFSC Code</label>
                    <input className="form-input uppercase" value={formData.ifscCode} onChange={(e) => updateFormData("ifscCode", e.target.value)} placeholder="HDFC0001234" />
                    {errors.ifscCode && <p className="error">{errors.ifscCode}</p>}
                  </div>
                  <div className="form-group">
                    <label>Account Holder Name</label>
                    <input className="form-input" value={formData.accountHolderName} onChange={(e) => updateFormData("accountHolderName", e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label>UPI ID (Optional)</label>
                  <input className="form-input" value={formData.upiId} onChange={(e) => updateFormData("upiId", e.target.value)} placeholder="example@upi" />
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="step-form">
              <h3>KYC Verification</h3>
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="form-group">
                      <label>PAN Card Number</label>
                      <input className="form-input uppercase" placeholder="ABCDE1234F" value={formData.panNumber} onChange={(e) => updateFormData("panNumber", e.target.value)} />
                      {errors.panNumber && <p className="error">{errors.panNumber}</p>}
                    </div>
                    <div className="form-group">
                      <label>PAN Image</label>
                      <div className="logo-container">
                        <input type="file" accept="image/*,application/pdf" onChange={(e) => handleFileChange(e, "panImage")} className="text-xs" />
                        {formData.panImage && (
                          <p className="successMessage">
                            ✓ {formData.panImage instanceof File ? formData.panImage.name : "Uploaded"}
                          </p>
                        )}
                      </div>
                      {errors.panImage && <p className="error">{errors.panImage}</p>}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="form-group">
                      <label>GST Number (Optional)</label>
                      <input className="form-input uppercase" placeholder="27ABCDE1234F1Z5" value={formData.gstNumber} onChange={(e) => updateFormData("gstNumber", e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>GST Certificate (Optional)</label>
                      <div className="logo-container">
                        <input type="file" accept="image/*,application/pdf" onChange={(e) => handleFileChange(e, "gstImage")} className="text-xs" />
                        {formData.gstImage && (
                          <p className="successMessage">
                            ✓ {formData.gstImage instanceof File ? formData.gstImage.name : "Uploaded"}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <hr className="border-gray-100" />

                <div className="space-y-6">
              {/* Business Proof hidden for now
              <div className="form-group">
                <label>Business Proof Type</label>
                <select className="form-input" value={formData.businessProofType} onChange={(e) => updateFormData("businessProofType", e.target.value)}>
                  <option value="">Select Proof Type</option>
                  {businessProofTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
                {errors.businessProofType && <p className="error">{errors.businessProofType}</p>}
              </div>
              */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Business Proof hidden for now
                <div className="form-group">
                  <label>Business Proof Image</label>
                  <div className="logo-container">
                    <input type="file" accept="image/*,application/pdf" onChange={(e) => handleFileChange(e, "businessProofImage")} className="text-xs" />
                    {formData.businessProofImage && (
                      <p className="successMessage">
                        ✓ {formData.businessProofImage instanceof File ? formData.businessProofImage.name : "Uploaded"}
                      </p>
                    )}
                  </div>
                  {errors.businessProofImage && <p className="error">{errors.businessProofImage}</p>}
                </div>
                */}
                    <div className="form-group">
                      <label>Bank Proof Image (Cheque/Passbook)</label>
                      <div className="logo-container">
                        <input type="file" accept="image/*,application/pdf" onChange={(e) => handleFileChange(e, "bankProofImage")} className="text-xs" />
                        {formData.bankProofImage && (
                          <p className="successMessage">
                            ✓ {formData.bankProofImage instanceof File ? formData.bankProofImage.name : "Uploaded"}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="step-form">
              <h3>Operational Setup</h3>
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-xl border border-gray-100">
                  <div className="form-group mb-0">
                    <label>Opening Time</label>
                    <input type="time" className="form-input" value={formData.openTime} onChange={(e) => updateFormData("openTime", e.target.value)} />
                  </div>
                  <div className="form-group mb-0">
                    <label>Closing Time</label>
                    <input type="time" className="form-input" value={formData.closeTime} onChange={(e) => updateFormData("closeTime", e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Operating Days</label>
                  <div className="selection-grid">
                    {daysOfWeek.map(d => (
                      <div
                        key={d}
                        className={`selection-pill ${formData.daysOpen.includes(d) ? 'active' : ''}`}
                        onClick={() => {
                          const days = formData.daysOpen.includes(d) ? formData.daysOpen.filter(x => x !== d) : [...formData.daysOpen, d];
                          updateFormData("daysOpen", days);
                        }}
                      >
                        {d}
                      </div>
                    ))}
                  </div>
                  {errors.daysOpen && <p className="error">{errors.daysOpen}</p>}
                </div>
              </div>
            </div>
          )}
          </div>

          {/* Navigation Buttons */}
          <div className="form-navigation">
            {currentStep > 1 && (
              <button type="button" onClick={handleBack} className="btn btn-secondary">
                Back
              </button>
            )}
            {currentStep === 4 && isPending ? (
              <button
                type="button"
                disabled
                className="btn btn-secondary cursor-not-allowed text-gray-500"
                style={{ padding: "12px 32px", opacity: 0.6 }}
              >
                Under Review
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                disabled={isLoading}
                className="btn btn-primary"
                style={{ padding: "12px 32px" }}
              >
                {isLoading ? (
                  <div className="spinner" />
                ) : currentStep === 4 ? (
                  "Complete Activation"
                ) : (
                  "Continue"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
 Register;