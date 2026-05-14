import React, { useState, useEffect } from "react";
import {
  Tag,
  Plus,
  Edit3,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Truck,
  Flame,
  Gift,
  AlertCircle,
  CheckCircle,
  X,
} from "lucide-react";
import {
  getMyOffers,
  createOffer,
  updateOffer,
  toggleOffer,
  deleteOffer,
} from "../api/offers";
import type { Offer, OfferFormData } from "../api/offers";

const OFFER_TYPES = [
  { value: "VENDOR_DISCOUNT", label: "Store Discount", icon: Tag, color: "#7C3AED", description: "Flat or percentage discount on your store" },
  { value: "VENDOR_MIN_ORDER", label: "Min Order Offer", icon: Truck, color: "#059669", description: "Free delivery or discount above certain order value" },
  { value: "VENDOR_CLEARANCE", label: "Clearance Sale", icon: Flame, color: "#CA8A04", description: "Big discounts on last stock" },
];

const OffersPage: React.FC = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const data = await getMyOffers();
      setOffers(data);
    } catch (err) {
      setError("Failed to load offers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const handleToggle = async (id: string) => {
    try {
      await toggleOffer(id);
      setOffers((prev) =>
        prev.map((o) => (o._id === id ? { ...o, isActive: !o.isActive } : o))
      );
    } catch {
      setError("Failed to toggle offer");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this offer?")) return;
    try {
      await deleteOffer(id);
      setOffers((prev) => prev.filter((o) => o._id !== id));
      setSuccess("Offer deleted");
    } catch {
      setError("Failed to delete offer");
    }
  };

  const handleEdit = (offer: Offer) => {
    setEditingOffer(offer);
    setShowForm(true);
  };

  const handleFormSubmit = async (data: OfferFormData) => {
    setSubmitting(true);
    setError(null);
    try {
      if (editingOffer) {
        await updateOffer(editingOffer._id, data);
        setSuccess("Offer updated successfully");
      } else {
        await createOffer(data);
        setSuccess("Offer created successfully");
      }
      setShowForm(false);
      setEditingOffer(null);
      await fetchOffers();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save offer");
    } finally {
      setSubmitting(false);
    }
  };

  // Auto-clear messages
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => { setError(null); setSuccess(null); }, 4000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const activeOffers = offers.filter((o) => o.isActive);
  const inactiveOffers = offers.filter((o) => !o.isActive);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: 0 }}>
            Offers & Promotions
          </h1>
          <p style={{ fontSize: 14, color: "#64748b", margin: "4px 0 0" }}>
            Create and manage offers for your store
          </p>
        </div>
        <button
          onClick={() => { setEditingOffer(null); setShowForm(true); }}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 20px", borderRadius: 12,
            background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
            color: "#fff", border: "none", cursor: "pointer",
            fontSize: 14, fontWeight: 700,
            boxShadow: "0 4px 14px rgba(124,58,237,0.3)",
          }}
        >
          <Plus size={16} /> Create Offer
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderRadius: 12, background: "#FEF2F2", border: "1px solid #FECACA", marginBottom: 16, color: "#DC2626", fontSize: 14, fontWeight: 600 }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}
      {success && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderRadius: 12, background: "#F0FDF4", border: "1px solid #BBF7D0", marginBottom: 16, color: "#16A34A", fontSize: 14, fontWeight: 600 }}>
          <CheckCircle size={16} /> {success}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        <StatCard label="Total Offers" value={offers.length} color="#7C3AED" />
        <StatCard label="Active" value={activeOffers.length} color="#16A34A" />
        <StatCard label="Total Usage" value={offers.reduce((s, o) => s + (o.currentUsage || 0), 0)} color="#EA580C" />
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: 40, color: "#94A3B8" }}>Loading offers...</div>
      )}

      {/* Offers List */}
      {!loading && offers.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: 16, border: "1px solid #F1F5F9" }}>
          <Gift size={48} color="#CBD5E1" style={{ marginBottom: 12 }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#64748B", margin: "0 0 4px" }}>No Offers Yet</h3>
          <p style={{ fontSize: 14, color: "#94A3B8" }}>Create your first offer to attract more customers</p>
        </div>
      )}

      {!loading && activeOffers.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginBottom: 12 }}>Active Offers</h2>
          {activeOffers.map((offer) => (
            <OfferCard key={offer._id} offer={offer} onToggle={handleToggle} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {!loading && inactiveOffers.length > 0 && (
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#94A3B8", marginBottom: 12 }}>Inactive Offers</h2>
          {inactiveOffers.map((offer) => (
            <OfferCard key={offer._id} offer={offer} onToggle={handleToggle} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <OfferFormModal
          offer={editingOffer}
          submitting={submitting}
          onSubmit={handleFormSubmit}
          onClose={() => { setShowForm(false); setEditingOffer(null); }}
        />
      )}
    </div>
  );
};

// ── Stat Card ──
function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 14, padding: "16px 20px",
      border: "1px solid #F1F5F9",
    }}>
      <div style={{ fontSize: 28, fontWeight: 900, color }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#94A3B8", marginTop: 2 }}>{label}</div>
    </div>
  );
}

// ── Offer Card ──
function OfferCard({ offer, onToggle, onEdit, onDelete }: {
  offer: Offer;
  onToggle: (id: string) => void;
  onEdit: (offer: Offer) => void;
  onDelete: (id: string) => void;
}) {
  const typeConfig = OFFER_TYPES.find((t) => t.value === offer.type);
  const isExpired = new Date(offer.endDate) < new Date();
  const discountLabel = offer.discountType === "flat" ? `₹${offer.discountValue} OFF` : `${offer.discountValue}% OFF`;

  return (
    <div style={{
      background: "#fff", borderRadius: 16, padding: 16,
      border: `1px solid ${offer.isActive ? "#E2E8F0" : "#F1F5F9"}`,
      opacity: offer.isActive ? 1 : 0.7,
      marginBottom: 10, display: "flex", alignItems: "center", gap: 16,
      transition: "all 0.2s",
    }}>
      {/* Discount Badge */}
      <div style={{
        width: 64, height: 64, borderRadius: 14,
        background: `${typeConfig?.color || "#7C3AED"}10`,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <span style={{ fontSize: 14, fontWeight: 900, color: typeConfig?.color || "#7C3AED", textAlign: "center", lineHeight: "16px" }}>
          {discountLabel}
        </span>
      </div>

      {/* Details */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", marginBottom: 2 }}>
          {offer.title}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{
            fontSize: 10, fontWeight: 700,
            padding: "2px 8px", borderRadius: 4,
            background: `${typeConfig?.color || "#7C3AED"}15`,
            color: typeConfig?.color || "#7C3AED",
          }}>
            {typeConfig?.label || offer.type}
          </span>
          {offer.couponCode && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "#F1F5F9", color: "#475569", letterSpacing: 0.5, borderStyle: "dashed", border: "1px dashed #CBD5E1" }}>
              {offer.couponCode}
            </span>
          )}
          {offer.applicableTo && offer.applicableTo !== 'both' && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: offer.applicableTo === 'try_and_buy' ? '#DCFCE7' : '#F3E8FF', color: offer.applicableTo === 'try_and_buy' ? '#166534' : '#7C3AED' }}>
              {offer.applicableTo === 'try_and_buy' ? 'TRY & BUY' : 'COURIER'}
            </span>
          )}
          {isExpired && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "#FEF2F2", color: "#DC2626" }}>
              EXPIRED
            </span>
          )}
          <span style={{ fontSize: 11, color: "#94A3B8" }}>
            {offer.currentUsage || 0} uses
          </span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button onClick={() => onToggle(offer._id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }} title={offer.isActive ? "Deactivate" : "Activate"}>
          {offer.isActive ? <ToggleRight size={24} color="#16A34A" /> : <ToggleLeft size={24} color="#94A3B8" />}
        </button>
        <button onClick={() => onEdit(offer)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }} title="Edit">
          <Edit3 size={16} color="#64748B" />
        </button>
        <button onClick={() => onDelete(offer._id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }} title="Delete">
          <Trash2 size={16} color="#EF4444" />
        </button>
      </div>
    </div>
  );
}

// ── Form Modal ──
function OfferFormModal({ offer, submitting, onSubmit, onClose }: {
  offer: Offer | null;
  submitting: boolean;
  onSubmit: (data: OfferFormData) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<OfferFormData>({
    title: offer?.title || "",
    description: offer?.description || "",
    badgeText: offer?.badgeText || "",
    type: offer?.type as any || "VENDOR_DISCOUNT",
    discountType: offer?.discountType || "percentage",
    discountValue: offer?.discountValue || 0,
    maxDiscount: offer?.maxDiscount || undefined,
    conditions: {
      minCartValue: offer?.conditions?.minCartValue || 0,
      minOrderValue: offer?.conditions?.minOrderValue || 0,
    },
    startDate: offer?.startDate ? new Date(offer.startDate).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
    endDate: offer?.endDate ? new Date(offer.endDate).toISOString().slice(0, 16) : "",
    couponCode: offer?.couponCode || "",
    requiresCoupon: offer?.requiresCoupon || false,
    maxUsageTotal: offer?.maxUsageTotal || undefined,
    maxUsagePerUser: offer?.maxUsagePerUser || 1,
    freeDelivery: offer?.freeDelivery || false,
    priority: offer?.priority || 0,
    benefitType: offer?.benefitType || 'CART',
    stackable: offer?.stackable !== undefined ? offer.stackable : true,
    isExclusive: offer?.isExclusive || false,
    applicableTo: (offer?.applicableTo as any) || 'both',
  });

  const updateField = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateCondition = (key: string, value: any) => {
    setForm((prev) => ({
      ...prev,
      conditions: { ...prev.conditions, [key]: value },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.endDate || !form.discountValue) return;
    onSubmit(form);
  };

  const selectedType = OFFER_TYPES.find((t) => t.value === form.type);

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.5)", zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center",
      backdropFilter: "blur(4px)",
    }}>
      <div style={{
        background: "#fff", borderRadius: 20, width: "100%", maxWidth: 560,
        maxHeight: "90vh", overflow: "auto", padding: 28,
        boxShadow: "0 24px 48px rgba(0,0,0,0.12)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", margin: 0 }}>
            {offer ? "Edit Offer" : "Create New Offer"}
          </h2>
          <button onClick={onClose} style={{ background: "#F1F5F9", border: "none", borderRadius: 8, padding: 6, cursor: "pointer" }}>
            <X size={18} color="#64748B" />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Offer Type */}
          <div>
            <label style={labelStyle}>Offer Type</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {OFFER_TYPES.map((t) => (
                <button
                  key={t.value} type="button"
                  onClick={() => updateField("type", t.value)}
                  style={{
                    padding: "12px 8px", borderRadius: 12, border: "2px solid",
                    borderColor: form.type === t.value ? t.color : "#E2E8F0",
                    background: form.type === t.value ? `${t.color}08` : "#fff",
                    cursor: "pointer", textAlign: "center",
                  }}
                >
                  <t.icon size={20} color={t.color} style={{ margin: "0 auto 4px" }} />
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>{t.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Applicable To */}
          <div>
            <label style={labelStyle}>Applicable To</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {[
                { value: 'both', label: 'Both', color: '#475569', description: 'Try & Buy + Courier' },
                { value: 'try_and_buy', label: 'Try & Buy', color: '#16A34A', description: 'Platform delivery only' },
                { value: 'courier', label: 'Standard Cart', color: '#7C3AED', description: 'Courier delivery only' },
              ].map((opt) => (
                <button
                  key={opt.value} type="button"
                  onClick={() => updateField("applicableTo", opt.value)}
                  style={{
                    padding: "10px 8px", borderRadius: 12, border: "2px solid",
                    borderColor: form.applicableTo === opt.value ? opt.color : "#E2E8F0",
                    background: form.applicableTo === opt.value ? `${opt.color}08` : "#fff",
                    cursor: "pointer", textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: form.applicableTo === opt.value ? opt.color : "#0F172A" }}>{opt.label}</div>
                  <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>{opt.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label style={labelStyle}>Offer Title *</label>
            <input
              value={form.title} onChange={(e) => updateField("title", e.target.value)}
              placeholder={`e.g. ${selectedType?.description}`}
              style={inputStyle} required
            />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description</label>
            <input
              value={form.description} onChange={(e) => updateField("description", e.target.value)}
              placeholder="Brief description for customers"
              style={inputStyle}
            />
          </div>

          {/* Discount */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Discount Type</label>
              <select
                value={form.discountType}
                onChange={(e) => updateField("discountType", e.target.value)}
                style={inputStyle}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat (₹)</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Value *</label>
              <input
                type="number" value={form.discountValue}
                onChange={(e) => updateField("discountValue", Number(e.target.value))}
                placeholder="e.g. 25" style={inputStyle} required min={0}
              />
            </div>
            {form.discountType === "percentage" && (
              <div>
                <label style={labelStyle}>Max Discount (₹)</label>
                <input
                  type="number" value={form.maxDiscount || ""}
                  onChange={(e) => updateField("maxDiscount", e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="e.g. 200" style={inputStyle} min={0}
                />
              </div>
            )}
          </div>

          {/* Min Cart / Order Value */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Min Cart Value (₹)</label>
              <input
                type="number" value={form.conditions?.minCartValue || ""}
                onChange={(e) => updateCondition("minCartValue", Number(e.target.value))}
                placeholder="0" style={inputStyle} min={0}
              />
            </div>
            {form.type === "VENDOR_MIN_ORDER" && (
              <div>
                <label style={labelStyle}>Min Order Value (₹)</label>
                <input
                  type="number" value={form.conditions?.minOrderValue || ""}
                  onChange={(e) => updateCondition("minOrderValue", Number(e.target.value))}
                  placeholder="e.g. 799" style={inputStyle} min={0}
                />
              </div>
            )}
          </div>

          {/* Date Range */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Start Date *</label>
              <input
                type="datetime-local" value={form.startDate}
                onChange={(e) => updateField("startDate", e.target.value)}
                style={inputStyle} required
              />
            </div>
            <div>
              <label style={labelStyle}>End Date *</label>
              <input
                type="datetime-local" value={form.endDate}
                onChange={(e) => updateField("endDate", e.target.value)}
                style={inputStyle} required
              />
            </div>
          </div>

          {/* Coupon Code */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "end" }}>
            <div>
              <label style={labelStyle}>Coupon Code (Optional)</label>
              <input
                value={form.couponCode || ""} onChange={(e) => updateField("couponCode", e.target.value.toUpperCase())}
                placeholder="e.g. NIKE25" style={{ ...inputStyle, letterSpacing: 1 }}
              />
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "10px 0" }}>
              <input
                type="checkbox" checked={form.requiresCoupon || false}
                onChange={(e) => updateField("requiresCoupon", e.target.checked)}
              />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>Requires code</span>
            </label>
          </div>

          {/* Free Delivery toggle */}
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input
              type="checkbox" checked={form.freeDelivery || false}
              onChange={(e) => updateField("freeDelivery", e.target.checked)}
            />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>Enable free delivery for this offer</span>
          </label>
          {/* Stacking Rules */}
          <div style={{ border: "1.5px solid #E2E8F0", borderRadius: 14, padding: 12, background: "#F8FAFC", marginTop: 8 }}>
            <label style={{ ...labelStyle, fontSize: 11, color: "#64748B", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>⚡ Stacking Rules</label>
            
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Benefit Type</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {[
                  { value: 'PRODUCT', label: 'Product' },
                  { value: 'CART', label: 'Cart' },
                  { value: 'DELIVERY', label: 'Delivery' },
                ].map((bt) => (
                  <button
                    key={bt.value} type="button"
                    onClick={() => updateField('benefitType', bt.value)}
                    style={{
                      padding: "8px 4px", borderRadius: 8, fontSize: 12, fontWeight: 700, border: "1.5px solid",
                      cursor: "pointer", transition: "all 0.2s",
                      backgroundColor: form.benefitType === bt.value ? "#7C3AED" : "#fff",
                      borderColor: form.benefitType === bt.value ? "#7C3AED" : "#E2E8F0",
                      color: form.benefitType === bt.value ? "#fff" : "#64748B",
                    }}
                  >
                    {bt.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 16 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <input 
                  type="checkbox" checked={form.stackable} 
                  onChange={(e) => updateField('stackable', e.target.checked)} 
                />
                <span style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Stackable</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <input 
                  type="checkbox" checked={form.isExclusive} 
                  onChange={(e) => { 
                    updateField('isExclusive', e.target.checked); 
                    if (e.target.checked) updateField('stackable', false); 
                  }} 
                />
                <span style={{ fontSize: 12, fontWeight: 600, color: "#DC2626" }}>Exclusive</span>
              </label>
            </div>
          </div>
          {/* Usage Limits */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Max Total Uses</label>
              <input
                type="number" value={form.maxUsageTotal || ""}
                onChange={(e) => updateField("maxUsageTotal", e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Unlimited" style={inputStyle} min={1}
              />
            </div>
            <div>
              <label style={labelStyle}>Max Uses Per User</label>
              <input
                type="number" value={form.maxUsagePerUser || 1}
                onChange={(e) => updateField("maxUsagePerUser", Number(e.target.value))}
                style={inputStyle} min={1}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit" disabled={submitting}
            style={{
              padding: "14px 24px", borderRadius: 14, border: "none",
              background: submitting ? "#94A3B8" : "linear-gradient(135deg, #7C3AED, #6D28D9)",
              color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer",
              marginTop: 8, boxShadow: "0 4px 14px rgba(124,58,237,0.3)",
            }}
          >
            {submitting ? "Saving..." : offer ? "Update Offer" : "Create Offer"}
          </button>
        </form>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, color: "#475569",
  display: "block", marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: 10,
  border: "1.5px solid #E2E8F0", fontSize: 14, fontWeight: 500,
  color: "#0F172A", outline: "none", background: "#F8FAFC",
  boxSizing: "border-box",
};

export default OffersPage;
