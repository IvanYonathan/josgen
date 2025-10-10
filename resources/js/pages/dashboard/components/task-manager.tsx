import { Task } from '@/types/todo-list/task';
import { ChevronDown, Edit3 } from 'lucide-react';
import { FC, useState } from 'react';

type SectionKey = 'today' | 'nextWeek' | 'upcoming';

export function TaskManager({ tasks }: Readonly<{ tasks: Task[] }>) {
    const [expandedSections, setExpandedSections] = useState<Record<SectionKey, boolean>>({ today: true, nextWeek: true, upcoming: true });

    const toggleSection = (section: SectionKey) => setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));

    const categorizeTasks = (tasksToCategorize: Task[]) => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        const endOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);
        return {
            today: tasksToCategorize.filter((t) => new Date(t.date + 'T00:00:00').getTime() === startOfToday.getTime()),
            nextWeek: tasksToCategorize.filter((t) => {
                const d = new Date(t.date + 'T00:00:00');
                return d >= startOfTomorrow && d <= endOfWeek;
            }),
            upcoming: tasksToCategorize.filter((t) => new Date(t.date + 'T00:00:00') > endOfWeek),
        };
    };

    const currentTasks = categorizeTasks(tasks);
    const getPriorityIcon = (priority: 'high' | 'medium' | 'low') => {
        switch (priority) {
            case 'high':
                return <div className="mr-2 h-2 w-2 flex-shrink-0 rounded-full bg-gradient-to-r from-red-400 to-red-600 shadow-sm"></div>;
            case 'medium':
                return <div className="mr-2 h-2 w-2 flex-shrink-0 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 shadow-sm"></div>;
            case 'low':
                return <div className="mr-2 h-2 w-2 flex-shrink-0 rounded-full bg-gradient-to-r from-gray-400 to-gray-600 shadow-sm"></div>;
            default:
                return <div className="mr-2 h-2 w-2 flex-shrink-0 rounded-full bg-gradient-to-r from-gray-300 to-gray-500 shadow-sm"></div>;
        }
    };

    const TaskSection: FC<{ title: string; tasks: Task[]; sectionKey: SectionKey; gradient: string }> = ({ title, tasks, sectionKey, gradient }) => (
        <div className="overflow-hidden rounded-xl border border-white/20 bg-white/60 backdrop-blur-sm dark:border-gray-700/20 dark:bg-gray-800/60">
            <button
                onClick={() => toggleSection(sectionKey)}
                className="flex w-full items-center justify-between p-4 transition-all duration-200 hover:bg-white/80 dark:hover:bg-gray-700/80"
            >
                <div className="flex items-center">
                    <div className={`h-3 w-3 rounded-full bg-gradient-to-r ${gradient} mr-3`}></div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
                    <span className="ml-2 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                        {tasks.length}
                    </span>
                </div>
                <div className={`transform transition-transform duration-200 ${expandedSections[sectionKey] ? 'rotate-180' : ''}`}>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                </div>
            </button>
            {expandedSections[sectionKey] && (
                <div className="space-y-3 px-4 pb-4">
                    {tasks.slice(0, 3).map((task) => (
                        <div key={task.id} className="group">
                            <div className="flex items-start rounded-lg bg-white/50 p-3 transition-all duration-200 hover:bg-white/80 hover:shadow-md dark:bg-gray-700/50 dark:hover:bg-gray-700/80">
                                <input
                                    type="checkbox"
                                    checked={task.completed}
                                    className="mt-1 mr-3 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                                    onChange={() => {}}
                                />
                                <div className="min-w-0 flex-1">
                                    <div className="mb-1 flex items-center">
                                        {getPriorityIcon(task.priority)}
                                        <span className="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
                                            {task.priority} priority
                                        </span>
                                    </div>
                                    <p className="line-clamp-2 text-sm leading-relaxed text-gray-700 dark:text-gray-300">{task.text}</p>
                                </div>
                                <div className="opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                    <button className="p-1 text-gray-400 transition-colors hover:text-indigo-500">
                                        <Edit3 className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}{' '}
                    {tasks.length > 3 && (
                        <div className="pt-2 text-center">
                            <span className="rounded-full bg-gray-100/80 px-3 py-1 text-xs text-gray-500 dark:bg-gray-700/80 dark:text-gray-400">
                                +{tasks.length - 3} more tasks
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-4">
            <TaskSection title="🔥 Today" tasks={currentTasks.today} sectionKey="today" gradient="from-red-500 to-pink-500" />
            <TaskSection title="📅 This Week" tasks={currentTasks.nextWeek} sectionKey="nextWeek" gradient="from-yellow-500 to-orange-500" />
            <TaskSection title="🗓️ Upcoming" tasks={currentTasks.upcoming} sectionKey="upcoming" gradient="from-gray-500 to-gray-600" />
        </div>
    );
}