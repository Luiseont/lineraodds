import type { SignMessageEvmTransaction, SignMessageEvmUserOperation, SignMessageSvmTransaction } from '@dynamic-labs/sdk-api-core';
import { BackupLocation } from '../constants';
import type { ThresholdSignatureScheme } from '../mpc/constants';
import { AuthMode, BackupLocationWithExternalKeyShareId, type KeygenCompleteResponse, type OpenRoomResponse, type ReshareResponse } from '../types';
import { BaseClient } from './client';
export declare class DynamicApiClient extends BaseClient {
    constructor({ environmentId, authToken, baseApiUrl, authMode, sdkVersion, }: {
        environmentId: string;
        authToken?: string;
        baseApiUrl?: string;
        authMode?: AuthMode;
        sdkVersion?: string;
    });
    authenticateApiToken({ environmentId }: {
        environmentId: string;
    }): Promise<import("axios").AxiosResponse<any, any>>;
    createWalletAccount({ chainName, clientKeygenIds, dynamicRequestId, thresholdSignatureScheme, onError, onCeremonyComplete, }: {
        chainName: string;
        dynamicRequestId?: string;
        clientKeygenIds: string[];
        thresholdSignatureScheme: ThresholdSignatureScheme;
        onError?: (error: Error) => void;
        onCeremonyComplete?: (accountAddress: string, walletId: string) => void;
    }): Promise<KeygenCompleteResponse>;
    signMessage({ dynamicRequestId, walletId, message, onError, isFormatted, mfaToken, context, }: {
        dynamicRequestId?: string;
        walletId: string;
        message: string;
        onError?: (error: Error) => void;
        isFormatted?: boolean;
        mfaToken?: string;
        context?: SignMessageEvmTransaction | SignMessageSvmTransaction | SignMessageEvmUserOperation;
    }): Promise<OpenRoomResponse>;
    refreshWalletAccountShares({ dynamicRequestId, walletId, onError, mfaToken, }: {
        dynamicRequestId?: string;
        walletId: string;
        onError?: (error: Error) => void;
        mfaToken?: string;
    }): Promise<{
        roomId: string;
        serverKeygenIds: string[];
    }>;
    reshare({ walletId, dynamicRequestId, clientKeygenIds, oldThresholdSignatureScheme, newThresholdSignatureScheme, delegateToProjectEnvironment, mfaToken, onError, }: {
        dynamicRequestId?: string;
        walletId: string;
        clientKeygenIds: string[];
        oldThresholdSignatureScheme: ThresholdSignatureScheme;
        newThresholdSignatureScheme: ThresholdSignatureScheme;
        delegateToProjectEnvironment?: boolean;
        mfaToken?: string;
        onError?: (error: Error) => void;
    }): Promise<ReshareResponse>;
    exportKey({ mfaToken, dynamicRequestId, walletId, exportId, onError, }: {
        mfaToken?: string;
        dynamicRequestId?: string;
        walletId: string;
        exportId: string;
        onError?: (error: Error) => void;
    }): Promise<OpenRoomResponse>;
    storeEncryptedBackupByWallet({ walletId, encryptedKeyShares, passwordEncrypted, signedSessionId, encryptionVersion, requiresSignedSessionId, authMode, }: {
        walletId: string;
        encryptedKeyShares: string[];
        passwordEncrypted: boolean;
        signedSessionId?: string;
        encryptionVersion?: string;
        requiresSignedSessionId?: boolean;
        authMode?: AuthMode;
    }): Promise<any>;
    markKeySharesAsBackedUpGoogleDrive({ walletId }: {
        walletId: string;
    }): Promise<any>;
    markKeySharesAsBackedUp({ walletId, locations, }: {
        walletId: string;
        locations: BackupLocationWithExternalKeyShareId[];
    }): Promise<{
        message: string;
        walletId: string;
        locationsWithKeyShares: {
            location: BackupLocation;
            keyShareId: string;
            externalKeyShareId?: string;
        }[];
    }>;
    recoverEncryptedBackupByWallet({ walletId, keyShareIds, signedSessionId, mfaToken, requiresSignedSessionId, authMode, }: {
        walletId: string;
        keyShareIds?: string[];
        signedSessionId?: string;
        mfaToken?: string;
        requiresSignedSessionId?: boolean;
        authMode?: AuthMode;
    }): Promise<any>;
    getAccessToken({ oauthAccountId }: {
        oauthAccountId: string;
    }): Promise<any>;
    importPrivateKey({ chainName, dynamicRequestId, clientKeygenIds, thresholdSignatureScheme, onError, onCeremonyComplete, }: {
        dynamicRequestId?: string;
        chainName: string;
        clientKeygenIds: string[];
        thresholdSignatureScheme: ThresholdSignatureScheme;
        onError?: (error: Error) => void;
        onCeremonyComplete?: (accountAddress: string, walletId: string) => void;
    }): Promise<KeygenCompleteResponse>;
    getUser(): Promise<any>;
    refreshUser(): Promise<any>;
    getEnvironmentSettings(): Promise<any>;
}
//# sourceMappingURL=api.d.ts.map