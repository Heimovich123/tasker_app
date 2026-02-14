'use client';

import { useEffect, useState } from 'react';

interface ToastProps {
    message: string;
    actionLabel?: string;
    onAction?: () => void;
    onDismiss: () => void;
    duration?: number;
}

export default function Toast({
    message,
    actionLabel,
    onAction,
    onDismiss,
    duration = 5000,
}: ToastProps) {
    const [isLeaving, setIsLeaving] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLeaving(true);
            setTimeout(onDismiss, 300);
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onDismiss]);

    const handleAction = () => {
        if (onAction) onAction();
        setIsLeaving(true);
        setTimeout(onDismiss, 200);
    };

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100]">
            <div
                className={`flex items-center gap-4 px-5 py-3.5 rounded-xl border border-border bg-[#1a1a28] shadow-2xl transition-all duration-300
          ${isLeaving ? 'opacity-0 translate-y-3 scale-95' : 'opacity-100 translate-y-0 scale-100 animate-slideUp'}
        `}
            >
                <span className="text-[13px] text-foreground">{message}</span>
                {actionLabel && onAction && (
                    <button
                        onClick={handleAction}
                        className="text-[13px] font-semibold text-accent hover:text-accent-hover transition-colors whitespace-nowrap"
                    >
                        {actionLabel}
                    </button>
                )}
                <button
                    onClick={() => {
                        setIsLeaving(true);
                        setTimeout(onDismiss, 200);
                    }}
                    className="text-muted hover:text-foreground transition-colors ml-1"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
