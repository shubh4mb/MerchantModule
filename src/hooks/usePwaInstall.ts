import { useCallback, useEffect, useState } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const DISMISS_STORAGE_KEY = 'ff_pwa_install_dismissed_at';
const DISMISS_SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let listenerAttached = false;
const subscribers = new Set<() => void>();

function notifySubscribers() {
  subscribers.forEach((cb) => cb());
}

function isStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function detectIosSafari(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  const isIosDevice =
    /iPad|iPhone|iPod/.test(ua) ||
    (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
  return isIosDevice;
}

function readIsDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_STORAGE_KEY);
    if (!raw) return false;
    const timestamp = Number(raw);
    if (!Number.isFinite(timestamp)) return false;
    return Date.now() - timestamp < DISMISS_SNOOZE_MS;
  } catch {
    return false;
  }
}

/**
 * Attaches global beforeinstallprompt and appinstalled listeners early so the
 * browser prompt event is never missed before React mounts.
 */
export function initPwaInstallListener(): void {
  if (listenerAttached || typeof window === 'undefined') return;
  listenerAttached = true;

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    notifySubscribers();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    try {
      localStorage.removeItem(DISMISS_STORAGE_KEY);
    } catch {
      // ignore storage errors
    }
    notifySubscribers();
  });
}

// Attach immediately on module import as well
initPwaInstallListener();

export function usePwaInstall() {
  const [, setTick] = useState(0);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => isStandaloneMode());
  const [isDismissed, setIsDismissed] = useState<boolean>(() => readIsDismissed());
  const isIos = detectIosSafari();

  useEffect(() => {
    initPwaInstallListener();

    const sync = () => {
      setIsInstalled(isStandaloneMode());
      setTick((n) => n + 1);
    };

    subscribers.add(sync);

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayChange = () => sync();
    mediaQuery.addEventListener('change', handleDisplayChange);

    return () => {
      subscribers.delete(sync);
      mediaQuery.removeEventListener('change', handleDisplayChange);
    };
  }, []);

  const canPromptNatively = Boolean(deferredPrompt);
  const canInstall = !isInstalled && (canPromptNatively || isIos);

  const promptInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | 'ios' | 'unavailable'> => {
    if (isInstalled) return 'unavailable';
    if (!deferredPrompt) {
      return isIos ? 'ios' : 'unavailable';
    }

    const promptEvent = deferredPrompt;
    deferredPrompt = null;
    notifySubscribers();

    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    return outcome;
  }, [isInstalled, isIos]);

  const dismissBanner = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_STORAGE_KEY, String(Date.now()));
    } catch {
      // ignore storage errors
    }
    setIsDismissed(true);
  }, []);

  return {
    isInstalled,
    isIos,
    canPromptNatively,
    canInstall,
    shouldShowBanner: canInstall && !isDismissed,
    promptInstall,
    dismissBanner,
  };
}
