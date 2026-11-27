import { registerSW } from 'virtual:pwa-register';

const UPDATE_INTERVAL_MS = 15 * 60 * 1000;
const FOCUS_THROTTLE_MS = 60 * 1000;

let initialized = false;

/**
 * Registers the VitePWA service worker in autoUpdate mode, polls Vercel for
 * new deployments periodically and on app focus, and reloads cleanly once a
 * replacement service worker takes control.
 */
export function registerPwaAutoUpdate(): void {
  if (initialized || typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }
  initialized = true;

  let hadController = Boolean(navigator.serviceWorker.controller);
  let reloading = false;
  let lastCheckAt = 0;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) {
      hadController = true;
      return;
    }
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });

  registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;

      const checkForUpdate = () => {
        if (!navigator.onLine || registration.installing) return;
        const now = Date.now();
        if (now - lastCheckAt < FOCUS_THROTTLE_MS) return;
        lastCheckAt = now;
        registration.update().catch(() => {
          // Network may be temporarily unavailable; retry on next trigger
        });
      };

      window.setInterval(() => {
        if (!navigator.onLine || registration.installing) return;
        lastCheckAt = Date.now();
        registration.update().catch(() => {});
      }, UPDATE_INTERVAL_MS);

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          checkForUpdate();
        }
      });

      window.addEventListener('focus', checkForUpdate);
    },
    onRegisterError(error) {
      console.error('PWA service worker registration failed:', error);
    },
  });
}
