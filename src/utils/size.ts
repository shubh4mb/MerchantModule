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

export const LETTER_SIZES = ['FS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'FREE'] as const;

/** 28–36, the usual Indian waist/bust run. Anything outside it goes in Custom. */
export const NUMERIC_SIZES = Array.from({ length: 9 }, (_, i) => String(28 + i));

export const SIZE_MODE_LABELS: Record<SizeMode, string> = {
  letter: 'Lettered (S, M, XL)',
  numeric: 'Numerical (28–36)',
  custom: 'Custom / other',
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
