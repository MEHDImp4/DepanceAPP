// Mock for virtual:pwa-register/react
export function useRegisterSW(_options?: unknown) {
    return {
        needRefresh: [false, (_value: boolean) => { }],
        offlineReady: [false, (_value: boolean) => { }],
        updateServiceWorker: (_reloadPage?: boolean) => { },
    };
}
