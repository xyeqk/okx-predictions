import { useCallback, useEffect, useRef, useState } from "react";
import { appKit } from "../lib/wallet-config";
import { BrowserProvider, formatEther } from "ethers";

interface WalletState {
  address: string | null;
  balance: string;
  isConnected: boolean;
}

let globalState: WalletState = { address: null, balance: "0 OKB", isConnected: false };
const listeners = new Set<() => void>();

function setGlobalState(s: Partial<WalletState>) {
  globalState = { ...globalState, ...s };
  listeners.forEach((l) => l());
}

async function fetchBalance(addr: string): Promise<string> {
  try {
    const w = window as any;
    const raw = w.okxwallet || w.ethereum;
    if (raw) {
      const provider = new BrowserProvider(raw);
      const b = await provider.getBalance(addr);
      return parseFloat(formatEther(b)).toFixed(4);
    }
  } catch {}
  return "0";
}

function syncState() {
  try {
    // Try multiple ways to get the address
    const state = appKit.getState() as any;
    let addr = state?.address || state?.selectedAddress || null;

    // Also check window.ethereum directly
    if (!addr) {
      const w = window as any;
      const raw = w.okxwallet || w.ethereum;
      if (raw?.selectedAddress) addr = raw.selectedAddress;
    }

    if (addr && !globalState.isConnected) {
      fetchBalance(addr).then(bal => {
        setGlobalState({ address: addr, balance: `${bal} OKB`, isConnected: true });
      });
    } else if (addr && addr !== globalState.address) {
      fetchBalance(addr).then(bal => {
        setGlobalState({ address: addr, balance: `${bal} OKB`, isConnected: true });
      });
    }
  } catch {}
}

export function useWallet() {
  const [, forceUpdate] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const listener = () => forceUpdate((n) => n + 1);
    listeners.add(listener);

    // Subscribe to AppKit state changes
    try {
      appKit.subscribeState((newState: any) => {
        if (newState?.address || newState?.open === false) {
          setTimeout(syncState, 500);
        }
      });
    } catch {}

    // Also listen for ethereum account changes
    const w = window as any;
    const raw = w.okxwallet || w.ethereum;
    if (raw?.on) {
      raw.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length > 0) {
          fetchBalance(accounts[0]).then(bal => {
            setGlobalState({ address: accounts[0], balance: `${bal} OKB`, isConnected: true });
          });
        } else {
          setGlobalState({ address: null, balance: "0 OKB", isConnected: false });
        }
      });
    }

    // Poll as fallback
    syncState();
    intervalRef.current = setInterval(syncState, 1500);

    return () => {
      listeners.delete(listener);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const connect = useCallback(async () => {
    try {
      await appKit.open();
      // Check after modal might close
      setTimeout(syncState, 1000);
      setTimeout(syncState, 3000);
    } catch (err) {
      console.error("Wallet connect error:", err);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try { await appKit.disconnect(); } catch {}
    setGlobalState({ address: null, balance: "0 OKB", isConnected: false });
  }, []);

  return {
    address: globalState.address,
    balance: globalState.balance,
    isConnected: globalState.isConnected,
    connecting: false,
    connect,
    disconnect,
  };
}
