import type { BackupKeySharesToGoogleDriveRequest, CreateWalletAccountRequest, CreateWalletAccountResponse, DelegateKeySharesRequest, ExportClientKeysharesRequest, GetWalletResponse, ImportPrivateKeyRequest, IsPasswordEncryptedRequest, OfflineExportPrivateKeyResponse, RefreshWalletAccountSharesRequest, RequiresPasswordForOperationRequest, ReshareRequest, SignMessageRequestBrowser, SignRawMessageRequest, SignTransactionRequest, SignTypedDataRequest, UpdatePasswordRequest, VerifyPasswordRequest } from '@dynamic-labs-wallet/core';
import { AuthMode, WalletOperation } from '@dynamic-labs-wallet/core';
import { IframeManager } from './iframeManager';
export declare class DynamicWalletClient extends IframeManager {
    constructor({ environmentId, authToken, baseApiUrl, baseMPCRelayApiUrl, chainName, sdkVersion, debug, authMode, }: {
        environmentId: string;
        authToken: string;
        baseApiUrl: string;
        baseMPCRelayApiUrl: string;
        chainName: string;
        sdkVersion?: string;
        debug?: boolean;
        authMode?: AuthMode;
    });
    getWallets(): Promise<GetWalletResponse[]>;
    getWallet({ accountAddress, walletOperation, signedSessionId, authToken, }: {
        accountAddress: string;
        walletOperation?: WalletOperation;
        signedSessionId: string;
        authToken?: string;
    }): Promise<GetWalletResponse>;
    createWalletAccount({ thresholdSignatureScheme, password, signedSessionId, authToken, }: Omit<CreateWalletAccountRequest, 'chainName'>): Promise<CreateWalletAccountResponse>;
    requiresPasswordForOperation({ accountAddress, walletOperation, authToken, }: Omit<RequiresPasswordForOperationRequest, 'chainName'>): Promise<boolean>;
    isPasswordEncrypted({ accountAddress, authToken, }: Omit<IsPasswordEncryptedRequest, 'chainName'>): Promise<boolean>;
    signMessage({ message, accountAddress, password, signedSessionId, authToken, mfaToken, context, }: Omit<SignMessageRequestBrowser, 'chainName'>): Promise<string>;
    signRawMessage({ message, accountAddress, password, signedSessionId, authToken, mfaToken, context, }: Omit<SignRawMessageRequest, 'chainName'>): Promise<string>;
    /**
     * Signs a transaction and returns the signature, @transaction is a string of the serialized transaction
     * EVM:
     *   transaction = serializeTransaction()
     * SOL:
     *   const messageBytes = transaction.serializeMessage();
     *   const messageToSign = Buffer.from(messageBytes).toString("hex");
     * SUI:
     *  const txBytes = await txb.build({ client });
     *  const txString = Buffer.from(txBytes).toString("hex");
     */
    signTransaction({ senderAddress, transaction, password, signedSessionId, authToken, mfaToken, chainId, }: Omit<SignTransactionRequest, 'chainName'>): Promise<string>;
    signTypedData({ accountAddress, typedData, password, signedSessionId, authToken, mfaToken, }: Omit<SignTypedDataRequest, 'chainName'>): Promise<string>;
    backupKeySharesToGoogleDrive({ accountAddress, password, signedSessionId, authToken, }: Omit<BackupKeySharesToGoogleDriveRequest, 'chainName'>): Promise<void>;
    delegateKeyShares({ accountAddress, password, signedSessionId, authToken, mfaToken, }: Omit<DelegateKeySharesRequest, 'chainName'>): Promise<void>;
    restoreBackupFromGoogleDrive({ accountAddress, displayContainer, password, signedSessionId, authToken, }: {
        accountAddress: string;
        displayContainer: HTMLElement;
        password?: string;
        signedSessionId: string;
        authToken?: string;
    }): Promise<void>;
    refreshWalletAccountShares({ accountAddress, password, signedSessionId, authToken, mfaToken, }: Omit<RefreshWalletAccountSharesRequest, 'chainName'>): Promise<void>;
    reshare({ accountAddress, oldThresholdSignatureScheme, newThresholdSignatureScheme, password, signedSessionId, authToken, mfaToken, }: Omit<ReshareRequest, 'chainName'>): Promise<void>;
    exportPrivateKey({ accountAddress, displayContainer, password, signedSessionId, authToken, mfaToken, }: {
        accountAddress: string;
        displayContainer: HTMLElement;
        password?: string;
        signedSessionId: string;
        authToken?: string;
        mfaToken?: string;
    }): Promise<void>;
    verifyPassword({ accountAddress, password, walletOperation, signedSessionId, authToken, }: Omit<VerifyPasswordRequest, 'chainName'>): Promise<void>;
    updatePassword({ accountAddress, existingPassword, newPassword, signedSessionId, authToken, }: Omit<UpdatePasswordRequest, 'chainName'>): Promise<void>;
    importPrivateKey({ privateKey, thresholdSignatureScheme, signedSessionId, authToken, }: Omit<ImportPrivateKeyRequest, 'chainName'>): Promise<CreateWalletAccountResponse>;
    exportClientKeyshares({ accountAddress, password, signedSessionId, authToken, }: Omit<ExportClientKeysharesRequest, 'chainName'>): Promise<void>;
    /**
     * keyShares is stringified list of EcdsaKeygenResult[] and Ed25519KeygenResult[]
     */
    offlineExportPrivateKey({ keyShares, derivationPath, }: {
        keyShares: string[];
        derivationPath?: string;
    }): Promise<OfflineExportPrivateKeyResponse>;
}
//# sourceMappingURL=client.d.ts.map