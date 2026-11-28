import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LETTER_SIZES,
  DEFAULT_NUMERIC_SIZES,
  LETTER_SIZES,
  NUMERIC_SIZES,
  applySizeModeDefaults,
  deriveSizeMode,
  getDefaultSizesForMode,
  isValidSize,
  normalizeSize,
  sizeFitsMode,
  sizeOptionsFor,
} from './size';

describe('normalizeSize', () => {
  it('strips all whitespace and upper-cases, like the backend setter', () => {
    expect(normalizeSize('  m ')).toBe('M');
    expect(normalizeSize('30-23 cm')).toBe('30-23CM');
    expect(normalizeSize('UK 8')).toBe('UK8');
    expect(normalizeSize('')).toBe('');
  });

  it('maps the spellings that used to collide on productCode to one value', () => {
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

describe('the size vocabularies', () => {
  it('Standard defaults are S, M, L, XL and Numerical defaults are 26 to 36 in steps of 2', () => {
    expect([...DEFAULT_LETTER_SIZES]).toEqual(['S', 'M', 'L', 'XL']);
    expect([...DEFAULT_NUMERIC_SIZES]).toEqual(['26', '28', '30', '32', '34', '36']);
  });

  it('Numerical covers every size from 26 to 36', () => {
    expect(NUMERIC_SIZES[0]).toBe('26');
    expect(NUMERIC_SIZES[NUMERIC_SIZES.length - 1]).toBe('36');
    expect(NUMERIC_SIZES).toHaveLength(11);
  });

  it('every default is itself an allowed, already-normalised size for its mode', () => {
    for (const s of DEFAULT_LETTER_SIZES) expect((LETTER_SIZES as readonly string[]).includes(s), s).toBe(true);
    for (const s of DEFAULT_NUMERIC_SIZES) expect(NUMERIC_SIZES.includes(s), s).toBe(true);
    for (const s of [...LETTER_SIZES, ...NUMERIC_SIZES]) {
      expect(isValidSize(s), s).toBe(true);
      expect(normalizeSize(s)).toBe(s);
    }
  });

  it('Custom has no option list and no defaults', () => {
    expect(sizeOptionsFor('custom')).toBeNull();
    expect(getDefaultSizesForMode('custom')).toEqual([]);
  });
});

describe('deriveSizeMode', () => {
  it('opens a new product in Standard', () => {
    expect(deriveSizeMode([])).toBe('letter');
  });

  it('opens an all-letter product in Standard, case-insensitively', () => {
    expect(deriveSizeMode(['S', 'M', 'xl'])).toBe('letter');
  });

  it('opens an all-numeric product in Numerical', () => {
    expect(deriveSizeMode(['26', '30', '36'])).toBe('numeric');
  });

  it('opens anything the lists cannot show in Custom — the data-loss guard', () => {
    // a product created in the merchant app: it must never open in a mode that hides its sizes
    expect(deriveSizeMode(['30-23 cm'])).toBe('custom');
    expect(deriveSizeMode(['UK 8', '7.5 inch'])).toBe('custom');
    expect(deriveSizeMode(['42'])).toBe('custom'); // outside 26-36
    expect(deriveSizeMode(['M', '32'])).toBe('custom'); // mixed systems
  });
});

describe('sizeFitsMode', () => {
  it('keeps a value the mode can show, normalising first', () => {
    expect(sizeFitsMode('M', 'letter')).toBe(true);
    expect(sizeFitsMode('m', 'letter')).toBe(true);
    expect(sizeFitsMode('32', 'numeric')).toBe(true);
  });

  it('rejects a value the mode cannot show', () => {
    expect(sizeFitsMode('M', 'numeric')).toBe(false);
    expect(sizeFitsMode('32', 'letter')).toBe(false);
    expect(sizeFitsMode('30-23 cm', 'numeric')).toBe(false);
  });

  it('accepts everything in Custom, and an empty row in every mode', () => {
    expect(sizeFitsMode('30-23 cm', 'custom')).toBe(true);
    expect(sizeFitsMode('', 'numeric')).toBe(true);
    expect(sizeFitsMode('  ', 'letter')).toBe(true);
  });
});

describe('applySizeModeDefaults', () => {
  type Row = { size: string; stock: number | string; merchantSizeCode?: string; _id?: string };

  it('gives a blank form the six numeric defaults, with empty stock', () => {
    const rows = applySizeModeDefaults<Row>([], 'numeric');
    expect(rows.map(r => r.size)).toEqual(['26', '28', '30', '32', '34', '36']);
    expect(rows.every(r => r.stock === '')).toBe(true);
  });

  it('gives a blank form the four Standard defaults', () => {
    expect(applySizeModeDefaults<Row>([], 'letter').map(r => r.size)).toEqual(['S', 'M', 'L', 'XL']);
  });

  it('Custom leaves the rows alone, or supplies one blank row', () => {
    const prev: Row[] = [{ size: '30-23CM', stock: 4 }];
    expect(applySizeModeDefaults(prev, 'custom')).toBe(prev);
    expect(applySizeModeDefaults<Row>([], 'custom')).toEqual([{ size: '', stock: '', merchantSizeCode: '' }]);
  });

  it('keeps each row\'s stock, SKU and id while replacing the size names', () => {
    const prev: Row[] = [
      { size: 'S', stock: 5, merchantSizeCode: 'SKU-S', _id: 'a' },
      { size: 'M', stock: 3, merchantSizeCode: 'SKU-M', _id: 'b' },
    ];
    const rows = applySizeModeDefaults(prev, 'numeric');
    expect(rows[0]).toMatchObject({ size: '26', stock: 5, merchantSizeCode: 'SKU-S', _id: 'a' });
    expect(rows[1]).toMatchObject({ size: '28', stock: 3, merchantSizeCode: 'SKU-M', _id: 'b' });
    expect(rows[2]).toMatchObject({ size: '30', stock: '' }); // no previous row: blank stock
  });

  // PINS A RISK, not a feature. On the Edit page this runs on a product that already has
  // sizes: S/M/L stocked 5/3/2 becomes 26/28/30 stocked 5/3/2 — the stock numbers are kept
  // but attached to different sizes. See docs/ui-fixes-2026-11.md (UI-13). If Edit is made
  // non-destructive this test should be changed on purpose, not "fixed" to pass.
  it('RISK: switching mode on existing rows re-labels their stock', () => {
    const prev: Row[] = [
      { size: 'S', stock: 5 }, { size: 'M', stock: 3 }, { size: 'L', stock: 2 },
    ];
    const rows = applySizeModeDefaults(prev, 'numeric');
    expect(rows.slice(0, 3).map(r => [r.size, r.stock])).toEqual([['26', 5], ['28', 3], ['30', 2]]);
  });

  it('retains rows beyond the defaults, blanking only the sizes the new mode cannot show', () => {
    const prev: Row[] = [
      { size: 'S', stock: 1 }, { size: 'M', stock: 1 }, { size: 'L', stock: 1 }, { size: 'XL', stock: 1 },
      { size: 'XXL', stock: 9 },        // fits Standard
      { size: '30-23CM', stock: 7 },    // does not
    ];
    const standard = applySizeModeDefaults(prev, 'letter');
    expect(standard).toHaveLength(6);
    expect(standard[4]).toMatchObject({ size: 'XXL', stock: 9 });
    expect(standard[5]).toMatchObject({ size: '', stock: 7 }); // stock kept, unusable name cleared
  });
});
