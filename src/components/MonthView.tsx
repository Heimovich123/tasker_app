'use client';

import { useState, useMemo } from 'react';
import { Task, Project, Priority } from '@/types';
import { isSameDay } from '@/lib/utils';

interface MonthViewProps {
    tasks: Task[];
    projects: Project[];
    onToggleStatus: (task: Task) => void;
    onEdit: (task: Task) => void;
    onDelete: (id: string) => void;
}

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const MONTH_NAMES = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

const priorityColor: Record<Priority, string> = {
    high: 'var(--priority-high)',
    medium: 'var(--priority-medium)',
    low: 'var(--priority-low)',
};

export default function MonthView({ tasks, projects, onToggleStatus, onEdit, onDelete }: MonthViewProps) {
    const [viewDate, setViewDate] = useState(new Date());
    const today = new Date();

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    // Build calendar grid
    const calendarDays = useMemo(() => {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        // Monday = 0, Sunday = 6
        let startDow = firstDay.getDay() - 1;
        if (startDow < 0) startDow = 6;

        const days: { date: Date; isCurrentMonth: boolean }[] = [];

        // Previous month filler days
        for (let i = startDow - 1; i >= 0; i--) {
            const d = new Date(year, month, -i);
            days.push({ date: d, isCurrentMonth: false });
        }

        // Current month days
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push({ date: new Date(year, month, i), isCurrentMonth: true });
        }

        // Next month filler (fill to 6 rows × 7 = 42 cells, or at least complete the row)
        const remaining = 7 - (days.length % 7);
        if (remaining < 7) {
            for (let i = 1; i <= remaining; i++) {
                days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
            }
        }

        return days;
    }, [year, month]);

    const goToPrevMonth = () => setViewDate(new Date(year, month - 1, 1));
    const goToNextMonth = () => setViewDate(new Date(year, month + 1, 1));
    const goToThisMonth = () => setViewDate(new Date());

    return (
        <div className="flex flex-col h-full animate-fadeIn">
            {/* Navigation */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-foreground">
                        {MONTH_NAMES[month]} {year}
                    </h2>
                    {(month !== today.getMonth() || year !== today.getFullYear()) && (
                        <button
                            onClick={goToThisMonth}
                            className="text-[12px] px-3 py-1 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors font-medium"
                        >
                            Сегодня
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={goToPrevMonth}
                        className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-muted hover:text-foreground transition-all"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={goToNextMonth}
                        className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-muted hover:text-foreground transition-all"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-px mb-1">
                {WEEKDAYS.map((day) => (
                    <div key={day} className="text-center text-[12px] text-muted font-medium uppercase tracking-wider py-2">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-px flex-1 bg-border rounded-xl overflow-hidden">
                {calendarDays.map((cell, idx) => {
                    const isToday = isSameDay(cell.date, today);
                    const dayTasks = tasks.filter((t) =>
                        isSameDay(new Date(t.dueDate), cell.date)
                    );
                    const doneTasks = dayTasks.filter((t) => t.status === 'done').length;
                    const activeTasks = dayTasks.filter((t) => t.status !== 'done');

                    return (
                        <div
                            key={idx}
                            className={`flex flex-col p-2 min-h-[100px] transition-colors
                                ${cell.isCurrentMonth ? 'bg-card' : 'bg-card/40'}
                                ${isToday ? 'bg-[var(--accent-subtle)]' : ''}
                            `}
                        >
                            {/* Day number */}
                            <div className="flex items-center justify-between mb-1.5">
                                <span
                                    className={`text-[13px] font-medium w-7 h-7 flex items-center justify-center rounded-lg
                                        ${isToday ? 'bg-accent text-white' : ''}
                                        ${cell.isCurrentMonth ? (isToday ? '' : 'text-foreground') : 'text-muted/40'}
                                    `}
                                >
                                    {cell.date.getDate()}
                                </span>
                                {dayTasks.length > 0 && doneTasks > 0 && (
                                    <span className="text-[10px] text-muted">
                                        {doneTasks}/{dayTasks.length}
                                    </span>
                                )}
                            </div>

                            {/* Tasks in cell — max 3 visible, then "+N more" */}
                            <div className="space-y-0.5 flex-1 overflow-hidden">
                                {activeTasks.slice(0, 3).map((task) => {
                                    const proj = projects.find((p) => p.id === task.projectId);
                                    return (
                                        <button
                                            key={task.id}
                                            onClick={() => onEdit(task)}
                                            className="w-full text-left px-1.5 py-0.5 rounded-md text-[11px] font-medium truncate transition-all hover:bg-white/5 flex items-center gap-1.5 group/task"
                                            title={task.title}
                                        >
                                            <span
                                                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: priorityColor[task.priority] }}
                                            />
                                            <span className="truncate text-foreground/80 group-hover/task:text-foreground">
                                                {task.title}
                                            </span>
                                            {proj && (
                                                <span className="text-[9px] flex-shrink-0" style={{ color: proj.color }}>
                                                    {proj.icon}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                                {activeTasks.length > 3 && (
                                    <span className="text-[10px] text-muted pl-1.5">
                                        +{activeTasks.length - 3} ещё
                                    </span>
                                )}
                                {doneTasks > 0 && activeTasks.length <= 3 && (
                                    <span className="text-[10px] text-muted/50 pl-1.5">
                                        ✓ {doneTasks}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
