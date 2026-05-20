'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var runtime = require('../runtime.cjs');
var SignMessageEip7702Auth = require('./SignMessageEip7702Auth.cjs');
var SignMessageEvmTransaction = require('./SignMessageEvmTransaction.cjs');
var SignMessageEvmUserOperation = require('./SignMessageEvmUserOperation.cjs');
var SignMessageSvmTransaction = require('./SignMessageSvmTransaction.cjs');

/* tslint:disable */
function SignMessageContextFromJSON(json) {
    return SignMessageContextFromJSONTyped(json);
}
function SignMessageContextFromJSONTyped(json, ignoreDiscriminator) {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        'evmTransaction': !runtime.exists(json, 'evmTransaction') ? undefined : SignMessageEvmTransaction.SignMessageEvmTransactionFromJSON(json['evmTransaction']),
        'evmUserOperation': !runtime.exists(json, 'evmUserOperation') ? undefined : SignMessageEvmUserOperation.SignMessageEvmUserOperationFromJSON(json['evmUserOperation']),
        'svmTransaction': !runtime.exists(json, 'svmTransaction') ? undefined : SignMessageSvmTransaction.SignMessageSvmTransactionFromJSON(json['svmTransaction']),
        'eip7702Auth': !runtime.exists(json, 'eip7702Auth') ? undefined : SignMessageEip7702Auth.SignMessageEip7702AuthFromJSON(json['eip7702Auth']),
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
        'evmTransaction': SignMessageEvmTransaction.SignMessageEvmTransactionToJSON(value.evmTransaction),
        'evmUserOperation': SignMessageEvmUserOperation.SignMessageEvmUserOperationToJSON(value.evmUserOperation),
        'svmTransaction': SignMessageSvmTransaction.SignMessageSvmTransactionToJSON(value.svmTransaction),
        'eip7702Auth': SignMessageEip7702Auth.SignMessageEip7702AuthToJSON(value.eip7702Auth),
    };
}

exports.SignMessageContextFromJSON = SignMessageContextFromJSON;
exports.SignMessageContextFromJSONTyped = SignMessageContextFromJSONTyped;
exports.SignMessageContextToJSON = SignMessageContextToJSON;
