import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

/* =========================================
   Toast Notification
   ========================================= */
export const ThemeToast = ({ message, type = 'info', onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bg = type === 'error' ? 'rgba(255, 59, 48, 0.9)' : 'rgba(0, 0, 0, 0.8)';

    return (
        <div style={{
            position: 'fixed',
            bottom: '110px',
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '0 20px',
            pointerEvents: 'none'
        }}>
            <div className="animate-slide-up" style={{
                backgroundColor: bg,
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '12px',
                boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                pointerEvents: 'auto',
                maxWidth: '100%',
                textAlign: 'center'
            }}>
                <span className="font-bold" style={{ fontSize: '14px' }}>{message}</span>
            </div>
        </div>
    );
};

/* =========================================
   Confirmation Modal
   ========================================= */
export const ThemeModal = ({ title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', isDestructive = false }) => {
    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '40px'
        }} className="animate-fade-in" onClick={onCancel}>
            <div style={{
                backgroundColor: 'var(--color-bg-card)',
                width: '100%',
                maxWidth: '280px',
                borderRadius: '16px',
                textAlign: 'center',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                border: '0.5px solid rgba(255,255,255,0.1)'
            }} className="animate-scale-in" onClick={e => e.stopPropagation()}>
                <div style={{ padding: '24px 20px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: 'var(--color-text-primary)' }}>{title}</h3>
                    {message && <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>{message}</p>}
                </div>

                <div style={{
                    display: 'flex',
                    borderTop: '0.5px solid var(--color-separator)',
                    backgroundColor: 'rgba(255,255,255,0.02)'
                }}>
                    {onCancel && (
                        <button onClick={onCancel} style={{
                            flex: 1,
                            padding: '14px',
                            color: 'var(--color-accent)',
                            fontSize: '17px',
                            fontWeight: '400',
                            borderRight: '0.5px solid var(--color-separator)',
                            background: 'transparent'
                        }}>
                            {cancelText}
                        </button>
                    )}
                    <button onClick={onConfirm} style={{
                        flex: 1,
                        padding: '14px',
                        color: isDestructive ? 'var(--color-danger)' : 'var(--color-accent)',
                        fontSize: '17px',
                        fontWeight: '700',
                        background: 'transparent'
                    }}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
