'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Task,
    Project,
    ViewMode,
    TaskStatus,
    Priority,
    PRIORITY_LABELS,
} from '@/types';
import {
    getTasks,
    addTask,
    updateTask,
    deleteTask,
    getProjects,
    addProject,
    updateProject,
    deleteProject,
    restoreLastDeleted,
    clearLastDeleted,
    recordCompletion,
    decrementCompletion,
} from '@/lib/storage';
import { isToday, isTomorrow, isThisWeek, isThisMonth, isPastDue, formatDateFull, generateId, getTodayISO, toLocalYMD } from '@/lib/utils';
import Sidebar from '@/components/Sidebar';
import TaskCard from '@/components/TaskCard';
import TaskModal from '@/components/TaskModal';
import ProjectModal from '@/components/ProjectModal';
import WeekView from '@/components/WeekView';
import MonthView from '@/components/MonthView';
import QuickAddInput from '@/components/QuickAddInput';
import SearchFilterBar, { Filters, DEFAULT_FILTERS } from '@/components/SearchFilterBar';
import StatsBar from '@/components/StatsBar';
import Toast from '@/components/Toast';
import BulkActionBar from '@/components/BulkActionBar';

// DnD
import {
    DndContext,
    DragOverlay,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const VIEW_TITLES: Record<ViewMode, string> = {
    inbox: 'Входящие',
    today: 'Сегодня',
    tomorrow: 'Завтра',
    week: 'Эта неделя',
    month: 'Этот месяц',
    project: 'Проект',
};

// ── Sortable Task Wrapper ──
function SortableTaskItem({
    task,
    project,
    projects,
    onToggleStatus,
    onUpdate,
    onEdit,
    onDelete,
    isSelected,
    onSelectToggle,
    activeView,
    searchQuery,
}: {
    task: Task;
    project?: Project;
    projects: Project[];
    onToggleStatus: (task: Task) => void;
    onUpdate: (task: Task) => void;
    onEdit: (task: Task) => void;
    onDelete: (id: string) => void;
    isSelected?: boolean;
    onSelectToggle?: (id: string) => void;
    activeView?: ViewMode;
    searchQuery?: string;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.25 : 1,
        zIndex: isDragging ? 0 : 'auto',
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            <div className="flex items-stretch gap-0">
                {/* Drag Handle */}
                <div
                    {...listeners}
                    className="flex items-center px-1 cursor-grab active:cursor-grabbing opacity-0 hover:opacity-100 text-muted hover:text-foreground transition-opacity"
                    style={{ touchAction: 'none' }}
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="9" cy="6" r="1.5" />
                        <circle cx="15" cy="6" r="1.5" />
                        <circle cx="9" cy="12" r="1.5" />
                        <circle cx="15" cy="12" r="1.5" />
                        <circle cx="9" cy="18" r="1.5" />
                        <circle cx="15" cy="18" r="1.5" />
                    </svg>
                </div>
                <div className="flex-1">
                    <TaskCard
                        task={task}
                        project={project}
                        projects={projects}
                        onToggleStatus={onToggleStatus}
                        onUpdate={onUpdate}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        isSelected={isSelected}
                        onSelectToggle={onSelectToggle}
                        activeView={activeView}
                        searchQuery={searchQuery}
                    />
                </div>
            </div>
        </div>
    );
}

export default function Dashboard() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [activeView, setActiveView] = useState<ViewMode>('today');
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [statsKey, setStatsKey] = useState(0);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [activeDragId, setActiveDragId] = useState<string | null>(null);

    // Load data from API
    useEffect(() => {
        async function loadData() {
            const [loadedTasks, loadedProjects] = await Promise.all([
                getTasks(),
                getProjects(),
            ]);
            setTasks(loadedTasks);
            setProjects(loadedProjects);
        }
        loadData();
    }, []);

    // DnD sensors
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // ── Filter & Sort ──
    const filteredTasks = useMemo(() => {
        let filtered = tasks;

        // View filter
        if (activeView === 'project' && selectedProjectId) {
            filtered = filtered.filter((t) => t.projectId === selectedProjectId);
        } else if (activeView === 'inbox') {
            // No date filter — show ALL tasks
        } else if (activeView === 'today') {
            filtered = filtered.filter((t) => isToday(t.dueDate) || (t.subtasks && t.subtasks.some(s => !s.completed && s.dueDate && isToday(s.dueDate))));
        } else if (activeView === 'tomorrow') {
            filtered = filtered.filter((t) => isTomorrow(t.dueDate) || (t.subtasks && t.subtasks.some(s => !s.completed && s.dueDate && isTomorrow(s.dueDate))));
        } else if (activeView === 'week') {
            filtered = filtered.filter((t) => isThisWeek(t.dueDate) || (t.subtasks && t.subtasks.some(s => !s.completed && s.dueDate && isThisWeek(s.dueDate))));
        } else if (activeView === 'month') {
            filtered = filtered.filter((t) => isThisMonth(t.dueDate) || (t.subtasks && t.subtasks.some(s => !s.completed && s.dueDate && isThisMonth(s.dueDate))));
        }

        // Search filter
        if (filters.search) {
            const q = filters.search.toLowerCase();
            filtered = filtered.filter(
                (t) =>
                    t.title.toLowerCase().includes(q) ||
                    t.description.toLowerCase().includes(q) ||
                    (t.subtasks && t.subtasks.some(s => s.title.toLowerCase().includes(q)))
            );
        }

        // Priority filter
        if (filters.priority !== 'all') {
            filtered = filtered.filter((t) => t.priority === filters.priority);
        }

        // Status filter
        if (filters.status !== 'all') {
            filtered = filtered.filter((t) => t.status === filters.status);
        }

        // Date filter
        if (filters.dateFilter !== 'all') {
            filtered = filtered.filter((t) => {
                switch (filters.dateFilter) {
                    case 'today': return isToday(t.dueDate);
                    case 'tomorrow': return isTomorrow(t.dueDate);
                    case 'week': return isThisWeek(t.dueDate);
                    case 'overdue': return isPastDue(t.dueDate) && t.status !== 'done';
                    case 'no_date': return !t.dueDate;
                    default: return true;
                }
            });
        }

        // Sort by order, then priority, then date
        return filtered.sort((a, b) => {
            if (a.status === 'done' && b.status !== 'done') return 1;
            if (a.status !== 'done' && b.status === 'done') return -1;
            if (a.order !== b.order) return a.order - b.order;
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });
    }, [tasks, activeView, selectedProjectId, filters]);

    // ── Grouped tasks ──
    const groupedTasks = useMemo(() => {
        if (activeView === 'week') return null; // Week view has its own grouping

        const groups: { priority: Priority; label: string; tasks: Task[] }[] = [
            { priority: 'high', label: '🔴 Высокий приоритет', tasks: [] },
            { priority: 'medium', label: '🟡 Средний приоритет', tasks: [] },
            { priority: 'low', label: '🔵 Низкий приоритет', tasks: [] },
        ];

        const done: Task[] = [];

        filteredTasks.forEach((t) => {
            if (t.status === 'done') {
                done.push(t);
            } else {
                const group = groups.find((g) => g.priority === t.priority);
                group?.tasks.push(t);
            }
        });

        if (done.length > 0) {
            groups.push({ priority: 'low' as Priority, label: '✓ Выполнено', tasks: done });
        }

        return groups.filter((g) => g.tasks.length > 0);
    }, [filteredTasks, activeView]);

    // ── Task counts ──
    const taskCounts = useMemo(
        () => ({
            inbox: tasks.filter((t) => t.status !== 'done').length,
            today: tasks.filter((t) => (isToday(t.dueDate) || t.subtasks?.some(s => s.dueDate && isToday(s.dueDate) && !s.completed)) && t.status !== 'done').length,
            tomorrow: tasks.filter((t) => (isTomorrow(t.dueDate) || t.subtasks?.some(s => s.dueDate && isTomorrow(s.dueDate) && !s.completed)) && t.status !== 'done').length,
            week: tasks.filter((t) => (isThisWeek(t.dueDate) || t.subtasks?.some(s => s.dueDate && isThisWeek(s.dueDate) && !s.completed)) && t.status !== 'done').length,
            month: tasks.filter((t) => (isThisMonth(t.dueDate) || t.subtasks?.some(s => s.dueDate && isThisMonth(s.dueDate) && !s.completed)) && t.status !== 'done').length,
        }),
        [tasks]
    );

    // ── Task handlers (async) ──
    const handleSaveTask = useCallback(async (task: Task) => {
        const allTasks = await getTasks();
        const isNew = !allTasks.find((t) => t.id === task.id);
        const updated = isNew ? await addTask(task) : await updateTask(task);
        setTasks(updated);
        setShowTaskModal(false);
        setEditingTask(null);
    }, []);

    const handleToggleStatus = useCallback(async (task: Task) => {
        const newStatus: TaskStatus = task.status === 'done' ? 'todo' : 'done';
        const now = new Date().toISOString();
        const updatedTask = {
            ...task,
            status: newStatus,
            completedAt: newStatus === 'done' ? now : null,
            updatedAt: now,
        };

        // Handle recurrence: if completing a recurring task, create next occurrence
        if (newStatus === 'done' && task.recurrence !== 'none') {
            await recordCompletion();
            setStatsKey((k) => k + 1);

            // Create next occurrence
            const nextDate = new Date(task.dueDate);
            if (task.recurrence === 'daily') nextDate.setDate(nextDate.getDate() + 1);
            else if (task.recurrence === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
            else if (task.recurrence === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);

            const yyyy = nextDate.getFullYear();
            const mm = String(nextDate.getMonth() + 1).padStart(2, '0');
            const dd = String(nextDate.getDate()).padStart(2, '0');

            const nextTask: Task = {
                ...task,
                id: generateId(),
                status: 'todo',
                completedAt: null,
                dueDate: `${yyyy}-${mm}-${dd}`,
                subtasks: task.subtasks.map((s) => ({ ...s, completed: false })),
                createdAt: now,
                updatedAt: now,
            };

            await updateTask(updatedTask);
            const updated = await addTask(nextTask);
            setTasks([...updated]);
            return;
        }

        if (newStatus === 'done') {
            await recordCompletion();
            setStatsKey((k) => k + 1);
        } else {
            // Un-completing a task: decrement stats
            await decrementCompletion();
            setStatsKey((k) => k + 1);
        }

        const updated = await updateTask(updatedTask);
        setTasks(updated);
    }, []);

    const handleDeleteTask = useCallback(async (id: string) => {
        const updated = await deleteTask(id);
        setTasks(updated);
        setToastMessage('Задача удалена');
    }, []);

    const handleUndoDelete = useCallback(async () => {
        const restored = await restoreLastDeleted();
        setTasks(restored);
        setToastMessage(null);
    }, []);

    const handleEditTask = useCallback((_task: Task) => {
        // Всё редактируется инлайн на карточке — модалка не нужна
    }, []);

    // ── Project handlers (async) ──
    const handleSaveProject = useCallback(async (project: Project) => {
        const allProjects = await getProjects();
        const isNew = !allProjects.find((p) => p.id === project.id);
        const updated = isNew ? await addProject(project) : await updateProject(project);
        setProjects(updated);
        setShowProjectModal(false);
        setEditingProject(null);
    }, []);

    const handleDeleteProject = useCallback(
        async (id: string) => {
            const updatedProjects = await deleteProject(id);
            setProjects(updatedProjects);
            const updatedTasks = tasks.map((t) =>
                t.projectId === id ? { ...t, projectId: null } : t
            );
            for (const t of updatedTasks) {
                await updateTask(t as Task);
            }
            setTasks(updatedTasks as Task[]);
            setShowProjectModal(false);
            setEditingProject(null);
            if (selectedProjectId === id) {
                setSelectedProjectId(null);
                setActiveView('today');
            }
        },
        [tasks, selectedProjectId]
    );

    // ── Drag & Drop ──
    const handleDragStart = useCallback((event: DragStartEvent) => {
        setActiveDragId(event.active.id as string);
    }, []);

    const handleDragEnd = useCallback(
        async (event: DragEndEvent) => {
            setActiveDragId(null);
            const { active, over } = event;
            if (!over || active.id === over.id) return;

            const oldIndex = filteredTasks.findIndex((t) => t.id === active.id);
            const newIndex = filteredTasks.findIndex((t) => t.id === over.id);

            if (oldIndex === -1 || newIndex === -1) return;

            const reordered = arrayMove(filteredTasks, oldIndex, newIndex);

            // Update order values
            for (let i = 0; i < reordered.length; i++) {
                reordered[i].order = i;
                await updateTask(reordered[i]);
            }

            const freshTasks = await getTasks();
            setTasks(freshTasks);
        },
        [filteredTasks]
    );

    const activeDragTask = activeDragId ? filteredTasks.find((t) => t.id === activeDragId) : null;
    const activeDragProject = activeDragTask ? projects.find((p) => p.id === activeDragTask.projectId) : undefined;

    // ── Selection handlers ──
    const handleSelectToggle = useCallback((id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const handleClearSelection = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    const handleBulkSetPriority = useCallback(async (priority: Priority) => {
        let updated = tasks;
        for (const id of selectedIds) {
            const t = updated.find((t) => t.id === id);
            if (t) updated = await updateTask({ ...t, priority, updatedAt: new Date().toISOString() });
        }
        setTasks([...updated]);
        handleClearSelection();
    }, [tasks, selectedIds, handleClearSelection]);

    const handleBulkSetDate = useCallback(async (date: string) => {
        let updated = tasks;
        for (const id of selectedIds) {
            const t = updated.find((t) => t.id === id);
            if (t) updated = await updateTask({ ...t, dueDate: date, updatedAt: new Date().toISOString() });
        }
        setTasks([...updated]);
        handleClearSelection();
    }, [tasks, selectedIds, handleClearSelection]);

    const handleBulkSetProject = useCallback(async (projectId: string | null) => {
        let updated = tasks;
        for (const id of selectedIds) {
            const t = updated.find((t) => t.id === id);
            if (t) updated = await updateTask({ ...t, projectId, updatedAt: new Date().toISOString() });
        }
        setTasks([...updated]);
        handleClearSelection();
    }, [tasks, selectedIds, handleClearSelection]);

    const handleBulkDelete = useCallback(async () => {
        let updated = tasks;
        for (const id of selectedIds) {
            updated = await deleteTask(id);
        }
        setTasks([...updated]);
        setToastMessage(`Удалено задач: ${selectedIds.size}`);
        handleClearSelection();
    }, [tasks, selectedIds, handleClearSelection]);

    // ── Derived ──
    const selectedProject = projects.find((p) => p.id === selectedProjectId);
    const doneCount = filteredTasks.filter((t) => t.status === 'done').length;
    const totalCount = filteredTasks.length;
    const progressPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
    const todayFormatted = formatDateFull(getTodayISO());
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowFormatted = formatDateFull(toLocalYMD(tomorrow));

    const taskIds = filteredTasks.map((t) => t.id);

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar
                activeView={activeView}
                onViewChange={setActiveView}
                projects={projects}
                selectedProjectId={selectedProjectId}
                onSelectProject={setSelectedProjectId}
                onNewProject={() => {
                    setEditingProject(null);
                    setShowProjectModal(true);
                }}
                taskCounts={taskCounts}
            />

            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="flex-shrink-0 px-8 py-6 border-b border-border">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                {selectedProject && (
                                    <button
                                        onClick={() => {
                                            setEditingProject(selectedProject);
                                            setShowProjectModal(true);
                                        }}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all hover:scale-110"
                                        style={{
                                            backgroundColor: `${selectedProject.color}20`,
                                            color: selectedProject.color,
                                        }}
                                    >
                                        {selectedProject.icon}
                                    </button>
                                )}
                                <h1 className="text-2xl font-bold text-foreground tracking-tight">
                                    {selectedProject ? selectedProject.name : VIEW_TITLES[activeView]}
                                </h1>
                            </div>
                            <p className="text-[13px] text-muted">
                                {activeView === 'today' ? todayFormatted : activeView === 'tomorrow' ? tomorrowFormatted : ''}
                            </p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    {totalCount > 0 && (
                        <div className="mt-3 flex items-center gap-3">
                            <div className="flex-1 h-2 rounded-full bg-border/50 overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-700 ease-out"
                                    style={{
                                        width: `${progressPercent}%`,
                                        background: 'linear-gradient(90deg, var(--accent), var(--success))',
                                    }}
                                />
                            </div>
                            <span className={`text-[13px] font-bold tabular-nums min-w-[3.5rem] text-right ${progressPercent === 100 ? 'text-[var(--success)]' : 'text-accent'
                                }`}>
                                {progressPercent}%
                            </span>
                            <span className="text-[12px] text-muted">
                                {doneCount}/{totalCount}
                            </span>
                        </div>
                    )}
                </header>

                {/* Stats Bar (only on Today view) */}
                {activeView === 'today' && (
                    <div className="px-8 pt-4">
                        <StatsBar key={statsKey} tasks={tasks} />
                    </div>
                )}

                {/* Quick Add + Search */}
                <div className="px-8 pt-4 pb-0 flex-shrink-0 space-y-3">
                    <SearchFilterBar
                        filters={filters}
                        onFiltersChange={setFilters}
                    />
                    <QuickAddInput
                        currentProjectId={selectedProjectId}
                        onAddTask={handleSaveTask}
                    />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-8 pb-8 pt-2">
                    {activeView === 'week' ? (
                        <WeekView
                            tasks={filteredTasks}
                            projects={projects}
                            onToggleStatus={handleToggleStatus}
                            onEdit={handleEditTask}
                            onDelete={handleDeleteTask}
                            onUpdate={handleSaveTask}
                        />
                    ) : activeView === 'month' ? (
                        <MonthView
                            tasks={filteredTasks}
                            projects={projects}
                            onToggleStatus={handleToggleStatus}
                            onEdit={handleEditTask}
                            onDelete={handleDeleteTask}
                        />
                    ) : (
                        <>
                            {filteredTasks.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 animate-fadeIn">
                                    <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center text-2xl text-muted mb-4">
                                        {activeView === 'today' ? '◉' : '◆'}
                                    </div>
                                    <p className="text-muted text-[14px] mb-1">Нет задач</p>
                                    <p className="text-muted/60 text-[13px]">
                                        Начните вводить название выше, чтобы добавить задачу
                                    </p>
                                </div>
                            ) : (
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragStart={handleDragStart}
                                    onDragEnd={handleDragEnd}
                                >
                                    {groupedTasks && groupedTasks.length > 0 ? (
                                        <div className="space-y-6 max-w-3xl">
                                            {groupedTasks.map((group) => (
                                                <div key={group.label}>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <h3 className="text-[12px] font-semibold text-muted uppercase tracking-wider">
                                                            {group.label}
                                                        </h3>
                                                        <span className="text-[11px] text-muted/50">
                                                            {group.tasks.length}
                                                        </span>
                                                        <div className="flex-1 h-px bg-border" />
                                                    </div>
                                                    <SortableContext items={group.tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                                                        <div className="task-list space-y-2">
                                                            {group.tasks.map((task) => (
                                                                <SortableTaskItem
                                                                    key={task.id}
                                                                    task={task}
                                                                    project={projects.find((p) => p.id === task.projectId)}
                                                                    projects={projects}
                                                                    onToggleStatus={handleToggleStatus}
                                                                    onUpdate={handleSaveTask}
                                                                    onEdit={handleEditTask}
                                                                    onDelete={handleDeleteTask}
                                                                    isSelected={selectedIds.has(task.id)}
                                                                    onSelectToggle={handleSelectToggle}
                                                                    activeView={activeView}
                                                                    searchQuery={filters.search}
                                                                />
                                                            ))}
                                                        </div>
                                                    </SortableContext>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                                            <div className="task-list space-y-2 max-w-3xl">
                                                {filteredTasks.map((task) => (
                                                    <SortableTaskItem
                                                        key={task.id}
                                                        task={task}
                                                        project={projects.find((p) => p.id === task.projectId)}
                                                        projects={projects}
                                                        onToggleStatus={handleToggleStatus}
                                                        onUpdate={handleSaveTask}
                                                        onEdit={handleEditTask}
                                                        onDelete={handleDeleteTask}
                                                        isSelected={selectedIds.has(task.id)}
                                                        onSelectToggle={handleSelectToggle}
                                                        activeView={activeView}
                                                        searchQuery={filters.search}
                                                    />
                                                ))}
                                            </div>
                                        </SortableContext>
                                    )}

                                    {/* Drag Overlay — floating ghost card */}
                                    <DragOverlay dropAnimation={{
                                        duration: 200,
                                        easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
                                    }}>
                                        {activeDragTask ? (
                                            <div className="opacity-90 scale-105 shadow-2xl shadow-black/40 rounded-xl ring-2 ring-accent/30 pointer-events-none">
                                                <TaskCard
                                                    task={activeDragTask}
                                                    project={activeDragProject}
                                                    projects={projects}
                                                    onToggleStatus={() => { }}
                                                    onUpdate={() => { }}
                                                    onEdit={() => { }}
                                                    onDelete={() => { }}
                                                    searchQuery={filters.search}
                                                />
                                            </div>
                                        ) : null}
                                    </DragOverlay>
                                </DndContext>
                            )}
                        </>
                    )}
                </div>
            </main>

            {/* Modals */}
            {showTaskModal && (
                <TaskModal
                    task={editingTask}
                    projects={projects}
                    onSave={handleSaveTask}
                    onClose={() => {
                        setShowTaskModal(false);
                        setEditingTask(null);
                    }}
                />
            )}

            {showProjectModal && (
                <ProjectModal
                    project={editingProject}
                    onSave={handleSaveProject}
                    onDelete={handleDeleteProject}
                    onClose={() => {
                        setShowProjectModal(false);
                        setEditingProject(null);
                    }}
                />
            )}

            {/* Bulk Action Bar */}
            <BulkActionBar
                selectedCount={selectedIds.size}
                projects={projects}
                onSetPriority={handleBulkSetPriority}
                onSetDate={handleBulkSetDate}
                onSetProject={handleBulkSetProject}
                onDelete={handleBulkDelete}
                onClearSelection={handleClearSelection}
            />

            {/* Toast */}
            {toastMessage && (
                <Toast
                    message={toastMessage}
                    actionLabel="Отменить"
                    onAction={handleUndoDelete}
                    onDismiss={() => {
                        clearLastDeleted();
                        setToastMessage(null);
                    }}
                />
            )}
        </div>
    );
}
