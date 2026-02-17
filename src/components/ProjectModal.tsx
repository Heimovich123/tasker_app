'use client';

import { useState, useEffect } from 'react';
import { Project, PROJECT_COLORS, PROJECT_ICONS } from '@/types';
import { generateId } from '@/lib/utils';

interface ProjectModalProps {
    project: Project | null;
    onSave: (project: Project) => void;
    onDelete?: (id: string) => void;
    onClose: () => void;
}

export default function ProjectModal({
    project,
    onSave,
    onDelete,
    onClose,
}: ProjectModalProps) {
    const isEdit = project !== null;

    const [name, setName] = useState(project?.name ?? '');
    const [color, setColor] = useState(project?.color ?? PROJECT_COLORS[0]);
    const [icon, setIcon] = useState(project?.icon ?? PROJECT_ICONS[0]);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose]);

    const handleSave = () => {
        if (!name.trim()) return;
        const saved: Project = {
            id: project?.id ?? generateId(),
            name: name.trim(),
            color,
            icon,
            createdAt: project?.createdAt ?? new Date().toISOString(),
        };
        onSave(saved);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-overlayIn"
            onClick={onClose}
        >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            <div
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-md bg-[#14141e] border border-border rounded-2xl shadow-2xl animate-modalIn overflow-hidden"
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <h2 className="text-lg font-semibold text-foreground">
                        {isEdit ? 'Редактировать проект' : 'Новый проект'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-muted hover:text-foreground transition-colors p-1"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="px-6 py-5 space-y-5">
                    {/* Preview */}
                    <div className="flex items-center justify-center py-4">
                        <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all"
                            style={{ backgroundColor: `${color}20`, color }}
                        >
                            {icon}
                        </div>
                    </div>

                    {/* Name */}
                    <div>
                        <label className="block text-[12px] font-medium text-muted mb-1.5 uppercase tracking-wide">
                            Название
                        </label>
                        <input
                            id="project-name-input"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Название проекта"
                            autoFocus
                            className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted/50 text-[14px] focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all"
                        />
                    </div>

                    {/* Color */}
                    <div>
                        <label className="block text-[12px] font-medium text-muted mb-2 uppercase tracking-wide">
                            Цвет
                        </label>
                        <div className="flex gap-2 flex-wrap">
                            {PROJECT_COLORS.map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setColor(c)}
                                    className={`w-8 h-8 rounded-full transition-all ${color === c
                                        ? 'ring-2 ring-offset-2 ring-offset-[#14141e] scale-110'
                                        : 'hover:scale-110'
                                        }`}
                                    style={{
                                        backgroundColor: c,
                                        '--tw-ring-color': color === c ? c : undefined,
                                    } as React.CSSProperties}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Icon */}
                    <div>
                        <label className="block text-[12px] font-medium text-muted mb-2 uppercase tracking-wide">
                            Иконка
                        </label>
                        <div className="flex gap-2 flex-wrap">
                            {PROJECT_ICONS.map((i) => (
                                <button
                                    key={i}
                                    onClick={() => setIcon(i)}
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all border
                    ${icon === i
                                            ? 'border-accent bg-accent/10 text-accent'
                                            : 'border-border bg-card text-muted hover:text-foreground hover:border-border-hover'
                                        }`}
                                >
                                    {i}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                    <div>
                        {isEdit && onDelete && (
                            <button
                                onClick={() => onDelete(project.id)}
                                className="px-4 py-2 rounded-xl text-[13px] font-medium text-[var(--danger)] hover:bg-[var(--danger-bg)] transition-all"
                            >
                                Удалить
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl text-[13px] font-medium text-muted hover:text-foreground hover:bg-card transition-all"
                        >
                            Отмена
                        </button>
                        <button
                            id="save-project-btn"
                            onClick={handleSave}
                            disabled={!name.trim()}
                            className="px-5 py-2.5 rounded-xl text-[13px] font-medium bg-accent text-white hover:bg-accent-hover disabled:opacity-40 transition-all glow-accent"
                        >
                            {isEdit ? 'Сохранить' : 'Создать'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
