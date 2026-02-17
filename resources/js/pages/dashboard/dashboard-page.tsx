import { useEffect, useState, type FC } from 'react';
import { UserIcon, Users } from 'lucide-react';
import { Task } from '@/types/todo-list/task';
import { TodoList, TodoItem } from '@/types/todo-list/todo-list';
import { DateDetailView } from './components/date-detail-view';
import { Calendar } from './components/calendar';
import { TaskManager } from './components/task-manager';
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
    // Extract just the date part (YYYY-MM-DD) from ISO timestamp
    const dateOnly = item.due_date
        ? item.due_date.split('T')[0]
        : new Date().toISOString().split('T')[0];

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
    const [user, setUser] = useState<User | null>(null);
    const [activeView, setActiveView] = useState('personal');
    const [personalTasks, setPersonalTasks] = useState<Task[]>([]);
    const [divisionTasks, setDivisionTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
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

        // Reload data when user returns to this tab/window
        const handleFocus = () => {
            loadTodoLists();
        };

        window.addEventListener('focus', handleFocus);

        return () => {
            window.removeEventListener('focus', handleFocus);
        };
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
    const startOfTomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const endOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
    const tasksForThisWeek = tasksToDisplay.filter((t) => {
        const d = new Date(t.date + 'T00:00:00');
        return d >= startOfTomorrow && d <= endOfWeek;
    });
    const tasksForUpcoming = tasksToDisplay.filter((t) => new Date(t.date + 'T00:00:00') > endOfWeek);

    // Calculate pending tasks for notification badges
    const personalPendingCount = personalTasks.filter(t => !t.completed).length;
    const divisionPendingCount = divisionTasks.filter(t => !t.completed).length;

    return (
        <AppLayout>
            <Head title="Dashboard" />
            <div className="flex flex-col rounded-xl p-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Welcome, {`${user?.name}`}</h1>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Here's your schedule for {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}.
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
                        Refresh
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
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Task Manager</h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {activeView === 'personal' ? 'Your personal tasks' : 'Team & division tasks'}
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
                                    Personal
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
                                    Division
                                    {divisionPendingCount > 0 && (
                                        <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm">
                                            {divisionPendingCount}
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>
                        <div className="mb-4 grid grid-cols-3 gap-2">
                            <div className="rounded-lg bg-gray-50 p-2 text-center dark:bg-gray-700">
                                <div className="text-lg font-bold text-blue-600">{tasksForToday.length}</div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">Today</div>
                            </div>
                            <div className="rounded-lg bg-gray-50 p-2 text-center dark:bg-gray-700">
                                <div className="text-lg font-bold text-blue-600">{tasksForThisWeek.length}</div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">This Week</div>
                            </div>
                            <div className="rounded-lg bg-gray-50 p-2 text-center dark:bg-gray-700">
                                <div className="text-lg font-bold text-gray-500">{tasksForUpcoming.length}</div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">Upcoming</div>
                            </div>
                        </div>
                        <TaskManager tasks={tasksToDisplay} onToggleTask={handleToggleTask} />
                        { activeView === 'personal' &&(
                            <div className="mt-4">
                            <Link
                                href="/toDoList/personal"
                                className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                            >
                                View All Tasks
                            </Link>
                        </div>
                            )
                        }

                        { activeView === 'division' &&(
                            <div className="mt-4">
                            <Link
                                href="/toDoList/division"
                                className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                            >
                                View All Tasks
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

