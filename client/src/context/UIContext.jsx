import React, { createContext, useContext, useState, useCallback } from 'react';
import { ThemeToast, ThemeModal } from '../components/ThemeUI';

const UIContext = createContext();

export const useUI = () => useContext(UIContext);

export const UIProvider = ({ children }) => {
    const [toast, setToast] = useState(null); // { message, type }
    const [modal, setModal] = useState(null); // { title, message, onConfirm, isDestructive, confirmText }
    const [isPrivacyMode, setIsPrivacyMode] = useState(() => {
        return localStorage.getItem('depance_privacy_mode') === 'true';
    });

    const togglePrivacyMode = useCallback(() => {
        setIsPrivacyMode(prev => {
            const newValue = !prev;
            localStorage.setItem('depance_privacy_mode', String(newValue));
            return newValue;
        });
    }, []);

    const showToast = useCallback((message, type = 'info') => {
        setToast({ message, type });
    }, []);

    const showConfirm = useCallback((title, message, onConfirm, options = {}) => {
        setModal({
            title,
            message,
            onConfirm: () => {
                onConfirm();
                setModal(null);
            },
            onCancel: () => setModal(null),
            isDestructive: options.isDestructive || false,
            confirmText: options.confirmText || 'Confirm',
            cancelText: options.cancelText || 'Cancel'
        });
    }, []);

    const showAlert = useCallback((title, message) => {
        setModal({
            title,
            message,
            onConfirm: () => setModal(null),
            onCancel: null, // No cancel button for alerts, just OK
            confirmText: 'OK',
            isDestructive: false
        });
    }, []);

    return (
        <UIContext.Provider value={{ showToast, showConfirm, showAlert, isPrivacyMode, togglePrivacyMode }}>
            {children}
            {toast && <ThemeToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            {modal && (
                <ThemeModal
                    title={modal.title}
                    message={modal.message}
                    onConfirm={modal.onConfirm}
                    onCancel={modal.onCancel || modal.onConfirm} // If no cancel, allow clicking outside or mapped to confirm for "OK" feel? actually Modals usually force choice.
                    // If onCancel is null (showAlert), we need to hide the cancel button in UI.
                    // But for now let's just make onCancel map to closing it if strictly alert.
                    // Modified logic:
                    confirmText={modal.confirmText}
                    cancelText={modal.cancelText}
                    isDestructive={modal.isDestructive}
                />
            )}
        </UIContext.Provider>
    );
};
