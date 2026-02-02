// Mock for virtual:pwa-register/react
export function useRegisterSW(options?: any) {
    return {
        needRefresh: [false, (value: boolean) => { }],
        offlineReady: [false, (value: boolean) => { }],
        updateServiceWorker: (reloadPage?: boolean) => { },
    };
}
