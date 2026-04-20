import React, { useEffect, useState } from "react";
import { 
  getMerchantById, 
  updateMerchantShopDetails, 
  updateMerchantBankDetails, 
  updateMerchantOperatingHours 
} from "../api/auth";
import MapSelector from "./auth/MapSelector";

const ProfilePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<string | null>(null);
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
    businessType: "",
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
      pan: { number: "", verified: false },
      gst: { number: "", verified: false },
    },
    isVerified: false,
    isActive: false,
  });

  const [previews, setPreviews] = useState({
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
          genderCategory: data.genderCategory || [],
          businessType: data.businessType || "Individual",
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
          },
          kyc: data.kyc || { isKycVerified: false },
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'backgroundImage') => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviews(prev => ({ ...prev, [field === 'logo' ? 'logo' : 'bg']: url }));
      setForm(prev => ({ ...prev, [field]: file }));
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

  const saveShopInfo = async () => {
    if (!merchantId) return;
    setSavingSection("shop");
    try {
      const payload = new FormData();
      payload.append("shopName", form.shopName);
      payload.append("shopDescription", form.shopDescription);
      payload.append("ownerName", form.ownerName);
      payload.append("businessType", form.businessType);
      payload.append("category", form.category.join(','));
      payload.append("genderCategory", form.genderCategory.join(','));
      payload.append("enableCourierDelivery", String(form.enableCourierDelivery));
      payload.append("shipsWithinHours", String(form.shipsWithinHours));
      payload.append("acceptsReturns", String(form.acceptsReturns));
      payload.append("address", JSON.stringify(form.address));

      if (form.logo instanceof File) payload.append("logo", form.logo);
      if (form.backgroundImage instanceof File) payload.append("backgroundImage", form.backgroundImage);

      await updateMerchantShopDetails(merchantId, payload);
      alert("Shop information updated!");
    } catch (err) {
      alert("Update failed");
    } finally {
      setSavingSection(null);
    }
  };

  const saveLocation = async () => {
    if (!merchantId) return;
    setSavingSection("location");
    try {
      const payload = new FormData();
      payload.append("address", JSON.stringify(form.address));
      await updateMerchantShopDetails(merchantId, payload);
      alert("Location details updated!");
    } catch (err) {
      alert("Update failed");
    } finally {
      setSavingSection(null);
    }
  };

  const saveHours = async () => {
    if (!merchantId) return;
    setSavingSection("hours");
    try {
      await updateMerchantOperatingHours(merchantId, form.operatingHours);
      alert("Operating hours updated!");
    } catch (err) {
      alert("Update failed");
    } finally {
      setSavingSection(null);
    }
  };

  const saveBank = async () => {
    if (!merchantId) return;
    setSavingSection("bank");
    try {
      await updateMerchantBankDetails(merchantId, form.bankDetails);
      alert("Bank details updated!");
    } catch (err) {
      alert("Update failed");
    } finally {
      setSavingSection(null);
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
        <div className="h-32 bg-gray-100 relative group">
          {previews.bg ? (
            <img src={previews.bg} className="w-full h-full object-cover" alt="Background" />
          ) : form.backgroundImage?.url ? (
            <img src={form.backgroundImage.url} className="w-full h-full object-cover" alt="Background" />
          ) : (
            <div className="w-full h-full bg-slate-200" />
          )}
          <label className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <span className="text-white text-xs font-bold uppercase tracking-wider">Change Cover</span>
            <input type="file" className="hidden" onChange={(e) => handleImageChange(e, 'backgroundImage')} />
          </label>
        </div>
        
        <div className="px-8 pb-8 relative">
          <div className="flex flex-col md:flex-row md:items-end gap-6 -mt-10">
            <div className="relative group w-24 h-24">
               {previews.logo ? (
                 <img src={previews.logo} className="w-full h-full rounded-2xl border-4 border-white shadow-lg bg-white object-cover" alt="Logo" />
               ) : form.logo?.url ? (
                 <img src={form.logo.url} className="w-full h-full rounded-2xl border-4 border-white shadow-lg bg-white object-cover" alt="Logo" />
               ) : (
                 <div className="w-full h-full rounded-2xl border-4 border-white shadow-lg bg-gray-100 flex items-center justify-center text-gray-400 font-bold">
                   Logo
                 </div>
               )}
               <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                 <span className="text-white text-[10px] font-bold">CHANGE</span>
                 <input type="file" className="hidden" onChange={(e) => handleImageChange(e, 'logo')} />
               </label>
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
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200 mb-8 gap-8">
        {(["shop", "location", "hours", "bank"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all relative ${
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
      <div className="animate-fadeIn">
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
                    <label className="input-label">Business Type</label>
                    <select name="businessType" value={form.businessType} onChange={handleInputChange} className="input">
                      <option value="Individual">Individual</option>
                      <option value="Sole Proprietor">Sole Proprietor</option>
                      <option value="Partnership">Partnership</option>
                      <option value="Company">Company</option>
                    </select>
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
                      {["Men", "Women", "Kids"].map((g) => (
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

              <button 
                onClick={saveShopInfo} 
                disabled={savingSection === 'shop'} 
                className="btn btn-primary w-full btn-lg"
              >
                {savingSection === 'shop' ? "Saving Changes..." : "Save Shop Information"}
              </button>
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

              <div className="card card-body">
                <h3 className="text-lg font-bold mb-6 text-black">Precise Coordinates</h3>
                <p className="text-xs text-gray-500 mb-6 -mt-4">Coordinates are used to show your store to nearby customers.</p>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="input-label text-[10px] text-gray-400 font-bold uppercase">Latitude</label>
                    <input type="number" readOnly value={form.address.latitude} className="input bg-gray-50" />
                  </div>
                  <div>
                    <label className="input-label text-[10px] text-gray-400 font-bold uppercase">Longitude</label>
                    <input type="number" readOnly value={form.address.longitude} className="input bg-gray-50" />
                  </div>
                </div>
              </div>

              <button onClick={saveLocation} disabled={savingSection === 'location'} className="btn btn-primary w-full btn-lg">
                {savingSection === 'location' ? "Saving..." : "Update Location"}
              </button>
            </div>

            <div className="card overflow-hidden min-h-[500px]">
               <MapSelector 
                 latitude={form.address.latitude} 
                 longitude={form.address.longitude} 
                 onLocationSelect={(lat, lng) => setForm(prev => ({ 
                   ...prev, 
                   address: { ...prev.address, latitude: lat, longitude: lng } 
                 }))} 
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

              <button onClick={saveHours} disabled={savingSection === 'hours'} className="btn btn-primary w-full btn-lg">
                {savingSection === 'hours' ? "Saving..." : "Save Operating Hours"}
              </button>
            </div>
          </div>
        )}

        {activeTab === "bank" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="card card-body">
                <h3 className="text-lg font-bold mb-6 text-black">Settlement Bank Account</h3>
                <div className="grid grid-cols-1 gap-5">
                  <div>
                    <label className="input-label">Account Holder Name</label>
                    <input type="text" name="accountHolderName" value={form.bankDetails.accountHolderName} onChange={(e) => handleInputChange(e, 'bankDetails')} className="input" />
                  </div>
                  <div>
                    <label className="input-label">Bank Account Number</label>
                    <input type="password" name="accountNumber" value={form.bankDetails.accountNumber} onChange={(e) => handleInputChange(e, 'bankDetails')} className="input" />
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="input-label">IFSC Code</label>
                      <input type="text" name="ifscCode" value={form.bankDetails.ifscCode} onChange={(e) => handleInputChange(e, 'bankDetails')} className="input uppercase" />
                    </div>
                    <div>
                      <label className="input-label">Bank Name</label>
                      <input type="text" name="bankName" value={form.bankDetails.bankName} onChange={(e) => handleInputChange(e, 'bankDetails')} className="input" />
                    </div>
                  </div>
                </div>
              </div>

              <button onClick={saveBank} disabled={savingSection === 'bank'} className="btn btn-primary w-full btn-lg">
                {savingSection === 'bank' ? "Saving..." : "Update Settlement Details"}
              </button>
            </div>

            <div className="space-y-6">
              <div className="card card-body">
                <h3 className="text-lg font-bold mb-6 text-black">KYC & Business Identity</h3>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">PAN Card</p>
                      <p className="font-bold text-black">{form.kyc.pan?.number || "NOT UPDATED"}</p>
                    </div>
                    {form.kyc.pan?.verified ? (
                       <span className="text-success text-xs font-bold">VERIFIED</span>
                    ) : (
                       <span className="text-amber-500 text-xs font-bold">PENDING</span>
                    )}
                  </div>
                  <div className="p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">GST Number</p>
                      <p className="font-bold text-black">{form.kyc.gst?.number || "NOT UPDATED"}</p>
                    </div>
                    {form.kyc.gst?.verified ? (
                       <span className="text-success text-xs font-bold">VERIFIED</span>
                    ) : (
                       <span className="text-amber-500 text-xs font-bold">PENDING</span>
                    )}
                  </div>
                </div>

                <div className="mt-8 p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-center">
                   <p className="text-xs text-gray-500">To update KYC documents, please contact support or your account manager.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
