export type Priority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type ViewMode = 'inbox' | 'today' | 'tomorrow' | 'week' | 'month' | 'project';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Subtask {
    id: string;
    title: string;
    completed: boolean;
    dueDate?: string | null;   // ISO date YYYY-MM-DD
    priority?: Priority;        // optional, defaults to parent
    order?: number;             // for drag & drop reordering
}

export interface Task {
    id: string;
    title: string;
    description: string;
    projectId: string | null;
    priority: Priority;
    status: TaskStatus;
    dueDate: string; // ISO date string (YYYY-MM-DD)
    subtasks: Subtask[];
    recurrence: RecurrenceType;
    order: number; // for drag & drop ordering
    completedAt: string | null; // ISO string, for stats tracking
    createdAt: string;
    updatedAt: string;
}

export interface Project {
    id: string;
    name: string;
    color: string;
    icon: string;
    createdAt: string;
}

export interface CompletionRecord {
    date: string; // YYYY-MM-DD
    count: number;
}

export const PROJECT_COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b',
    '#22c55e', '#06b6d4', '#3b82f6', '#f97316', '#14b8a6',
];

export const PROJECT_ICONS = [
    '◆', '●', '■', '▲', '★', '◎', '◈', '◉', '▣', '⬡',
];

export const PRIORITY_LABELS: Record<Priority, string> = {
    low: 'Низкий',
    medium: 'Средний',
    high: 'Высокий',
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
    todo: 'К выполнению',
    in_progress: 'В работе',
    done: 'Готово',
};

export const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
    none: 'Без повтора',
    daily: 'Каждый день',
    weekly: 'Каждую неделю',
    monthly: 'Каждый месяц',
};
