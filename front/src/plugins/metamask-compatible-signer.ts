import type { Signer } from "@linera/client";

/**
 * A signer implementation for Dynamic wallets that follows the @linera/metamask pattern.
 * 
 * This signer uses window.ethereum (injected by Dynamic wallet) to sign messages
 * using the same approach as MetaMask. It's designed to work seamlessly with
 * Linera's native Composite signer.
 */
export default class MetaMaskCompatibleSigner implements Signer {
    async sign(owner: string, value: Uint8Array): Promise<string> {
        if (typeof window === 'undefined' || !(window as any).ethereum) {
            throw new Error("window.ethereum not found - Dynamic wallet not initialized");
        }

        const ethereum = (window as any).ethereum;

        // Get current account
        const accounts = await ethereum.request({ method: 'eth_accounts' }) as string[];
        if (!accounts || accounts.length === 0) {
            throw new Error("No accounts connected");
        }

        const currentAccount = accounts[0]?.toLowerCase();
        if (!currentAccount) {
            throw new Error("No account address available");
        }

        if (owner.toLowerCase() !== currentAccount) {
            throw new Error(`Signer address ${currentAccount} does not match requested owner: ${owner}`);
        }

        // Encode message as hex string (same format as @linera/metamask)
        const msgHex = `0x${uint8ArrayToHex(value)}`;

        try {
            const signature = await ethereum.request({
                method: 'personal_sign',
                params: [msgHex, owner],
            }) as string;

            if (!signature) {
                throw new Error("No signature returned");
            }

            return signature;
        } catch (error: any) {
            throw new Error(`Signature request failed: ${error?.message || error}`);
        }
    }

    async containsKey(owner: string): Promise<boolean> {
        try {
            if (typeof window === 'undefined' || !(window as any).ethereum) {
                return false;
            }

            const ethereum = (window as any).ethereum;
            const accounts = await ethereum.request({ method: 'eth_accounts' }) as string[];

            if (!accounts || accounts.length === 0) {
                return false;
            }

            const currentAccount = accounts[0]?.toLowerCase();
            if (!currentAccount) {
                return false;
            }

            return owner.toLowerCase() === currentAccount;
        } catch {
            return false;
        }
    }
}

function uint8ArrayToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
        .map((b: number) => b.toString(16).padStart(2, "0"))
        .join("");
}
