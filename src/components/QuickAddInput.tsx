'use client';

import { useState } from 'react';
import { generateId, getTodayISO } from '@/lib/utils';
import { Task, Priority } from '@/types';

interface QuickAddInputProps {
    currentProjectId: string | null;
    onAddTask: (task: Task) => void;
    onOpenFullModal: () => void;
}

export default function QuickAddInput({
    currentProjectId,
    onAddTask,
    onOpenFullModal,
}: QuickAddInputProps) {
    const [title, setTitle] = useState('');
    const [isFocused, setIsFocused] = useState(false);

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
        <div className={`
      relative mb-6 transition-all duration-200
      ${isFocused ? 'scale-[1.01]' : 'scale-100'}
    `}>
            <div className={`
        flex items-center gap-3 px-4 py-3 rounded-xl border bg-card/50 transition-all
        ${isFocused
                    ? 'border-accent ring-1 ring-accent/20 shadow-lg'
                    : 'border-border hover:border-border-hover shadow-sm'
                }
      `}>
                {/* Plus Icon */}
                <div className={`
          flex items-center justify-center w-6 h-6 rounded-md transition-colors
          ${isFocused ? 'text-accent' : 'text-muted'}
        `}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                </div>

                {/* Input */}
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="Добавить задачу..."
                    className="flex-1 bg-transparent border-none outline-none text-[15px] placeholder:text-muted/60"
                />

                {/* Action Button (visible when typing or focused) */}
                <button
                    onClick={onOpenFullModal}
                    className={`
            text-xs font-medium px-2 py-1 rounded-md transition-all
            ${title.trim() || isFocused
                            ? 'opacity-100 text-muted hover:text-foreground hover:bg-white/5'
                            : 'opacity-0 pointer-events-none'
                        }
          `}
                    title="Расширенное добавление"
                >
                    Options ↵
                </button>

                {/* Enter Tip */}
                <div className={`
            text-[10px] text-muted transition-all duration-200
            ${title.trim() ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'}
          `}>
                    Enter
                </div>
            </div>
        </div>
    );
}
