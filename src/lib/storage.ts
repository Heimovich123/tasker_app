import { Task, Project, CompletionRecord } from '@/types';

const TASKS_KEY = 'tasker_tasks';
const PROJECTS_KEY = 'tasker_projects';
const STATS_KEY = 'tasker_stats';
const DELETED_KEY = 'tasker_deleted'; // for undo

// ── Tasks ──

export function getTasks(): Task[] {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(TASKS_KEY);
    if (!raw) return [];
    // Migrate old tasks that don't have new fields
    const tasks: Task[] = JSON.parse(raw);
    return tasks.map((t) => ({
        ...t,
        recurrence: t.recurrence ?? 'none',
        order: t.order ?? 0,
        completedAt: t.completedAt ?? null,
    }));
}

export function saveTasks(tasks: Task[]): void {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

export function addTask(task: Task): Task[] {
    const tasks = getTasks();
    task.order = tasks.length;
    tasks.push(task);
    saveTasks(tasks);
    return tasks;
}

export function updateTask(updated: Task): Task[] {
    const tasks = getTasks().map((t) => (t.id === updated.id ? updated : t));
    saveTasks(tasks);
    return tasks;
}

export function deleteTask(id: string): Task[] {
    const tasks = getTasks();
    const deleted = tasks.find((t) => t.id === id);
    if (deleted) {
        // Store for undo
        localStorage.setItem(DELETED_KEY, JSON.stringify(deleted));
    }
    const remaining = tasks.filter((t) => t.id !== id);
    saveTasks(remaining);
    return remaining;
}

export function getLastDeleted(): Task | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(DELETED_KEY);
    return raw ? JSON.parse(raw) : null;
}

export function restoreLastDeleted(): Task[] {
    const deleted = getLastDeleted();
    if (!deleted) return getTasks();
    localStorage.removeItem(DELETED_KEY);
    return addTask(deleted);
}

export function clearLastDeleted(): void {
    localStorage.removeItem(DELETED_KEY);
}

// ── Projects ──

export function getProjects(): Project[] {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(PROJECTS_KEY);
    return raw ? JSON.parse(raw) : [];
}

export function saveProjects(projects: Project[]): void {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export function addProject(project: Project): Project[] {
    const projects = getProjects();
    projects.push(project);
    saveProjects(projects);
    return projects;
}

export function updateProject(updated: Project): Project[] {
    const projects = getProjects().map((p) =>
        p.id === updated.id ? updated : p
    );
    saveProjects(projects);
    return projects;
}

export function deleteProject(id: string): Project[] {
    const projects = getProjects().filter((p) => p.id !== id);
    saveProjects(projects);
    return projects;
}

// ── Stats ──

export function getStats(): CompletionRecord[] {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(STATS_KEY);
    return raw ? JSON.parse(raw) : [];
}

export function recordCompletion(): void {
    const stats = getStats();
    const today = new Date().toISOString().split('T')[0];
    const existing = stats.find((s) => s.date === today);
    if (existing) {
        existing.count += 1;
    } else {
        stats.push({ date: today, count: 1 });
    }
    // Keep last 90 days
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    const filtered = stats.filter((s) => s.date >= cutoffStr);
    localStorage.setItem(STATS_KEY, JSON.stringify(filtered));
}

export function decrementCompletion(): void {
    const stats = getStats();
    const today = new Date().toISOString().split('T')[0];
    const existing = stats.find((s) => s.date === today);
    if (existing && existing.count > 0) {
        existing.count -= 1;
    }
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export function getStreak(): number {
    const stats = getStats();
    if (stats.length === 0) return 0;

    const dates = stats
        .filter((s) => s.count > 0)
        .map((s) => s.date)
        .sort()
        .reverse();

    if (dates.length === 0) return 0;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Streak must include today or yesterday
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

export function getTodayCompletions(): number {
    const stats = getStats();
    const today = new Date().toISOString().split('T')[0];
    return stats.find((s) => s.date === today)?.count ?? 0;
}

export function getWeekCompletions(): number {
    const stats = getStats();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const cutoff = weekAgo.toISOString().split('T')[0];
    return stats.filter((s) => s.date >= cutoff).reduce((sum, s) => sum + s.count, 0);
}
