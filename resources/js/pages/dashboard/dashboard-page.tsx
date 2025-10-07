import { useEffect, useState, type FC } from 'react';
import { UserIcon, Users } from 'lucide-react';
import { Task } from '@/types/todo-list/task';
import { DateDetailView } from './components/date-detail-view';
import { Calendar } from './components/calendar';
import { TaskManager } from './components/task-manager';
import { personalTasks, divisionTasks } from '@/data/mock-tasks';
import { me } from '@/lib/api/auth';
import { User } from '@/types/user/user';

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
        selectedTasks: []
    });

    useEffect(() => {
        me().then(
            userData => setUser(userData.user))
            .catch(err => console.error('Failed to fetch user data:', err));
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
    const tasksForToday = tasksToDisplay.filter(t => new Date(t.date + 'T00:00:00').getTime() === startOfToday.getTime());
    const startOfTomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const endOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
    const tasksForThisWeek = tasksToDisplay.filter(t => { const d = new Date(t.date + 'T00:00:00'); return d >= startOfTomorrow && d <= endOfWeek; });
    const tasksForUpcoming = tasksToDisplay.filter(t => new Date(t.date + 'T00:00:00') > endOfWeek);

    return (
        <AppLayout>
            <Head title="Dashboard" />
            <div className="flex flex-col p-6 rounded-xl"><h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Welcome, {`${user?.name}`}</h1><p className="text-sm text-neutral-600 dark:text-neutral-400">Here's your schedule for {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}.</p></div>
            
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 mt-6">
                <div className="grid md:grid-cols-3 gap-4">
                    {/* Task Manager Column (takes 2/3 width) */}
                    <div className="md:col-span-2 dark:border-sidebar-border/70 border border-sidebar-border/70 bg-white dark:bg-gray-800 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Task Manager</h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{activeView === 'personal' ? 'Your personal tasks' : 'Team & division tasks'}</p>
                            </div>
                            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                <button onClick={() => setActiveView('personal')} className={`flex items-center px-3 py-1 rounded text-xs font-medium transition-colors ${activeView === 'personal' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}><UserIcon className="w-3 h-3 mr-1" />Personal</button>
                                <button onClick={() => setActiveView('division')} className={`flex items-center px-3 py-1 rounded text-xs font-medium transition-colors ${activeView === 'division' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}><Users className="w-3 h-3 mr-1" />Division</button>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mb-4">
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2 text-center"><div className="text-lg font-bold text-blue-600">{tasksForToday.length}</div><div className="text-xs text-gray-600 dark:text-gray-400">Today</div></div>
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2 text-center"><div className="text-lg font-bold text-blue-600">{tasksForThisWeek.length}</div><div className="text-xs text-gray-600 dark:text-gray-400">This Week</div></div>
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2 text-center"><div className="text-lg font-bold text-gray-500">{tasksForUpcoming.length}</div><div className="text-xs text-gray-600 dark:text-gray-400">Upcoming</div></div>
                        </div>
                        <TaskManager tasks={tasksToDisplay} />
                         <div className="mt-4">
                            <Link href="/toDoList" className="flex items-center justify-center w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">View All Tasks</Link>
                        </div>
                    </div>
                    
                    {/* Calendar & Details Column (takes 1/3 width) */}
                    <div className="md:col-span-1 flex flex-col gap-4">
                        <div className="dark:border-sidebar-border/70 border border-sidebar-border/70 bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
                            <Calendar 
                                tasks={tasksToDisplay} 
                                onDateClick={handleDateClick}
                                selectedDate={dateDetail.selectedDate}
                            />
                        </div>

                        {/* Conditionally render the detail view below the calendar */}
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

