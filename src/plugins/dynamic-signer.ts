import type { Signer } from "@linera/client";
import type { WalletAccount as DynamicWalletAccount } from "@dynamic-labs-sdk/client";

export class DynamicSigner implements Signer {
  private dynamicWallet: any;

  constructor(dynamicWallet: any) {
    this.dynamicWallet = dynamicWallet;
  }

  async address(): Promise<string> {
    return this.dynamicWallet.address;
  }

  async containsKey(owner: string): Promise<boolean> {
    const walletAddress = this.dynamicWallet.address;
    return owner.toLowerCase() === walletAddress.toLowerCase();
  }

  async sign(owner: string, value: Uint8Array): Promise<string> {
    const address: `0x${string}` = owner as `0x${string}`;
    const primaryWallet = this.dynamicWallet.address;

    if (!primaryWallet || !owner) {
      throw new Error("No primary wallet found");
    }

    if (owner.toLowerCase() !== primaryWallet.toLowerCase()) {
      throw new Error("Owner does not match primary wallet");
    }

    try {
      const msgHex: `0x${string}` = `0x${uint8ArrayToHex(value)}`;

      // IMPORTANT: The value parameter is already pre-hashed, and the standard `signMessage`
      // method would hash it again, resulting in a double-hash. To avoid this, we bypass
      // the standard signing flow and use `personal_sign` directly on the wallet client.
      // DO NOT USE: this.dynamicWallet.signMessage(msgHex) - it would cause double-hashing

  // Try to obtain a wallet client with a generic request method
  const walletClient = await (this.dynamicWallet as any).getWalletClient?.();
  if (!walletClient?.request) throw new Error('Wallet client not available');
      const signature = await walletClient.request({
        method: "personal_sign",
        params: [msgHex, address],
      });

      if (!signature) throw new Error("Failed to sign message");
      return signature;
    } catch (error: any) {
      console.error("Failed to sign message:", error);
      throw new Error(
        `Dynamic signature request failed: ${error?.message || error}`
      );
    }
  }
}

function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b: number) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Signer backed by Dynamic JavaScript SDK WalletAccount (no React)
export class DynamicSdkSigner implements Signer {
  private walletAccount: DynamicWalletAccount;

  constructor(walletAccount: DynamicWalletAccount) {
    this.walletAccount = walletAccount;
  }

  async address(): Promise<string> {
    return getAccountAddress(this.walletAccount);
  }

  async containsKey(owner: string): Promise<boolean> {
    return owner.toLowerCase() === getAccountAddress(this.walletAccount).toLowerCase();
  }

  async sign(owner: string, value: Uint8Array): Promise<string> {
    const { signMessage } = await import('@dynamic-labs-sdk/client');
    if (owner.toLowerCase() !== getAccountAddress(this.walletAccount).toLowerCase()) {
      throw new Error("Owner does not match connected wallet account");
    }
    // Pass raw bytes as 0x-hex. Most EVM wallets accept hex for personal_sign.
    const msgHex = `0x${uint8ArrayToHex(value)}` as `0x${string}`;
    try {
      const { signature } = await signMessage({ walletAccount: this.walletAccount as any, message: msgHex });
      if (!signature) throw new Error('No signature returned');
      return signature;
    } catch (e: any) {
      throw new Error(`Dynamic SDK sign failed: ${e?.message || e}`);
    }
  }
}

function getAccountAddress(walletAccount: any): string {
  return (walletAccount?.accountAddress ?? walletAccount?.address ?? '').toString();
}