import { useEffect, useState, type FC } from 'react';
import { UserIcon, Users } from 'lucide-react';
import { Task } from '@/types/todo-list/task';
import { DateDetailView } from './components/date-detail-view';
import { Calendar } from './components/calendar';
import { TaskManager } from './components/task-manager';
import { personalTasks, divisionTasks } from '@/data/mock-tasks';

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

export default function Dashboard() {
    const [user, setUser] = useState<User | null>(null);

    const [activeView, setActiveView] = useState('personal');

    const [dateDetail, setDateDetail] = useState<{ selectedDate: string; selectedTasks: Task[] }>({
        selectedDate: '',
        selectedTasks: [],
    });

    useEffect(() => {
        me()
            .then((userData) => setUser(userData.user))
            .catch((err) => console.error('Failed to fetch user data:', err));
    }, []);

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

    return (
        <AppLayout>
            <Head title="Dashboard" />
            <div className="flex flex-col rounded-xl p-6">
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Welcome, {`${user?.name}`}</h1>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Here's your schedule for {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}.
                </p>
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
                                    className={`flex items-center rounded px-3 py-1 text-xs font-medium transition-colors $
                                        {activeView === 'personal' 
                                        ? 'bg-blue-600 text-white' 
                                        : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}
                                >
                                    <UserIcon className="mr-1 h-3 w-3" />
                                    Personal
                                </button>
                                <button
                                    onClick={() => setActiveView('division')}
                                    className={`flex items-center rounded px-3 py-1 text-xs font-medium transition-colors ${activeView === 'division' 
                                        ? 'bg-blue-600 text-white' 
                                        : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}
                                >
                                    <Users className="mr-1 h-3 w-3" />
                                    Division
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
                        <TaskManager tasks={tasksToDisplay} />
                        <div className="mt-4">
                            <Link
                                href="/toDoList"
                                className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                            >
                                View All Tasks
                            </Link>
                        </div>
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

