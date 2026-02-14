'use client';

import { useState, useRef, useEffect } from 'react';
import { Priority, TaskStatus, PRIORITY_LABELS, STATUS_LABELS } from '@/types';

export type DateFilter = 'all' | 'today' | 'tomorrow' | 'week' | 'overdue' | 'no_date';

const DATE_FILTER_LABELS: Record<DateFilter, string> = {
    all: 'Дата',
    today: 'Сегодня',
    tomorrow: 'Завтра',
    week: 'На неделе',
    overdue: 'Просроченные',
    no_date: 'Без даты',
};

export interface Filters {
    search: string;
    priority: Priority | 'all';
    status: TaskStatus | 'all';
    dateFilter: DateFilter;
}

interface SearchFilterBarProps {
    filters: Filters;
    onFiltersChange: (filters: Filters) => void;
}

export const DEFAULT_FILTERS: Filters = {
    search: '',
    priority: 'all',
    status: 'all',
    dateFilter: 'all',
};

const priorityDots: Record<string, string> = {
    high: 'bg-[var(--priority-high)]',
    medium: 'bg-[var(--priority-medium)]',
    low: 'bg-[var(--priority-low)]',
};

export default function SearchFilterBar({
    filters,
    onFiltersChange,
}: SearchFilterBarProps) {
    const [searchOpen, setSearchOpen] = useState(false);
    const searchRef = useRef<HTMLInputElement>(null);

    const hasActiveFilters =
        filters.priority !== 'all' || filters.status !== 'all' || filters.dateFilter !== 'all';

    useEffect(() => {
        if (searchOpen && searchRef.current) {
            searchRef.current.focus();
        }
    }, [searchOpen]);

    const cyclePriority = () => {
        const cycle: (Priority | 'all')[] = ['all', 'high', 'medium', 'low'];
        const idx = cycle.indexOf(filters.priority);
        onFiltersChange({ ...filters, priority: cycle[(idx + 1) % cycle.length] });
    };

    const cycleStatus = () => {
        const cycle: (TaskStatus | 'all')[] = ['all', 'todo', 'in_progress', 'done'];
        const idx = cycle.indexOf(filters.status);
        onFiltersChange({ ...filters, status: cycle[(idx + 1) % cycle.length] });
    };

    const cycleDateFilter = () => {
        const cycle: DateFilter[] = ['all', 'today', 'tomorrow', 'week', 'overdue', 'no_date'];
        const idx = cycle.indexOf(filters.dateFilter);
        onFiltersChange({ ...filters, dateFilter: cycle[(idx + 1) % cycle.length] });
    };

    const statusIcon = (s: TaskStatus | 'all') => {
        if (s === 'done') return '✓';
        if (s === 'in_progress') return '◒';
        if (s === 'todo') return '○';
        return '⊙';
    };

    return (
        <div className="flex items-center gap-2">
            {/* Search toggle / input */}
            {searchOpen || filters.search ? (
                <div className="relative flex-1 animate-fadeIn">
                    <svg
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.2-5.2M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        ref={searchRef}
                        type="text"
                        value={filters.search}
                        onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
                        onBlur={() => { if (!filters.search) setSearchOpen(false); }}
                        placeholder="Поиск..."
                        className="w-full pl-9 pr-8 py-2 rounded-lg bg-card border border-border text-foreground placeholder:text-muted/50 text-[13px] focus:outline-none focus:border-accent/50 transition-all"
                    />
                    <button
                        onClick={() => { onFiltersChange({ ...filters, search: '' }); setSearchOpen(false); }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => setSearchOpen(true)}
                    className="w-8 h-8 rounded-lg border border-border bg-card/50 hover:bg-card-hover flex items-center justify-center text-muted hover:text-foreground transition-all"
                    title="Поиск"
                >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.2-5.2M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </button>
            )}

            {/* Priority filter pill */}
            <button
                onClick={cyclePriority}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-all
                    ${filters.priority !== 'all'
                        ? 'bg-accent/10 border border-accent/30 text-accent'
                        : 'bg-card/50 border border-border text-muted hover:text-foreground hover:border-border-hover'
                    }`}
                title="Фильтр по приоритету (клик = переключить)"
            >
                {filters.priority !== 'all' ? (
                    <span className={`w-2 h-2 rounded-full ${priorityDots[filters.priority]}`} />
                ) : (
                    <span className="w-2 h-2 rounded-full bg-muted/40" />
                )}
                {filters.priority === 'all' ? 'Приоритет' : PRIORITY_LABELS[filters.priority]}
            </button>

            {/* Status filter pill */}
            <button
                onClick={cycleStatus}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-all
                    ${filters.status !== 'all'
                        ? 'bg-accent/10 border border-accent/30 text-accent'
                        : 'bg-card/50 border border-border text-muted hover:text-foreground hover:border-border-hover'
                    }`}
                title="Фильтр по статусу (клик = переключить)"
            >
                <span className="text-[11px]">{statusIcon(filters.status)}</span>
                {filters.status === 'all' ? 'Статус' : STATUS_LABELS[filters.status]}
            </button>

            {/* Date filter pill */}
            <button
                onClick={cycleDateFilter}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-all
                    ${filters.dateFilter !== 'all'
                        ? 'bg-accent/10 border border-accent/30 text-accent'
                        : 'bg-card/50 border border-border text-muted hover:text-foreground hover:border-border-hover'
                    }`}
                title="Фильтр по дате (клик = переключить)"
            >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {DATE_FILTER_LABELS[filters.dateFilter]}
            </button>

            {/* Reset */}
            {(hasActiveFilters || filters.search) && (
                <button
                    onClick={() => { onFiltersChange(DEFAULT_FILTERS); setSearchOpen(false); }}
                    className="text-[11px] text-muted hover:text-foreground px-1.5 py-1 transition-colors"
                    title="Сбросить фильтры"
                >
                    ✕
                </button>
            )}

        </div>
    );
}
