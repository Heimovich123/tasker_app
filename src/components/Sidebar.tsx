'use client';

import { ViewMode } from '@/types';

interface SidebarProps {
    activeView: ViewMode;
    onViewChange: (view: ViewMode) => void;
    projects: { id: string; name: string; color: string; icon: string }[];
    selectedProjectId: string | null;
    onSelectProject: (id: string | null) => void;
    onNewProject: () => void;
    taskCounts: {
        inbox: number;
        today: number;
        tomorrow: number;
        week: number;
        month: number;
    };
}

export default function Sidebar({
    activeView,
    onViewChange,
    projects,
    selectedProjectId,
    onSelectProject,
    onNewProject,
    taskCounts,
}: SidebarProps) {
    const navItems: { view: ViewMode; label: string; icon: string; count?: number }[] = [
        { view: 'inbox', label: 'Входящие', icon: '▣', count: taskCounts.inbox },
        { view: 'today', label: 'Сегодня', icon: '◉', count: taskCounts.today },
        { view: 'tomorrow', label: 'Завтра', icon: '◑', count: taskCounts.tomorrow },
        { view: 'week', label: 'Неделя', icon: '◫', count: taskCounts.week },
        { view: 'month', label: 'Месяц', icon: '▦', count: taskCounts.month },
    ];

    return (
        <aside className="w-[260px] h-screen flex-shrink-0 flex flex-col border-r border-border bg-[#0c0c14] overflow-hidden">
            {/* Logo */}
            <div className="px-5 py-6 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white font-bold text-sm">
                    T
                </div>
                <span className="text-lg font-semibold tracking-tight text-foreground">
                    Tasker
                </span>
            </div>

            {/* Main Navigation */}
            <nav className="px-3 flex-1 overflow-y-auto">
                <div className="mb-6">
                    <p className="px-3 mb-2 text-[11px] font-medium uppercase tracking-widest text-muted">
                        Планирование
                    </p>
                    {navItems.map((item) => (
                        <button
                            key={item.view}
                            id={`nav-${item.view}`}
                            onClick={() => {
                                onViewChange(item.view);
                                onSelectProject(null);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-all duration-200 group mb-0.5
                ${activeView === item.view && !selectedProjectId
                                    ? 'bg-accent/10 text-accent'
                                    : 'text-muted-foreground hover:bg-card-hover hover:text-foreground'
                                }`}
                        >
                            <span className="text-base opacity-70 group-hover:opacity-100 transition-opacity">
                                {item.icon}
                            </span>
                            <span className="flex-1 text-left">{item.label}</span>
                            {item.count !== undefined && item.count > 0 && (
                                <span
                                    className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors
                    ${activeView === item.view && !selectedProjectId
                                            ? 'bg-accent/20 text-accent'
                                            : 'bg-card text-muted'
                                        }`}
                                >
                                    {item.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Projects */}
                <div>
                    <div className="px-3 mb-2 flex items-center justify-between">
                        <p className="text-[11px] font-medium uppercase tracking-widest text-muted">
                            Проекты
                        </p>
                        <button
                            id="new-project-btn"
                            onClick={onNewProject}
                            className="text-muted hover:text-accent transition-colors text-lg leading-none"
                            title="Новый проект"
                        >
                            +
                        </button>
                    </div>
                    {projects.length === 0 ? (
                        <p className="px-3 py-4 text-xs text-muted text-center">
                            Нет проектов
                        </p>
                    ) : (
                        projects.map((project) => (
                            <button
                                key={project.id}
                                id={`project-${project.id}`}
                                onClick={() => {
                                    onViewChange('project');
                                    onSelectProject(project.id);
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-all duration-200 group mb-0.5
                  ${selectedProjectId === project.id
                                        ? 'bg-card text-foreground'
                                        : 'text-muted-foreground hover:bg-card-hover hover:text-foreground'
                                    }`}
                            >
                                <span
                                    style={{ color: project.color }}
                                    className="text-sm"
                                >
                                    {project.icon}
                                </span>
                                <span className="flex-1 text-left truncate">
                                    {project.name}
                                </span>
                            </button>
                        ))
                    )}
                </div>
            </nav>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-border">
                <p className="text-[11px] text-muted">
                    © 2026 Tasker
                </p>
            </div>
        </aside>
    );
}
