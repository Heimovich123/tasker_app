'use client';

import { Task, Project } from '@/types';
import { getWeekDates, isSameDay, getDayName, getDayNumber, toLocalYMD } from '@/lib/utils';
import TaskCard from './TaskCard';

interface WeekViewProps {
    tasks: Task[];
    projects: Project[];
    onToggleStatus: (task: Task) => void;
    onEdit: (task: Task) => void;
    onDelete: (id: string) => void;
}

export default function WeekView({
    tasks,
    projects,
    onToggleStatus,
    onEdit,
    onDelete,
}: WeekViewProps) {
    const weekDates = getWeekDates();
    const today = new Date();

    return (
        <div className="grid grid-cols-7 gap-3 h-full min-h-0">
            {weekDates.map((date) => {
                const dateStr = toLocalYMD(date);
                const isCurrentDay = isSameDay(date, today);
                const dayTasks = tasks.filter((t) =>
                    t.dueDate === dateStr ||
                    (t.subtasks && t.subtasks.some(s => !s.completed && s.dueDate === dateStr))
                );

                return (
                    <div
                        key={date.toISOString()}
                        className={`flex flex-col rounded-xl border overflow-hidden transition-all
              ${isCurrentDay
                                ? 'border-accent/30 bg-[var(--accent-subtle)]'
                                : 'border-border bg-card/30'
                            }`}
                    >
                        {/* Day Header */}
                        <div
                            className={`px-3 py-2.5 text-center border-b transition-all
                ${isCurrentDay
                                    ? 'border-accent/20 bg-accent/5'
                                    : 'border-border'
                                }`}
                        >
                            <p className="text-[11px] uppercase tracking-wider text-muted font-medium">
                                {getDayName(date)}
                            </p>
                            <p
                                className={`text-lg font-semibold mt-0.5
                  ${isCurrentDay ? 'text-accent' : 'text-foreground'}`}
                            >
                                {getDayNumber(date)}
                            </p>
                        </div>

                        {/* Tasks */}
                        <div className="flex-1 p-2 space-y-1.5 overflow-y-auto">
                            {dayTasks.length === 0 ? (
                                <p className="text-[11px] text-muted text-center py-4 opacity-50">
                                    —
                                </p>
                            ) : (
                                dayTasks.map((task) => (
                                    <MiniTaskCard
                                        key={task.id}
                                        task={task}
                                        project={projects.find((p) => p.id === task.projectId)}
                                        onToggleStatus={onToggleStatus}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// Compact task card for week view
function MiniTaskCard({
    task,
    project,
    onToggleStatus,
    onEdit,
    onDelete,
}: {
    task: Task;
    project?: Project;
    onToggleStatus: (task: Task) => void;
    onEdit: (task: Task) => void;
    onDelete: (id: string) => void;
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
