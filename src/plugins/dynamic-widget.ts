// Lightweight wrapper to use Dynamic's hosted widget in a Vue app
// Loads the widget script and exposes helpers to open the modal and get the wallet

declare global {
  interface Window {
    dynamic?: any;
    Dynamic?: any;
  }
}

const DYNAMIC_SCRIPT_BASE = "https://widget.dynamic.xyz/v2";

let loadPromise: Promise<void> | null = null;

function getAppId(): string {
  const appId = "c4c4e25784d37e4a583bea83c3c2cb5b156a8783967094eeda8018342196ae85"; //(import.meta as any).env?.VITE_DYNAMIC_APP_ID;
  if (!appId) throw new Error("VITE_DYNAMIC_APP_ID is not set");
  return String(appId);
}

export function ensureDynamicWidget(appId?: string): Promise<void> {
  if (window.dynamic || window.Dynamic) return Promise.resolve();
  if (loadPromise) return loadPromise;
  const finalAppId = appId ?? getAppId();
  loadPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `${DYNAMIC_SCRIPT_BASE}?appId=${encodeURIComponent(finalAppId)}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Dynamic widget script"));
    document.head.appendChild(script);
  });
  return loadPromise;
}

export async function openDynamicAndGetWallet(): Promise<any> {
  await ensureDynamicWidget();
  const dynamic = window.dynamic ?? window.Dynamic;
  if (!dynamic) throw new Error("Dynamic widget is not available");

  // Try opening the modal
  try {
    if (typeof dynamic.open === "function") dynamic.open();
    else if (dynamic?.modal && typeof dynamic.modal.open === "function") dynamic.modal.open();
  } catch { /* ignore open errors; some SDKs auto-open */ }

  // Wait for a primary wallet to appear on the global state
  const wallet = await waitForPrimaryWallet(dynamic, 60_000);
  if (!wallet) throw new Error("No wallet connected");
  return wallet;
}

export function getPrimaryWallet(): any | null {
  const dynamic = window.dynamic ?? window.Dynamic;
  const user = dynamic?.user ?? dynamic?.getUser?.();
  const wallet = user?.primaryWallet ?? user?.wallet ?? null;
  return wallet ?? null;
}

async function waitForPrimaryWallet(dynamic: any, timeoutMs: number): Promise<any | null> {
  const start = Date.now();
  // Prefer event-based if available
  if (typeof dynamic?.on === "function") {
    try {
      const eventNames = ["connect", "connected", "userConnected", "user:connected"];
      const wallet = await new Promise<any | null>((resolve) => {
        const offFns: Array<() => void> = [];
        for (const evt of eventNames) {
          try {
            const off = dynamic.on(evt, (payload: any) => {
              try { offFns.forEach((fn) => fn()); } catch {}
              const w = extractWalletFromPayload(payload) ?? getPrimaryWallet();
              resolve(w ?? null);
            });
            if (typeof off === "function") offFns.push(off);
          } catch { /* ignore */ }
        }
        // Fallback timeout to polling
        setTimeout(() => resolve(null), 2_000);
      });
      if (wallet) return wallet;
    } catch { /* ignore */ }
  }

  // Polling fallback
  while (Date.now() - start < timeoutMs) {
    const w = getPrimaryWallet();
    if (w) return w;
    await new Promise((r) => setTimeout(r, 300));
  }
  return null;
}

function extractWalletFromPayload(payload: any): any | null {
  if (!payload) return null;
  // common shapes across versions
  if (payload.primaryWallet) return payload.primaryWallet;
  if (payload.wallet) return payload.wallet;
  if (payload.user?.primaryWallet) return payload.user.primaryWallet;
  return null;
}
