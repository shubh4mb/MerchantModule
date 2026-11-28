// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { SizeField, SizeModeSelector } from './SizeField';
import { MAX_SIZE_LENGTH, type SizeMode } from '../../utils/size';

afterEach(cleanup);

const renderField = (props: Partial<React.ComponentProps<typeof SizeField>> = {}) => {
  const onChange = vi.fn();
  render(<SizeField mode="letter" value="" onChange={onChange} {...props} />);
  return { onChange, input: screen.getByRole('textbox') as HTMLInputElement };
};

describe('SizeField', () => {
  it('is a required text box with a placeholder', () => {
    const { input } = renderField();
    expect(input.type).toBe('text');
    expect(input.required).toBe(true);
    expect(input.placeholder).toBe('Size');
  });

  it('shows a custom placeholder when given one', () => {
    const { input } = renderField({ placeholder: 'e.g. 30-23 cm' });
    expect(input.placeholder).toBe('e.g. 30-23 cm');
  });

  it('upper-cases what the merchant types', () => {
    const { input, onChange } = renderField();
    fireEvent.change(input, { target: { value: 'xl' } });
    expect(onChange).toHaveBeenLastCalledWith('XL');
  });

  it('keeps spaces while typing, so "30-23 cm" can be typed naturally', () => {
    const { input, onChange } = renderField({ mode: 'custom' });
    fireEvent.change(input, { target: { value: '30-23 cm' } });
    expect(onChange).toHaveBeenLastCalledWith('30-23 CM');
  });

  it('normalises on blur — whitespace stripped, upper-cased — to match the backend', () => {
    // 30-23 cm and 30-23cm used to collide on productCode; both must land on one value
    const { input, onChange } = renderField({ mode: 'custom', value: '30-23 cm' });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenLastCalledWith('30-23CM');
  });

  it('limits the length to MAX_SIZE_LENGTH', () => {
    const { input } = renderField();
    expect(input.maxLength).toBe(MAX_SIZE_LENGTH);
  });

  it('uses the numeric keypad only in Numerical mode', () => {
    const modes: [SizeMode, string][] = [['numeric', 'numeric'], ['letter', 'text'], ['custom', 'text']];
    for (const [mode, expected] of modes) {
      const { unmount } = render(<SizeField mode={mode} value="" onChange={() => {}} />);
      expect((screen.getByRole('textbox') as HTMLInputElement).inputMode).toBe(expected);
      unmount();
    }
  });

  it('never rewrites or hides an existing value on render, in any mode', () => {
    // The data-loss bug: a legacy size from the merchant app must show exactly as stored,
    // whichever size mode the form opens in. Rendering must not call onChange.
    // Mixed case on purpose: an all-lowercase value would hide a bug that lowercases it,
    // and an all-uppercase one would hide a bug that upper-cases it.
    const legacy = 'Uk 8 / 30-23 cm';
    for (const mode of ['letter', 'numeric', 'custom'] as SizeMode[]) {
      const onChange = vi.fn();
      const { unmount } = render(<SizeField mode={mode} value={legacy} onChange={onChange} />);
      expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe(legacy);
      expect(onChange).not.toHaveBeenCalled();
      unmount();
    }
  });

  it('treats an undefined value as empty rather than crashing', () => {
    const { input } = renderField({ value: undefined as unknown as string });
    expect(input.value).toBe('');
  });
});

describe('SizeModeSelector', () => {
  const renderSelector = (mode: SizeMode) => {
    const onChange = vi.fn();
    render(<SizeModeSelector mode={mode} onChange={onChange} />);
    return { onChange, radios: screen.getAllByRole('radio') };
  };

  it('offers Standard, Numerical and Custom as one radio group', () => {
    renderSelector('letter');
    expect(screen.getByRole('radiogroup', { name: 'Size System' })).toBeTruthy();
    expect(screen.getAllByRole('radio').map(r => r.textContent)).toEqual([
      expect.stringContaining('Standard'),
      expect.stringContaining('Numerical'),
      expect.stringContaining('Custom'),
    ]);
  });

  it('marks exactly the current mode as checked', () => {
    for (const [mode, idx] of [['letter', 0], ['numeric', 1], ['custom', 2]] as [SizeMode, number][]) {
      const { unmount } = render(<SizeModeSelector mode={mode} onChange={() => {}} />);
      const checked = screen.getAllByRole('radio').map(r => r.getAttribute('aria-checked'));
      expect(checked.filter(c => c === 'true')).toHaveLength(1);
      expect(checked[idx]).toBe('true');
      unmount();
    }
  });

  it('reports the mode that was tapped', () => {
    const { onChange, radios } = renderSelector('letter');
    fireEvent.click(radios[1]);
    expect(onChange).toHaveBeenLastCalledWith('numeric');
    fireEvent.click(radios[2]);
    expect(onChange).toHaveBeenLastCalledWith('custom');
    fireEvent.click(radios[0]);
    expect(onChange).toHaveBeenLastCalledWith('letter');
  });

  it('never submits the enclosing form — the tabs are type="button"', () => {
    const submit = vi.fn((e: React.FormEvent) => e.preventDefault());
    render(<form onSubmit={submit}><SizeModeSelector mode="letter" onChange={() => {}} /></form>);
    screen.getAllByRole('radio').forEach(r => fireEvent.click(r));
    expect(submit).not.toHaveBeenCalled();
  });

  it('shows a hint for Standard and Numerical, and none for Custom', () => {
    const hints: [SizeMode, RegExp | null][] = [['letter', /S, M, L, XL/], ['numeric', /26 - 36/], ['custom', null]];
    for (const [mode, re] of hints) {
      const { unmount, container } = render(<SizeModeSelector mode={mode} onChange={() => {}} />);
      const hint = container.querySelector('.size-mode-hint');
      if (re) expect(hint?.textContent).toMatch(re);
      else expect(hint).toBeNull();
      unmount();
    }
  });
});
