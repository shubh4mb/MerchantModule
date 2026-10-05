import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  RefreshCw,
  CreditCard,
  PackageCheck,
  ShieldCheck,
  HelpCircle,
  Printer,
  ArrowLeft,
  ShieldAlert,
  Clock,
  Sparkles,
} from "lucide-react";

interface PoliciesPageProps {
  isPublic?: boolean;
}

type TabType = "terms" | "returns" | "settlements" | "packaging" | "privacy";

const PoliciesPage: React.FC<PoliciesPageProps> = ({ isPublic = false }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("terms");

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      style={{
        minHeight: "100%",
        padding: isPublic ? "var(--space-8) var(--space-4)" : "var(--space-6)",
        maxWidth: "1140px",
        margin: "0 auto",
      }}
    >
      {/* Top Bar for Public View */}
      {isPublic && (
        <div style={{ marginBottom: "var(--space-6)" }}>
          <button
            onClick={() => navigate(-1)}
            className="btn btn-secondary"
            style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)" }}
          >
            <ArrowLeft size={16} /> Back
          </button>
        </div>
      )}

      {/* Hero Header */}
      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-xl)",
          padding: "var(--space-6) var(--space-8)",
          marginBottom: "var(--space-6)",
          boxShadow: "var(--shadow-sm)",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--space-4)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-2)" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "var(--radius-lg)",
                background: "var(--color-accent-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FileText size={22} color="var(--color-text)" />
            </div>
            <div>
              <h1
                style={{
                  fontSize: "var(--text-2xl)",
                  fontWeight: 700,
                  color: "var(--color-text)",
                  margin: 0,
                  letterSpacing: "-0.02em",
                }}
              >
                Merchant Policies & Operating Standards
              </h1>
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  color: "var(--color-text-secondary)",
                  margin: 0,
                  marginTop: "2px",
                }}
              >
                Official Master Agreement, SLAs, Try & Buy Protocols, and Settlement Rules
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <span
            style={{
              fontSize: "var(--text-xs)",
              padding: "4px 10px",
              borderRadius: "var(--radius-full)",
              background: "var(--color-info-subtle)",
              color: "var(--color-info)",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Clock size={12} /> v2.4 • Effective Sep 2026
          </span>
          <button
            onClick={handlePrint}
            className="btn btn-secondary"
            style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)" }}
            title="Print or Save as PDF"
          >
            <Printer size={16} /> Print Terms
          </button>
        </div>
      </div>

      {/* Segmented Navigation Tabs */}
      <div
        style={{
          display: "flex",
          gap: "var(--space-2)",
          borderBottom: "1px solid var(--color-border)",
          paddingBottom: "var(--space-3)",
          marginBottom: "var(--space-6)",
          overflowX: "auto",
        }}
      >
        <button
          onClick={() => setActiveTab("terms")}
          style={{
            padding: "8px 16px",
            borderRadius: "var(--radius-md)",
            border: "none",
            background: activeTab === "terms" ? "var(--color-accent)" : "transparent",
            color: activeTab === "terms" ? "var(--color-text-inverse)" : "var(--color-text-secondary)",
            fontWeight: activeTab === "terms" ? 600 : 500,
            fontSize: "var(--text-sm)",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--space-2)",
            whiteSpace: "nowrap",
            transition: "all var(--transition-fast)",
          }}
        >
          <FileText size={16} /> Merchant Partner Agreement
        </button>

        <button
          onClick={() => setActiveTab("returns")}
          style={{
            padding: "8px 16px",
            borderRadius: "var(--radius-md)",
            border: "none",
            background: activeTab === "returns" ? "var(--color-accent)" : "transparent",
            color: activeTab === "returns" ? "var(--color-text-inverse)" : "var(--color-text-secondary)",
            fontWeight: activeTab === "returns" ? 600 : 500,
            fontSize: "var(--text-sm)",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--space-2)",
            whiteSpace: "nowrap",
            transition: "all var(--transition-fast)",
          }}
        >
          <RefreshCw size={16} /> Try & Buy & Damage Policy
        </button>

        <button
          onClick={() => setActiveTab("settlements")}
          style={{
            padding: "8px 16px",
            borderRadius: "var(--radius-md)",
            border: "none",
            background: activeTab === "settlements" ? "var(--color-accent)" : "transparent",
            color: activeTab === "settlements" ? "var(--color-text-inverse)" : "var(--color-text-secondary)",
            fontWeight: activeTab === "settlements" ? 600 : 500,
            fontSize: "var(--text-sm)",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--space-2)",
            whiteSpace: "nowrap",
            transition: "all var(--transition-fast)",
          }}
        >
          <CreditCard size={16} /> Payouts & Commission
        </button>

        <button
          onClick={() => setActiveTab("packaging")}
          style={{
            padding: "8px 16px",
            borderRadius: "var(--radius-md)",
            border: "none",
            background: activeTab === "packaging" ? "var(--color-accent)" : "transparent",
            color: activeTab === "packaging" ? "var(--color-text-inverse)" : "var(--color-text-secondary)",
            fontWeight: activeTab === "packaging" ? 600 : 500,
            fontSize: "var(--text-sm)",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--space-2)",
            whiteSpace: "nowrap",
            transition: "all var(--transition-fast)",
          }}
        >
          <PackageCheck size={16} /> Packaging & Zip Covers
        </button>

        <button
          onClick={() => setActiveTab("privacy")}
          style={{
            padding: "8px 16px",
            borderRadius: "var(--radius-md)",
            border: "none",
            background: activeTab === "privacy" ? "var(--color-accent)" : "transparent",
            color: activeTab === "privacy" ? "var(--color-text-inverse)" : "var(--color-text-secondary)",
            fontWeight: activeTab === "privacy" ? 600 : 500,
            fontSize: "var(--text-sm)",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--space-2)",
            whiteSpace: "nowrap",
            transition: "all var(--transition-fast)",
          }}
        >
          <ShieldCheck size={16} /> Privacy & Anti-Solicitation
        </button>
      </div>

      {/* Policy Details Container */}
      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-xl)",
          padding: "var(--space-8)",
          boxShadow: "var(--shadow-sm)",
          lineHeight: 1.7,
        }}
      >
        {/* TAB 1: Merchant Agreement */}
        {activeTab === "terms" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-4)" }}>
              <FileText size={20} color="var(--color-text)" />
              <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 700, margin: 0 }}>
                1. FlashFits Merchant Partner Agreement
              </h2>
            </div>

            <section style={{ marginBottom: "var(--space-6)" }}>
              <h3 style={{ fontSize: "var(--text-md)", fontWeight: 600, color: "var(--color-text)", marginBottom: "var(--space-2)" }}>
                1.1 Introduction & Commercial Relationship
              </h3>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-base)", marginBottom: "var(--space-3)" }}>
                This Merchant Agreement ("Agreement") constitutes a legally binding contract between FlashFits Quick Commerce
                Private Limited ("FlashFits", "Platform", "we", "us") and the registered retail merchant partner ("Merchant", "Store
                Partner", "you"). By creating a seller account, uploading catalog products, or accepting delivery orders on the
                FlashFits Merchant Module, you agree to strictly comply with all provisions, operational SLAs, and standards set
                forth in this document.
              </p>
            </section>

            <section style={{ marginBottom: "var(--space-6)" }}>
              <h3 style={{ fontSize: "var(--text-md)", fontWeight: 600, color: "var(--color-text)", marginBottom: "var(--space-2)" }}>
                1.2 Merchant Onboarding & Physical Store Verification
              </h3>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-base)", marginBottom: "var(--space-3)" }}>
                To maintain high consumer trust and reliable hyperlocal dispatch:
              </p>
              <ul style={{ paddingLeft: "var(--space-5)", color: "var(--color-text-secondary)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                <li>
                  <strong style={{ color: "var(--color-text)" }}>KYC Submission:</strong> Every merchant must submit valid business registration, PAN card, GSTIN (where required by Indian tax thresholds), and cancelled cheque or bank proof matching the legal trading entity.
                </li>
                <li>
                  <strong style={{ color: "var(--color-text)" }}>Physical Store Coordinates:</strong> The physical pickup desk must have exact GPS coordinates recorded to enable prompt rider arrival. Any store relocation must be notified at least 7 days in advance.
                </li>
                <li>
                  <strong style={{ color: "var(--color-text)" }}>Operational Hours:</strong> Merchants must staff their order fulfillment desk and ensure instant readiness during the operating hours configured in their profile.
                </li>
              </ul>
            </section>

            <section style={{ marginBottom: "var(--space-6)" }}>
              <h3 style={{ fontSize: "var(--text-md)", fontWeight: 600, color: "var(--color-text)", marginBottom: "var(--space-2)" }}>
                1.3 Product Catalog, Authenticity & Quality Assurance
              </h3>
              <ul style={{ paddingLeft: "var(--space-5)", color: "var(--color-text-secondary)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                <li>
                  <strong style={{ color: "var(--color-text)" }}>100% Genuine Apparel:</strong> FlashFits enforces an absolute zero-tolerance policy against counterfeit, replica, refurbished, or unauthorized copy apparel, footwear, and accessories. Verified counterfeit listings will attract an immediate contractual penalty of ₹50,000 per violation, instant deactivation, and forfeiture of accrued receivables.
                </li>
                <li>
                  <strong style={{ color: "var(--color-text)" }}>New, Tagged Merchandise:</strong> All apparel must be brand new, unwashed, unstained, factory-fresh, and bearing original manufacturer / brand barcode and price tags.
                </li>
                <li>
                  <strong style={{ color: "var(--color-text)" }}>Price Parity:</strong> The listing price on FlashFits shall never exceed the in-store offline retail price or Maximum Retail Price (MRP).
                </li>
              </ul>
            </section>

            <section style={{ marginBottom: "var(--space-6)" }}>
              <h3 style={{ fontSize: "var(--text-md)", fontWeight: 600, color: "var(--color-text)", marginBottom: "var(--space-2)" }}>
                1.4 Fulfillment SLAs (Local Try & Buy)
              </h3>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-base)", marginBottom: "var(--space-3)" }}>
                To fulfill our customer promise of express 30-minute fashion delivery:
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: "var(--space-4)",
                  marginTop: "var(--space-3)",
                }}
              >
                <div style={{ background: "var(--color-bg)", padding: "var(--space-4)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)" }}>
                  <div style={{ fontWeight: 700, fontSize: "var(--text-base)", color: "var(--color-text)" }}>5 Minutes SLA</div>
                  <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", marginTop: "4px" }}>
                    Acknowledge and accept incoming order chime alerts.
                  </div>
                </div>
                <div style={{ background: "var(--color-bg)", padding: "var(--space-4)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)" }}>
                  <div style={{ fontWeight: 700, fontSize: "var(--text-base)", color: "var(--color-text)" }}>10 Minutes SLA</div>
                  <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", marginTop: "4px" }}>
                    Pick, fold, and pack garments in sealed FlashFits Zip Covers with security seals.
                  </div>
                </div>
                <div style={{ background: "var(--color-bg)", padding: "var(--space-4)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)" }}>
                  <div style={{ fontWeight: 700, fontSize: "var(--text-base)", color: "var(--color-text)" }}>OTP Handshake</div>
                  <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", marginTop: "4px" }}>
                    Verify rider's last 4 Order digits (#XXXX) and exchange the 4-digit pickup OTP.
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: Try & Buy & Damage Policy */}
        {activeTab === "returns" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-4)" }}>
              <RefreshCw size={20} color="var(--color-text)" />
              <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 700, margin: 0 }}>
                2. Try & Buy, Doorstep Returns & Damage Reporting Policy
              </h2>
            </div>

            <section style={{ marginBottom: "var(--space-6)" }}>
              <h3 style={{ fontSize: "var(--text-md)", fontWeight: 600, color: "var(--color-text)", marginBottom: "var(--space-2)" }}>
                2.1 How FlashFits Try & Buy Operates
              </h3>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-base)", marginBottom: "var(--space-3)" }}>
                FlashFits operates a pioneering quick-commerce trial model. Customers order multiple garments, styles, or sizes
                with ₹0 upfront payment. A dedicated rider delivers the sealed zip cover to the customer's doorstep and waits up
                to 15–30 minutes while the customer tries the clothing on at home.
              </p>
              <div
                style={{
                  background: "var(--color-info-subtle)",
                  border: "1px solid var(--color-info)",
                  borderRadius: "var(--radius-lg)",
                  padding: "var(--space-4)",
                  color: "var(--color-info)",
                  fontSize: "var(--text-sm)",
                  display: "flex",
                  gap: "var(--space-3)",
                }}
              >
                <Sparkles size={20} style={{ flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <strong>Zero Merchant Loss on Partial Keeps:</strong> You earn full revenue on every kept garment. Unkept garments are immediately returned back to your store on the same delivery run by the dedicated rider.
                </div>
              </div>
            </section>

            <section style={{ marginBottom: "var(--space-6)" }}>
              <h3 style={{ fontSize: "var(--text-md)", fontWeight: 600, color: "var(--color-text)", marginBottom: "var(--space-2)" }}>
                2.2 In-Person Return Inspection Protocol
              </h3>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-base)", marginBottom: "var(--space-3)" }}>
                When the rider returns to your store with unkept trial items:
              </p>
              <ul style={{ paddingLeft: "var(--space-5)", color: "var(--color-text-secondary)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                <li>
                  <strong style={{ color: "var(--color-text)" }}>Immediate Physical Inspection:</strong> Inspect all returned garments in the rider's presence. Check that brand tags, size tags, and price tickets are intact.
                </li>
                <li>
                  <strong style={{ color: "var(--color-text)" }}>Hygiene & Stain Check:</strong> Verify garments are free from makeup, deodorants, perfumes, soil, or snagging.
                </li>
                <li>
                  <strong style={{ color: "var(--color-text)" }}>Return OTP Handover:</strong> Provide the 4-digit return completion OTP to the rider only after verifying item physical integrity.
                </li>
              </ul>
            </section>

            <section style={{ marginBottom: "var(--space-6)" }}>
              <h3 style={{ fontSize: "var(--text-md)", fontWeight: 600, color: "var(--color-text)", marginBottom: "var(--space-2)" }}>
                2.3 Damage Claims & FlashFits Merchant Protection Fund (MPF)
              </h3>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-base)", marginBottom: "var(--space-3)" }}>
                In the rare instance where a garment is returned in a damaged condition, stained, or with missing tags:
              </p>
              <div
                style={{
                  background: "var(--color-bg)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-lg)",
                  padding: "var(--space-5)",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-3)" }}>
                  <ShieldAlert size={22} color="var(--color-warning)" style={{ flexShrink: 0 }} />
                  <div>
                    <h4 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600, color: "var(--color-text)" }}>
                      24-Hour Damage Reporting Window
                    </h4>
                    <p style={{ margin: "var(--space-2) 0 0 0", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      Merchants must raise a Damage Incident Report via the Merchant Module within 24 hours of rider return handoff.
                      You must upload clear photo/video proof showing the defect, original tag location, and packaging seal tag ID.
                    </p>
                    <p style={{ margin: "var(--space-2) 0 0 0", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      Our Merchant Protection Fund reimburses the merchant's wholesale landing cost within 3 business days once verified as transit or trial damage.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section style={{ marginBottom: "var(--space-6)" }}>
              <h3 style={{ fontSize: "var(--text-md)", fontWeight: 600, color: "var(--color-text)", marginBottom: "var(--space-2)" }}>
                2.4 Courier Shipping Returns (Standard 3-Day Window)
              </h3>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-base)" }}>
                For non-hyperlocal orders shipped via national courier logistics, customers have 72 hours (3 calendar days)
                from confirmed delivery to raise an in-app return request for sizing issues or defects. The merchant has 48 hours
                from receiving the reverse courier parcel to verify item condition before refund disbursement.
              </p>
            </section>
          </div>
        )}

        {/* TAB 3: Settlements, Commissions & Payouts */}
        {activeTab === "settlements" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-4)" }}>
              <CreditCard size={20} color="var(--color-text)" />
              <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 700, margin: 0 }}>
                3. Payouts, Commissions & Taxation Policy
              </h2>
            </div>

            <section style={{ marginBottom: "var(--space-6)" }}>
              <h3 style={{ fontSize: "var(--text-md)", fontWeight: 600, color: "var(--color-text)", marginBottom: "var(--space-2)" }}>
                3.1 Commission Charged Only on Kept Items
              </h3>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-base)", marginBottom: "var(--space-3)" }}>
                FlashFits charges a tiered platform commission calculated strictly on <strong style={{ color: "var(--color-text)" }}>Net Kept Sales</strong> (items
                actually retained and paid for by the customer post-trial). No commission or reverse logistics fee is charged to the
                merchant for items returned during the doorstep trial session.
              </p>
            </section>

            <section style={{ marginBottom: "var(--space-6)" }}>
              <h3 style={{ fontSize: "var(--text-md)", fontWeight: 600, color: "var(--color-text)", marginBottom: "var(--space-2)" }}>
                3.2 T+2 Settlement Cycle
              </h3>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-base)", marginBottom: "var(--space-3)" }}>
                Payouts are transferred via automated bank transfer (NEFT/IMPS) on a rolling <strong style={{ color: "var(--color-text)" }}>T+2 business days</strong> basis
                from order completion. Weekly summary statements with detailed per-order calculations, kept quantities, and tax
                certificates are accessible anytime in your Revenue dashboard.
              </p>
            </section>

            <section style={{ marginBottom: "var(--space-6)" }}>
              <h3 style={{ fontSize: "var(--text-md)", fontWeight: 600, color: "var(--color-text)", marginBottom: "var(--space-2)" }}>
                3.3 Statutory Tax Compliance (TCS & TDS)
              </h3>
              <ul style={{ paddingLeft: "var(--space-5)", color: "var(--color-text-secondary)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                <li>
                  <strong style={{ color: "var(--color-text)" }}>TCS Deduction:</strong> 1% Tax Collected at Source is deducted under Section 52 of the CGST/SGST Act for registered sellers and remitted to the Indian government under your GSTIN.
                </li>
                <li>
                  <strong style={{ color: "var(--color-text)" }}>TDS under Section 194-O:</strong> 1% TDS on gross e-commerce sales where applicable under Income Tax guidelines.
                </li>
                <li>
                  <strong style={{ color: "var(--color-text)" }}>Monthly Platform Tax Invoices:</strong> FlashFits furnishes GST invoices by the 10th of every calendar month for platform commission fees.
                </li>
              </ul>
            </section>
          </div>
        )}

        {/* TAB 4: Packaging & Zip Covers */}
        {activeTab === "packaging" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-4)" }}>
              <PackageCheck size={20} color="var(--color-text)" />
              <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 700, margin: 0 }}>
                4. Packaging, Zip Covers & Security Seals
              </h2>
            </div>

            <section style={{ marginBottom: "var(--space-6)" }}>
              <h3 style={{ fontSize: "var(--text-md)", fontWeight: 600, color: "var(--color-text)", marginBottom: "var(--space-2)" }}>
                4.1 Mandatory FlashFits Branded Zip Covers
              </h3>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-base)", marginBottom: "var(--space-3)" }}>
                To preserve garment freshness and present a luxury doorstep experience, all Try & Buy orders must be packaged in
                genuine FlashFits Zip Covers. Dispatching orders in unbranded shopping bags, polybags, or open bags is strictly
                prohibited.
              </p>
            </section>

            <section style={{ marginBottom: "var(--space-6)" }}>
              <h3 style={{ fontSize: "var(--text-md)", fontWeight: 600, color: "var(--color-text)", marginBottom: "var(--space-2)" }}>
                4.2 Serialized Barcode Seal Protocol
              </h3>
              <ul style={{ paddingLeft: "var(--space-5)", color: "var(--color-text-secondary)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                <li>
                  <strong style={{ color: "var(--color-text)" }}>Attaching Security Seals:</strong> Each zip cover zipper must be locked using a single-use FlashFits tamper-evident security barcode tag.
                </li>
                <li>
                  <strong style={{ color: "var(--color-text)" }}>System Record:</strong> Scan the security tag ID into the Merchant Module when marking an order as "Packed".
                </li>
                <li>
                  <strong style={{ color: "var(--color-text)" }}>Tamper Rejection:</strong> Riders and customers are instructed to reject any parcel with a broken or mismatched seal tag.
                </li>
              </ul>
            </section>

            <section style={{ marginBottom: "var(--space-6)" }}>
              <h3 style={{ fontSize: "var(--text-md)", fontWeight: 600, color: "var(--color-text)", marginBottom: "var(--space-2)" }}>
                4.3 Ordering Zip Cover Supplies
              </h3>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-base)" }}>
                Merchants can replenish their stock of FlashFits Zip Covers and Security Seal tags directly from the "Zip Covers"
                tab in the sidebar. Packs are subsidized by FlashFits and delivered within 24 hours to your store.
              </p>
            </section>
          </div>
        )}

        {/* TAB 5: Data Protection & Anti-Solicitation */}
        {activeTab === "privacy" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-4)" }}>
              <ShieldCheck size={20} color="var(--color-text)" />
              <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 700, margin: 0 }}>
                5. Customer Data Privacy & Anti-Solicitation Policy
              </h2>
            </div>

            <section style={{ marginBottom: "var(--space-6)" }}>
              <h3 style={{ fontSize: "var(--text-md)", fontWeight: 600, color: "var(--color-text)", marginBottom: "var(--space-2)" }}>
                5.1 Customer Data Confidentiality & DPDP Compliance
              </h3>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-base)", marginBottom: "var(--space-3)" }}>
                In compliance with the Digital Personal Data Protection (DPDP) Act, 2023, customer identity, mobile numbers, and
                addresses accessed through FlashFits are strictly confidential and provided solely for order fulfillment purposes.
              </p>
            </section>

            <section style={{ marginBottom: "var(--space-6)" }}>
              <h3 style={{ fontSize: "var(--text-md)", fontWeight: 600, color: "var(--color-text)", marginBottom: "var(--space-2)" }}>
                5.2 Prohibition of Direct Solicitation & Off-Platform Marketing
              </h3>
              <ul style={{ paddingLeft: "var(--space-5)", color: "var(--color-text-secondary)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                <li>
                  <strong style={{ color: "var(--color-text)" }}>No Direct Contact:</strong> Merchants shall not contact customers directly via WhatsApp, SMS, telemarketing calls, or email for any purpose outside active order dispatch.
                </li>
                <li>
                  <strong style={{ color: "var(--color-text)" }}>No External Marketing Inserts:</strong> Inserting promotional pamphlets, external discount coupons, or offline store flyers inside FlashFits zip covers is strictly prohibited.
                </li>
                <li>
                  <strong style={{ color: "var(--color-text)" }}>No Selling Customer Data:</strong> Sharing, exporting, or monetizing FlashFits customer details with third-party advertising brokers is a criminal violation.
                </li>
              </ul>
            </section>

            <section style={{ marginBottom: "var(--space-6)" }}>
              <h3 style={{ fontSize: "var(--text-md)", fontWeight: 600, color: "var(--color-text)", marginBottom: "var(--space-2)" }}>
                5.3 Penalties for Data Breach
              </h3>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-base)" }}>
                Any verified off-platform customer poaching or data solicitation will result in permanent store blacklisting,
                termination of this agreement, and legal damages under the Indian Information Technology Act.
              </p>
            </section>
          </div>
        )}

        {/* Footer Support Banner */}
        <div
          style={{
            marginTop: "var(--space-8)",
            paddingTop: "var(--space-6)",
            borderTop: "1px solid var(--color-border)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--space-4)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <HelpCircle size={22} color="var(--color-info)" />
            <div>
              <div style={{ fontWeight: 600, fontSize: "var(--text-sm)", color: "var(--color-text)" }}>
                Questions or Policy Discrepancies?
              </div>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                Contact our Partner Grievance Cell at <strong style={{ color: "var(--color-text)" }}>merchants@flashfits.com</strong>
              </div>
            </div>
          </div>

          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)" }}>
            FlashFits Quick Commerce Pvt Ltd • All Rights Reserved © 2026
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoliciesPage;
