import { useEffect, useState, type FC } from 'react';
import { UserIcon, Users } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { Task } from '@/types/todo-list/task';
import { TodoList, TodoItem } from '@/types/todo-list/todo-list';
import { DateDetailView } from './components/date-detail-view';
import { Calendar } from './components/calendar';
import { TaskManager, SectionKey } from './components/task-manager';
import { listTodoLists } from '@/lib/api/todo-list/list-todo-lists';
import { toggleTodoItem } from '@/lib/api/todo-list/items/toggle-todo-item';

import { User } from '@/types/user/user';
import { me } from '@/lib/api/auth/me';

const AppLayout: FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100 font-sans">
        <main>{children}</main>
    </div>
);

const Head: FC<{ title: string }> = ({ title }) => {
    // This component normally sets the document head title.
    // In a real app, this would be handled by a library like React Helmet or Inertia's Head component.
    if (typeof document !== 'undefined') {
        document.title = title;
    }
    return null;
};

const Link: FC<{ href: string; children: React.ReactNode; className?: string }> = ({ href, children, className }) => (
    <a href={href} className={className}>{children}</a>
);

// Transform TodoItem to Task format for compatibility with existing components
const transformTodoItemToTask = (item: TodoItem): Task => {
    // Parse as Date so the browser converts UTC → local timezone, then extract YYYY-MM-DD
    let dateOnly: string;
    if (item.due_date) {
        const d = new Date(item.due_date);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        dateOnly = `${yyyy}-${mm}-${dd}`;
    } else {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        dateOnly = `${yyyy}-${mm}-${dd}`;
    }

    return {
        id: item.id,
        text: item.title,
        completed: item.completed,
        description: item.description ?? '',
        priority: (item.priority || 'medium') as 'high' | 'medium' | 'low',
        date: dateOnly,
    };
};

export default function Dashboard() {
    const { t, i18n } = useTranslation('dashboard');
    const [user, setUser] = useState<User | null>(null);
    const [activeView, setActiveView] = useState('personal');
    const [personalTasks, setPersonalTasks] = useState<Task[]>([]);
    const [divisionTasks, setDivisionTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<SectionKey | null>('today');

    const toggleSection = (section: SectionKey) =>
        setActiveSection((prev) => (prev === section ? null : section));

    const expandedSections: Record<SectionKey, boolean> = {
        today: activeSection === 'today',
        nextWeek: activeSection === 'nextWeek',
        upcoming: activeSection === 'upcoming',
        past: activeSection === 'past',
    };
    const [error, setError] = useState<string | null>(null);

    const [dateDetail, setDateDetail] = useState<{ selectedDate: string; selectedTasks: Task[] }>({
        selectedDate: '',
        selectedTasks: [],
    });

    useEffect(() => {
        me()
            .then((userData) => setUser(userData.user))
            .catch((err) => console.error('Failed to fetch user data:', err));
    }, []);

    // Load todo lists from API
    const loadTodoLists = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch personal tasks
            const personalResponse = await listTodoLists({ type: 'personal', limit: 100 });
            const personalItems: Task[] = [];
            personalResponse.todo_lists.forEach((list: TodoList) => {
                if (list.items) {
                    list.items.forEach((item: TodoItem) => {
                        personalItems.push(transformTodoItemToTask(item));
                    });
                }
            });
            setPersonalTasks(personalItems);

            // Fetch division tasks
            const divisionResponse = await listTodoLists({ type: 'division', limit: 100 });
            const divisionItems: Task[] = [];
            divisionResponse.todo_lists.forEach((list: TodoList) => {
                if (list.items) {
                    list.items.forEach((item: TodoItem) => {
                        divisionItems.push(transformTodoItemToTask(item));
                    });
                }
            });
            setDivisionTasks(divisionItems);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to load tasks';
            setError(errorMsg);
            console.error('Failed to load todo lists:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTodoLists();
    }, []);

    // Handle task toggle (check/uncheck) with optimistic updates
    const handleToggleTask = async (taskId: number) => {
        // Optimistically update the UI immediately
        const updateTaskState = (tasks: Task[]) =>
            tasks.map(task =>
                task.id === taskId
                    ? { ...task, completed: !task.completed }
                    : task
            );

        // Update both personal and division tasks optimistically
        setPersonalTasks(updateTaskState);
        setDivisionTasks(updateTaskState);

        try {
            // Call the API in the background to persist the change
            await toggleTodoItem({ id: taskId });
        } catch (err) {
            console.error('Failed to toggle task:', err);

            // Roll back the optimistic update on error
            setPersonalTasks(updateTaskState); // Toggle back
            setDivisionTasks(updateTaskState); // Toggle back

            // Optionally show an error toast/notification here
            setError('Failed to update task. Please try again.');
        }
    };

    const handleDateClick = (date: string, tasks: Task[]) => {
        if (dateDetail.selectedDate === date) {
            setDateDetail({ selectedDate: '', selectedTasks: [] });
        } else {
            setDateDetail({ selectedDate: date, selectedTasks: tasks });
        }
    };

    const tasksToDisplay = activeView === 'personal' ? personalTasks : divisionTasks;
    const today = new Date();

    // Stats calculation
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const tasksForToday = tasksToDisplay.filter((t) => new Date(t.date + 'T00:00:00').getTime() === startOfToday.getTime());
    // This week = Sunday through Saturday of the current calendar week
    const dayOfWeek = today.getDay(); // 0=Sun
    const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - dayOfWeek);
    const endOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() + (6 - dayOfWeek));
    const tasksForThisWeek = tasksToDisplay.filter((t) => {
        const d = new Date(t.date + 'T00:00:00');
        return d >= startOfWeek && d <= endOfWeek && d.getTime() !== startOfToday.getTime();
    });
    const tasksForUpcoming = tasksToDisplay.filter((t) => new Date(t.date + 'T00:00:00') > endOfWeek);
    const tasksForPast = tasksToDisplay.filter((t) => new Date(t.date + 'T00:00:00') < startOfToday);

    // Calculate pending tasks for notification badges
    const personalPendingCount = personalTasks.filter(t => !t.completed).length;
    const divisionPendingCount = divisionTasks.filter(t => !t.completed).length;

    return (
        <AppLayout>
            <Head title="Dashboard" />
            <div className="flex flex-col rounded-xl p-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{t('welcome', { name: user?.name ?? '' })}</h1>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            {t('scheduleFor', { date: today.toLocaleDateString(i18n.language === 'id' ? 'id-ID' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' }) })}
                        </p>
                    </div>
                    <button
                        onClick={loadTodoLists}
                        disabled={loading}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                    >
                        <svg
                            className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        {t('refresh')}
                    </button>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="mt-4 p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                        {error}
                    </div>
                )}
            </div>

            <div className="mt-6 flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="grid gap-4 md:grid-cols-3">
                    {/* Task Manager Column (takes 2/3 width) */}
                    <div className="dark:border-sidebar-border/70 border-sidebar-border/70 rounded-xl border bg-white p-4 md:col-span-2 dark:bg-gray-800">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('taskManager')}</h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {activeView === 'personal' ? t('personalTasks') : t('teamTasks')}
                                </p>
                            </div>
                            <div className="flex items-center rounded-lg bg-gray-100 p-1 dark:bg-gray-700">
                                <button
                                    onClick={() => setActiveView('personal')}
                                    className={`relative flex items-center rounded px-3 py-1 text-xs font-medium transition-colors ${activeView === 'personal'
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}
                                >
                                    <UserIcon className="mr-1 h-3 w-3" />
                                    {t('personal')}
                                    {personalPendingCount > 0 && (
                                        <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm">
                                            {personalPendingCount}
                                        </span>
                                    )}
                                </button>
                                <button
                                    onClick={() => setActiveView('division')}
                                    className={`relative flex items-center rounded px-3 py-1 text-xs font-medium transition-colors ${activeView === 'division'
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}
                                >
                                    <Users className="mr-1 h-3 w-3" />
                                    {t('division')}
                                    {divisionPendingCount > 0 && (
                                        <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm">
                                            {divisionPendingCount}
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>
                        <div className="mb-4 grid grid-cols-4 gap-2">
                            {/* Today */}
                            <button
                                onClick={() => toggleSection('today')}
                                className={`cursor-pointer rounded-xl p-3 text-center transition-all duration-200 hover:scale-105 active:scale-95 border-2 shadow-sm ${expandedSections.today
                                    ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/30 dark:border-blue-400'
                                    : 'bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600 hover:border-blue-300 hover:bg-blue-50/50 dark:hover:border-blue-600'
                                    }`}
                            >
                                <div className={`text-xl font-bold ${expandedSections.today ? 'text-blue-600' : 'text-blue-500'}`}>{tasksForToday.length}</div>
                                <div className={`text-xs font-medium mt-0.5 ${expandedSections.today ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>{t('today')}</div>
                            </button>

                            {/* This Week */}
                            <button
                                onClick={() => toggleSection('nextWeek')}
                                className={`cursor-pointer rounded-xl p-3 text-center transition-all duration-200 hover:scale-105 active:scale-95 border-2 shadow-sm ${expandedSections.nextWeek
                                    ? 'bg-yellow-50 border-yellow-500 dark:bg-yellow-900/30 dark:border-yellow-400'
                                    : 'bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600 hover:border-yellow-300 hover:bg-yellow-50/50 dark:hover:border-yellow-600'
                                    }`}
                            >
                                <div className={`text-xl font-bold ${expandedSections.nextWeek ? 'text-yellow-600' : 'text-blue-500'}`}>{tasksForThisWeek.length}</div>
                                <div className={`text-xs font-medium mt-0.5 ${expandedSections.nextWeek ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-600 dark:text-gray-400'}`}>{t('thisWeek')}</div>
                            </button>

                            {/* Upcoming */}
                            <button
                                onClick={() => toggleSection('upcoming')}
                                className={`cursor-pointer rounded-xl p-3 text-center transition-all duration-200 hover:scale-105 active:scale-95 border-2 shadow-sm ${expandedSections.upcoming
                                    ? 'bg-purple-50 border-purple-500 dark:bg-purple-900/30 dark:border-purple-400'
                                    : 'bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600 hover:border-purple-300 hover:bg-purple-50/50 dark:hover:border-purple-600'
                                    }`}
                            >
                                <div className={`text-xl font-bold ${expandedSections.upcoming ? 'text-purple-600' : 'text-gray-500'}`}>{tasksForUpcoming.length}</div>
                                <div className={`text-xs font-medium mt-0.5 ${expandedSections.upcoming ? 'text-purple-600 dark:text-purple-400' : 'text-gray-600 dark:text-gray-400'}`}>{t('upcoming')}</div>
                            </button>

                            {/* Past */}
                            <button
                                onClick={() => toggleSection('past')}
                                className={`cursor-pointer rounded-xl p-3 text-center transition-all duration-200 hover:scale-105 active:scale-95 border-2 shadow-sm ${expandedSections.past
                                    ? 'bg-gray-100 border-gray-500 dark:bg-gray-600/30 dark:border-gray-400'
                                    : 'bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600 hover:border-gray-400 hover:bg-gray-100 dark:hover:border-gray-500'
                                    }`}
                            >
                                <div className={`text-xl font-bold ${expandedSections.past ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500'}`}>{tasksForPast.length}</div>
                                <div className={`text-xs font-medium mt-0.5 ${expandedSections.past ? 'text-gray-700 dark:text-gray-300' : 'text-gray-600 dark:text-gray-400'}`}>{t('past')}</div>
                            </button>
                        </div>
                        <TaskManager
                            tasks={tasksToDisplay}
                            onToggleTask={handleToggleTask}
                            expandedSections={expandedSections}
                            onToggleSection={toggleSection}
                        />
                        {activeView === 'personal' && (
                            <div className="mt-4">
                                <Link
                                    href="/toDoList/personal"
                                    className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                                >
                                    {t('viewAllTasks')}
                                </Link>
                            </div>
                        )
                        }

                        {activeView === 'division' && (
                            <div className="mt-4">
                                <Link
                                    href="/toDoList/division"
                                    className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                                >
                                    {t('viewAllTasks')}
                                </Link>
                            </div>
                        )
                        }

                    </div>

                    <div className="flex flex-col gap-4 md:col-span-1">
                        <div className="dark:border-sidebar-border/70 border-sidebar-border/70 overflow-hidden rounded-xl border bg-white dark:bg-gray-800">
                            <Calendar tasks={tasksToDisplay} onDateClick={handleDateClick} selectedDate={dateDetail.selectedDate} />
                        </div>

                        {dateDetail.selectedDate && (
                            <DateDetailView
                                selectedDate={dateDetail.selectedDate}
                                tasks={dateDetail.selectedTasks}
                                onClose={() => setDateDetail({ selectedDate: '', selectedTasks: [] })}
                            />
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

