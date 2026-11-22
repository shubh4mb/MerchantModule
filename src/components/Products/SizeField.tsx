import { ChevronDown } from "lucide-react";
import {
    MAX_SIZE_LENGTH,
    SIZE_MODE_LABELS,
    normalizeSize,
    sizeOptionsFor,
    type SizeMode,
} from "../../utils/size";

/**
 * The size picker used by Add Product and Edit Product.
 *
 * One selector per product chooses the sizing system; each row then shows the
 * matching dropdown. A size that the chosen dropdown cannot represent — a
 * legacy "30-23 CM" entered from the merchant app, say — always renders as a
 * text box, so opening a product in the web form can never silently rewrite
 * its sizes. That was the data-loss bug in
 * FF_api_web/docs/reports/numeric-size-variants-bug.md §3.
 */

export const SizeModeSelector = ({ mode, onChange }: { mode: SizeMode; onChange: (mode: SizeMode) => void }) => (
    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 600 }}>
        <span style={{ color: "var(--color-text-secondary)" }}>Size type</span>
        <div className="select-wrapper" style={{ margin: 0, minWidth: "170px" }}>
            <select value={mode} onChange={e => onChange(e.target.value as SizeMode)} style={{ fontSize: "12px" }}>
                {(Object.keys(SIZE_MODE_LABELS) as SizeMode[]).map(m => (
                    <option key={m} value={m}>{SIZE_MODE_LABELS[m]}</option>
                ))}
            </select>
            <ChevronDown className="select-icon" />
        </div>
    </label>
);

export const SizeField = ({
    mode,
    value,
    onChange,
}: {
    mode: SizeMode;
    value: string;
    onChange: (size: string) => void;
}) => {
    const options = sizeOptionsFor(mode);
    const current = value || "";

    // Free text when the merchant chose Custom, and whenever the existing value
    // is not one of the options — never drop a size we cannot display.
    if (!options || (current !== "" && !options.includes(normalizeSize(current)))) {
        return (
            <input
                type="text"
                value={current}
                onChange={e => onChange(e.target.value)}
                onBlur={e => onChange(normalizeSize(e.target.value))}
                maxLength={MAX_SIZE_LENGTH}
                placeholder="e.g. 30-23 cm, 28-29, UK 8"
                title="Any size: letters, digits, - . /"
                required
            />
        );
    }

    return (
        <div className="select-wrapper" style={{ margin: 0 }}>
            <select value={normalizeSize(current)} onChange={e => onChange(e.target.value)} required>
                {current === "" && <option value="">Select size</option>}
                {options.map(optionSize => (
                    <option key={optionSize} value={optionSize}>{optionSize}</option>
                ))}
            </select>
            <ChevronDown className="select-icon" />
        </div>
    );
};
