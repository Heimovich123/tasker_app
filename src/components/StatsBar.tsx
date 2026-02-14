'use client';

import { Task } from '@/types';
import { getStreak, getWeekCompletions, getTodayCompletions, getStats } from '@/lib/storage';
import { useEffect, useState } from 'react';

interface StatsBarProps {
    tasks: Task[];
}

export default function StatsBar({ tasks }: StatsBarProps) {
    const [weekCount, setWeekCount] = useState(0);
    const [streak, setStreak] = useState(0);
    const [weekData, setWeekData] = useState<number[]>([]);

    // Today's count is derived directly from tasks — always accurate
    const today = new Date().toISOString().split('T')[0];
    const todayCount = tasks.filter(
        (t) => t.status === 'done' && t.completedAt && t.completedAt.startsWith(today)
    ).length;

    useEffect(() => {
        // Week count: take storage total, replace stale today with live count
        const rawWeek = getWeekCompletions();
        const staleToday = getTodayCompletions();
        setWeekCount(rawWeek - staleToday + todayCount);
        setStreak(getStreak());

        // Build 7-day mini chart data
        const stats = getStats();
        const days: number[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0];
            if (key === today) {
                // Use live task data for today
                days.push(todayCount);
            } else {
                const record = stats.find((s) => s.date === key);
                days.push(record?.count ?? 0);
            }
        }
        setWeekData(days);
    }, [tasks, todayCount, today]);

    const maxWeek = Math.max(...weekData, 1);

    // Recalculate effective streak considering live today count
    const effectiveStreak = todayCount > 0 ? Math.max(streak, 1) : (streak > 0 && weekData.length > 0 && weekData[weekData.length - 1] === 0 ? 0 : streak);

    return (
        <div className="flex items-center gap-6 px-5 py-3 rounded-xl border border-border bg-card/50">
            {/* Today */}
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                    <span className="text-accent text-sm font-bold">{todayCount}</span>
                </div>
                <div>
                    <p className="text-[11px] text-muted uppercase tracking-wide">Сегодня</p>
                    <p className="text-[12px] text-foreground font-medium">выполнено</p>
                </div>
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-border" />

            {/* Week */}
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[var(--success-bg)] flex items-center justify-center">
                    <span className="text-[var(--success)] text-sm font-bold">{weekCount}</span>
                </div>
                <div>
                    <p className="text-[11px] text-muted uppercase tracking-wide">Неделя</p>
                    <p className="text-[12px] text-foreground font-medium">выполнено</p>
                </div>
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-border" />

            {/* Streak */}
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[var(--warning-bg)] flex items-center justify-center">
                    <span className="text-[var(--warning)] text-sm font-bold">{todayCount > 0 ? Math.max(streak, 1) : 0}</span>
                </div>
                <div>
                    <p className="text-[11px] text-muted uppercase tracking-wide">Streak</p>
                    <p className="text-[12px] text-foreground font-medium">
                        {todayCount > 0
                            ? (Math.max(streak, 1) === 1 ? 'день' : Math.max(streak, 1) >= 2 && Math.max(streak, 1) <= 4 ? 'дня' : 'дней')
                            : 'дней'
                        }
                    </p>
                </div>
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-border" />

            {/* Mini Chart */}
            <div className="flex items-end gap-1 h-8">
                {weekData.map((val, i) => (
                    <div
                        key={i}
                        className="w-3 rounded-sm transition-all bg-accent/30 hover:bg-accent/50"
                        style={{
                            height: `${Math.max((val / maxWeek) * 100, 8)}%`,
                            minHeight: '3px',
                        }}
                        title={`${val} задач`}
                    />
                ))}
            </div>
        </div>
    );
}
