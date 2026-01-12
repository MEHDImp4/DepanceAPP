import { useRegisterSW } from 'virtual:pwa-register/react'

function ReloadPrompt() {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW()

    const close = () => {
        setOfflineReady(false)
        setNeedRefresh(false)
    }

    return (
        <div className="ReloadPrompt-container">
            {(offlineReady || needRefresh) && (
                <div className="fixed bottom-4 right-4 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg z-50 flex flex-col gap-2 max-w-sm animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <div className="text-sm text-zinc-600 dark:text-zinc-300">
                        {offlineReady
                            ? <span>App ready to work offline</span>
                            : <span>New content available, click on reload button to update.</span>
                        }
                    </div>
                    <div className="flex gap-2 mt-2">
                        {needRefresh && (
                            <button
                                className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
                                onClick={() => updateServiceWorker(true)}
                            >
                                Reload
                            </button>
                        )}
                        <button
                            className="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                            onClick={() => close()}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ReloadPrompt
