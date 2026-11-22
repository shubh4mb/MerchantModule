import { describe, expect, it } from 'vitest';
import {
  LETTER_SIZES,
  NUMERIC_SIZES,
  deriveSizeMode,
  isValidSize,
  normalizeSize,
  sizeOptionsFor,
} from './size';

describe('normalizeSize', () => {
  it('strips all whitespace and upper-cases, like the backend setter', () => {
    expect(normalizeSize('  m ')).toBe('M');
    expect(normalizeSize('30-23 cm')).toBe('30-23CM');
    expect(normalizeSize('UK 8')).toBe('UK8');
    expect(normalizeSize('')).toBe('');
  });

  it('maps the spellings that used to collide to one value', () => {
    expect(normalizeSize('30-23 cm')).toBe(normalizeSize('30-23cm'));
  });
});

describe('isValidSize', () => {
  it('accepts every size shape merchants sell', () => {
    for (const s of ['M', 'XXL', '32', '28-29', '30-23 cm', 'UK 8', '7.5 inch', '4Y', '90/36']) {
      expect(isValidSize(s), s).toBe(true);
    }
  });

  it('rejects empty, oversized and corrupting input', () => {
    for (const s of ['', '   ', '-M', 'M;DROP', '<b>M</b>', 'a'.repeat(21)]) {
      expect(isValidSize(s), s).toBe(false);
    }
  });
});

describe('deriveSizeMode', () => {
  it('opens a new product in Lettered', () => {
    expect(deriveSizeMode([])).toBe('letter');
  });

  it('opens an all-letter product in Lettered', () => {
    expect(deriveSizeMode(['S', 'M', 'xl'])).toBe('letter');
  });

  it('opens an all-numeric product in Numerical', () => {
    expect(deriveSizeMode(['28', '30', '36'])).toBe('numeric');
  });

  it('opens anything a dropdown cannot show in Custom — the data-loss guard', () => {
    // a product created in the merchant app; the old <select> rendered these
    // blank and `required` forced the merchant to overwrite them
    expect(deriveSizeMode(['30-23 cm'])).toBe('custom');
    expect(deriveSizeMode(['UK 8', '7.5 inch'])).toBe('custom');
    expect(deriveSizeMode(['42'])).toBe('custom'); // outside the 28-36 run
    expect(deriveSizeMode(['M', '32'])).toBe('custom'); // mixed systems
  });
});

describe('sizeOptionsFor', () => {
  it('returns no options for Custom, so the field falls back to free text', () => {
    expect(sizeOptionsFor('custom')).toBeNull();
    expect(sizeOptionsFor('letter')).toEqual([...LETTER_SIZES]);
    expect(sizeOptionsFor('numeric')).toEqual(NUMERIC_SIZES);
  });

  it('offers 28 to 36 in Numerical', () => {
    expect(NUMERIC_SIZES[0]).toBe('28');
    expect(NUMERIC_SIZES[NUMERIC_SIZES.length - 1]).toBe('36');
  });

  it('every offered option is itself a valid, already-normalised size', () => {
    for (const s of [...LETTER_SIZES, ...NUMERIC_SIZES]) {
      expect(isValidSize(s), s).toBe(true);
      expect(normalizeSize(s)).toBe(s);
    }
  });
});
