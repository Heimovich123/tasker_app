'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Task, Project, Priority, TaskStatus, RecurrenceType, Subtask, ViewMode, PRIORITY_LABELS, STATUS_LABELS, RECURRENCE_LABELS } from '@/types';
import { formatDate, isPastDue, isToday, isTomorrow, isThisWeek, isThisMonth, generateId } from '@/lib/utils';
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

interface TaskCardProps {
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
}

// Helper to highlight matching text
const highlightMatch = (text: string, query?: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
        <span>
            {parts.map((part, i) =>
                part.toLowerCase() === query.toLowerCase() ? (
                    <span key={i} className="bg-yellow-500/30 text-yellow-200 font-bold px-0.5 rounded">
                        {part}
                    </span>
                ) : (
                    part
                )
            )}
        </span>
    );
};

const priorityDot: Record<Priority, string> = {
    high: 'bg-[var(--priority-high)]',
    medium: 'bg-[var(--priority-medium)]',
    low: 'bg-[var(--priority-low)]',
};

function isSubtaskMatchingView(subtask: Subtask, activeView?: ViewMode): boolean {
    if (!activeView || activeView === 'inbox' || activeView === 'project') return true;

    // Strict matching for filtered views: no date = filtered out (dimmed)
    const date = subtask.dueDate || '';
    if (activeView === 'today') return isToday(date);
    if (activeView === 'tomorrow') return isTomorrow(date);
    if (activeView === 'week') return isThisWeek(date);
    if (activeView === 'month') return isThisMonth(date);
    return true;
}

export default function TaskCard({
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
}: TaskCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

    // Auto-expand if subtasks match search query
    useEffect(() => {
        if (searchQuery && task.subtasks && task.subtasks.length > 0) {
            const hasMatch = task.subtasks.some(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()));
            if (hasMatch) {
                setIsExpanded(true);
            }
        }
    }, [searchQuery, task.subtasks]);
    const [showQuickActions, setShowQuickActions] = useState<'priority' | 'project' | 'date' | 'status' | 'recurrence' | null>(null);
    const [isCompleting, setIsCompleting] = useState(false);

    // Inline editing state
    const [editingTitle, setEditingTitle] = useState(false);
    const [editingDesc, setEditingDesc] = useState(false);
    const [titleDraft, setTitleDraft] = useState(task.title);
    const [descDraft, setDescDraft] = useState(task.description);
    const [isAddingSubtask, setIsAddingSubtask] = useState(false);
    const [activeDragSubtaskId, setActiveDragSubtaskId] = useState<string | null>(null);

    const quickActionsRef = useRef<HTMLDivElement>(null);
    const priorityBtnRef = useRef<HTMLButtonElement>(null);
    const dateBtnRef = useRef<HTMLButtonElement>(null);
    const projectBtnRef = useRef<HTMLButtonElement>(null);
    const statusBtnRef = useRef<HTMLButtonElement>(null);
    const recurrenceBtnRef = useRef<HTMLButtonElement>(null);
    const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

    const openQuickAction = useCallback((type: 'priority' | 'project' | 'date' | 'status' | 'recurrence', btnRef: React.RefObject<HTMLButtonElement | null>) => {
        if (showQuickActions === type) {
            setShowQuickActions(null);
            return;
        }
        if (btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            setDropdownPos({
                top: rect.top + window.scrollY - 4,
                left: rect.right + window.scrollX,
            });
        }
        setShowQuickActions(type);
    }, [showQuickActions]);
    const titleInputRef = useRef<HTMLInputElement>(null);
    const descInputRef = useRef<HTMLTextAreaElement>(null);
    const subtaskInputRef = useRef<HTMLInputElement>(null);

    const isDone = task.status === 'done';
    const isTaskMatching = activeView ? (
        activeView === 'today' ? isToday(task.dueDate || '') :
            activeView === 'tomorrow' ? isTomorrow(task.dueDate || '') :
                activeView === 'week' ? isThisWeek(task.dueDate || '') :
                    activeView === 'month' ? isThisMonth(task.dueDate || '') :
                        true
    ) : true;

    // Auto-expand if task itself doesn't match but is in the list (meaning it has matching subtasks)
    useEffect(() => {
        if (!isTaskMatching && activeView && activeView !== 'inbox' && activeView !== 'project') {
            setIsExpanded(true);
        }
    }, [activeView, isTaskMatching]);
    const isOverdue = !isDone && isPastDue(task.dueDate);
    const sortedSubtasks = [...task.subtasks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const completedSubtasks = sortedSubtasks.filter((s) => s.completed).length;
    const totalSubtasks = sortedSubtasks.length;

    // Sync drafts when task changes from outside
    useEffect(() => {
        if (!editingTitle) setTitleDraft(task.title);
    }, [task.title, editingTitle]);
    useEffect(() => {
        if (!editingDesc) setDescDraft(task.description);
    }, [task.description, editingDesc]);

    // Focus input when editing starts
    useEffect(() => {
        if (editingTitle && titleInputRef.current) {
            titleInputRef.current.focus();
            titleInputRef.current.select();
        }
    }, [editingTitle]);
    useEffect(() => {
        if (editingDesc && descInputRef.current) {
            descInputRef.current.focus();
        }
    }, [editingDesc]);
    useEffect(() => {
        if (isAddingSubtask && subtaskInputRef.current) {
            subtaskInputRef.current.focus();
        }
    }, [isAddingSubtask]);

    // Close quick actions on outside click
    useEffect(() => {
        if (!showQuickActions) return;
        const handleClick = (e: MouseEvent) => {
            if (quickActionsRef.current && !quickActionsRef.current.contains(e.target as Node)) {
                setShowQuickActions(null);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [showQuickActions]);

    // ── Handlers ──

    const handleCheck = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isDone) {
            setIsCompleting(true);
            setTimeout(() => {
                onToggleStatus(task);
                setIsCompleting(false);
            }, 400);
        } else {
            onToggleStatus(task);
        }
    };

    const handleTitleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingTitle(true);
    };

    const handleTitleSave = () => {
        setEditingTitle(false);
        const trimmed = titleDraft.trim();
        if (trimmed && trimmed !== task.title) {
            onUpdate({ ...task, title: trimmed, updatedAt: new Date().toISOString() });
        } else {
            setTitleDraft(task.title);
        }
    };

    const handleTitleKeyDown = (e: React.KeyboardEvent) => {
        e.stopPropagation();
        if (e.key === 'Enter') handleTitleSave();
        else if (e.key === 'Escape') { setTitleDraft(task.title); setEditingTitle(false); }
    };

    const handleDescClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingDesc(true);
    };

    const handleDescSave = () => {
        setEditingDesc(false);
        const trimmed = descDraft.trim();
        if (trimmed !== task.description) {
            onUpdate({ ...task, description: trimmed, updatedAt: new Date().toISOString() });
        }
    };

    const handleDescKeyDown = (e: React.KeyboardEvent) => {
        e.stopPropagation();
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleDescSave(); }
        else if (e.key === 'Escape') { setDescDraft(task.description); setEditingDesc(false); }
    };

    const handleToggleSubtask = (e: React.MouseEvent, subtaskId: string) => {
        e.stopPropagation();
        const updatedSubtasks = task.subtasks.map((s) =>
            s.id === subtaskId ? { ...s, completed: !s.completed } : s
        );
        onUpdate({ ...task, subtasks: updatedSubtasks, updatedAt: new Date().toISOString() });
    };

    const handleAddSubtask = (e?: React.MouseEvent | React.KeyboardEvent) => {
        e?.stopPropagation();
        if (!newSubtaskTitle.trim()) { setIsAddingSubtask(false); return; }
        const newSub: Subtask = {
            id: generateId(),
            title: newSubtaskTitle.trim(),
            completed: false,
            dueDate: null,
            priority: undefined,
            order: task.subtasks.length,
        };
        onUpdate({
            ...task,
            subtasks: [...task.subtasks, newSub],
            updatedAt: new Date().toISOString(),
        });
        setNewSubtaskTitle('');
    };

    const handleStartAddingSubtask = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded(true);
        setIsAddingSubtask(true);
    };

    const handleDeleteSubtask = (e: React.MouseEvent, subtaskId: string) => {
        e.stopPropagation();
        onUpdate({ ...task, subtasks: task.subtasks.filter((s) => s.id !== subtaskId), updatedAt: new Date().toISOString() });
    };

    const handleExpandClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    };

    // Subtask date quick set
    const handleSubtaskSetDate = (subtaskId: string, daysOffset: number) => {
        const d = new Date();
        d.setDate(d.getDate() + daysOffset);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        const updatedSubtasks = task.subtasks.map((s) =>
            s.id === subtaskId ? { ...s, dueDate: dateStr } : s
        );
        onUpdate({ ...task, subtasks: updatedSubtasks, updatedAt: new Date().toISOString() });
    };

    // Subtask priority cycle
    const handleSubtaskCyclePriority = (subtaskId: string) => {
        const cycle: (Priority | undefined)[] = [undefined, 'low', 'medium', 'high'];
        const sub = task.subtasks.find((s) => s.id === subtaskId);
        if (!sub) return;
        const currentIdx = cycle.indexOf(sub.priority);
        const nextPriority = cycle[(currentIdx + 1) % cycle.length];
        const updatedSubtasks = task.subtasks.map((s) =>
            s.id === subtaskId ? { ...s, priority: nextPriority } : s
        );
        onUpdate({ ...task, subtasks: updatedSubtasks, updatedAt: new Date().toISOString() });
    };

    // Subtask drag & drop
    const subtaskSensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleSubtaskDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = task.subtasks.findIndex((s) => s.id === active.id);
        const newIndex = task.subtasks.findIndex((s) => s.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;
        const reordered = arrayMove(task.subtasks, oldIndex, newIndex).map((s, i) => ({ ...s, order: i }));
        onUpdate({ ...task, subtasks: reordered, updatedAt: new Date().toISOString() });
    };

    const handleSetPriority = (e: React.MouseEvent, priority: Priority) => {
        e.stopPropagation();
        onUpdate({ ...task, priority, updatedAt: new Date().toISOString() });
        setShowQuickActions(null);
    };

    const handleSetProject = (e: React.MouseEvent, projectId: string | null) => {
        e.stopPropagation();
        onUpdate({ ...task, projectId, updatedAt: new Date().toISOString() });
        setShowQuickActions(null);
    };

    const handleSetDate = (e: React.MouseEvent, daysOffset: number) => {
        e.stopPropagation();
        const d = new Date();
        d.setDate(d.getDate() + daysOffset);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        onUpdate({ ...task, dueDate: `${yyyy}-${mm}-${dd}`, updatedAt: new Date().toISOString() });
        setShowQuickActions(null);
    };

    const handleSetDateDirect = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        if (e.target.value) {
            onUpdate({ ...task, dueDate: e.target.value, updatedAt: new Date().toISOString() });
            // Don't close immediately allow user to type
        }
    };

    const handleSetStatus = (e: React.MouseEvent, newStatus: TaskStatus) => {
        e.stopPropagation();
        const now = new Date().toISOString();
        onUpdate({
            ...task,
            status: newStatus,
            completedAt: newStatus === 'done' ? now : null,
            updatedAt: now,
        });
        setShowQuickActions(null);
    };

    const handleSetRecurrence = (e: React.MouseEvent, rec: RecurrenceType) => {
        e.stopPropagation();
        onUpdate({ ...task, recurrence: rec, updatedAt: new Date().toISOString() });
        setShowQuickActions(null);
    };

    // Subtask date — direct string
    const handleSubtaskSetDateDirect = (subtaskId: string, dateStr: string) => {
        const updatedSubtasks = task.subtasks.map((s) =>
            s.id === subtaskId ? { ...s, dueDate: dateStr } : s
        );
        onUpdate({ ...task, subtasks: updatedSubtasks, updatedAt: new Date().toISOString() });
    };

    return (
        <div
            id={`task-${task.id}`}
            className={`group relative flex flex-col px-5 py-4 rounded-xl border transition-all duration-300
                ${isCompleting ? 'opacity-40 scale-[0.98] translate-y-1' : ''}
                ${isSelected ? 'border-accent/50 bg-accent/5 ring-1 ring-accent/20' : ''}
                ${isDone && !isSelected
                    ? 'border-border bg-card/50 opacity-50'
                    : !isSelected ? 'border-border hover:border-border-hover bg-card hover:bg-card-hover' : ''
                }
                ${isOverdue ? 'border-[var(--danger)]/30' : ''}
            `}
        >
            <div className="flex items-start gap-3 w-full">
                {/* Selection checkbox — appears on hover */}
                {onSelectToggle && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onSelectToggle(task.id); }}
                        className={`mt-1 w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200
                            ${isSelected
                                ? 'bg-accent border-accent'
                                : 'border-muted/30 hover:border-accent opacity-0 group-hover:opacity-100'
                            }`}
                    >
                        {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                    </button>
                )}
                {/* Checkbox — крупный */}
                <button
                    onClick={handleCheck}
                    className={`mt-1 w-6 h-6 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200
                        ${isDone
                            ? 'bg-accent border-accent'
                            : 'border-muted/40 hover:border-accent group-hover:border-muted'
                        }`}
                >
                    {isDone && (
                        <svg className="w-3.5 h-3.5 text-white animate-checkmark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Title row */}
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                        {editingTitle ? (
                            <input
                                ref={titleInputRef}
                                type="text"
                                value={titleDraft}
                                onChange={(e) => setTitleDraft(e.target.value)}
                                onBlur={handleTitleSave}
                                onKeyDown={handleTitleKeyDown}
                                onClick={(e) => e.stopPropagation()}
                                className="flex-1 bg-transparent border-b-2 border-accent text-[16px] font-medium text-foreground outline-none py-1"
                            />
                        ) : (
                            <h3
                                onClick={handleTitleClick}
                                className={`text-[16px] font-medium leading-snug truncate cursor-text hover:text-accent transition-colors
                                    ${isDone ? 'line-through text-muted' :
                                        !isTaskMatching ? 'text-muted' : 'text-foreground'}`}
                                title="Нажмите чтобы редактировать"
                            >
                                {highlightMatch(task.title, searchQuery)}
                            </h3>
                        )}

                        {/* Quick Action Buttons */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" ref={quickActionsRef}>
                                {/* Priority */}
                                <button
                                    ref={priorityBtnRef}
                                    onClick={(e) => { e.stopPropagation(); openQuickAction('priority', priorityBtnRef); }}
                                    className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-muted hover:text-foreground transition-all"
                                    title="Приоритет"
                                >
                                    <span className={`w-2.5 h-2.5 rounded-full inline-block ${priorityDot[task.priority]}`} />
                                </button>

                                {/* Date */}
                                <button
                                    ref={dateBtnRef}
                                    onClick={(e) => { e.stopPropagation(); openQuickAction('date', dateBtnRef); }}
                                    className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-muted hover:text-foreground transition-all"
                                    title="Перенести дату"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </button>

                                {/* Project */}
                                {projects.length > 0 && (
                                    <button
                                        ref={projectBtnRef}
                                        onClick={(e) => { e.stopPropagation(); openQuickAction('project', projectBtnRef); }}
                                        className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-muted hover:text-foreground transition-all"
                                        title="Переместить в проект"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                        </svg>
                                    </button>
                                )}

                                {/* Status */}
                                <button
                                    ref={statusBtnRef}
                                    onClick={(e) => { e.stopPropagation(); openQuickAction('status', statusBtnRef); }}
                                    className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-muted hover:text-foreground transition-all"
                                    title="Статус"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </button>

                                {/* Recurrence */}
                                <button
                                    ref={recurrenceBtnRef}
                                    onClick={(e) => { e.stopPropagation(); openQuickAction('recurrence', recurrenceBtnRef); }}
                                    className={`w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center transition-all
                                        ${task.recurrence && task.recurrence !== 'none' ? 'text-accent' : 'text-muted hover:text-foreground'}`}
                                    title="Повторение"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Description — inline editable */}
                    {editingDesc ? (
                        <textarea
                            ref={descInputRef}
                            value={descDraft}
                            onChange={(e) => setDescDraft(e.target.value)}
                            onBlur={handleDescSave}
                            onKeyDown={handleDescKeyDown}
                            onClick={(e) => e.stopPropagation()}
                            rows={2}
                            placeholder="Добавить описание..."
                            className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-[14px] text-foreground outline-none focus:border-accent resize-none mb-3"
                        />
                    ) : task.description ? (
                        <p
                            onClick={handleDescClick}
                            className={`text-[14px] leading-relaxed mb-3 cursor-text text-muted hover:text-foreground transition-colors ${isExpanded ? '' : 'line-clamp-2'}`}
                            title="Нажмите чтобы редактировать"
                        >
                            {highlightMatch(task.description, searchQuery)}
                        </p>
                    ) : null}

                    {/* Subtasks — with drag & drop */}
                    {totalSubtasks > 0 && isExpanded && (
                        <div className="mb-3 pl-1" onClick={(e) => e.stopPropagation()}>
                            <DndContext
                                sensors={subtaskSensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleSubtaskDragEnd}
                            >
                                <SortableContext items={sortedSubtasks.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                                    <div className="space-y-0.5">
                                        {sortedSubtasks.map((sub) => (
                                            <SortableSubtaskItem
                                                key={sub.id}
                                                subtask={sub}
                                                dimmed={!isSubtaskMatchingView(sub, activeView)}
                                                onToggle={(e) => handleToggleSubtask(e, sub.id)}
                                                onDelete={(e) => handleDeleteSubtask(e, sub.id)}
                                                onSetDate={(offset) => handleSubtaskSetDate(sub.id, offset)}
                                                onSetDateDirect={(dateStr) => handleSubtaskSetDateDirect(sub.id, dateStr)}
                                                onCyclePriority={() => handleSubtaskCyclePriority(sub.id)}
                                                searchQuery={searchQuery}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        </div>
                    )}

                    {/* Add subtask input */}
                    {isAddingSubtask && (
                        <div className="flex items-center gap-3 mb-3 pl-1 animate-fadeIn" onClick={(e) => e.stopPropagation()}>
                            <div className="w-5 h-5 rounded-md border-2 border-accent/30 flex-shrink-0 flex items-center justify-center">
                                <span className="text-accent text-[12px] font-bold">+</span>
                            </div>
                            <input
                                ref={subtaskInputRef}
                                type="text"
                                value={newSubtaskTitle}
                                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleAddSubtask(e);
                                    if (e.key === 'Escape') { setIsAddingSubtask(false); setNewSubtaskTitle(''); }
                                }}
                                onBlur={() => { if (!newSubtaskTitle) setIsAddingSubtask(false); }}
                                placeholder="Название подзадачи..."
                                className="flex-1 bg-transparent border-b-2 border-accent/30 focus:border-accent py-1 text-[14px] outline-none placeholder:text-muted/40 transition-colors"
                            />
                        </div>
                    )}

                    {/* Subtask Progress Bar */}
                    {totalSubtasks > 0 && (
                        <div className="flex items-center gap-3 mb-3">
                            <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-accent to-[var(--success)]"
                                    style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
                                />
                            </div>
                            <span className="text-[12px] text-muted font-medium tabular-nums">
                                {completedSubtasks}/{totalSubtasks}
                            </span>
                        </div>
                    )}

                    {/* Meta Row */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className="flex items-center gap-1.5 text-[13px] text-muted">
                                <span className={`w-2 h-2 rounded-full ${priorityDot[task.priority]}`} />
                                {PRIORITY_LABELS[task.priority]}
                            </span>

                            {task.dueDate && (
                                <span className={`text-[13px] ${isOverdue ? 'text-[var(--danger)] font-medium' : 'text-muted'}`}>
                                    {isOverdue ? '⚠ ' : ''}{formatDate(task.dueDate)}
                                </span>
                            )}

                            {project && (
                                <span
                                    className="text-[12px] px-2.5 py-1 rounded-full font-medium"
                                    style={{ color: project.color, backgroundColor: `${project.color}15` }}
                                >
                                    {project.icon} {project.name}
                                </span>
                            )}

                            {totalSubtasks > 0 && (
                                <button
                                    onClick={handleExpandClick}
                                    className="flex items-center gap-1.5 text-[13px] text-muted hover:text-foreground transition-colors"
                                >
                                    <svg className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                    </svg>
                                    <span>{completedSubtasks}/{totalSubtasks}</span>
                                </button>
                            )}

                            {task.status === 'in_progress' && (
                                <span className="text-[12px] px-2.5 py-1 rounded-full bg-[var(--warning-bg)] text-[var(--warning)] font-medium">
                                    {STATUS_LABELS.in_progress}
                                </span>
                            )}

                            {task.recurrence && task.recurrence !== 'none' && (
                                <span className="text-[12px] px-2.5 py-1 rounded-full bg-accent/10 text-accent font-medium">
                                    ↻ {RECURRENCE_LABELS[task.recurrence]}
                                </span>
                            )}
                        </div>

                        {/* Bottom actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={handleStartAddingSubtask}
                                className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-muted hover:text-accent transition-colors"
                                title="Добавить подзадачу"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                                className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-muted hover:text-[var(--danger)] transition-colors"
                                title="Удалить"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Portal Quick Action Dropdowns */}
            {showQuickActions && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[9999]" onMouseDown={() => setShowQuickActions(null)}>
                    <div
                        className="absolute py-1.5 px-1 rounded-xl border border-border bg-[#1a1a28] shadow-2xl animate-scaleIn"
                        style={{
                            top: Math.max(10, dropdownPos.top),
                            left: Math.max(10, dropdownPos.left - (showQuickActions === 'recurrence' ? 180 : showQuickActions === 'status' ? 160 : showQuickActions === 'project' ? 160 : showQuickActions === 'date' ? 150 : 140)),
                            transform: 'translateY(-100%)',
                            minWidth: showQuickActions === 'recurrence' ? 180 : showQuickActions === 'status' ? 160 : showQuickActions === 'project' ? 160 : showQuickActions === 'date' ? 150 : 140,
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        {showQuickActions === 'priority' && (
                            <>
                                {(Object.entries(PRIORITY_LABELS) as [Priority, string][]).map(([val, label]) => (
                                    <button
                                        key={val}
                                        onClick={(e) => handleSetPriority(e, val)}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors
                                            ${task.priority === val ? 'bg-white/5 text-foreground' : 'text-muted hover:text-foreground hover:bg-white/5'}`}
                                    >
                                        <span className={`w-2.5 h-2.5 rounded-full ${priorityDot[val]}`} />
                                        {label}
                                    </button>
                                ))}
                            </>
                        )}
                        {showQuickActions === 'date' && (
                            <>
                                {[
                                    { label: 'Сегодня', offset: 0 },
                                    { label: 'Завтра', offset: 1 },
                                ].map((opt) => (
                                    <button
                                        key={opt.offset}
                                        onClick={(e) => handleSetDate(e, opt.offset)}
                                        className="w-full text-left px-3 py-2 rounded-lg text-[13px] text-muted hover:text-foreground hover:bg-white/5 transition-colors"
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                                <button
                                    onClick={(e) => { e.stopPropagation(); onUpdate({ ...task, dueDate: '', updatedAt: new Date().toISOString() }); setShowQuickActions(null); }}
                                    className="w-full text-left px-3 py-2 rounded-lg text-[13px] text-muted hover:text-foreground hover:bg-white/5 transition-colors"
                                >
                                    Без даты
                                </button>
                                <div className="border-t border-border mt-1 pt-1 px-2 pb-1">
                                    <input
                                        type="date"
                                        max="2100-12-31"
                                        value={task.dueDate}
                                        onChange={handleSetDateDirect}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-full bg-white/5 border border-border rounded-lg px-3 py-2 text-[13px] text-foreground outline-none focus:border-accent cursor-pointer"
                                    />
                                </div>
                            </>
                        )}
                        {showQuickActions === 'project' && (
                            <>
                                <button
                                    onClick={(e) => handleSetProject(e, null)}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-colors
                                        ${!task.projectId ? 'bg-white/5 text-foreground' : 'text-muted hover:text-foreground hover:bg-white/5'}`}
                                >
                                    Без проекта
                                </button>
                                {projects.map((p) => (
                                    <button
                                        key={p.id}
                                        onClick={(e) => handleSetProject(e, p.id)}
                                        className={`w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg text-[13px] transition-colors
                                            ${task.projectId === p.id ? 'bg-white/5 text-foreground' : 'text-muted hover:text-foreground hover:bg-white/5'}`}
                                    >
                                        <span style={{ color: p.color }}>{p.icon}</span>
                                        {p.name}
                                    </button>
                                ))}
                            </>
                        )}
                        {showQuickActions === 'status' && (
                            <>
                                {(Object.entries(STATUS_LABELS) as [TaskStatus, string][]).map(([val, label]) => (
                                    <button
                                        key={val}
                                        onClick={(e) => handleSetStatus(e, val)}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors
                                            ${task.status === val ? 'bg-white/5 text-foreground' : 'text-muted hover:text-foreground hover:bg-white/5'}`}
                                    >
                                        <span className={`w-2 h-2 rounded-full ${val === 'done' ? 'bg-[var(--success)]' :
                                            val === 'in_progress' ? 'bg-[var(--warning)]' :
                                                'bg-muted/50'
                                            }`} />
                                        {label}
                                    </button>
                                ))}
                            </>
                        )}
                        {showQuickActions === 'recurrence' && (
                            <>
                                {(Object.entries(RECURRENCE_LABELS) as [RecurrenceType, string][]).map(([val, label]) => (
                                    <button
                                        key={val}
                                        onClick={(e) => handleSetRecurrence(e, val)}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors
                                            ${task.recurrence === val ? 'bg-white/5 text-foreground' : 'text-muted hover:text-foreground hover:bg-white/5'}`}
                                    >
                                        {val === 'none' ? '—' : '↻'}
                                        <span className="ml-0.5">{label}</span>
                                    </button>
                                ))}
                            </>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

// ── Sortable Subtask Item ──
const subtaskPriorityDot: Record<string, string> = {
    high: 'bg-[var(--priority-high)]',
    medium: 'bg-[var(--priority-medium)]',
    low: 'bg-[var(--priority-low)]',
};


function SortableSubtaskItem({
    subtask,
    dimmed,
    onToggle,
    onDelete,
    onSetDate,
    onSetDateDirect,
    onCyclePriority,
    searchQuery,
}: {
    subtask: Subtask;
    dimmed?: boolean;
    onToggle: (e: React.MouseEvent) => void;
    onDelete: (e: React.MouseEvent) => void;
    onSetDate: (daysOffset: number) => void;
    onSetDateDirect: (dateStr: string) => void;
    onCyclePriority: () => void;
    searchQuery?: string;
}) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: subtask.id });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        position: isDragging ? 'relative' : undefined,
    };

    const isOverdue = subtask.dueDate && isPastDue(subtask.dueDate) && !subtask.completed;

    const toggleMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isMenuOpen) {
            setIsMenuOpen(false);
        } else {
            // Calculate position
            if (buttonRef.current) {
                const rect = buttonRef.current.getBoundingClientRect();
                setMenuPos({
                    top: rect.bottom + window.scrollY + 5,
                    left: rect.left + window.scrollX - 100,
                });
                setIsMenuOpen(true);
            }
        }
    };

    const subtaskStyle: React.CSSProperties = {
        ...style,
        opacity: isDragging ? undefined : 1,
        display: dimmed ? 'none' : 'flex', // Hide non-matching subtasks completely in filtered views
    };

    return (
        <>
            <div
                ref={setNodeRef}
                style={subtaskStyle}
                {...attributes}
                className={`flex items-center gap-2 group/sub animate-fadeIn py-1 rounded-lg transition-all duration-150
                    ${isDragging
                        ? 'bg-accent/10 shadow-lg shadow-accent/10 ring-1 ring-accent/30 scale-[1.02]'
                        : 'hover:bg-white/[0.02]'
                    }`}
            >
                {/* Drag handle */}
                <div
                    {...listeners}
                    className="opacity-0 group-hover/sub:opacity-100 cursor-grab active:cursor-grabbing text-muted hover:text-foreground transition-opacity"
                    style={{ touchAction: 'none' }}
                >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="9" cy="6" r="1.5" />
                        <circle cx="15" cy="6" r="1.5" />
                        <circle cx="9" cy="12" r="1.5" />
                        <circle cx="15" cy="12" r="1.5" />
                        <circle cx="9" cy="18" r="1.5" />
                        <circle cx="15" cy="18" r="1.5" />
                    </svg>
                </div>

                {/* Checkbox */}
                <button
                    onClick={onToggle}
                    className={`w-4.5 h-4.5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all
                        ${subtask.completed ? 'bg-accent border-accent' : 'border-muted/30 hover:border-accent'}`}
                >
                    {subtask.completed && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                </button>

                {/* Priority dot (click to cycle) */}
                <button
                    onClick={(e) => { e.stopPropagation(); onCyclePriority(); }}
                    className="flex-shrink-0 p-0.5 rounded hover:bg-white/5 transition-colors"
                    title="Сменить приоритет"
                >
                    {subtask.priority ? (
                        <span className={`w-2 h-2 rounded-full inline-block ${subtaskPriorityDot[subtask.priority]}`} />
                    ) : (
                        <span className="w-2 h-2 rounded-full inline-block bg-muted/20" />
                    )}
                </button>

                {/* Title */}
                <span className={`text-[13px] flex-1 ${subtask.completed ? 'line-through text-muted' : 'text-foreground'}`}>
                    {highlightMatch(subtask.title, searchQuery)}
                </span>

                {/* Date badge with ref */}
                <button
                    ref={buttonRef}
                    onClick={toggleMenu}
                    className={`text-[11px] px-1.5 py-0.5 rounded-md transition-colors flex-shrink-0
                        ${subtask.dueDate
                            ? (isOverdue
                                ? 'text-[var(--danger)] bg-[var(--danger-bg)] font-medium'
                                : 'text-muted hover:text-foreground bg-white/5')
                            : 'text-muted/30 hover:text-muted opacity-0 group-hover/sub:opacity-100'
                        }`}
                    title="Установить дату"
                >
                    {subtask.dueDate ? formatDate(subtask.dueDate) : '📅'}
                </button>

                {/* Delete */}
                <button
                    onClick={onDelete}
                    className="opacity-0 group-hover/sub:opacity-100 text-muted hover:text-[var(--danger)] transition-opacity p-1"
                >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Portal Menu */}
            {isMenuOpen && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-start justify-start" onClick={() => setIsMenuOpen(false)}>
                    {/* Positioned Menu */}
                    <div
                        className="absolute py-1 px-1 rounded-xl border border-border bg-[#1a1a28] shadow-2xl animate-scaleIn min-w-[140px]"
                        style={{
                            top: Math.min(menuPos.top, window.innerHeight - 200), // Prevent going off bottom
                            left: Math.max(10, Math.min(menuPos.left, window.innerWidth - 150)), // Prevent going off screen
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {[
                            { label: 'Сегодня', offset: 0 },
                            { label: 'Завтра', offset: 1 },
                        ].map((opt) => (
                            <button
                                key={opt.offset}
                                onClick={(e) => { e.stopPropagation(); onSetDate(opt.offset); setIsMenuOpen(false); }}
                                className="w-full text-left px-3 py-1.5 rounded-lg text-[12px] text-muted hover:text-foreground hover:bg-white/5 transition-colors"
                            >
                                {opt.label}
                            </button>
                        ))}
                        <button
                            onClick={(e) => { e.stopPropagation(); onSetDateDirect(''); setIsMenuOpen(false); }}
                            className="w-full text-left px-3 py-1.5 rounded-lg text-[12px] text-muted hover:text-foreground hover:bg-white/5 transition-colors"
                        >
                            Без даты
                        </button>
                        <div className="border-t border-border mt-1 pt-1 px-1.5 pb-0.5">
                            <input
                                type="date"
                                max="2100-12-31"
                                value={subtask.dueDate || ''}
                                onChange={(e) => {
                                    e.stopPropagation();
                                    onSetDateDirect(e.target.value);
                                    // Don't close immediately allow user to type
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full bg-white/5 border border-border rounded-lg px-2 py-1.5 text-[12px] text-foreground outline-none focus:border-accent cursor-pointer"
                            />
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
