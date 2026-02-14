'use client';

import { useState, useEffect } from 'react';
import { Task, Project, Priority, TaskStatus, RecurrenceType, Subtask, PRIORITY_LABELS, STATUS_LABELS, RECURRENCE_LABELS } from '@/types';
import { generateId, getTodayISO } from '@/lib/utils';

interface TaskModalProps {
    task: Task | null; // null = create mode
    projects: Project[];
    onSave: (task: Task) => void;
    onClose: () => void;
}

export default function TaskModal({ task, projects, onSave, onClose }: TaskModalProps) {
    const isEdit = task !== null;

    const [title, setTitle] = useState(task?.title ?? '');
    const [description, setDescription] = useState(task?.description ?? '');
    const [projectId, setProjectId] = useState<string | null>(task?.projectId ?? null);
    const [priority, setPriority] = useState<Priority>(task?.priority ?? 'medium');
    const [status, setStatus] = useState<TaskStatus>(task?.status ?? 'todo');
    const [dueDate, setDueDate] = useState(task?.dueDate ?? getTodayISO());
    const [subtasks, setSubtasks] = useState<Subtask[]>(task?.subtasks ?? []);
    const [recurrence, setRecurrence] = useState<RecurrenceType>(task?.recurrence ?? 'none');
    const [newSubtask, setNewSubtask] = useState('');

    // Close on Escape
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose]);

    const handleSave = () => {
        if (!title.trim()) return;

        const now = new Date().toISOString();
        const savedTask: Task = {
            id: task?.id ?? generateId(),
            title: title.trim(),
            description: description.trim(),
            projectId,
            priority,
            status,
            dueDate,
            subtasks,
            recurrence,
            order: task?.order ?? 0,
            completedAt: task?.completedAt ?? null,
            createdAt: task?.createdAt ?? now,
            updatedAt: now,
        };
        onSave(savedTask);
    };

    const addSubtask = () => {
        if (!newSubtask.trim()) return;
        setSubtasks([
            ...subtasks,
            { id: generateId(), title: newSubtask.trim(), completed: false },
        ]);
        setNewSubtask('');
    };

    const toggleSubtask = (id: string) => {
        setSubtasks(
            subtasks.map((s) =>
                s.id === id ? { ...s, completed: !s.completed } : s
            )
        );
    };

    const removeSubtask = (id: string) => {
        setSubtasks(subtasks.filter((s) => s.id !== id));
    };

    const handleSubtaskKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addSubtask();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-overlayIn"
            onClick={onClose}
        >
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Modal */}
            <div
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-lg bg-[#14141e] border border-border rounded-2xl shadow-2xl animate-modalIn overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <h2 className="text-lg font-semibold text-foreground">
                        {isEdit ? 'Редактировать задачу' : 'Новая задача'}
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

                {/* Body */}
                <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
                    {/* Title */}
                    <div>
                        <label className="block text-[12px] font-medium text-muted mb-1.5 uppercase tracking-wide">
                            Название
                        </label>
                        <input
                            id="task-title-input"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Что нужно сделать?"
                            autoFocus
                            className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted/50 text-[14px] focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-[12px] font-medium text-muted mb-1.5 uppercase tracking-wide">
                            Описание
                        </label>
                        <textarea
                            id="task-desc-input"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Подробности (необязательно)"
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted/50 text-[14px] focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all resize-none"
                        />
                    </div>

                    {/* Date + Priority + Status row */}
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-[12px] font-medium text-muted mb-1.5 uppercase tracking-wide">
                                Дата
                            </label>
                            <input
                                id="task-date-input"
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl bg-card border border-border text-foreground text-[13px] focus:outline-none focus:border-accent transition-all [color-scheme:dark]"
                            />
                        </div>
                        <div>
                            <label className="block text-[12px] font-medium text-muted mb-1.5 uppercase tracking-wide">
                                Приоритет
                            </label>
                            <select
                                id="task-priority-select"
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as Priority)}
                                className="w-full px-3 py-2.5 rounded-xl bg-card border border-border text-foreground text-[13px] focus:outline-none focus:border-accent transition-all appearance-none cursor-pointer"
                            >
                                {(Object.entries(PRIORITY_LABELS) as [Priority, string][]).map(
                                    ([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    )
                                )}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[12px] font-medium text-muted mb-1.5 uppercase tracking-wide">
                                Статус
                            </label>
                            <select
                                id="task-status-select"
                                value={status}
                                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                                className="w-full px-3 py-2.5 rounded-xl bg-card border border-border text-foreground text-[13px] focus:outline-none focus:border-accent transition-all appearance-none cursor-pointer"
                            >
                                {(Object.entries(STATUS_LABELS) as [TaskStatus, string][]).map(
                                    ([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    )
                                )}
                            </select>
                        </div>
                    </div>

                    {/* Project */}
                    <div>
                        <label className="block text-[12px] font-medium text-muted mb-1.5 uppercase tracking-wide">
                            Проект
                        </label>
                        <select
                            id="task-project-select"
                            value={projectId ?? ''}
                            onChange={(e) => setProjectId(e.target.value || null)}
                            className="w-full px-3 py-2.5 rounded-xl bg-card border border-border text-foreground text-[13px] focus:outline-none focus:border-accent transition-all appearance-none cursor-pointer"
                        >
                            <option value="">Без проекта</option>
                            {projects.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.icon} {p.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Recurrence */}
                    <div>
                        <label className="block text-[12px] font-medium text-muted mb-1.5 uppercase tracking-wide">
                            Повторение
                        </label>
                        <select
                            id="task-recurrence-select"
                            value={recurrence}
                            onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
                            className="w-full px-3 py-2.5 rounded-xl bg-card border border-border text-foreground text-[13px] focus:outline-none focus:border-accent transition-all appearance-none cursor-pointer"
                        >
                            {(Object.entries(RECURRENCE_LABELS) as [RecurrenceType, string][]).map(
                                ([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                )
                            )}
                        </select>
                    </div>

                    {/* Subtasks */}
                    <div>
                        <label className="block text-[12px] font-medium text-muted mb-1.5 uppercase tracking-wide">
                            Подзадачи
                        </label>
                        <div className="space-y-1.5 mb-2">
                            {subtasks.map((sub) => (
                                <div
                                    key={sub.id}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card/50 border border-border group"
                                >
                                    <button
                                        onClick={() => toggleSubtask(sub.id)}
                                        className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all
                      ${sub.completed
                                                ? 'bg-accent border-accent'
                                                : 'border-muted/40 hover:border-accent'
                                            }`}
                                    >
                                        {sub.completed && (
                                            <svg
                                                className="w-2.5 h-2.5 text-white"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={3}
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M5 13l4 4L19 7"
                                                />
                                            </svg>
                                        )}
                                    </button>
                                    <span
                                        className={`flex-1 text-[13px] ${sub.completed ? 'line-through text-muted' : 'text-foreground'
                                            }`}
                                    >
                                        {sub.title}
                                    </span>
                                    <button
                                        onClick={() => removeSubtask(sub.id)}
                                        className="opacity-0 group-hover:opacity-100 text-muted hover:text-[var(--danger)] transition-all"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                id="subtask-input"
                                type="text"
                                value={newSubtask}
                                onChange={(e) => setNewSubtask(e.target.value)}
                                onKeyDown={handleSubtaskKeyDown}
                                placeholder="Добавить подзадачу..."
                                className="flex-1 px-3 py-2 rounded-lg bg-card border border-border text-foreground placeholder:text-muted/50 text-[13px] focus:outline-none focus:border-accent transition-all"
                            />
                            <button
                                onClick={addSubtask}
                                disabled={!newSubtask.trim()}
                                className="px-3 py-2 rounded-lg bg-card border border-border text-muted hover:text-accent hover:border-accent disabled:opacity-30 transition-all text-[13px]"
                            >
                                +
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl text-[13px] font-medium text-muted hover:text-foreground hover:bg-card transition-all"
                    >
                        Отмена
                    </button>
                    <button
                        id="save-task-btn"
                        onClick={handleSave}
                        disabled={!title.trim()}
                        className="px-5 py-2.5 rounded-xl text-[13px] font-medium bg-accent text-white hover:bg-accent-hover disabled:opacity-40 transition-all glow-accent"
                    >
                        {isEdit ? 'Сохранить' : 'Создать'}
                    </button>
                </div>
            </div>
        </div>
    );
}
