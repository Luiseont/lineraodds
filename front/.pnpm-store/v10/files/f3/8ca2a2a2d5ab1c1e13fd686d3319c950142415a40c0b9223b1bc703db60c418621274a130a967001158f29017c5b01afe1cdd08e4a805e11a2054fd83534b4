'use strict';

var core = require('@dynamic-labs-wallet/core');
var uuid = require('uuid');
var messageTransport = require('@dynamic-labs/message-transport');
var logger$1 = require('@dynamic-labs/logger');

function _extends() {
    _extends = Object.assign || function assign(target) {
        for(var i = 1; i < arguments.length; i++){
            var source = arguments[i];
            for(var key in source)if (Object.prototype.hasOwnProperty.call(source, key)) target[key] = source[key];
        }
        return target;
    };
    return _extends.apply(this, arguments);
}

class iframeMessageHandler {
    async getWallets(request) {
        return this.requestChannel.request('getWallets', request);
    }
    async getWallet(request) {
        return this.requestChannel.request('getWallet', request);
    }
    async createWalletAccount(request) {
        return this.requestChannel.request('createWalletAccount', request);
    }
    async requiresPasswordForOperation(request) {
        return this.requestChannel.request('requiresPasswordForOperation', request);
    }
    async signMessage(request) {
        return this.requestChannel.request('signMessage', request);
    }
    async signRawMessage(request) {
        return this.requestChannel.request('signRawMessage', request);
    }
    async signTransaction(request) {
        return this.requestChannel.request('signTransaction', request);
    }
    async isPasswordEncrypted(request) {
        return this.requestChannel.request('isPasswordEncrypted', request);
    }
    async backupKeySharesToGoogleDrive(request) {
        await this.requestChannel.request('backupKeySharesToGoogleDrive', request);
    }
    async delegateKeyShares(request) {
        return this.requestChannel.request('delegateKeyShares', request);
    }
    async restoreBackupFromGoogleDrive(request) {
        return this.requestChannel.request('restoreBackupFromGoogleDrive', request);
    }
    async refreshWalletAccountShares(request) {
        return this.requestChannel.request('refreshWalletAccountShares', request);
    }
    async reshare(request) {
        return this.requestChannel.request('reshare', request);
    }
    async exportPrivateKey(request) {
        return this.requestChannel.request('exportPrivateKey', request);
    }
    async verifyPassword(request) {
        return this.requestChannel.request('verifyPassword', request);
    }
    async updatePassword(request) {
        return this.requestChannel.request('updatePassword', request);
    }
    async importPrivateKey(request) {
        return this.requestChannel.request('importPrivateKey', request);
    }
    async sendAuthToken(token, authMode) {
        return this.requestChannel.request('sendAuthToken', token, authMode);
    }
    async exportClientKeyshares(request) {
        return this.requestChannel.request('exportClientKeyshares', request);
    }
    async offlineExportPrivateKey(request) {
        return this.requestChannel.request('offlineExportPrivateKey', request);
    }
    async signTypedData(request) {
        return this.requestChannel.request('signTypedData', request);
    }
    async cleanup() {
        return this.requestChannel.request('cleanup');
    }
    constructor(messageTransport$1){
        this.requestChannel = messageTransport.createRequestChannel(messageTransport$1);
    }
}

const logger = new logger$1.Logger('DynamicWaasWalletClient');

const setupMessageTransportBridge = (messageTransport$1, iframe, iframeOrigin)=>{
    if (!(iframe == null ? void 0 : iframe.contentWindow)) {
        throw new Error('Iframe or contentWindow not available');
    }
    const logger = new logger$1.Logger('debug');
    messageTransport$1.on((message)=>{
        // Forward the message to webview via postMessage
        if (message.origin === 'host') {
            var _iframe_contentWindow;
            iframe == null ? void 0 : (_iframe_contentWindow = iframe.contentWindow) == null ? void 0 : _iframe_contentWindow.postMessage(message, iframeOrigin);
        }
    });
    const handleIncomingMessage = (message)=>{
        const { data } = message;
        if (!data) return;
        if ((data == null ? void 0 : data.origin) !== 'webview') {
            return;
        }
        if (typeof data !== 'object') {
            return;
        }
        try {
            const message = messageTransport.parseMessageTransportData(data);
            messageTransport$1.emit(message);
        } catch (error) {
            if (!(error instanceof SyntaxError)) {
                logger.error('Error handling incoming message:', error);
            }
        }
    };
    /**
   * Handle incoming message from android client
   */ // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    document.addEventListener('message', handleIncomingMessage);
    /**
   * Handle incoming message from iOS client
   */ window.addEventListener('message', handleIncomingMessage);
};

class IframeManager {
    // Simply load the iframe from localhost
    async initialize() {
        await this.doInitializeIframeCommunication();
    }
    /**
   * this is called on class construction time
   * @returns {Promise<void>} that resolves when the iframe is loaded and the message transport and iframe storage are initialized
   */ initializeIframeCommunication() {
        var _IframeManager;
        var _iframeLoadPromise;
        (_iframeLoadPromise = (_IframeManager = IframeManager).iframeLoadPromise) != null ? _iframeLoadPromise : _IframeManager.iframeLoadPromise = this.doInitializeIframeCommunication();
        return IframeManager.iframeLoadPromise;
    }
    /**
   * initialize the iframe communication by awaiting the iframe load promise
   * and initializing the message transport and iframe storage after iframe is successfully loaded
   */ async doInitializeIframeCommunication() {
        try {
            await this.loadIframe();
        } catch (error) {
            this.logger.error('Error initializing iframe:', error);
            throw error;
        }
    }
    /**
   * initialize the message transport after iframe is successfully loaded
   */ async initializeMessageTransport() {
        if (this.messageTransport && this.iframeMessageHandler) {
            this.logger.debug('Skipping initializeMessageTransport: transport and message handler already initialized');
            return;
        }
        await this.initializeIframeCommunication();
        const transport = messageTransport.applyDefaultMessageOrigin({
            defaultOrigin: 'host',
            messageTransport: messageTransport.createMessageTransport()
        });
        this.messageTransport = transport;
        if (!this.iframe) {
            throw new Error('Iframe not available');
        }
        setupMessageTransportBridge(this.messageTransport, this.iframe, this.iframeDomain);
        this.iframeMessageHandler = new iframeMessageHandler(this.messageTransport);
        await this.initAuthToken();
    }
    /**
   * securely exchange the auth token with iframe securely
   */ async initAuthToken() {
        if (!this.iframeMessageHandler) {
            throw new Error('Iframe message handler not initialized');
        }
        try {
            // Send auth token to iframe
            await this.iframeMessageHandler.sendAuthToken(this.authToken, this.authMode);
        } catch (error) {
            throw new Error('Failed to establish secure token exchange: ' + error);
        }
    }
    /**
   * Reset the shared iframe and iframe load promise, and iframe instance count
   */ async resetSharedIframe() {
        IframeManager.sharedIframe = null;
        IframeManager.iframeInstanceCount = 0;
        IframeManager.iframeLoadPromise = null;
        this.iframe = null;
        this.iframeMessageHandler = null;
        this.messageTransport = null;
        // Double the timeout and cap at 60 seconds to give more time for slow networks
        IframeManager.iframeLoadTimeout = Math.min(IframeManager.iframeLoadTimeout * 2, 60000);
    }
    async loadIframe() {
        // If the iframe is already loaded, just assign and resolve
        if (IframeManager.sharedIframe) {
            this.assignExistingIframe();
            return Promise.resolve();
        }
        // If a load is in progress, wait for it, then assign
        if (IframeManager.iframeLoadPromise) {
            return IframeManager.iframeLoadPromise.then(()=>{
                this.assignExistingIframe();
            });
        }
        IframeManager.iframeLoadPromise = this.createIframeLoadPromise();
        return IframeManager.iframeLoadPromise;
    }
    assignExistingIframe() {
        this.iframe = IframeManager.sharedIframe;
        IframeManager.iframeInstanceCount++;
    }
    createIframeLoadPromise() {
        return new Promise((resolve, reject)=>{
            const attemptLoad = ()=>{
                IframeManager.iframeLoadAttempts++;
                this.logger.info(`Loading iframe for waas wallet client... (attempt ${IframeManager.iframeLoadAttempts}/${IframeManager.maxRetryAttempts + 1})`, this.getIframeContext());
                const iframe = document.createElement('iframe');
                let messageListener = null;
                const context = _extends({}, this.getIframeContext(), {
                    attempt: IframeManager.iframeLoadAttempts
                });
                // Set up timeout that will trigger iframe error, a retry will be triggered on this iframe error
                const iframeTimeoutId = setTimeout(()=>{
                    if (iframe.onerror) {
                        iframe.onerror('Iframe load timeout');
                    }
                }, IframeManager.iframeLoadTimeout);
                messageListener = this.createMessageListener(iframe, iframeTimeoutId, resolve);
                window.addEventListener('message', messageListener);
                this.configureIframe(iframe);
                this.setIframeSource(iframe);
                this.logger.debug('Creating iframe with src:', iframe.src);
                document.body.appendChild(iframe);
                this.setupIframeEventHandlersWithRetry(iframe, messageListener, iframeTimeoutId, reject, attemptLoad, context);
            };
            // Start the first attempt
            attemptLoad();
        });
    }
    setupIframeEventHandlersWithRetry(iframe, messageListener, iframeTimeoutId, reject, attemptLoad, context) {
        iframe.onload = ()=>{
            this.logger.debug('Iframe onload fired, waiting for ready message...');
        };
        iframe.onerror = (error)=>{
            if (messageListener) {
                window.removeEventListener('message', messageListener);
            }
            clearTimeout(iframeTimeoutId);
            // Check if we should retry
            if (IframeManager.iframeLoadAttempts <= IframeManager.maxRetryAttempts) {
                const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred.';
                this.logger.warn(`(loadIframe) Iframe failed to load on attempt ${IframeManager.iframeLoadAttempts}, retrying... context: ${JSON.stringify(context)}, error: ${errorMsg}`);
                // Clean up current attempt
                if (iframe.parentNode) {
                    iframe.parentNode.removeChild(iframe);
                }
                // Retry after a short delay
                setTimeout(()=>{
                    attemptLoad();
                }, 1000); // 1 second delay between retries
            } else {
                // Max retries reached, give up
                this.logger.error('Iframe failed to load after all retry attempts: ', error);
                this.resetSharedIframe();
                IframeManager.iframeLoadAttempts = 0;
                reject(new Error(`Failed to load iframe after all retry attempts... context: ${JSON.stringify(context)}`));
            }
        };
    }
    getIframeContext() {
        var _this_sdkVersion;
        return {
            iframeDomain: this.iframeDomain,
            environmentId: this.environmentId,
            sdkVersion: (_this_sdkVersion = this.sdkVersion) != null ? _this_sdkVersion : '',
            instanceId: this.instanceId,
            chainName: this.chainName,
            iframeLoadTimeout: IframeManager.iframeLoadTimeout
        };
    }
    createMessageListener(iframe, iframeTimeoutId, resolve) {
        const messageListener = (event)=>{
            if (event.source === iframe.contentWindow && event.data === `iframe-ready-${this.instanceId}`) {
                window.removeEventListener('message', messageListener);
                clearTimeout(iframeTimeoutId);
                IframeManager.sharedIframe = iframe;
                this.iframe = iframe;
                IframeManager.iframeInstanceCount++;
                IframeManager.iframeLoadAttempts = 0; // Reset retry counter on success
                resolve();
                this.logger.info('Iframe loaded successfully...', this.getIframeContext());
            }
        };
        return messageListener;
    }
    configureIframe(iframe) {
        iframe.style.display = 'none';
        iframe.setAttribute('title', 'Dynamic Wallet Iframe');
        iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-downloads');
        iframe.setAttribute('referrerpolicy', 'origin');
        iframe.style.position = 'fixed';
        iframe.style.top = '0';
        iframe.style.left = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        iframe.style.pointerEvents = 'none';
    }
    setIframeSource(iframe) {
        var _this_instanceId, _this_sdkVersion;
        const params = new URLSearchParams({
            instanceId: (_this_instanceId = this.instanceId) != null ? _this_instanceId : '',
            hostOrigin: window.location.origin,
            environmentId: this.environmentId,
            baseApiUrl: this.baseApiUrl,
            baseMPCRelayApiUrl: this.baseMPCRelayApiUrl,
            sdkVersion: (_this_sdkVersion = this.sdkVersion) != null ? _this_sdkVersion : ''
        });
        iframe.src = `${this.iframeDomain}/waas-v1/${this.environmentId}?${params.toString()}`;
    }
    /**
   * Load an iframe for a specific container
   * @param {HTMLElement} container - The container to which the iframe will be attached
   * @returns {Promise<HTMLIFrameElement>} that resolves when the iframe is loaded
   */ loadIframeForContainer(container) {
        return new Promise((resolve, reject)=>{
            var _this_sdkVersion;
            const context = {
                iframeDomain: this.iframeDomain,
                environmentId: this.environmentId,
                sdkVersion: (_this_sdkVersion = this.sdkVersion) != null ? _this_sdkVersion : '',
                instanceId: this.instanceId,
                chainName: this.chainName,
                iframeLoadTimeout: IframeManager.iframeLoadTimeout
            };
            this.logger.info(`Loading iframe for container...`, context);
            const iframe = document.createElement('iframe');
            let messageListener = null;
            const iframeTimeoutId = setTimeout(()=>{
                if (messageListener) {
                    window.removeEventListener('message', messageListener);
                }
                this.logger.error(`(loadIframeForContainer) Iframe load timeout due to no handshake message from iframe, this could be network issues, incorrect iframe domain, or CORS errors that prevents iframe from being loaded or sending handshake message, context: ${JSON.stringify(context)}`);
                reject(new Error(`(loadIframeForContainer) Iframe load timeout due to no handshake message from iframe, this could be network issues, incorrect iframe domain, or CORS errors that prevents iframe from being loaded or sending handshake message, context: ${JSON.stringify(context)}`));
            }, IframeManager.iframeLoadTimeout);
            iframe.style.display = 'block';
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.setAttribute('title', 'Dynamic Wallet Storage');
            iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
            iframe.setAttribute('referrerpolicy', 'origin');
            var _this_instanceId, _this_sdkVersion1;
            const params = new URLSearchParams({
                instanceId: (_this_instanceId = this.instanceId) != null ? _this_instanceId : '',
                hostOrigin: window.location.origin,
                environmentId: this.environmentId,
                baseApiUrl: this.baseApiUrl,
                baseMPCRelayApiUrl: this.baseMPCRelayApiUrl,
                sdkVersion: (_this_sdkVersion1 = this.sdkVersion) != null ? _this_sdkVersion1 : ''
            });
            iframe.src = `${this.iframeDomain}/waas-v1/${this.environmentId}?${params.toString()}`;
            this.logger.debug('Creating iframe with src:', iframe.src);
            // Add iframe to the provided container
            container.appendChild(iframe);
            iframe.onload = ()=>{
                // The message listener is already set up, so iframe can send ready message
                this.logger.debug('Iframe onload fired, waiting for ready message...');
            };
            iframe.onerror = (error)=>{
                if (messageListener) {
                    window.removeEventListener('message', messageListener);
                }
                clearTimeout(iframeTimeoutId);
                this.logger.error('Iframe failed to load due to errors: ', error);
                reject(new Error('Failed to load iframe due to unknown load errors, this is likely a browser or network issue.'));
            };
            // Set up message listener BEFORE creating iframe
            messageListener = (event)=>{
                if (event.source === iframe.contentWindow && event.data === `iframe-ready-${this.instanceId}`) {
                    if (messageListener) {
                        window.removeEventListener('message', messageListener);
                    }
                    clearTimeout(iframeTimeoutId);
                    IframeManager.sharedIframe = iframe;
                    this.iframe = iframe;
                    IframeManager.iframeInstanceCount++;
                    resolve(iframe);
                    var _this_sdkVersion;
                    this.logger.info('Iframe loaded successfully...', {
                        iframeDomain: this.iframeDomain,
                        environmentId: this.environmentId,
                        sdkVersion: (_this_sdkVersion = this.sdkVersion) != null ? _this_sdkVersion : '',
                        instanceId: this.instanceId,
                        chainName: this.chainName
                    });
                }
            };
            window.addEventListener('message', messageListener);
        });
    }
    /**
   * Initializes the iframe display for a specific container.
   *
   * @param {HTMLElement} container - The container to which the iframe will be attached.
   * @returns:
   *   iframe: HTMLIFrameElement;
   *   iframeDisplay: IframeDisplayChannelAdapter;
   *   cleanup: () => void;
   */ async initializeIframeDisplayForContainer({ container }) {
        try {
            const iframe = await this.loadIframeForContainer(container);
            const transport = messageTransport.applyDefaultMessageOrigin({
                defaultOrigin: 'host',
                messageTransport: messageTransport.createMessageTransport()
            });
            setupMessageTransportBridge(transport, iframe, this.iframeDomain);
            const iframeDisplay = new iframeMessageHandler(transport);
            var _this_authMode;
            // if authMode is header: inform iframe the authMode with auth token
            // if authMode is cookie:  inform iframe the authMode with empty authToken
            await iframeDisplay.sendAuthToken(this.authToken, (_this_authMode = this.authMode) != null ? _this_authMode : core.AuthMode.HEADER);
            return {
                iframe,
                iframeDisplay,
                cleanup: ()=>{
                    container.removeChild(iframe);
                }
            };
        } catch (error) {
            this.logger.error('Error initializing iframe:', error);
            throw error;
        }
    }
    async cleanup() {
        await this.initializeMessageTransport();
        if (!this.iframeMessageHandler) {
            throw new Error('Iframe message handler not initialized');
        }
        await this.iframeMessageHandler.cleanup();
        if (this.iframe) {
            IframeManager.iframeInstanceCount--;
            if (IframeManager.sharedIframe && IframeManager.iframeInstanceCount === 0) {
                document.body.removeChild(IframeManager.sharedIframe);
                IframeManager.sharedIframe = null;
                IframeManager.iframeLoadPromise = null;
            }
            this.iframe = null;
        }
    }
    constructor({ environmentId, baseApiUrl, baseMPCRelayApiUrl, chainName, sdkVersion, authMode = core.AuthMode.HEADER, authToken, debug }){
        this.logger = logger;
        this.instanceId = null;
        this.iframeDomain = null;
        this.messageTransport = null;
        this.iframeMessageHandler = null;
        this.iframe = null;
        this.environmentId = environmentId;
        this.authToken = authToken;
        this.authMode = authMode;
        this.baseApiUrl = baseApiUrl;
        this.baseMPCRelayApiUrl = baseMPCRelayApiUrl;
        this.chainName = chainName;
        this.sdkVersion = sdkVersion;
        const environment = core.getEnvironmentFromUrl(baseApiUrl);
        this.iframeDomain = core.IFRAME_DOMAIN_MAP[environment];
        if (this.authMode === core.AuthMode.COOKIE) {
            this.iframeDomain = this.baseApiUrl;
        }
        // Generate unique instanceId when client is created
        this.instanceId = uuid.v4();
        this.debug = Boolean(debug);
        this.logger.setLogLevel(this.debug ? 'DEBUG' : 'INFO');
    }
}
IframeManager.iframeLoadPromise = null;
IframeManager.iframeLoadTimeout = 10000;
IframeManager.iframeLoadAttempts = 0;
IframeManager.maxRetryAttempts = 1;
IframeManager.sharedIframe = null;
IframeManager.iframeInstanceCount = 0;

class DynamicWalletClient extends IframeManager {
    async getWallets() {
        await this.initializeMessageTransport();
        if (!this.iframeMessageHandler) {
            throw new Error('Iframe message handler not initialized');
        }
        return this.iframeMessageHandler.getWallets({
            chainName: this.chainName
        });
    }
    async getWallet({ accountAddress, walletOperation = core.WalletOperation.NO_OPERATION, signedSessionId, authToken }) {
        await this.initializeMessageTransport();
        if (!this.iframeMessageHandler) {
            throw new Error('Iframe message handler not initialized');
        }
        return this.iframeMessageHandler.getWallet({
            chainName: this.chainName,
            accountAddress,
            walletOperation,
            signedSessionId,
            authToken
        });
    }
    async createWalletAccount({ thresholdSignatureScheme, password = undefined, signedSessionId, authToken }) {
        await this.initializeMessageTransport();
        if (!this.iframeMessageHandler) {
            throw new Error('Iframe message handler not initialized');
        }
        return this.iframeMessageHandler.createWalletAccount({
            chainName: this.chainName,
            thresholdSignatureScheme,
            password,
            signedSessionId,
            authToken
        });
    }
    async requiresPasswordForOperation({ accountAddress, walletOperation = core.WalletOperation.REACH_THRESHOLD, authToken }) {
        await this.initializeMessageTransport();
        if (!this.iframeMessageHandler) {
            throw new Error('Iframe message handler not initialized');
        }
        return this.iframeMessageHandler.requiresPasswordForOperation({
            chainName: this.chainName,
            accountAddress,
            walletOperation,
            authToken
        });
    }
    async isPasswordEncrypted({ accountAddress, authToken }) {
        await this.initializeMessageTransport();
        if (!this.iframeMessageHandler) {
            throw new Error('Iframe message handler not initialized');
        }
        return this.iframeMessageHandler.isPasswordEncrypted({
            chainName: this.chainName,
            accountAddress,
            authToken
        });
    }
    async signMessage({ message, accountAddress, password = undefined, signedSessionId, authToken, mfaToken, context }) {
        await this.initializeMessageTransport();
        if (!this.iframeMessageHandler) {
            throw new Error('Iframe message handler not initialized');
        }
        const contextString = JSON.stringify(context, (_key, value)=>typeof value === 'bigint' ? value.toString() : value);
        return this.iframeMessageHandler.signMessage({
            chainName: this.chainName,
            message,
            accountAddress,
            password,
            signedSessionId,
            authToken,
            mfaToken,
            context: contextString
        });
    }
    async signRawMessage({ message, accountAddress, password = undefined, signedSessionId, authToken, mfaToken, context }) {
        await this.initializeMessageTransport();
        if (!this.iframeMessageHandler) {
            throw new Error('Iframe message handler not initialized');
        }
        return this.iframeMessageHandler.signRawMessage({
            chainName: this.chainName,
            message,
            accountAddress,
            password,
            signedSessionId,
            authToken,
            mfaToken,
            context
        });
    }
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
   */ async signTransaction({ senderAddress, transaction, password = undefined, signedSessionId, authToken, mfaToken, chainId }) {
        await this.initializeMessageTransport();
        if (!this.iframeMessageHandler) {
            throw new Error('Iframe message handler not initialized');
        }
        return this.iframeMessageHandler.signTransaction({
            chainName: this.chainName,
            senderAddress,
            transaction,
            password,
            signedSessionId,
            authToken,
            mfaToken,
            chainId
        });
    }
    async signTypedData({ accountAddress, typedData, password = undefined, signedSessionId, authToken, mfaToken }) {
        await this.initializeMessageTransport();
        if (!this.iframeMessageHandler) {
            throw new Error('Iframe message handler not initialized');
        }
        return this.iframeMessageHandler.signTypedData({
            chainName: this.chainName,
            accountAddress,
            typedData: JSON.stringify(typedData),
            password,
            signedSessionId,
            authToken,
            mfaToken
        });
    }
    async backupKeySharesToGoogleDrive({ accountAddress, password = undefined, signedSessionId, authToken }) {
        await this.initializeMessageTransport();
        if (!this.iframeMessageHandler) {
            throw new Error('Iframe message handler not initialized');
        }
        return this.iframeMessageHandler.backupKeySharesToGoogleDrive({
            chainName: this.chainName,
            accountAddress,
            password,
            signedSessionId,
            authToken
        });
    }
    async delegateKeyShares({ accountAddress, password, signedSessionId, authToken, mfaToken }) {
        await this.initializeMessageTransport();
        if (!this.iframeMessageHandler) {
            throw new Error('Iframe message handler not initialized');
        }
        return this.iframeMessageHandler.delegateKeyShares({
            chainName: this.chainName,
            accountAddress,
            password,
            signedSessionId,
            authToken,
            mfaToken
        });
    }
    async restoreBackupFromGoogleDrive({ accountAddress, displayContainer, password, signedSessionId, authToken }) {
        const { iframeDisplay } = await this.initializeIframeDisplayForContainer({
            container: displayContainer
        });
        if (!iframeDisplay) {
            throw new Error('Failed to initialize iframe handler with display functionality');
        }
        return iframeDisplay.restoreBackupFromGoogleDrive({
            chainName: this.chainName,
            accountAddress,
            password,
            signedSessionId,
            authToken
        });
    }
    async refreshWalletAccountShares({ accountAddress, password, signedSessionId, authToken, mfaToken }) {
        await this.initializeMessageTransport();
        if (!this.iframeMessageHandler) {
            throw new Error('Iframe message handler not initialized');
        }
        return this.iframeMessageHandler.refreshWalletAccountShares({
            chainName: this.chainName,
            accountAddress: accountAddress,
            password: password,
            signedSessionId,
            authToken,
            mfaToken
        });
    }
    async reshare({ accountAddress, oldThresholdSignatureScheme, newThresholdSignatureScheme, password, signedSessionId, authToken, mfaToken }) {
        await this.initializeMessageTransport();
        if (!this.iframeMessageHandler) {
            throw new Error('Iframe message handler not initialized');
        }
        return this.iframeMessageHandler.reshare({
            chainName: this.chainName,
            accountAddress,
            oldThresholdSignatureScheme,
            newThresholdSignatureScheme,
            password,
            signedSessionId,
            authToken,
            mfaToken
        });
    }
    async exportPrivateKey({ accountAddress, displayContainer, password, signedSessionId, authToken, mfaToken }) {
        const { iframeDisplay } = await this.initializeIframeDisplayForContainer({
            container: displayContainer
        });
        if (!iframeDisplay) {
            throw new Error('Failed to initialize iframe handler with display functionality');
        }
        return iframeDisplay.exportPrivateKey({
            chainName: this.chainName,
            accountAddress,
            password,
            signedSessionId,
            authToken,
            mfaToken
        });
    }
    async verifyPassword({ accountAddress, password, walletOperation = core.WalletOperation.NO_OPERATION, signedSessionId, authToken }) {
        await this.initializeMessageTransport();
        if (!this.iframeMessageHandler) {
            throw new Error('Iframe message handler not initialized');
        }
        return this.iframeMessageHandler.verifyPassword({
            chainName: this.chainName,
            accountAddress,
            password,
            walletOperation,
            signedSessionId,
            authToken
        });
    }
    async updatePassword({ accountAddress, existingPassword, newPassword, signedSessionId, authToken }) {
        await this.initializeMessageTransport();
        if (!this.iframeMessageHandler) {
            throw new Error('Iframe message handler not initialized');
        }
        return this.iframeMessageHandler.updatePassword({
            chainName: this.chainName,
            accountAddress,
            existingPassword,
            newPassword,
            signedSessionId,
            authToken
        });
    }
    async importPrivateKey({ privateKey, thresholdSignatureScheme, signedSessionId, authToken }) {
        await this.initializeMessageTransport();
        if (!this.iframeMessageHandler) {
            throw new Error('Iframe message handler not initialized');
        }
        return this.iframeMessageHandler.importPrivateKey({
            chainName: this.chainName,
            privateKey,
            thresholdSignatureScheme,
            signedSessionId,
            authToken
        });
    }
    async exportClientKeyshares({ accountAddress, password, signedSessionId, authToken }) {
        await this.initializeMessageTransport();
        if (!this.iframeMessageHandler) {
            throw new Error('Iframe message handler not initialized');
        }
        return this.iframeMessageHandler.exportClientKeyshares({
            chainName: this.chainName,
            accountAddress,
            password,
            signedSessionId,
            authToken
        });
    }
    /**
   * keyShares is stringified list of EcdsaKeygenResult[] and Ed25519KeygenResult[]
   */ async offlineExportPrivateKey({ keyShares, derivationPath }) {
        await this.initializeMessageTransport();
        if (!this.iframeMessageHandler) {
            throw new Error('Iframe message handler not initialized');
        }
        const args = {
            chainName: this.chainName,
            keyShares,
            derivationPath
        };
        const serializedArgs = JSON.stringify(args);
        const argsBuffer = new TextEncoder().encode(serializedArgs);
        const base64Args = Buffer.from(argsBuffer).toString('base64');
        return this.iframeMessageHandler.offlineExportPrivateKey({
            chainName: this.chainName,
            base64Args
        });
    }
    constructor({ environmentId, authToken, baseApiUrl, baseMPCRelayApiUrl, chainName, sdkVersion, debug, authMode = core.AuthMode.HEADER }){
        super({
            environmentId,
            authToken,
            baseApiUrl,
            baseMPCRelayApiUrl,
            chainName,
            sdkVersion,
            debug,
            authMode
        });
    }
}

Object.defineProperty(exports, "AuthMode", {
    enumerable: true,
    get: function () { return core.AuthMode; }
});
Object.defineProperty(exports, "MPC_RELAY_PREPROD_API_URL", {
    enumerable: true,
    get: function () { return core.MPC_RELAY_PREPROD_API_URL; }
});
Object.defineProperty(exports, "MPC_RELAY_PROD_API_URL", {
    enumerable: true,
    get: function () { return core.MPC_RELAY_PROD_API_URL; }
});
Object.defineProperty(exports, "ThresholdSignatureScheme", {
    enumerable: true,
    get: function () { return core.ThresholdSignatureScheme; }
});
Object.defineProperty(exports, "WalletOperation", {
    enumerable: true,
    get: function () { return core.WalletOperation; }
});
exports.DynamicWalletClient = DynamicWalletClient;
