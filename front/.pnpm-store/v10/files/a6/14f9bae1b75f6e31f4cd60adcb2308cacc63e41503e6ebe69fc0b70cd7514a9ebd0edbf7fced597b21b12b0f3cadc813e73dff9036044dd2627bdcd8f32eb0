import { type MessageTransportWithDefaultOrigin, type RequestChannel } from '@dynamic-labs/message-transport';
import type { IframeRequestMessages, GetWalletResponse, CreateWalletAccountResponse, SignMessageRequest, RequiresPasswordForOperationRequest, SignTransactionRequest, IsPasswordEncryptedRequest, BackupKeySharesToGoogleDriveRequest, RestoreBackupFromGoogleDriveRequest, RefreshWalletAccountSharesRequest, ReshareRequest, ExportPrivateKeyRequest, VerifyPasswordRequest, UpdatePasswordRequest, ImportPrivateKeyRequest, ExportClientKeysharesRequest, OfflineExportPrivateKeyRequest, OfflineExportPrivateKeyResponse, SignRawMessageRequest, GetWalletsRequest, CreateWalletAccountRequest, GetWalletRequest, SignTypedDataRequest, DelegateKeySharesRequest, AuthMode } from '@dynamic-labs-wallet/core';
export declare class iframeMessageHandler {
    requestChannel: RequestChannel<IframeRequestMessages>;
    constructor(messageTransport: MessageTransportWithDefaultOrigin);
    getWallets(request: GetWalletsRequest): Promise<GetWalletResponse[]>;
    getWallet(request: GetWalletRequest): Promise<GetWalletResponse>;
    createWalletAccount(request: CreateWalletAccountRequest): Promise<CreateWalletAccountResponse>;
    requiresPasswordForOperation(request: RequiresPasswordForOperationRequest): Promise<boolean>;
    signMessage(request: SignMessageRequest): Promise<string>;
    signRawMessage(request: SignRawMessageRequest): Promise<string>;
    signTransaction(request: SignTransactionRequest): Promise<string>;
    isPasswordEncrypted(request: IsPasswordEncryptedRequest): Promise<boolean>;
    backupKeySharesToGoogleDrive(request: BackupKeySharesToGoogleDriveRequest): Promise<void>;
    delegateKeyShares(request: DelegateKeySharesRequest): Promise<void>;
    restoreBackupFromGoogleDrive(request: RestoreBackupFromGoogleDriveRequest): Promise<void>;
    refreshWalletAccountShares(request: RefreshWalletAccountSharesRequest): Promise<void>;
    reshare(request: ReshareRequest): Promise<void>;
    exportPrivateKey(request: ExportPrivateKeyRequest): Promise<void>;
    verifyPassword(request: VerifyPasswordRequest): Promise<void>;
    updatePassword(request: UpdatePasswordRequest): Promise<void>;
    importPrivateKey(request: ImportPrivateKeyRequest): Promise<CreateWalletAccountResponse>;
    sendAuthToken(token?: string, authMode?: AuthMode): Promise<void>;
    exportClientKeyshares(request: ExportClientKeysharesRequest): Promise<void>;
    offlineExportPrivateKey(request: OfflineExportPrivateKeyRequest): Promise<OfflineExportPrivateKeyResponse>;
    signTypedData(request: SignTypedDataRequest): Promise<string>;
    cleanup(): Promise<void>;
}
//# sourceMappingURL=iframeMessageHandler.d.ts.map