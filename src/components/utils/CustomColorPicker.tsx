import { useState, useRef, useEffect } from 'react';

interface CustomColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
}

const PRESET_COLORS = [
  '#000000', '#FFFFFF', '#808080', '#D3D3D3',
  '#FF0000', '#FF4500', '#FF8C00', '#FFD700',
  '#008000', '#32CD32', '#00FFFF', '#0000FF',
  '#4B0082', '#800080', '#FFC0CB', '#A52A2A'
];

export default function CustomColorPicker({ value, onChange }: CustomColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Convert hex to HSL for sliders
  const hexToHsl = (hex: string) => {
    // Strip # if present
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('');
    }
    if (hex.length !== 6) return { h: 0, s: 0, l: 0 };

    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  };

  const hslToHex = (h: number, s: number, l: number) => {
    s /= 100;
    l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;

    if (0 <= h && h < 60) { r = c; g = x; b = 0; }
    else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
    else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
    else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
    else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
    else if (300 <= h && h < 360) { r = c; g = 0; b = x; }

    const toHex = (x: number) => {
      const hex = Math.round((x + m) * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  };

  const hsl = hexToHsl(value);

  const handleHslChange = (field: 'h' | 's' | 'l', val: number) => {
    const newHsl = { ...hsl, [field]: val };
    const hex = hslToHex(newHsl.h, newHsl.s, newHsl.l);
    onChange(hex);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Trigger preview circle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '8px',
          backgroundColor: value || '#000000',
          border: '2px solid var(--color-border)',
          cursor: 'pointer',
          boxShadow: 'var(--shadow-sm)',
          display: 'block',
          padding: 0,
        }}
        title="Choose color"
      />

      {isOpen && (
        <div style={{
          position: 'absolute',
          bottom: '52px',
          right: 0,
          zIndex: 1000,
          background: 'var(--color-surface, #ffffff)',
          border: '1px solid var(--color-border, #e2e8f0)',
          borderRadius: '12px',
          padding: '16px',
          width: '240px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        }}>
          {/* Preset Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '6px', marginBottom: '14px' }}>
            {PRESET_COLORS.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => {
                  onChange(color);
                }}
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '4px',
                  backgroundColor: color,
                  border: value.toUpperCase() === color.toUpperCase() ? '2px solid #3b82f6' : '1px solid #cbd5e1',
                  cursor: 'pointer',
                  padding: 0,
                }}
              />
            ))}
          </div>

          {/* HSL Sliders */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Hue */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>
                <span>Hue</span>
                <span>{hsl.h}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                value={hsl.h}
                onChange={(e) => handleHslChange('h', parseInt(e.target.value))}
                style={{
                  width: '100%',
                  height: '6px',
                  borderRadius: '3px',
                  background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
                  WebkitAppearance: 'none',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              />
            </div>

            {/* Saturation */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>
                <span>Saturation</span>
                <span>{hsl.s}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={hsl.s}
                onChange={(e) => handleHslChange('s', parseInt(e.target.value))}
                style={{
                  width: '100%',
                  height: '6px',
                  borderRadius: '3px',
                  background: `linear-gradient(to right, #808080, ${hslToHex(hsl.h, 100, 50)})`,
                  WebkitAppearance: 'none',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              />
            </div>

            {/* Lightness */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>
                <span>Lightness</span>
                <span>{hsl.l}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={hsl.l}
                onChange={(e) => handleHslChange('l', parseInt(e.target.value))}
                style={{
                  width: '100%',
                  height: '6px',
                  borderRadius: '3px',
                  background: `linear-gradient(to right, #000000, ${hslToHex(hsl.h, hsl.s, 50)}, #ffffff)`,
                  WebkitAppearance: 'none',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
