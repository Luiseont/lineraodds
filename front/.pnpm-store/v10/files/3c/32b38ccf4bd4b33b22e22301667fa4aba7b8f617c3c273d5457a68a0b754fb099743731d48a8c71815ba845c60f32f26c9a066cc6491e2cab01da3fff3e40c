import { exists } from '../runtime.js';
import { SignMessageEip7702AuthFromJSON, SignMessageEip7702AuthToJSON } from './SignMessageEip7702Auth.js';
import { SignMessageEvmTransactionFromJSON, SignMessageEvmTransactionToJSON } from './SignMessageEvmTransaction.js';
import { SignMessageEvmUserOperationFromJSON, SignMessageEvmUserOperationToJSON } from './SignMessageEvmUserOperation.js';
import { SignMessageSvmTransactionFromJSON, SignMessageSvmTransactionToJSON } from './SignMessageSvmTransaction.js';

/* tslint:disable */
function SignMessageContextFromJSON(json) {
    return SignMessageContextFromJSONTyped(json);
}
function SignMessageContextFromJSONTyped(json, ignoreDiscriminator) {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        'evmTransaction': !exists(json, 'evmTransaction') ? undefined : SignMessageEvmTransactionFromJSON(json['evmTransaction']),
        'evmUserOperation': !exists(json, 'evmUserOperation') ? undefined : SignMessageEvmUserOperationFromJSON(json['evmUserOperation']),
        'svmTransaction': !exists(json, 'svmTransaction') ? undefined : SignMessageSvmTransactionFromJSON(json['svmTransaction']),
        'eip7702Auth': !exists(json, 'eip7702Auth') ? undefined : SignMessageEip7702AuthFromJSON(json['eip7702Auth']),
    };
}
function SignMessageContextToJSON(value) {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        'evmTransaction': SignMessageEvmTransactionToJSON(value.evmTransaction),
        'evmUserOperation': SignMessageEvmUserOperationToJSON(value.evmUserOperation),
        'svmTransaction': SignMessageSvmTransactionToJSON(value.svmTransaction),
        'eip7702Auth': SignMessageEip7702AuthToJSON(value.eip7702Auth),
    };
}

export { SignMessageContextFromJSON, SignMessageContextFromJSONTyped, SignMessageContextToJSON };
