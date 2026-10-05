import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMerchantById, updateMerchantBankDetails, updateMerchantKYC, updateMerchantBranding } from "../api/auth";
import { Camera, Loader2, FileText } from "lucide-react";
import MapSelector from "./auth/MapSelector";

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"shop" | "location" | "hours" | "bank">("shop");
  const merchantId = localStorage.getItem("merchant_id");

  // Comprehensive Form State
  const [form, setForm] = useState({
    // Shop Details
    shopName: "",
    shopDescription: "",
    ownerName: "",
    category: [] as string[],
    genderCategory: [] as string[],
    storeMobileNumber: "",
    pickupContactNumber: "",
    logo: null as any,
    backgroundImage: null as any,
    enableCourierDelivery: false,
    shipsWithinHours: 24,
    acceptsReturns: false,
    phoneNumber: "",
    email: "",

    // Address & Location
    address: {
      street: "",
      city: "",
      state: "",
      postalCode: "",
      landmark: "",
      latitude: 0,
      longitude: 0,
    },

    // Operating Hours
    operatingHours: {
      open: "09:00",
      close: "21:00",
      daysOpen: [] as string[],
    },

    // Bank Details
    bankDetails: {
      accountHolderName: "",
      accountNumber: "",
      ifscCode: "",
      bankName: "",
      upiId: "",
    },

    // KYC Status (Read Only mostly)
    kyc: {
      isKycVerified: false,
      pan: { number: "", verified: false, image: null as any },
      gst: { number: "", verified: false, image: null as any },
      businessProof: { proofType: "", verified: false, image: null as any },
      bankProof: { verified: false, image: null as any },
    },
    rejectionReason: "",
    isVerified: false,
    isActive: false,
  });

  const [kycFiles, setKycFiles] = useState({
    panImage: null as File | null,
    businessProofImage: null as File | null,
    bankProofImage: null as File | null,
  });

  const [savingBank, setSavingBank] = useState(false);
  const [savingKyc, setSavingKyc] = useState(false);

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);
  const logoInputRef = React.useRef<HTMLInputElement>(null);
  const bgInputRef = React.useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !merchantId) return;

    try {
      setUploadingLogo(true);
      const formData = new FormData();
      formData.append("logo", file);
      const res = await updateMerchantBranding(merchantId, formData);
      if (res?.logo) {
        setForm(prev => ({ ...prev, logo: res.logo }));
        alert("Store logo updated successfully!");
      }
    } catch (err: any) {
      alert("Failed to update logo: " + (err.message || "Unknown error"));
    } finally {
      setUploadingLogo(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !merchantId) return;

    try {
      setUploadingBg(true);
      const formData = new FormData();
      formData.append("backgroundImage", file);
      const res = await updateMerchantBranding(merchantId, formData);
      if (res?.backgroundImage) {
        setForm(prev => ({ ...prev, backgroundImage: res.backgroundImage }));
        alert("Store cover background updated successfully!");
      }
    } catch (err: any) {
      alert("Failed to update cover background: " + (err.message || "Unknown error"));
    } finally {
      setUploadingBg(false);
      if (e.target) e.target.value = "";
    }
  };

  const [previews] = useState({
    logo: null as string | null,
    bg: null as string | null,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!merchantId) return;
        const data = await getMerchantById();
        setForm({
          ...form,
          shopName: data.shopName || "",
          shopDescription: data.shopDescription || "",
          ownerName: data.ownerName || "",
          category: data.category || [],
          genderCategory: Array.isArray(data.genderCategory)
            ? data.genderCategory.reduce((acc: string[], val: string) => {
                if (val === 'Kids') {
                  if (!acc.includes('Boys')) acc.push('Boys');
                  if (!acc.includes('Girls')) acc.push('Girls');
                } else {
                  if (!acc.includes(val)) acc.push(val);
                }
                return acc;
              }, [])
            : [],
          storeMobileNumber: data.storeMobileNumber || "",
          pickupContactNumber: data.pickupContactNumber || "",
          logo: data.logo || null,
          backgroundImage: data.backgroundImage || null,
          enableCourierDelivery: data.enableCourierDelivery || false,
          shipsWithinHours: data.shipsWithinHours || 24,
          acceptsReturns: data.acceptsReturns || false,
          phoneNumber: data.phoneNumber || "",
          email: data.email || "",
          address: {
            street: data.address?.street || "",
            city: data.address?.city || "",
            state: data.address?.state || "",
            postalCode: data.address?.postalCode || "",
            landmark: data.address?.landmark || "",
            latitude: data.address?.latitude || data.address?.location?.coordinates?.[1] || 0,
            longitude: data.address?.longitude || data.address?.location?.coordinates?.[0] || 0,
          },
          operatingHours: {
            open: data.operatingHours?.open || "09:00",
            close: data.operatingHours?.close || "21:00",
            daysOpen: data.operatingHours?.daysOpen || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
          },
          bankDetails: {
            accountHolderName: data.bankDetails?.accountHolderName || "",
            accountNumber: data.bankDetails?.accountNumber || "",
            ifscCode: data.bankDetails?.ifscCode || "",
            bankName: data.bankDetails?.bankName || "",
            upiId: data.bankDetails?.upiId || "",
            isBankVerified: data.bankDetails?.isBankVerified || false,
          } as any,
          kyc: {
            isKycVerified: data.kyc?.isKycVerified || false,
            pan: data.kyc?.pan || { number: "", verified: false },
            gst: data.kyc?.gst || { number: "", verified: false },
            businessProof: data.kyc?.businessProof || { proofType: "", verified: false },
            bankProof: data.kyc?.bankProof || { verified: false },
          },
          rejectionReason: data.rejectionReason || "",
          isVerified: data.isVerified || false,
          isActive: data.isActive || false,
        });
      } catch (err) {
        console.error("Profile Load Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [merchantId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, section?: string) => {
    const { name, value } = e.target;
    if (section) {
      setForm(prev => ({
        ...prev,
        [section]: { ...(prev as any)[section], [name]: value }
      }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleToggleDay = (day: string) => {
    const current = form.operatingHours.daysOpen;
    const updated = current.includes(day) 
      ? current.filter(d => d !== day) 
      : [...current, day];
    setForm(prev => ({
      ...prev,
      operatingHours: { ...prev.operatingHours, daysOpen: updated }
    }));
  };

  const handleSaveBank = async () => {
    if (!merchantId) return;
    setSavingBank(true);
    try {
      await updateMerchantBankDetails(merchantId, form.bankDetails);
      alert("Bank details submitted successfully! Verification will be processed by our admin team.");
      const data = await getMerchantById();
      if (data) {
        setForm(prev => ({
          ...prev,
          bankDetails: data.bankDetails || prev.bankDetails,
          rejectionReason: data.rejectionReason || "",
        }));
      }
    } catch (err: any) {
      alert("Error updating bank details: " + err.message);
    } finally {
      setSavingBank(false);
    }
  };

  const handleSaveKyc = async () => {
    if (!merchantId) return;
    setSavingKyc(true);
    try {
      const formData = new FormData();
      if (form.kyc?.pan?.number) formData.append("panNumber", form.kyc.pan.number.trim().toUpperCase());
      if (form.kyc?.gst?.number) formData.append("gstNumber", form.kyc.gst.number.trim().toUpperCase());
      if (form.kyc?.businessProof?.proofType) {
        formData.append("businessProofType", form.kyc.businessProof.proofType);
      }
      if (kycFiles.panImage) formData.append("panImage", kycFiles.panImage);
      if (kycFiles.businessProofImage) formData.append("businessProofImage", kycFiles.businessProofImage);
      if (kycFiles.bankProofImage) formData.append("bankProofImage", kycFiles.bankProofImage);

      await updateMerchantKYC(merchantId, formData);
      alert("KYC documents submitted successfully! Verification will be processed by our admin team.");
      const data = await getMerchantById();
      if (data) {
        setForm(prev => ({
          ...prev,
          kyc: data.kyc || prev.kyc,
          rejectionReason: data.rejectionReason || "",
        }));
      }
    } catch (err: any) {
      alert("Error updating KYC details: " + err.message);
    } finally {
      setSavingKyc(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="page-container max-w-5xl">
      {/* Header Profile Section */}
      <div className="card mb-10 overflow-hidden text-black">
        <div className="h-44 bg-gray-100 relative group overflow-hidden">
          {previews.bg ? (
            <img src={previews.bg} className="w-full h-full object-cover" alt="Background" />
          ) : form.backgroundImage?.url ? (
            <img src={form.backgroundImage.url} className="w-full h-full object-cover" alt="Background" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-slate-800 to-slate-900" />
          )}

          {/* Edit Cover Background Button */}
          <input
            type="file"
            ref={bgInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleBgUpload}
          />
          <button
            type="button"
            onClick={() => bgInputRef.current?.click()}
            disabled={uploadingBg}
            className="absolute top-4 right-4 bg-black/70 hover:bg-black text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md shadow-lg transition-all cursor-pointer disabled:opacity-50 z-10"
            title="Edit Store Banner"
          >
            {uploadingBg ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Camera size={14} />
                <span>Change Banner</span>
              </>
            )}
          </button>
        </div>
        
        <div className="px-8 pb-8 relative">
          <div className="flex flex-col md:flex-row md:items-end gap-6 -mt-12">
            <div className="relative group w-24 h-24">
               {previews.logo ? (
                 <img src={previews.logo} className="w-full h-full rounded-2xl border-4 border-white shadow-xl bg-white object-cover" alt="Logo" />
               ) : form.logo?.url ? (
                 <img src={form.logo.url} className="w-full h-full rounded-2xl border-4 border-white shadow-xl bg-white object-cover" alt="Logo" />
               ) : (
                 <div className="w-full h-full rounded-2xl border-4 border-white shadow-xl bg-gray-100 flex items-center justify-center text-gray-400 font-bold">
                   Logo
                 </div>
               )}

               {/* Edit Profile Image Button */}
               <input
                 type="file"
                 ref={logoInputRef}
                 accept="image/*"
                 className="hidden"
                 onChange={handleLogoUpload}
               />
               <button
                 type="button"
                 onClick={() => logoInputRef.current?.click()}
                 disabled={uploadingLogo}
                 className="absolute -bottom-1 -right-1 bg-black hover:bg-gray-800 text-white p-2 rounded-full shadow-lg border-2 border-white transition-all cursor-pointer disabled:opacity-50 z-10"
                 title="Change Store Logo"
               >
                 {uploadingLogo ? (
                   <Loader2 size={13} className="animate-spin" />
                 ) : (
                   <Camera size={13} />
                 )}
               </button>
            </div>
            
            <div className="flex-1">
              <h1 className="text-2xl font-bold flex items-center gap-3">
                {form.shopName || "My Store"}
                {form.isVerified ? (
                   <span className="bg-success-subtle text-success text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest font-bold border border-green-100">Verified</span>
                ) : (
                   <span className="bg-amber-50 text-amber-600 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest font-bold border border-amber-100">Verification Pending</span>
                )}
              </h1>
              <p className="text-gray-500 font-medium">{form.ownerName || "Owner Name"}</p>
            </div>

            <div className="flex items-center gap-3">
               <div className="text-right hidden sm:block">
                 <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Status</p>
                 <p className={`text-sm font-bold ${form.isActive ? 'text-green-600' : 'text-red-500'}`}>
                   {form.isActive ? 'ACTIVE' : 'INACTIVE'}
                 </p>
               </div>
               <div className={`w-3 h-3 rounded-full ${form.isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />

               <button
                 type="button"
                 onClick={() => navigate("/merchant/policies")}
                 className="btn btn-secondary flex items-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-lg ml-2 hover:bg-gray-100 transition-all cursor-pointer"
                 title="View Merchant Policies & Operating Standards"
               >
                 <FileText size={14} />
                 <span className="hidden sm:inline">Policies & Terms</span>
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* Locked Profile Notification */}
      <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl mb-6 text-sm font-semibold flex items-center gap-3">
        <span>ℹ️</span>
        <span>Your store profile details are verified and locked. If you need to update your shop name, contact info, address, bank details or timings, please contact admin support.</span>
      </div>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto gap-4 md:gap-8 border-b border-gray-200 mb-8 whitespace-nowrap scrollbar-none pb-1">
        {(["shop", "location", "hours", "bank"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all relative whitespace-nowrap flex-shrink-0 ${
              activeTab === tab ? "text-black" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {tab === "shop" && "Store Info"}
            {tab === "location" && "Location"}
            {tab === "hours" && "Operating Hours"}
            {tab === "bank" && "Bank & KYC"}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <fieldset disabled={activeTab !== "bank"} className="w-full border-0 p-0 m-0 animate-fadeIn">
        {activeTab === "shop" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="card card-body">
                <h3 className="text-lg font-bold mb-6 text-black">General Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="input-label">Shop Name</label>
                    <input type="text" name="shopName" value={form.shopName} onChange={handleInputChange} className="input" />
                  </div>
                  <div>
                    <label className="input-label">Owner Name</label>
                    <input type="text" name="ownerName" value={form.ownerName} onChange={handleInputChange} className="input" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="input-label">Shop Description</label>
                    <textarea name="shopDescription" value={form.shopDescription} onChange={handleInputChange} className="input" placeholder="Tell customers about your shop..." />
                  </div>
                  <div>
                    <label className="input-label">Store Mobile Number</label>
                    <input type="text" name="storeMobileNumber" value={form.storeMobileNumber} onChange={handleInputChange} className="input" />
                  </div>
                  <div>
                    <label className="input-label">Pickup Contact Number</label>
                    <input type="text" name="pickupContactNumber" value={form.pickupContactNumber} onChange={handleInputChange} className="input" />
                  </div>
                  <div>
                    <label className="input-label">Store Phone</label>
                    <input type="text" value={form.phoneNumber} readOnly className="input bg-gray-50 text-gray-500 cursor-not-allowed" />
                  </div>
                </div>
              </div>

              <div className="card card-body">
                <h3 className="text-lg font-bold mb-6 text-black">Categories & Reach</h3>
                <div className="space-y-6">
                  <div>
                    <label className="input-label mb-3">Gender Segments</label>
                    <div className="flex gap-3">
                      {["Men", "Women", "Boys", "Girls"].map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => {
                            const current = form.genderCategory;
                            const updated = current.includes(g) ? current.filter(x => x !== g) : [...current, g];
                            setForm({ ...form, genderCategory: updated });
                          }}
                          className={`filter-pill ${form.genderCategory.includes(g) ? 'active' : ''}`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-black">Enable Courier Delivery</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Ship products outside your local zone (Standard ₹40 fee)</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, enableCourierDelivery: !form.enableCourierDelivery })}
                      className={`toggle ${form.enableCourierDelivery ? 'active' : ''}`}
                    >
                      <span className="toggle-knob" />
                    </button>
                  </div>

                  {form.enableCourierDelivery && (
                    <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 animate-slideDown">
                      <div>
                        <label className="input-label !text-xs">Estimate Shipping (Hours)</label>
                        <input 
                          type="number" 
                          name="shipsWithinHours" 
                          value={form.shipsWithinHours} 
                          onChange={handleInputChange} 
                          className="input !py-2 !px-3 !text-sm" 
                          min="1"
                        />
                      </div>
                      <div className="flex flex-col justify-center">
                        <label className="input-label !text-xs">Accepts Returns?</label>
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, acceptsReturns: !form.acceptsReturns })}
                          className={`btn ${form.acceptsReturns ? 'btn-primary' : 'btn-secondary'} !py-1.5 !px-3 !text-xs !w-full`}
                        >
                          {form.acceptsReturns ? 'YES, ACCEPTS' : 'NO RETURNS'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>

            <div className="space-y-6">
               <div className="card card-body bg-black text-white">
                  <h3 className="text-white text-md font-bold mb-2">Store Status</h3>
                  <p className="text-gray-400 text-xs mb-6">Your store is currently {form.isActive ? 'visible to customers' : 'hidden from customers'}.</p>
                  <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                    <span className="text-sm font-bold">Online Status</span>
                    <div className={`w-2 h-2 rounded-full ${form.isActive ? 'bg-green-500' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
                  </div>
               </div>

               <div className="card card-body">
                  <h4 className="font-bold text-sm mb-4 text-black">Contact Info</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                       <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs">📞</span>
                       {form.phoneNumber}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                       <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs">✉️</span>
                       {form.email}
                    </div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === "location" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="card card-body">
                <h3 className="text-lg font-bold mb-6 text-black">Store Address</h3>
                <div className="grid grid-cols-1 gap-5">
                  <div>
                    <label className="input-label">Street Address</label>
                    <input type="text" name="street" value={form.address.street} onChange={(e) => handleInputChange(e, 'address')} className="input" />
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="input-label">City</label>
                      <input type="text" name="city" value={form.address.city} onChange={(e) => handleInputChange(e, 'address')} className="input" />
                    </div>
                    <div>
                      <label className="input-label">State</label>
                      <input type="text" name="state" value={form.address.state} onChange={(e) => handleInputChange(e, 'address')} className="input" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="input-label">Postal Code</label>
                      <input type="text" name="postalCode" value={form.address.postalCode} onChange={(e) => handleInputChange(e, 'address')} className="input" />
                    </div>
                    <div>
                      <label className="input-label">Landmark</label>
                      <input type="text" name="landmark" value={form.address.landmark} onChange={(e) => handleInputChange(e, 'address')} className="input" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Precise Coordinates are hidden from user input but stored in background */}
            </div>

            <div className="card overflow-hidden min-h-[500px]">
               <MapSelector 
                 latitude={form.address.latitude} 
                 longitude={form.address.longitude} 
                 readOnly={true}
                 onLocationSelect={async (lat, lng) => {
                   setForm(prev => ({ 
                     ...prev, 
                     address: { ...prev.address, latitude: lat, longitude: lng } 
                   }));
                   try {
                     const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                     const data = await response.json();
                     if (data && data.address) {
                       setForm(prev => ({
                         ...prev,
                         address: {
                           ...prev.address,
                           street: data.address.road || data.address.suburb || data.address.neighbourhood || prev.address.street,
                           city: data.address.city || data.address.town || data.address.county || prev.address.city,
                           state: data.address.state || prev.address.state,
                           postalCode: data.address.postcode || prev.address.postalCode,
                           latitude: lat,
                           longitude: lng
                         }
                       }));
                     }
                   } catch (err) {
                     console.warn("Reverse geocode failed:", err);
                   }
                 }} 
               />
            </div>
          </div>
        )}

        {activeTab === "hours" && (
          <div className="max-w-2xl mx-auto">
            <div className="card card-body text-black">
              <h3 className="text-lg font-bold mb-6 text-black">Store Timing</h3>
              
              <div className="grid grid-cols-2 gap-8 mb-10">
                <div>
                  <label className="input-label">Opening Time</label>
                  <input 
                    type="time" 
                    name="open" 
                    value={form.operatingHours.open} 
                    onChange={(e) => handleInputChange(e, 'operatingHours')} 
                    className="input text-xl font-bold py-4" 
                  />
                </div>
                <div>
                  <label className="input-label">Closing Time</label>
                  <input 
                    type="time" 
                    name="close" 
                    value={form.operatingHours.close} 
                    onChange={(e) => handleInputChange(e, 'operatingHours')} 
                    className="input text-xl font-bold py-4" 
                  />
                </div>
              </div>

              <div className="mb-10 text-black">
                 <label className="input-label mb-4">Open Days</label>
                 <div className="flex flex-wrap gap-2 text-black">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleToggleDay(day)}
                        className={`w-12 h-12 rounded-xl text-sm font-bold transition-all border ${
                          form.operatingHours.daysOpen.includes(day)
                            ? "bg-black text-white border-black"
                            : "bg-white text-gray-400 border-gray-200 hover:border-black hover:text-black"
                        }`}
                      >
                        {day.substring(0, 3)}
                      </button>
                    ))}
                 </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "bank" && (
          <div className="space-y-8">
            {form.rejectionReason && (
              <div className="p-5 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-left">
                <div className="flex items-center gap-2 font-bold text-sm text-red-800 mb-1">
                  <span>❌</span>
                  <span>Compliance Issues Flagged by Admin:</span>
                </div>
                <p className="whitespace-pre-line text-xs font-semibold text-red-700">{form.rejectionReason}</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="card card-body">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-black">Settlement Bank Account</h3>
                    <button 
                      onClick={handleSaveBank}
                      disabled={savingBank}
                      className="btn btn-primary !py-2 !px-4 !text-sm"
                    >
                      {savingBank ? 'Saving...' : 'Save Bank Details'}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-5">
                    <div>
                      <label className="input-label">Account Holder Name</label>
                      <input type="text" name="accountHolderName" value={form.bankDetails.accountHolderName} onChange={(e) => handleInputChange(e, 'bankDetails')} className="input" placeholder="Name as per bank records" />
                    </div>
                    <div>
                      <label className="input-label">Bank Account Number</label>
                      <input type="text" name="accountNumber" value={form.bankDetails.accountNumber} onChange={(e) => handleInputChange(e, 'bankDetails')} className="input" placeholder="Account Number" />
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="input-label">IFSC Code</label>
                        <input type="text" name="ifscCode" value={form.bankDetails.ifscCode} onChange={(e) => handleInputChange(e, 'bankDetails')} className="input uppercase" placeholder="e.g. HDFC0001234" />
                      </div>
                      <div>
                        <label className="input-label">Bank Name</label>
                        <input type="text" name="bankName" value={form.bankDetails.bankName} onChange={(e) => handleInputChange(e, 'bankDetails')} className="input" placeholder="e.g. HDFC Bank" />
                      </div>
                    </div>
                    <div>
                      <label className="input-label">UPI ID (Optional)</label>
                      <input type="text" name="upiId" value={form.bankDetails.upiId} onChange={(e) => handleInputChange(e, 'bankDetails')} className="input" placeholder="username@upi" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="card card-body">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-black">KYC & Business Identity</h3>
                    <button 
                      onClick={handleSaveKyc}
                      disabled={savingKyc}
                      className="btn btn-primary !py-2 !px-4 !text-sm"
                    >
                      {savingKyc ? 'Saving...' : 'Save KYC Details'}
                    </button>
                  </div>
                  <div className="space-y-4">
                    {/* PAN Card */}
                    <div className="p-4 rounded-xl border border-gray-100 flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] text-gray-400 font-bold uppercase">PAN Card Number</label>
                        {form.kyc?.pan?.verified ? (
                           <span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-0.5 rounded-full border border-green-200">VERIFIED</span>
                        ) : (
                           <span className="text-amber-500 text-xs font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">PENDING</span>
                        )}
                      </div>
                      <input 
                        type="text" 
                        value={form.kyc?.pan?.number || ""} 
                        onChange={(e) => setForm(prev => ({...prev, kyc: {...prev.kyc, pan: {...prev.kyc.pan, number: e.target.value}}}))} 
                        className="input uppercase font-mono"
                        placeholder="ABCDE1234F"
                      />
                      <input 
                        type="file" 
                        accept="image/*,application/pdf"
                        onChange={(e) => setKycFiles(prev => ({...prev, panImage: e.target.files?.[0] || null}))} 
                        className="text-xs mt-1" 
                      />
                    </div>

                    {/* GSTIN Number */}
                    <div className="p-4 rounded-xl border border-gray-100 flex flex-col gap-2">
                      <label className="text-[10px] text-gray-400 font-bold uppercase">GSTIN Number (Optional)</label>
                      <input 
                        type="text" 
                        value={form.kyc?.gst?.number || ""} 
                        onChange={(e) => setForm(prev => ({...prev, kyc: {...prev.kyc, gst: {...prev.kyc.gst, number: e.target.value}}}))} 
                        className="input uppercase font-mono"
                        placeholder="27ABCDE1234F1Z5"
                      />
                    </div>

                    {/* Legal Business Proof */}
                    <div className="p-4 rounded-xl border border-gray-100 flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] text-gray-400 font-bold uppercase">Legal Business Proof</label>
                        {form.kyc?.businessProof?.verified ? (
                           <span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-0.5 rounded-full border border-green-200">VERIFIED</span>
                        ) : (
                           <span className="text-amber-500 text-xs font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">PENDING</span>
                        )}
                      </div>
                      <select
                        value={form.kyc?.businessProof?.proofType || ""}
                        onChange={(e) => setForm(prev => ({...prev, kyc: {...prev.kyc, businessProof: {...prev.kyc.businessProof, proofType: e.target.value}}}))}
                        className="input text-xs"
                      >
                        <option value="">Select Proof Type</option>
                        <option value="shop_license">Shop & Establishment License</option>
                        <option value="gst_cert">GST Certificate</option>
                        <option value="udyam">Udyam Registration (MSME)</option>
                        <option value="rent_agreement">Rental Agreement</option>
                      </select>
                      <input 
                        type="file" 
                        accept="image/*,application/pdf"
                        onChange={(e) => setKycFiles(prev => ({...prev, businessProofImage: e.target.files?.[0] || null}))} 
                        className="text-xs mt-1" 
                      />
                    </div>

                    {/* Bank Account Proof */}
                    <div className="p-4 rounded-xl border border-gray-100 flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] text-gray-400 font-bold uppercase">Bank Proof (Cheque / Passbook)</label>
                        {form.kyc?.bankProof?.verified ? (
                           <span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-0.5 rounded-full border border-green-200">VERIFIED</span>
                        ) : (
                           <span className="text-amber-500 text-xs font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">PENDING</span>
                        )}
                      </div>
                      <input 
                        type="file" 
                        accept="image/*,application/pdf"
                        onChange={(e) => setKycFiles(prev => ({...prev, bankProofImage: e.target.files?.[0] || null}))} 
                        className="text-xs mt-1" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </fieldset>
    </div>
  );
};

export default ProfilePage;
