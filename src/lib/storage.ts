import { Task, Project, CompletionRecord } from '@/types';

// ── Tasks ──

export async function getTasks(): Promise<Task[]> {
    const res = await fetch('/api/tasks');
    if (!res.ok) return [];
    return res.json();
}

export async function addTask(task: Task): Promise<Task[]> {
    const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
    });
    return res.json();
}

export async function updateTask(updated: Task): Promise<Task[]> {
    const res = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
    });
    return res.json();
}

export async function deleteTask(id: string): Promise<Task[]> {
    const res = await fetch(`/api/tasks?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
    });
    return res.json();
}

export async function restoreLastDeleted(): Promise<Task[]> {
    const res = await fetch('/api/tasks/restore', { method: 'POST' });
    return res.json();
}

export function clearLastDeleted(): void {
    // Очистка происходит автоматически при restore, ничего не нужно
}

// ── Projects ──

export async function getProjects(): Promise<Project[]> {
    const res = await fetch('/api/projects');
    if (!res.ok) return [];
    return res.json();
}

export async function addProject(project: Project): Promise<Project[]> {
    const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
    });
    return res.json();
}

export async function updateProject(updated: Project): Promise<Project[]> {
    const res = await fetch('/api/projects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
    });
    return res.json();
}

export async function deleteProject(id: string): Promise<Project[]> {
    const res = await fetch(`/api/projects?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
    });
    return res.json();
}

// ── Stats ──

export async function getStats(): Promise<CompletionRecord[]> {
    const res = await fetch('/api/stats');
    if (!res.ok) return [];
    return res.json();
}

export async function recordCompletion(): Promise<void> {
    await fetch('/api/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'record' }),
    });
}

export async function decrementCompletion(): Promise<void> {
    await fetch('/api/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'decrement' }),
    });
}

export async function getStreak(): Promise<number> {
    const stats = await getStats();
    if (stats.length === 0) return 0;

    const dates = stats
        .filter((s) => s.count > 0)
        .map((s) => s.date)
        .sort()
        .reverse();

    if (dates.length === 0) return 0;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (dates[0] !== today && dates[0] !== yesterday) return 0;

    let streak = 1;
    for (let i = 0; i < dates.length - 1; i++) {
        const curr = new Date(dates[i]);
        const prev = new Date(dates[i + 1]);
        const diff = (curr.getTime() - prev.getTime()) / 86400000;
        if (diff === 1) {
            streak++;
        } else {
            break;
        }
    }
    return streak;
}

export async function getTodayCompletions(): Promise<number> {
    const stats = await getStats();
    const today = new Date().toISOString().split('T')[0];
    return stats.find((s) => s.date === today)?.count ?? 0;
}

export async function getWeekCompletions(): Promise<number> {
    const stats = await getStats();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const cutoff = weekAgo.toISOString().split('T')[0];
    return stats.filter((s) => s.date >= cutoff).reduce((sum, s) => sum + s.count, 0);
}
