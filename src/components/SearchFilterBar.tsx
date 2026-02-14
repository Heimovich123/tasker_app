'use client';

import { useState } from 'react';
import { Priority, TaskStatus, PRIORITY_LABELS, STATUS_LABELS } from '@/types';

export interface Filters {
    search: string;
    priority: Priority | 'all';
    status: TaskStatus | 'all';
}

interface SearchFilterBarProps {
    filters: Filters;
    onFiltersChange: (filters: Filters) => void;
}

export const DEFAULT_FILTERS: Filters = {
    search: '',
    priority: 'all',
    status: 'all',
};

export default function SearchFilterBar({
    filters,
    onFiltersChange,
}: SearchFilterBarProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const hasActiveFilters =
        filters.priority !== 'all' || filters.status !== 'all';

    return (
        <div className="mb-4">
            {/* Search Row */}
            <div className="flex items-center gap-2">
                {/* Search Input */}
                <div className="relative flex-1">
                    <svg
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21 21l-5.2-5.2M17 10a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                    <input
                        type="text"
                        value={filters.search}
                        onChange={(e) =>
                            onFiltersChange({ ...filters, search: e.target.value })
                        }
                        placeholder="Поиск задач..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-foreground placeholder:text-muted/50 text-[13px] focus:outline-none focus:border-accent/50 transition-all"
                    />
                    {filters.search && (
                        <button
                            onClick={() => onFiltersChange({ ...filters, search: '' })}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Filter Toggle */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-[13px] font-medium transition-all
            ${hasActiveFilters
                            ? 'border-accent/30 bg-accent/10 text-accent'
                            : 'border-border bg-card text-muted hover:text-foreground hover:border-border-hover'
                        }`}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Фильтры
                    {hasActiveFilters && (
                        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                    )}
                </button>

                {/* Clear all filters */}
                {(hasActiveFilters || filters.search) && (
                    <button
                        onClick={() => onFiltersChange(DEFAULT_FILTERS)}
                        className="text-[12px] text-muted hover:text-foreground px-2 py-2.5 transition-colors"
                    >
                        Сбросить
                    </button>
                )}
            </div>

            {/* Filter Pills */}
            {isExpanded && (
                <div className="flex items-center gap-4 mt-3 animate-fadeIn">
                    {/* Priority Filter */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-muted uppercase tracking-wide mr-1">Приоритет:</span>
                        <FilterPill
                            label="Все"
                            active={filters.priority === 'all'}
                            onClick={() => onFiltersChange({ ...filters, priority: 'all' })}
                        />
                        {(Object.entries(PRIORITY_LABELS) as [Priority, string][]).map(
                            ([value, label]) => (
                                <FilterPill
                                    key={value}
                                    label={label}
                                    active={filters.priority === value}
                                    onClick={() => onFiltersChange({ ...filters, priority: value })}
                                />
                            )
                        )}
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-muted uppercase tracking-wide mr-1">Статус:</span>
                        <FilterPill
                            label="Все"
                            active={filters.status === 'all'}
                            onClick={() => onFiltersChange({ ...filters, status: 'all' })}
                        />
                        {(Object.entries(STATUS_LABELS) as [TaskStatus, string][]).map(
                            ([value, label]) => (
                                <FilterPill
                                    key={value}
                                    label={label}
                                    active={filters.status === value}
                                    onClick={() => onFiltersChange({ ...filters, status: value })}
                                />
                            )
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function FilterPill({
    label,
    active,
    onClick,
}: {
    label: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`px-2.5 py-1 rounded-lg text-[12px] font-medium transition-all
        ${active
                    ? 'bg-accent/15 text-accent border border-accent/30'
                    : 'bg-card border border-border text-muted hover:text-foreground hover:border-border-hover'
                }`}
        >
            {label}
        </button>
    );
}
