'use client';

import { useState, useRef, useEffect } from 'react';
import { Priority, Project, PRIORITY_LABELS } from '@/types';

interface BulkActionBarProps {
    selectedCount: number;
    projects: Project[];
    onSetPriority: (priority: Priority) => void;
    onSetDate: (date: string) => void;
    onSetProject: (projectId: string | null) => void;
    onDelete: () => void;
    onClearSelection: () => void;
}

const priorityDot: Record<Priority, string> = {
    high: 'bg-[var(--priority-high)]',
    medium: 'bg-[var(--priority-medium)]',
    low: 'bg-[var(--priority-low)]',
};

export default function BulkActionBar({
    selectedCount,
    projects,
    onSetPriority,
    onSetDate,
    onSetProject,
    onDelete,
    onClearSelection,
}: BulkActionBarProps) {
    const [openMenu, setOpenMenu] = useState<'priority' | 'date' | 'project' | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu on outside click
    useEffect(() => {
        if (!openMenu) return;
        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpenMenu(null);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [openMenu]);

    if (selectedCount === 0) return null;

    const handleDateOffset = (offset: number) => {
        const d = new Date();
        d.setDate(d.getDate() + offset);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        onSetDate(`${yyyy}-${mm}-${dd}`);
        setOpenMenu(null);
    };

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slideUp">
            <div ref={menuRef} className="flex items-center gap-2 bg-[#1a1a28] border border-border rounded-2xl shadow-2xl shadow-black/30 px-5 py-3">
                {/* Count + close */}
                <div className="flex items-center gap-2 mr-2 pr-3 border-r border-border">
                    <span className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center text-white text-[13px] font-bold">
                        {selectedCount}
                    </span>
                    <span className="text-[14px] text-foreground font-medium">
                        {selectedCount === 1
                            ? 'задача'
                            : selectedCount < 5
                                ? 'задачи'
                                : 'задач'}
                    </span>
                </div>

                {/* Priority */}
                <div className="relative">
                    <button
                        onClick={() => setOpenMenu(openMenu === 'priority' ? null : 'priority')}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] text-muted hover:text-foreground hover:bg-white/5 transition-all"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                        </svg>
                        Приоритет
                    </button>
                    {openMenu === 'priority' && (
                        <div className="absolute bottom-full mb-2 left-0 py-1.5 px-1 rounded-xl border border-border bg-[#1a1a28] shadow-xl min-w-[140px] animate-scaleIn">
                            {(Object.entries(PRIORITY_LABELS) as [Priority, string][]).map(([val, label]) => (
                                <button
                                    key={val}
                                    onClick={() => { onSetPriority(val); setOpenMenu(null); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-muted hover:text-foreground hover:bg-white/5 transition-colors"
                                >
                                    <span className={`w-2.5 h-2.5 rounded-full ${priorityDot[val]}`} />
                                    {label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Date */}
                <div className="relative">
                    <button
                        onClick={() => setOpenMenu(openMenu === 'date' ? null : 'date')}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] text-muted hover:text-foreground hover:bg-white/5 transition-all"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Дата
                    </button>
                    {openMenu === 'date' && (
                        <div className="absolute bottom-full mb-2 left-0 py-1.5 px-1 rounded-xl border border-border bg-[#1a1a28] shadow-xl min-w-[150px] animate-scaleIn">
                            {[
                                { label: 'Сегодня', offset: 0 },
                                { label: 'Завтра', offset: 1 },
                            ].map((opt) => (
                                <button
                                    key={opt.offset}
                                    onClick={() => handleDateOffset(opt.offset)}
                                    className="w-full text-left px-3 py-2 rounded-lg text-[13px] text-muted hover:text-foreground hover:bg-white/5 transition-colors"
                                >
                                    {opt.label}
                                </button>
                            ))}
                            <button
                                onClick={() => { onSetDate(''); setOpenMenu(null); }}
                                className="w-full text-left px-3 py-2 rounded-lg text-[13px] text-muted hover:text-foreground hover:bg-white/5 transition-colors"
                            >
                                Без даты
                            </button>
                            <div className="border-t border-border mt-1 pt-1 px-2 pb-1">
                                <input
                                    type="date"
                                    onChange={(e) => { if (e.target.value) { onSetDate(e.target.value); setOpenMenu(null); } }}
                                    className="w-full bg-white/5 border border-border rounded-lg px-3 py-2 text-[13px] text-foreground outline-none focus:border-accent cursor-pointer"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Project */}
                {projects.length > 0 && (
                    <div className="relative">
                        <button
                            onClick={() => setOpenMenu(openMenu === 'project' ? null : 'project')}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] text-muted hover:text-foreground hover:bg-white/5 transition-all"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                            Проект
                        </button>
                        {openMenu === 'project' && (
                            <div className="absolute bottom-full mb-2 left-0 py-1.5 px-1 rounded-xl border border-border bg-[#1a1a28] shadow-xl min-w-[160px] animate-scaleIn">
                                <button
                                    onClick={() => { onSetProject(null); setOpenMenu(null); }}
                                    className="w-full text-left px-3 py-2 rounded-lg text-[13px] text-muted hover:text-foreground hover:bg-white/5 transition-colors"
                                >
                                    Без проекта
                                </button>
                                {projects.map((p) => (
                                    <button
                                        key={p.id}
                                        onClick={() => { onSetProject(p.id); setOpenMenu(null); }}
                                        className="w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg text-[13px] text-muted hover:text-foreground hover:bg-white/5 transition-colors"
                                    >
                                        <span style={{ color: p.color }}>{p.icon}</span>
                                        {p.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Divider */}
                <div className="w-px h-6 bg-border mx-1" />

                {/* Delete */}
                <button
                    onClick={() => { onDelete(); setOpenMenu(null); }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-all"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Удалить
                </button>

                {/* Close */}
                <button
                    onClick={onClearSelection}
                    className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-muted hover:text-foreground transition-all ml-1"
                    title="Снять выделение"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
