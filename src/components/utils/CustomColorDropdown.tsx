import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";

export interface ColorOption {
  name: string;
  hex: string;
}

interface CustomColorDropdownProps {
  options: ColorOption[];
  value: { name: string; hex: string };
  onChange: (color: { name: string; hex: string }) => void;
}

export default function CustomColorDropdown({ options, value, onChange }: CustomColorDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} style={{ position: "relative", flex: 1, minWidth: "200px" }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          borderRadius: "var(--radius-md, 4px)",
          border: "1px solid var(--color-border, #cbd5e1)",
          background: "var(--color-surface, #fff)",
          color: "var(--color-text, #000)",
          cursor: "pointer"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {value.hex && (
            <div
              style={{
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                backgroundColor: value.hex,
                border: "1px solid #cbd5e1"
              }}
            />
          )}
          <span>{value.name || "-- Choose a Color --"}</span>
        </div>
        <ChevronDown size={16} style={{ color: "#64748b" }} />
      </div>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: "4px",
            background: "var(--color-surface, #fff)",
            border: "1px solid var(--color-border, #cbd5e1)",
            borderRadius: "var(--radius-md, 4px)",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            zIndex: 50,
            display: "flex",
            flexDirection: "column"
          }}
        >
          <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--color-border, #cbd5e1)", display: "flex", alignItems: "center", gap: "8px" }}>
             <Search size={16} style={{ color: "#94a3b8" }} />
             <input 
               type="text" 
               placeholder="Search colors..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               onClick={(e) => e.stopPropagation()}
               style={{ flex: 1, border: "none", outline: "none", background: "transparent", color: "var(--color-text, #000)", fontSize: "14px" }}
             />
          </div>
          <div style={{ maxHeight: "200px", overflowY: "auto" }}>
            {filteredOptions.length > 0 ? filteredOptions.map((c) => (
              <div
                key={c.hex}
                onClick={() => {
                  onChange(c);
                  setIsOpen(false);
                  setSearchTerm("");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 14px",
                  cursor: "pointer",
                  transition: "background-color 0.2s"
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-bg, #f1f5f9)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    backgroundColor: c.hex,
                    border: "1px solid #cbd5e1",
                    flexShrink: 0
                  }}
                />
                <span style={{ color: "var(--color-text, #000)", fontWeight: 500 }}>{c.name}</span>
              </div>
            )) : (
              <div style={{ padding: "10px 14px", color: "#64748b", fontSize: "14px", textAlign: "center" }}>No colors found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
