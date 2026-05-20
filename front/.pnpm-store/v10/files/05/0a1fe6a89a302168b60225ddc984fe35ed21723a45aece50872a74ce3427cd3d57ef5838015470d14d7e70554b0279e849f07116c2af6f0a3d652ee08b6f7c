import type { SignMessageContext } from '@dynamic-labs/sdk-api-core';
import { BackupLocation, WalletOperation } from './constants';
import { ThresholdSignatureScheme } from './mpc';
export declare enum AuthMode {
    HEADER = "header",
    COOKIE = "cookie"
}
export type InitKeygenResult = {
    keygenId: string;
    keygenSecret: string;
};
export type KeygenResult = {
    pubkey: string;
    secretShare: string;
};
export type KeygenCompleteResponse = {
    walletId: string;
    roomId: string;
    serverKeygenIds: string[];
};
export type OpenRoomResponse = {
    roomId: string;
    serverKeygenIds: string[];
};
export type ReshareResponse = {
    roomId: string;
    serverKeygenIds: string[];
    newServerKeygenIds: string[];
};
export declare enum SuccessEventType {
    KeygenComplete = "keygen_complete",
    RoomCreated = "room_created",
    CeremonyComplete = "ceremony_complete"
}
export type InitializeResult = {
    error: unknown | null;
};
export interface KeyShareBackupInfo {
    passwordEncrypted: boolean;
    backups: Record<BackupLocation, BackupLocationWithExternalKeyShareId[]>;
}
export interface WaasWalletProperties {
    derivationPath?: string;
    keyShares: KeyShareInfo[];
    thresholdSignatureScheme: ThresholdSignatureScheme;
}
export interface KeyShareInfo {
    id: string;
    backupLocation: BackupLocation;
    passwordEncrypted: boolean;
    externalKeyShareId?: string;
}
export type FeatureFlags = Record<string, boolean>;
export interface DynamicWalletClientProps {
    environmentId: string;
    authToken?: string;
    baseApiUrl?: string;
    storageKey?: string;
    debug?: boolean;
    baseMPCRelayApiUrl?: string;
    featureFlags?: FeatureFlags;
    authMode?: AuthMode;
    sdkVersion?: string;
}
export type BackupData = {
    keyShares: string[];
    metadata: {
        version: string;
        createdAt: string;
        accountAddress: string;
        thresholdSignatureScheme: ThresholdSignatureScheme;
        hasPassword: boolean;
        encryption?: EncryptionMetadata;
        shareCount: number;
    };
};
export type EncryptionMetadata = {
    algorithm: string;
    keyDerivation: string;
    iterations: number;
    hashAlgorithm: string;
    algorithmLength: number;
};
export type IframeRequestMessages = {
    sendAuthToken: (token?: string, authMode?: AuthMode) => Promise<void>;
    createWalletAccount: (request: CreateWalletAccountRequest) => Promise<CreateWalletAccountResponse>;
    getWallets: (request: GetWalletsRequest) => Promise<GetWalletResponse[]>;
    getWallet: (request: GetWalletRequest) => Promise<GetWalletResponse>;
    signMessage: (request: SignMessageRequest) => Promise<string>;
    signRawMessage: (request: SignRawMessageRequest) => Promise<string>;
    signTypedData: (request: SignTypedDataRequest) => Promise<string>;
    requiresPasswordForOperation: (request: RequiresPasswordForOperationRequest) => Promise<boolean>;
    signTransaction: (request: SignTransactionRequest) => Promise<string>;
    isPasswordEncrypted: (request: IsPasswordEncryptedRequest) => Promise<boolean>;
    backupKeySharesToGoogleDrive: (request: BackupKeySharesToGoogleDriveRequest) => Promise<string[]>;
    restoreBackupFromGoogleDrive: (request: RestoreBackupFromGoogleDriveRequest) => Promise<void>;
    delegateKeyShares: (request: DelegateKeySharesRequest) => Promise<void>;
    refreshWalletAccountShares: (request: RefreshWalletAccountSharesRequest) => Promise<void>;
    reshare: (request: ReshareRequest) => Promise<void>;
    exportPrivateKey: (request: ExportPrivateKeyRequest) => Promise<void>;
    verifyPassword: (request: VerifyPasswordRequest) => Promise<void>;
    updatePassword: (request: UpdatePasswordRequest) => Promise<void>;
    importPrivateKey: (request: ImportPrivateKeyRequest) => Promise<CreateWalletAccountResponse>;
    exportClientKeyshares: (request: ExportClientKeysharesRequest) => Promise<void>;
    offlineExportPrivateKey: (request: OfflineExportPrivateKeyRequest) => Promise<OfflineExportPrivateKeyResponse>;
    cleanup: () => Promise<void>;
};
export type CreateWalletAccountRequest = {
    chainName: string;
    thresholdSignatureScheme: ThresholdSignatureScheme;
    password?: string;
    signedSessionId: string;
    authToken?: string;
};
export type CreateWalletAccountResponse = {
    chainName: string;
    accountAddress: string;
    publicKeyHex: string;
    rawPublicKey: string | Uint8Array | undefined;
};
export type GetWalletsRequest = {
    chainName: string;
    authToken?: string;
};
export type GetWalletResponse = {
    chainName: string;
    accountAddress: string;
    walletId: string;
    clientKeySharesBackupInfo: KeyShareBackupInfo;
    derivationPath: string;
    thresholdSignatureScheme: ThresholdSignatureScheme;
};
export type GetWalletRequest = {
    chainName: string;
    accountAddress: string;
    walletOperation: WalletOperation;
    shareCount?: number;
    password?: string;
    signedSessionId: string;
    authToken?: string;
};
export type SignMessageRequest = {
    chainName: string;
    message: string;
    accountAddress: string;
    password?: string;
    signedSessionId: string;
    authToken?: string;
    mfaToken?: string;
    context?: string;
};
export type SignMessageRequestBrowser = {
    chainName: string;
    message: string;
    accountAddress: string;
    password?: string;
    signedSessionId: string;
    authToken?: string;
    mfaToken?: string;
    context?: SignMessageContext;
};
export type SignRawMessageRequest = {
    chainName: string;
    message: string;
    accountAddress: string;
    password?: string;
    signedSessionId: string;
    authToken?: string;
    mfaToken?: string;
    context?: SignMessageContext;
};
export type RequiresPasswordForOperationRequest = {
    chainName: string;
    accountAddress: string;
    walletOperation?: WalletOperation;
    authToken?: string;
};
export type SignTransactionRequest = {
    chainName: string;
    senderAddress: string;
    transaction: string;
    password?: string;
    signedSessionId: string;
    authToken?: string;
    mfaToken?: string;
    chainId?: string;
};
export type SignTypedDataRequest = {
    chainName: string;
    accountAddress: string;
    typedData: string;
    password?: string;
    signedSessionId: string;
    authToken?: string;
    mfaToken?: string;
};
export type IsPasswordEncryptedRequest = {
    chainName: string;
    accountAddress: string;
    authToken?: string;
};
export type BackupKeySharesToGoogleDriveRequest = {
    chainName: string;
    accountAddress: string;
    password?: string;
    signedSessionId: string;
    authToken?: string;
};
export type RestoreBackupFromGoogleDriveRequest = {
    chainName: string;
    accountAddress: string;
    password?: string;
    signedSessionId: string;
    authToken?: string;
};
export type DelegateKeySharesRequest = {
    chainName: string;
    accountAddress: string;
    password?: string;
    signedSessionId: string;
    authToken?: string;
    mfaToken?: string;
};
export type RefreshWalletAccountSharesRequest = {
    chainName: string;
    accountAddress: string;
    password?: string;
    signedSessionId: string;
    authToken?: string;
    mfaToken?: string;
};
export type ReshareRequest = {
    chainName: string;
    accountAddress: string;
    oldThresholdSignatureScheme: ThresholdSignatureScheme;
    newThresholdSignatureScheme: ThresholdSignatureScheme;
    password?: string;
    signedSessionId: string;
    authToken?: string;
    mfaToken?: string;
};
export type ExportPrivateKeyRequest = {
    chainName: string;
    accountAddress: string;
    password?: string;
    signedSessionId: string;
    authToken?: string;
    mfaToken?: string;
};
export type VerifyPasswordRequest = {
    chainName: string;
    accountAddress: string;
    password?: string;
    walletOperation?: WalletOperation;
    signedSessionId: string;
    authToken?: string;
};
export type UpdatePasswordRequest = {
    chainName: string;
    accountAddress: string;
    existingPassword: string;
    newPassword: string;
    signedSessionId: string;
    authToken?: string;
};
export type ImportPrivateKeyRequest = {
    chainName: string;
    privateKey: string;
    thresholdSignatureScheme: ThresholdSignatureScheme;
    password?: string;
    signedSessionId: string;
    authToken?: string;
};
export type ExportClientKeysharesRequest = {
    chainName: string;
    accountAddress: string;
    signedSessionId: string;
    password?: string;
    authToken?: string;
};
export type OfflineExportPrivateKeyRequest = {
    chainName: string;
    base64Args: string;
    authToken?: string;
};
export type OfflineExportPrivateKeyResponse = {
    derivedPrivateKey: string | undefined;
};
export type BackupLocationWithExternalKeyShareId = {
    location: BackupLocation;
    externalKeyShareId?: string;
    keyShareId?: string;
};
//# sourceMappingURL=types.d.ts.map