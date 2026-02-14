'use client';

import { useState, useRef } from 'react';
import { generateId, getTodayISO } from '@/lib/utils';
import { Task } from '@/types';

interface QuickAddInputProps {
    currentProjectId: string | null;
    onAddTask: (task: Task) => void;
}

export default function QuickAddInput({
    currentProjectId,
    onAddTask,
}: QuickAddInputProps) {
    const [title, setTitle] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && title.trim()) {
            e.preventDefault();
            const now = new Date().toISOString();
            const newTask: Task = {
                id: generateId(),
                title: title.trim(),
                description: '',
                projectId: currentProjectId,
                priority: 'medium',
                status: 'todo',
                dueDate: getTodayISO(),
                subtasks: [],
                recurrence: 'none',
                order: 0,
                completedAt: null,
                createdAt: now,
                updatedAt: now,
            };
            onAddTask(newTask);
            setTitle('');
        } else if (e.key === 'Escape') {
            setTitle('');
            (e.target as HTMLInputElement).blur();
        }
    };

    return (
        <div
            onClick={() => inputRef.current?.focus()}
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-border bg-card/50 hover:border-border-hover focus-within:border-accent focus-within:ring-1 focus-within:ring-accent/20 transition-all cursor-text"
        >
            <svg className="w-4 h-4 text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <input
                ref={inputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Новая задача — Enter чтобы добавить"
                className="flex-1 bg-transparent border-none outline-none text-[14px] placeholder:text-muted/50"
            />
            {title.trim() && (
                <kbd className="text-[10px] text-muted/60 bg-white/5 px-1.5 py-0.5 rounded border border-border font-mono">
                    Enter ↵
                </kbd>
            )}
        </div>
    );
}
