import type { Signer } from "@linera/client";
import { ethers } from "ethers";

/**
 * A signer implementation for Dynamic wallets based on @linera/metamask pattern.
 * 
 * This implementation follows the same pattern as @linera/metamask but adapted
 * for Dynamic wallet integration instead of window.ethereum.
 */
export class DynamicSigner implements Signer {
  private provider: ethers.BrowserProvider;

  constructor(dynamicWallet: any) {
    if (!dynamicWallet) {
      throw new Error("Dynamic wallet is required");
    }
    // Create ethers provider from Dynamic wallet's ethereum provider
    this.provider = new ethers.BrowserProvider(dynamicWallet);
  }

  async sign(owner: string, value: Uint8Array): Promise<string> {
    // Get the signer from the provider
    const signer = await this.provider.getSigner();
    const signerAddress = await signer.getAddress();

    // Verify owner matches
    if (owner.toLowerCase() !== signerAddress.toLowerCase()) {
      throw new Error(`Signer address ${signerAddress} does not match requested owner: ${owner}`);
    }

    // Encode message as hex string (same as @linera/metamask)
    const msgHex = `0x${uint8ArrayToHex(value)}`;

    try {
      // Use ethers signer to sign the message
      const signature = await signer.signMessage(ethers.getBytes(msgHex));
      if (!signature) {
        throw new Error("No signature returned");
      }
      return signature;
    } catch (err: any) {
      throw new Error(`Dynamic signature request failed: ${err?.message || err}`);
    }
  }

  async containsKey(owner: string): Promise<boolean> {
    try {
      const signer = await this.provider.getSigner();
      const address = await signer.getAddress();
      return owner.toLowerCase() === address.toLowerCase();
    } catch {
      return false;
    }
  }

  async address(): Promise<string> {
    const signer = await this.provider.getSigner();
    const address = await signer.getAddress();
    return address;
  }
}

function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b: number) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Alternative implementation using window.ethereum directly (for Dynamic SDK)
export class DynamicSdkSigner implements Signer {
  private walletAccount: any;

  constructor(walletAccount: any) {
    this.walletAccount = walletAccount;
  }

  async address(): Promise<string> {
    const addr = getAccountAddress(this.walletAccount);
    if (!addr) {
      throw new Error('Wallet account address not available');
    }
    return addr;
  }

  async containsKey(owner: string): Promise<boolean> {
    try {
      const addr = await this.address();
      return owner.toLowerCase() === addr.toLowerCase();
    } catch {
      return false;
    }
  }

  async sign(owner: string, value: Uint8Array): Promise<string> {
    const currentAddress = await this.address();
    if (owner.toLowerCase() !== currentAddress.toLowerCase()) {
      throw new Error("Owner does not match connected wallet account");
    }

    const msgHex = `0x${uint8ArrayToHex(value)}`;

    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const signature = await (window as any).ethereum.request({
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
    } else {
      throw new Error("window.ethereum not found");
    }
  }
}

function getAccountAddress(walletAccount: any): string {
  return (walletAccount?.accountAddress ?? walletAccount?.address ?? '').toString();
}