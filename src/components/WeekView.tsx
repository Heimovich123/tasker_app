'use client';

import { useState } from 'react';
import { Task, Project, Subtask } from '@/types';
import { getWeekDates, isSameDay, getDayName, getDayNumber, toLocalYMD } from '@/lib/utils';

// Элемент дня: либо задача, либо подзадача
type DayItem =
    | { type: 'task'; task: Task; project?: Project }
    | { type: 'subtask'; subtask: Subtask; parentTask: Task; project?: Project };

interface WeekViewProps {
    tasks: Task[];
    projects: Project[];
    onToggleStatus: (task: Task) => void;
    onEdit: (task: Task) => void;
    onDelete: (id: string) => void;
    onUpdate?: (task: Task) => void;
}

export default function WeekView({
    tasks,
    projects,
    onToggleStatus,
    onEdit,
    onDelete,
    onUpdate,
}: WeekViewProps) {
    const [weekOffset, setWeekOffset] = useState(0);
    const weekDates = getWeekDates(weekOffset);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Форматируем диапазон дат для заголовка
    const firstDay = weekDates[0];
    const lastDay = weekDates[6];
    const formatShort = (d: Date) =>
        d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    const rangeLabel = `${formatShort(firstDay)} — ${formatShort(lastDay)}`;

    // Собираем элементы для каждого дня
    const getDayItems = (dateStr: string): DayItem[] => {
        const items: DayItem[] = [];

        tasks.forEach((task) => {
            const project = projects.find((p) => p.id === task.projectId);

            if (task.dueDate === dateStr) {
                items.push({ type: 'task', task, project });
            }

            if (task.subtasks) {
                task.subtasks.forEach((sub) => {
                    if (sub.dueDate === dateStr && !sub.completed) {
                        items.push({ type: 'subtask', subtask: sub, parentTask: task, project });
                    }
                });
            }
        });

        return items;
    };

    const handleToggleSubtask = (parentTask: Task, subtaskId: string) => {
        if (!onUpdate) return;
        const updatedSubtasks = parentTask.subtasks.map((s) =>
            s.id === subtaskId ? { ...s, completed: !s.completed } : s
        );
        onUpdate({ ...parentTask, subtasks: updatedSubtasks, updatedAt: new Date().toISOString() });
    };

    return (
        <div className="flex flex-col h-full min-h-0 gap-3">
            {/* Навигация по неделям */}
            <div className="flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setWeekOffset(weekOffset - 1)}
                        className="w-8 h-8 rounded-lg border border-border hover:bg-card-hover flex items-center justify-center text-muted hover:text-foreground transition-all"
                        title="Предыдущая неделя"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    {weekOffset !== 0 && (
                        <button
                            onClick={() => setWeekOffset(0)}
                            className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-all"
                        >
                            Сегодня
                        </button>
                    )}

                    <button
                        onClick={() => setWeekOffset(weekOffset + 1)}
                        className="w-8 h-8 rounded-lg border border-border hover:bg-card-hover flex items-center justify-center text-muted hover:text-foreground transition-all"
                        title="Следующая неделя"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>

                <span className="text-[13px] text-muted font-medium">
                    {rangeLabel}
                </span>
            </div>

            {/* Сетка дней */}
            <div className="grid grid-cols-7 gap-3 flex-1 min-h-0">
                {weekDates.map((date) => {
                    const dateStr = toLocalYMD(date);
                    const isCurrentDay = isSameDay(date, today);
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                    const dayItems = getDayItems(dateStr);

                    return (
                        <div
                            key={date.toISOString()}
                            className={`flex flex-col rounded-xl border overflow-hidden transition-all
              ${isCurrentDay
                                    ? 'border-accent/30 bg-[var(--accent-subtle)]'
                                    : isWeekend
                                        ? 'border-border bg-white/[0.02]'
                                        : 'border-border bg-card/30'
                                }`}
                        >
                            {/* Day Header */}
                            <div
                                className={`px-3 py-2.5 text-center border-b transition-all
                ${isCurrentDay
                                        ? 'border-accent/20 bg-accent/5'
                                        : isWeekend
                                            ? 'border-border bg-amber-500/5'
                                            : 'border-border'
                                    }`}
                            >
                                <p className={`text-[11px] uppercase tracking-wider font-medium ${isWeekend ? 'text-amber-400/70' : 'text-muted'}`}>
                                    {getDayName(date)}
                                </p>
                                <p
                                    className={`text-lg font-semibold mt-0.5
                  ${isCurrentDay ? 'text-accent' : isWeekend ? 'text-amber-400/60' : 'text-foreground'}`}
                                >
                                    {getDayNumber(date)}
                                </p>
                            </div>

                            {/* Items */}
                            <div className="flex-1 p-2 space-y-1 overflow-y-auto">
                                {dayItems.length === 0 ? (
                                    <p className="text-[11px] text-muted text-center py-4 opacity-50">
                                        —
                                    </p>
                                ) : (
                                    dayItems.map((item) =>
                                        item.type === 'task' ? (
                                            <MiniTaskCard
                                                key={`task-${item.task.id}`}
                                                task={item.task}
                                                project={item.project}
                                                onToggleStatus={onToggleStatus}
                                                onEdit={onEdit}
                                            />
                                        ) : (
                                            <MiniSubtaskCard
                                                key={`sub-${item.subtask.id}`}
                                                subtask={item.subtask}
                                                parentTask={item.parentTask}
                                                project={item.project}
                                                onToggle={() => handleToggleSubtask(item.parentTask, item.subtask.id)}
                                                onClickParent={() => onEdit(item.parentTask)}
                                            />
                                        )
                                    )
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ── Компактная карточка задачи ──
function MiniTaskCard({
    task,
    project,
    onToggleStatus,
    onEdit,
}: {
    task: Task;
    project?: Project;
    onToggleStatus: (task: Task) => void;
    onEdit: (task: Task) => void;
}) {
    const isDone = task.status === 'done';

    return (
        <div
            onClick={() => onEdit(task)}
            className={`group flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-all
        ${isDone ? 'opacity-50' : 'hover:bg-card-hover'}`}
        >
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onToggleStatus(task);
                }}
                className={`mt-0.5 w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center transition-all
          ${isDone ? 'bg-accent border-accent' : 'border-muted/40 hover:border-accent'}`}
            >
                {isDone && (
                    <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                )}
            </button>
            <div className="flex-1 min-w-0">
                <p
                    className={`text-[12px] leading-tight truncate font-medium
            ${isDone ? 'line-through text-muted' : 'text-foreground'}`}
                >
                    {task.title}
                </p>
                {project && (
                    <span
                        className="inline-block mt-0.5 text-[10px] font-medium"
                        style={{ color: project.color }}
                    >
                        {project.icon}
                    </span>
                )}
            </div>
        </div>
    );
}

// ── Компактная карточка подзадачи ──
function MiniSubtaskCard({
    subtask,
    parentTask,
    project,
    onToggle,
    onClickParent,
}: {
    subtask: Subtask;
    parentTask: Task;
    project?: Project;
    onToggle: () => void;
    onClickParent: () => void;
}) {
    return (
        <div
            onClick={onClickParent}
            className="group flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-all hover:bg-card-hover border-l-2 border-accent/20 ml-1"
        >
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onToggle();
                }}
                className="mt-0.5 w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center transition-all border-muted/40 hover:border-accent"
            >
            </button>
            <div className="flex-1 min-w-0">
                <p className="text-[12px] leading-tight truncate font-medium text-foreground">
                    {subtask.title}
                </p>
                <p className="text-[10px] text-muted/60 truncate mt-0.5">
                    ↳ {parentTask.title}
                </p>
            </div>
        </div>
    );
}
