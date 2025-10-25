import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Register.css';
import {
  getMerchantById,
  updateMerchantShopDetails,
  updateMerchantBankDetails,
  updateMerchantOperatingHours,
  activateMerchant,
} from '../../api/auth';
import LogoCrop from './LogoCrop/LogoCrop';

const steps = [
  { number: 1, title: 'Shop Details', subtitle: 'Store information & branding', icon: 'store' },
  { number: 2, title: 'Bank Details', subtitle: 'Payment & settlement info', icon: 'account_balance' },
  { number: 3, title: 'Final Setup', subtitle: 'Operating hours & activation', icon: 'schedule' },
];

const categories = [
  'Grocery & Food',
  'Electronics',
  'Fashion & Clothing',
  'Health & Beauty',
  'Home & Garden',
  'Sports & Fitness',
  'Books & Media',
  'Others',
];

const daysOfWeek = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday',
  'Friday', 'Saturday', 'Sunday',
];

const Register = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<number | null>(null); // null = unknown yet
const [loading, setLoading] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string | null }>({});
  const [merchantId, setMerchantId] = useState<string | null>(null);

const [formData, setFormData] = useState({
  shopName: '',
  shopDescription: '',
  category: '',
  logo: null as File | null,
  address: { street: '', city: '', postalCode: '' },
  ownerName: '',
  accountHolderName: '',
  accountNumber: '',
  ifscCode: '',
  bankName: '',
  upiId: '',
  openTime: '09:00',
  closeTime: '21:00',
  daysOpen: [] as string[],
});

  useEffect(() => {
    const email = localStorage.getItem('merchant_id');
    
    if (!email) return;

    const fetchMerchant = async () => {
      setIsLoading(true);
      try {
        const res = await getMerchantById();
          console.log(res,'resresresres(resresres1)');

        if (res) {
          const merchant = res;
          setMerchantId(merchant._id);

          // Populate formData with existing values
        setFormData((prev) => ({
          ...prev,
          shopName: merchant.shopName || '',
          shopDescription: merchant.shopDescription || '',
          category: merchant.category || '',
          logo: merchant.logo || null,
          address: {
            street: merchant.address?.street || '',
            city: merchant.address?.city || '',
            postalCode: merchant.address?.postalCode || '',
          },
          ownerName: merchant.ownerName || '',
          accountHolderName: merchant.bankDetails?.accountHolderName || '',
          accountNumber: merchant.bankDetails?.accountNumber || '',
          ifscCode: merchant.bankDetails?.ifscCode || '',
          bankName: merchant.bankDetails?.bankName || '',
          upiId: merchant.bankDetails?.upiId || '',
          openTime: merchant.operatingHours?.openTime || '09:00',
          closeTime: merchant.operatingHours?.closeTime || '21:00',
          daysOpen: merchant.operatingHours?.daysOpen || [],
        }));
  console.log(merchant.isActive,'merchant.isActive');
  
          // Determine current step
      if (!merchant.isActive) {
        if (!merchant.shopName || !merchant.category) {
          setCurrentStep(1);
          console.log('setCurrentStep(1)');
        } else if (!merchant.bankDetails?.accountNumber) {
          setCurrentStep(2);
          console.log('setCurrentStep(2)');
        } else {
          setCurrentStep(3);
          console.log('setCurrentStep(3)');
        }
      } else {
        navigate('/merchant/products'); // Already active
      }
        }
      } catch (error) {
        console.error('Failed to fetch merchant:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMerchant();
  }, [navigate]);

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const validateStep = (step: number) => {
    const newErrors: { [key: string]: string } = {};
    if (step === 1) {
      if (!formData.shopName.trim()) newErrors.shopName = 'Shop name is required';
      if (!formData.category) newErrors.category = 'Category is required';
      if (!formData.ownerName.trim()) newErrors.ownerName = 'Owner name is required';
      if (!formData.logo) newErrors.logo = 'Logo is required';
      if (!formData.address.street.trim() || !formData.address.city.trim() || !formData.address.postalCode.trim()) {
        newErrors.address = 'Complete address is required';
  }
    } else if (step === 2) {
      if (!formData.accountHolderName.trim()) newErrors.accountHolderName = 'Account holder name is required';
      if (!formData.accountNumber.trim()) newErrors.accountNumber = 'Account number is required';
      if (!formData.ifscCode.trim()) newErrors.ifscCode = 'IFSC code is required';
      if (!formData.bankName.trim()) newErrors.bankName = 'Bank name is required';
    } else if (step === 3) {
      if (!formData.openTime) newErrors.openTime = 'Opening time is required';
      if (!formData.closeTime) newErrors.closeTime = 'Closing time is required';
      if (formData.daysOpen.length === 0) newErrors.daysOpen = 'Select at least one working day';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) {
        console.log("Validation failed:", errors);
        return;
      }
    if (!merchantId) return;

    setIsLoading(true);
    try {
      if (currentStep === 1) {
        const data = new FormData();
        data.append("shopName", formData.shopName);
        data.append("shopDescription", formData.shopDescription);
        data.append("category", formData.category);
        data.append("ownerName", formData.ownerName);
        data.append("address", JSON.stringify(formData.address));

        if (formData.logo instanceof File) {
          data.append("logo", formData.logo); // ✅ send File
        }

        const res = await updateMerchantShopDetails(merchantId, data);
        console.log(res, "Shop details response");
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
        await updateMerchantOperatingHours(merchantId, {
          openTime: formData.openTime,
          closeTime: formData.closeTime,
          daysOpen: formData.daysOpen,
        });
        await activateMerchant(merchantId);
        alert('Merchant registration complete!');
        navigate('/merchant/products');
      }
    } catch (error) {
      console.error('Step update failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const toggleDay = (day: string) => {
    const currentDays = formData.daysOpen;
    if (currentDays.includes(day)) updateFormData('daysOpen', currentDays.filter(d => d !== day));
    else updateFormData('daysOpen', [...currentDays, day]);
  };


  return (
    <div className="onboarding-container">
      {/* Progress Sidebar */}
      <div className="progress-sidebar">
        <div className="logo">
          <div className="logo-icon">
            <span className="logo-text">F</span>
          </div>
          <h2 className="brand-name">FlashFits</h2>
        </div>

        <div className="onboarding-title">
          <h3>Merchant Onboarding</h3>
          <p>Complete your registration in 3 simple steps</p>
        </div>

        <div className="progress-steps">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className={`step ${currentStep >= step.number ? 'active' : ''} ${currentStep > step.number ? 'completed' : ''}`}
            >
              <div className="step-number">
                {currentStep > step.number ? (
                  <i className="material-icons">check</i>
                ) : (
                  step.number
                )}
              </div>
              <div className="step-content">
                <h4>{step.title}</h4>
                <p>{step.subtitle}</p>
              </div>
              {index < steps.length - 1 && <div className="step-indicator"></div>}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="form-container">
          {/* Step 1 */}
          {currentStep === 1 && (
            <div className="step-form">
              <h3>Shop Details</h3>
              <div className="form-group">
                <label>Shop Name</label>
                <input
                  type="text"
                  value={formData.shopName}
                  onChange={(e) => updateFormData("shopName", e.target.value)}
                  placeholder="Enter shop name"
                />
                {errors.shopName && <p className="error">{errors.shopName}</p>}
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.shopDescription}
                  onChange={(e) => updateFormData("shopDescription", e.target.value)}
                  placeholder="Enter shop description"
                />
                {errors.shopDescription && <p className="error">{errors.shopDescription}</p>}
              </div>

              <div className="form-group">
                <label>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => updateFormData("category", e.target.value)}
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {errors.category && <p className="error">{errors.category}</p>}
              </div>
            {/* Owner Name */}
            <div className="form-group">
              <label>Owner Name</label>
              <input
                type="text"
                value={formData.ownerName}
                onChange={(e) => updateFormData("ownerName", e.target.value)}
                placeholder="Enter owner name"
              />
              {errors.ownerName && <p className="error">{errors.ownerName}</p>}
            </div>

            {/* Address */}
            <h4>Shop Address</h4>
            <div className="form-group">
              <label>Street</label>
              <input
                type="text"
                value={formData.address.street}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    address: { ...prev.address, street: e.target.value },
                  }))
                }
                placeholder="Enter street"
              />
              {errors.address && <p className="error">{errors.address}</p>}
            </div>

            <div className="form-group">
              <label>City</label>
              <input
                type="text"
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

            <div className="form-group">
              <label>Postal Code</label>
              <input
                type="text"
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


            {/* Shop Logo Upload with Cropper */}
          <div className="form-group">
            <label>Shop Logo</label>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => updateFormData("isLogoCropOpen", true)}
            >
              {formData.logo ? "Change Logo" : "Upload Logo"}
            </button>

            {/* Preview cropped logo */}
            {formData.logo && (
              <div className="logo-preview">
                <img
                  src={typeof formData.logo === "string" ? formData.logo : URL.createObjectURL(formData.logo)}
                  alt="Shop Logo Preview"
                  style={{
                    width: "80px",
                    height: "80px",
                    objectFit: "cover",
                    marginTop: "8px",
                    borderRadius: "8px",
                  }}
                />
              </div>
            )}

            {errors.logo && <p className="error">{errors.logo}</p>}

            {/* LogoCrop Modal */}
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

            </div>
          )}

          {/* Step 2 */}
          {currentStep === 2 && (
            <div className="step-form">
              <h3>Bank Details</h3>
              <div className="form-group">
                <label>Account Holder Name</label>
                <input
                  type="text"
                  value={formData.accountHolderName}
                  onChange={(e) => updateFormData("accountHolderName", e.target.value)}
                  placeholder="Enter account holder name"
                />
                {errors.accountHolderName && <p className="error">{errors.accountHolderName}</p>}
              </div>

              <div className="form-group">
                <label>Account Number</label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => updateFormData("accountNumber", e.target.value)}
                  placeholder="Enter account number"
                />
                {errors.accountNumber && <p className="error">{errors.accountNumber}</p>}
              </div>

              <div className="form-group">
                <label>IFSC Code</label>
                <input
                  type="text"
                  value={formData.ifscCode}
                  onChange={(e) => updateFormData("ifscCode", e.target.value)}
                  placeholder="Enter IFSC code"
                />
                {errors.ifscCode && <p className="error">{errors.ifscCode}</p>}
              </div>

              <div className="form-group">
                <label>Bank Name</label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => updateFormData("bankName", e.target.value)}
                  placeholder="Enter bank name"
                />
                {errors.bankName && <p className="error">{errors.bankName}</p>}
              </div>

              <div className="form-group">
                <label>UPI ID (Optional)</label>
                <input
                  type="text"
                  value={formData.upiId}
                  onChange={(e) => updateFormData("upiId", e.target.value)}
                  placeholder="Enter UPI ID"
                />
              </div>
            </div>
          )}

          {/* Step 3 */}
          {currentStep === 3 && (
            <div className="step-form">
              <h3>Operating Hours</h3>
              <div className="form-group">
                <label>Opening Time</label>
                <input
                  type="time"
                  value={formData.openTime}
                  onChange={(e) => updateFormData("openTime", e.target.value)}
                />
                {errors.openTime && <p className="error">{errors.openTime}</p>}
              </div>

              <div className="form-group">
                <label>Closing Time</label>
                <input
                  type="time"
                  value={formData.closeTime}
                  onChange={(e) => updateFormData("closeTime", e.target.value)}
                />
                {errors.closeTime && <p className="error">{errors.closeTime}</p>}
              </div>

              <div className="form-group">
                <label>Days Open</label>
                <div className="days-checkboxes">
                  {daysOfWeek.map((day) => (
                    <label key={day}>
                      <input
                        type="checkbox"
                        checked={formData.daysOpen.includes(day)}
                        onChange={() => toggleDay(day)}
                      />
                      {day}
                    </label>
                  ))}
                </div>
                {errors.daysOpen && <p className="error">{errors.daysOpen}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="form-navigation">
          {currentStep > 1 && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleBack}
              disabled={isLoading}
            >
              <i className="material-icons">arrow_back</i>
              Back
            </button>
          )}

          <button
            type="button"
            className={`btn btn-primary ${isLoading ? 'loading' : ''}`}
            onClick={handleNext}
            disabled={isLoading}
          >
            {isLoading && <div className="spinner"></div>}
            <span>
              {currentStep === 3 ? 'Activate Account' : 'Continue'}
            </span>
            {/* {currentStep < 3 && <i className="material-icons">arrow_forward</i>} */}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;
