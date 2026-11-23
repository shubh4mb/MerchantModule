/**
 * Size vocabulary and normalisation for the merchant dashboard.
 *
 * Sizes are free text across FlashFits — the merchant app, the Add Variant
 * flow and the database all accept any string. These helpers keep the web forms
 * consistent with that, while still offering the common sizes as a dropdown so
 * a clothing merchant picks "M" in one tap.
 *
 * Must stay in step with Backend/src/helperFns/sizeNormalizer.js, which is what
 * actually normalises on save.
 */

export type SizeMode = 'letter' | 'numeric' | 'custom';

export const DEFAULT_LETTER_SIZES = ['S', 'M', 'L', 'XL'] as const;
export const DEFAULT_NUMERIC_SIZES = ['26', '28', '30', '32', '34', '36'] as const;

export const LETTER_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'FS', 'FREE'] as const;

/** 26–36 waist/bust run. Anything outside it goes in Custom. */
export const NUMERIC_SIZES = Array.from({ length: 11 }, (_, i) => String(26 + i));

export const SIZE_MODE_LABELS: Record<SizeMode, string> = {
  letter: 'Standard (S, M, L, XL)',
  numeric: 'Numerical (26 - 36)',
  custom: 'Custom / Other',
};

export const MAX_SIZE_LENGTH = 20;

/** Same rule as the backend: strip all whitespace, upper-case. */
export const normalizeSize = (value: string): string =>
  (value || '').replace(/\s+/g, '').toUpperCase();

/** Shape check, not a vocabulary check — mirrors the backend's isValidSize. */
export const isValidSize = (value: string): boolean => {
  const size = normalizeSize(value);
  return size.length > 0 && size.length <= MAX_SIZE_LENGTH && /^[A-Z0-9][A-Z0-9./-]*$/.test(size);
};

export const sizeOptionsFor = (mode: SizeMode): readonly string[] | null =>
  mode === 'letter' ? LETTER_SIZES : mode === 'numeric' ? NUMERIC_SIZES : null;

export const getDefaultSizesForMode = (mode: SizeMode): readonly string[] => {
  if (mode === 'numeric') return DEFAULT_NUMERIC_SIZES;
  if (mode === 'letter') return DEFAULT_LETTER_SIZES;
  return [];
};

/**
 * Can this value be shown in this mode's dropdown/suggestions? Custom takes anything.
 */
export const sizeFitsMode = (value: string, mode: SizeMode): boolean => {
  const options = sizeOptionsFor(mode);
  if (!options) return true;
  const size = normalizeSize(value);
  return size === '' || options.includes(size);
};

/**
 * Which mode to open a form in, given the sizes a product already has.
 * Numeric-looking existing sizes open in Numerical; anything the dropdowns
 * cannot represent opens in Custom, so an existing size is never hidden behind
 * a dropdown that has no option for it.
 */
export const deriveSizeMode = (sizes: string[]): SizeMode => {
  const values = sizes.map(normalizeSize).filter(Boolean);
  if (!values.length) return 'letter';
  if (values.every(v => (LETTER_SIZES as readonly string[]).includes(v))) return 'letter';
  if (values.every(v => NUMERIC_SIZES.includes(v))) return 'numeric';
  return 'custom';
};

/**
 * Applies default sizes when switching size mode:
 * - 'letter' -> S, M, L, XL
 * - 'numeric' -> 26, 28, 30, 32, 34, 36
 * Preserves existing stock levels and custom SKU codes where possible.
 */
export const applySizeModeDefaults = <T extends { size: string; stock: any; merchantSizeCode?: string }>(
  prevSizes: T[],
  newMode: SizeMode
): T[] => {
  const targetDefaults = getDefaultSizesForMode(newMode);
  if (!targetDefaults.length) {
    return prevSizes.length > 0
      ? prevSizes
      : ([{ size: '', stock: '', merchantSizeCode: '' }] as unknown as T[]);
  }

  if (!prevSizes.length) {
    return targetDefaults.map(size => ({
      size,
      stock: '',
      merchantSizeCode: '',
    })) as unknown as T[];
  }

  // Map 1:1 to default sizes for the new mode, preserving existing stock & SKU
  const result: T[] = targetDefaults.map((defaultSize, idx) => {
    const existing = prevSizes[idx];
    return {
      ...(existing || {}),
      size: defaultSize,
      stock: existing ? existing.stock : '',
      merchantSizeCode: existing?.merchantSizeCode || '',
    } as T;
  });

  // If there were extra rows beyond default 4 rows, retain them
  if (prevSizes.length > targetDefaults.length) {
    for (let i = targetDefaults.length; i < prevSizes.length; i++) {
      const extra = prevSizes[i];
      result.push({
        ...extra,
        size: sizeFitsMode(extra.size, newMode) ? extra.size : '',
      });
    }
  }

  return result;
};
