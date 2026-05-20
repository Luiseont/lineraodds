import type { DynamicClient } from '../../../client/types';
/**
 * Maps the state keys to the event names.
 *
 * This is mainly to ensure that whenever a new state key is added, the developer
 * will have to come to this file and remember to add it here and in the interface.
 */
export declare const stateChangeEvents: {
    initStatus: "initStatusChanged";
    mfaToken: "mfaTokenChanged";
    projectSettings: "projectSettingsChanged";
    token: "tokenChanged";
    user: "userChanged";
};
declare global {
    interface DynamicEvents {
        initStatusChanged: (args: {
            initStatus: DynamicClient['initStatus'];
        }) => void;
        mfaTokenChanged: (args: {
            mfaToken: DynamicClient['mfaToken'];
        }) => void;
        projectSettingsChanged: (args: {
            projectSettings: DynamicClient['projectSettings'];
        }) => void;
        tokenChanged: (args: {
            token: DynamicClient['token'];
        }) => void;
        userChanged: (args: {
            user: DynamicClient['user'];
        }) => void;
    }
}
export type DynamicStateChangeEvents = DynamicEvents[(typeof stateChangeEvents)[keyof typeof stateChangeEvents]];
//# sourceMappingURL=events.d.ts.map