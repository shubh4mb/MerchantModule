import {
    MAX_SIZE_LENGTH,
    normalizeSize,
    type SizeMode,
} from "../../utils/size";

/**
 * The size picker used by Add Product and Edit Product.
 *
 * Provides a segmented mode selector:
 * - Standard: S, M, L, XL
 * - Numerical: 26 - 36 (ideal for jeans, trousers, shirts)
 * - Custom: free text
 *
 * Size fields are standard HTML inputs fully editable by keypad or keyboard.
 */

export const SizeModeSelector = ({
    mode,
    onChange,
}: {
    mode: SizeMode;
    onChange: (mode: SizeMode) => void;
}) => (
    <div className="size-mode-selector-wrapper">
        <div className="size-mode-tabs" role="radiogroup" aria-label="Size System">
            <button
                type="button"
                onClick={() => onChange("letter")}
                className={`size-mode-tab ${mode === "letter" ? "active" : ""}`}
                role="radio"
                aria-checked={mode === "letter"}
                title="Default sizes: S, M, L, XL"
            >
                <span className="size-mode-tab-title">Standard</span>
                <span className="size-mode-tab-sub">S, M, L, XL</span>
            </button>
            <button
                type="button"
                onClick={() => onChange("numeric")}
                className={`size-mode-tab ${mode === "numeric" ? "active" : ""}`}
                role="radio"
                aria-checked={mode === "numeric"}
                title="Default for jeans, trousers & shirts: 26 - 36"
            >
                <span className="size-mode-tab-title">Numerical</span>
                <span className="size-mode-tab-sub">26 - 36</span>
            </button>
            <button
                type="button"
                onClick={() => onChange("custom")}
                className={`size-mode-tab ${mode === "custom" ? "active" : ""}`}
                role="radio"
                aria-checked={mode === "custom"}
                title="Custom / Free text sizes"
            >
                <span className="size-mode-tab-title">Custom</span>
                <span className="size-mode-tab-sub">Any size</span>
            </button>
        </div>
        {mode === "numeric" && (
            <div className="size-mode-hint">
                <span>👖</span>
                <span>Default sizes for jeans, trousers & shirts (26 - 36)</span>
            </div>
        )}
        {mode === "letter" && (
            <div className="size-mode-hint">
                <span>👕</span>
                <span>Default sizes: S, M, L, XL</span>
            </div>
        )}
    </div>
);

export const SizeField = ({
    mode,
    value,
    onChange,
    id,
    placeholder,
}: {
    mode: SizeMode;
    value: string;
    onChange: (size: string) => void;
    id?: string;
    placeholder?: string;
}) => {
    const current = value ?? "";

    return (
        <div style={{ position: "relative", width: "100%" }}>
            <input
                id={id}
                type="text"
                value={current}
                onChange={e => onChange(e.target.value.toUpperCase())}
                onBlur={e => onChange(normalizeSize(e.target.value))}
                maxLength={MAX_SIZE_LENGTH}
                placeholder={placeholder || "Size"}
                title="Size: editable by keypad or keyboard"
                autoCapitalize="characters"
                autoComplete="off"
                className="size-field-input"
                inputMode={mode === 'numeric' ? "numeric" : "text"}
                required
            />
        </div>
    );
};
