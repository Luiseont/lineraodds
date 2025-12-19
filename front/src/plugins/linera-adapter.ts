import {
  initialize as initLinera,
  Faucet,
  Client,
  Wallet,
  Application
} from "@linera/client";
import * as linera from '@linera/client';
import MetaMaskCompatibleSigner from "./metamask-compatible-signer";

export interface LineraProvider {
  client: Client;
  wallet: Wallet;
  faucet: Faucet;
  address: string;
  chainId: string;
  chain: any;
  autoSigner: any; // Store the actual PrivateKey object
  autoSignerAddress: string;
}

export class LineraAdapter {
  private static instance: LineraAdapter | null = null;
  private provider: LineraProvider | null = null;
  private application: Application | null = null;
  private wasmInitPromise: Promise<unknown> | null = null;
  private connectPromise: Promise<LineraProvider> | null = null;
  private onConnectionChange?: () => void;

  private constructor() { }

  static getInstance(): LineraAdapter {
    if (!LineraAdapter.instance) LineraAdapter.instance = new LineraAdapter();
    return LineraAdapter.instance;
  }

  async connect(
    dynamicWalletOrAccount: any,
    rpcUrl: string
  ): Promise<LineraProvider> {
    if (this.provider) return this.provider;
    if (this.connectPromise) return this.connectPromise;

    if (!dynamicWalletOrAccount) {
      throw new Error("Dynamic wallet is required for Linera connection");
    }

    try {
      this.connectPromise = (async () => {
        const address = getAddressFromDynamic(dynamicWalletOrAccount);
        console.log("🔗 Connecting with Dynamic wallet:", address);

        try {
          if (!this.wasmInitPromise) this.wasmInitPromise = initLinera();
          await this.wasmInitPromise;
          console.log("✅ Linera WASM modules initialized successfully");
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          if (msg.includes("storage is already initialized")) {
            console.warn(
              "⚠️ Linera storage already initialized; continuing without re-init"
            );
          } else {
            throw e;
          }
        }

        const faucet = await new Faucet(rpcUrl);
        const wallet = await faucet.createWallet();
        const chainId = await faucet.claimChain(wallet, address);

        // Create auto-signer for automatic operations
        const autoSigner = linera.signer.PrivateKey.createRandom();

        // Create user signer for wallet operations
        const userSigner = new MetaMaskCompatibleSigner();

        // Create Composite signer with both signers (Linera native)
        const compositeSigner = new linera.signer.Composite(autoSigner, userSigner);

        const client = await new Client(wallet, compositeSigner);
        console.log("Autosigner Address: ", autoSigner.address());
        // Obtain chain instance
        const chain = await client.chain(chainId);
        await chain.addOwner(autoSigner.address());
        await wallet.setOwner(chainId, autoSigner.address());
        this.provider = {
          client,
          wallet,
          faucet,
          chainId,
          address,
          chain,
          autoSigner: autoSigner,
          autoSignerAddress: autoSigner.address()
        };

        this.onConnectionChange?.();
        return this.provider;
      })();

      const provider = await this.connectPromise;
      return provider;
    } catch (error) {
      console.error("Failed to connect to Linera:", error);
      throw new Error(
        `Failed to connect to Linera network: ${error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      this.connectPromise = null;
    }
  }

  async setApplication(appId: string) {
    if (!this.provider) throw new Error("Not connected to Linera");
    if (!appId) throw new Error("Application ID is required");
    if (!this.provider.chain) throw new Error("Chain instance not available");

    // Use chain instance to get application (new API in v0.15.8)
    const application = await this.provider.chain.application(appId);
    if (!application) throw new Error("Failed to get application");
    console.log("✅ Linera application set successfully!");
    this.application = application;
    this.onConnectionChange?.();
  }

  async queryApplication<T>(query: string): Promise<T> {
    if (!this.application) throw new Error("Application not set");

    const result = await this.application.query(query);
    const response = JSON.parse(result);

    console.log("✅ Linera application queried successfully!");
    return response as T;
  }

  getProvider(): LineraProvider {
    if (!this.provider) throw new Error("Provider not set");
    return this.provider;
  }

  getFaucet(): Faucet {
    if (!this.provider?.faucet) throw new Error("Faucet not set");
    return this.provider.faucet;
  }

  getWallet(): Wallet {
    if (!this.provider?.wallet) throw new Error("Wallet not set");
    return this.provider.wallet;
  }

  getApplication(): Application {
    if (!this.application) throw new Error("Application not set");
    return this.application;
  }

  isChainConnected(): boolean {
    return this.provider !== null;
  }

  isApplicationSet(): boolean {
    return this.application !== null;
  }

  onConnectionStateChange(callback: () => void): void {
    this.onConnectionChange = callback;
  }

  offConnectionStateChange(): void {
    this.onConnectionChange = undefined;
  }



  reset(): void {
    this.application = null;
    this.provider = null;
    this.connectPromise = null;
    this.onConnectionChange?.();
  }
}

// Export singleton instance
export const lineraAdapter = LineraAdapter.getInstance();

// Helper to extract address from Dynamic wallet
function getAddressFromDynamic(obj: any): string {
  return (obj?.address ?? obj?.accountAddress ?? obj?.user?.primaryWallet?.address ?? '').toString();
}