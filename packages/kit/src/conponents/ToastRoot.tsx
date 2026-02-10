import React from 'react';
import { observer } from 'mobx-react-lite';
import { createPortal } from 'react-dom';
import { getToastsStore } from '../api/toasts';
import {Toast} from "./Toast";
export const ToastRoot = observer(function ToastRoot() {
    const toasts = getToastsStore();
    if (toasts.list.length === 0) return null;

    return createPortal(
        <>
            <div
                className="fixed right-4 bottom-4 flex flex-col gap-3 pointer-events-none"
                style={{ zIndex: 9999 }}
            >
                {toasts.list.map(t => (
                    <div
                        key={t.id}
                        className={`pointer-events-auto ${t.closing ? 'ks-toast-leave' : 'ks-toast-enter'}`}
                    >
                        <Toast
                            variant={t.variant === 'error' ? 'error' : 'default'}
                            onClose={() => toasts.remove(t.id)}
                        >
                            {t.content}
                        </Toast>
                    </div>
                ))}
            </div>
        </>,
        document.body
    );
});
