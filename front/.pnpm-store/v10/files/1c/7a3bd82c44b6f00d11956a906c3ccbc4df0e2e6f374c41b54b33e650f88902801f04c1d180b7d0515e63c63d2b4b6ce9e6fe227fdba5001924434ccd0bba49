import type { ProviderEnum } from '@dynamic-labs/sdk-api-core';
export type SocialProvider = `${Extract<ProviderEnum, ProviderEnum.Apple | ProviderEnum.Discord | ProviderEnum.Facebook | ProviderEnum.Github | ProviderEnum.Google | ProviderEnum.Linkedin | ProviderEnum.Microsoft | ProviderEnum.Epicgames | ProviderEnum.Steam | ProviderEnum.Tiktok | ProviderEnum.Twitch | ProviderEnum.Twitter>}`;
type SignInWithSocialRedirectParams = {
    captchaToken?: string;
    provider: SocialProvider;
    redirectUrl: string;
};
/** Redirects the user to the OAuth provider's authorization page */
export declare const signInWithSocialRedirect: ({ provider, redirectUrl, captchaToken }: SignInWithSocialRedirectParams, client?: import("../../../../../exports").DynamicClient) => Promise<void>;
export {};
//# sourceMappingURL=signInWithSocialRedirect.d.ts.map