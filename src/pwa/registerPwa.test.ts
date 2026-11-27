import { describe, it, expect, vi, beforeEach } from 'vitest';

const registerSWMock = vi.fn();

vi.mock('virtual:pwa-register', () => ({
  registerSW: (...args: unknown[]) => registerSWMock(...args),
}));

describe('registerPwaAutoUpdate', () => {
  beforeEach(() => {
    vi.resetModules();
    registerSWMock.mockReset();
  });

  it('does not reload on first service worker claim, but reloads once on subsequent controllerchange', async () => {
    const swListeners: Record<string, Array<() => void>> = {};
    const docListeners: Record<string, Array<() => void>> = {};
    const winListeners: Record<string, Array<() => void>> = {};
    const reloadMock = vi.fn();

    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        location: { reload: reloadMock },
        setInterval: vi.fn(),
        addEventListener: (evt: string, cb: () => void) => {
          (winListeners[evt] ??= []).push(cb);
        },
      },
    });

    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: {
        visibilityState: 'visible',
        addEventListener: (evt: string, cb: () => void) => {
          (docListeners[evt] ??= []).push(cb);
        },
      },
    });

    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: {
        onLine: true,
        serviceWorker: {
          controller: null,
          addEventListener: (evt: string, cb: () => void) => {
            (swListeners[evt] ??= []).push(cb);
          },
        },
      },
    });

    const { registerPwaAutoUpdate } = await import('./registerPwa');
    registerPwaAutoUpdate();

    expect(registerSWMock).toHaveBeenCalledTimes(1);
    const options = registerSWMock.mock.calls[0][0] as {
      immediate: boolean;
      onRegisteredSW: (url: string, reg: { update: () => Promise<void>; installing: null }) => void;
    };
    expect(options.immediate).toBe(true);

    // First controllerchange (initial SW install) should NOT reload
    swListeners.controllerchange.forEach((cb) => cb());
    expect(reloadMock).not.toHaveBeenCalled();

    // Subsequent controllerchange (real update) should reload exactly once
    swListeners.controllerchange.forEach((cb) => cb());
    swListeners.controllerchange.forEach((cb) => cb());
    expect(reloadMock).toHaveBeenCalledTimes(1);

    // Visibility check triggers registration.update() and throttles rapid repeats
    const updateMock = vi.fn().mockResolvedValue(undefined);
    options.onRegisteredSW('/sw.js', { update: updateMock, installing: null });
    docListeners.visibilitychange.forEach((cb) => cb());
    docListeners.visibilitychange.forEach((cb) => cb());
    expect(updateMock).toHaveBeenCalledTimes(1);
  });
});
