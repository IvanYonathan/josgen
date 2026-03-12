import { useTranslation } from '@/hooks/use-translation';
import { Task } from '@/types/todo-list/task';
import { ChevronDown, Calendar, Clock } from 'lucide-react';
import { FC, useState } from 'react';

type SectionKey = 'today' | 'nextWeek' | 'upcoming' | 'past';

interface TaskManagerProps {
    tasks: Task[];
    onToggleTask?: (taskId: number) => Promise<void>;
    expandedSections?: Record<SectionKey, boolean>;
    onToggleSection?: (section: SectionKey) => void;
}

export type { SectionKey };

export function TaskManager({ tasks, onToggleTask, expandedSections: expandedSectionsProp, onToggleSection }: Readonly<TaskManagerProps>) {
    const { t, i18n } = useTranslation('dashboard');
    const [expandedSectionsInternal, setExpandedSectionsInternal] = useState<Record<SectionKey, boolean>>({ today: false, nextWeek: false, upcoming: false, past: false });

    const expandedSections = expandedSectionsProp ?? expandedSectionsInternal;
    const toggleSection = onToggleSection ?? ((section: SectionKey) => setExpandedSectionsInternal((prev) => ({ ...prev, [section]: !prev[section] })));

    const categorizeTasks = (tasksToCategorize: Task[]) => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        // This week = Sunday through Saturday of the current calendar week
        const dow = now.getDay(); // 0=Sun
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dow);
        const endOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (6 - dow));
        return {
            today: tasksToCategorize.filter((t) => new Date(t.date + 'T00:00:00').getTime() === startOfToday.getTime()),
            nextWeek: tasksToCategorize.filter((t) => {
                const d = new Date(t.date + 'T00:00:00');
                return d >= startOfWeek && d <= endOfWeek && d.getTime() !== startOfToday.getTime();
            }),
            upcoming: tasksToCategorize.filter((t) => new Date(t.date + 'T00:00:00') > endOfWeek),
            past: tasksToCategorize.filter((t) => new Date(t.date + 'T00:00:00') < startOfToday),
        };
    };

    const currentTasks = categorizeTasks(tasks);

    // Get priority badge styling
    const getPriorityBadge = (priority: 'high' | 'medium' | 'low') => {
        const styles = {
            high: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50',
            medium: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800/50',
            low: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700/30 dark:text-gray-400 dark:border-gray-600/50',
        };
        return styles[priority];
    };

    // Format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString + 'T00:00:00');
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Check if it's today
        if (date.toDateString() === today.toDateString()) {
            return t('dateToday');
        }
        // Check if it's tomorrow
        if (date.toDateString() === tomorrow.toDateString()) {
            return t('dateTomorrow');
        }
        // Otherwise show the date
        const locale = i18n.language === 'id' ? 'id-ID' : 'en-US';
        return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
    };

    const TaskSection: FC<{ title: string; tasks: Task[]; sectionKey: SectionKey; gradient: string }> = ({ title, tasks, sectionKey, gradient }) => (
        <div className="overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-sm dark:border-gray-700/50 dark:bg-gray-800/50">
            <button
                onClick={() => toggleSection(sectionKey)}
                className="flex w-full items-center justify-between p-4 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
                <div className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full bg-gradient-to-r ${gradient} shadow-sm`}></div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                        {tasks.length}
                    </span>
                </div>
                <div className={`transform transition-transform duration-200 ${expandedSections[sectionKey] ? 'rotate-180' : ''}`}>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                </div>
            </button>
            {expandedSections[sectionKey] && (
                <div className="space-y-2 px-4 pb-4">
                    {tasks.slice(0, 3).map((task) => (
                        <div key={task.id} className="group">
                            <div className="flex items-start gap-3 rounded-lg border border-gray-200/60 bg-gradient-to-br from-white to-gray-50/50 p-4 transition-all duration-200 hover:border-blue-200 hover:shadow-md dark:border-gray-700/60 dark:from-gray-800/80 dark:to-gray-800/40 dark:hover:border-blue-700/50">
                                <input
                                    type="checkbox"
                                    checked={task.completed}
                                    className="mt-0.5 h-5 w-5 rounded border-gray-300 text-blue-600 transition-all focus:ring-2 focus:ring-blue-500 dark:border-gray-600"
                                    onChange={() => onToggleTask?.(task.id)}
                                />
                                <div className="min-w-0 flex-1 space-y-2">
                                    {/* Priority Badge */}
                                    <div className="flex items-center gap-2">
                                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${getPriorityBadge(task.priority)}`}>
                                            {t('priority', { priority: task.priority })}
                                        </span>
                                    </div>

                                    {/* Task Title */}
                                    <p className={`text-sm font-medium leading-relaxed ${task.completed ? 'text-gray-500 line-through dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>
                                        {task.text}
                                    </p>

                                    <p className="line-clamp-2 text-sm text-gray-500 dark:text-gray-400">{task.description}</p>

                                    {/* Due Date */}
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                        <Calendar className="h-3.5 w-3.5" />
                                        <span>{t('due', { date: formatDate(task.date) })}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {tasks.length > 3 && (
                        <div className="pt-2 text-center">
                            <button className="rounded-full bg-gray-100 px-4 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600">
                                {t('moreTasks', { count: tasks.length - 3 })}
                            </button>
                        </div>
                    )}
                    {tasks.length === 0 && (
                        <div className="py-8 text-center">
                            <Clock className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600" />
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t('noTasks')}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-4">
            {expandedSections.today && (
                <TaskSection title={t('today')} tasks={currentTasks.today} sectionKey="today" gradient="from-red-500 to-pink-500" />
            )}
            {expandedSections.nextWeek && (
                <TaskSection title={t('thisWeek')} tasks={currentTasks.nextWeek} sectionKey="nextWeek" gradient="from-yellow-500 to-orange-500" />
            )}
            {expandedSections.upcoming && (
                <TaskSection title={t('upcoming')} tasks={currentTasks.upcoming} sectionKey="upcoming" gradient="from-purple-500 to-purple-600" />
            )}
            {expandedSections.past && (
                <TaskSection title={t('past')} tasks={currentTasks.past} sectionKey="past" gradient="from-gray-500 to-gray-600" />
            )}
        </div>
    );
}