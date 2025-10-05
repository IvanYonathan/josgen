import { useState, type FC } from 'react';
import { User, Users, Edit3, ChevronDown, ChevronRight, ChevronLeft } from 'lucide-react';
import { usePage } from '@inertiajs/react';




const AppLayout: FC<{ children: React.ReactNode; breadcrumbs: any[] }> = ({ children }) => (
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

// --- TYPE DEFINITIONS ---
interface Task {
    id: number;
    text: string;
    completed: boolean;
    priority: 'high' | 'medium' | 'low';
    date: string;
}

interface BreadcrumbItem {
    title: string;
    href: string;
}

// --- NEW: DATE DETAIL VIEW COMPONENT ---
interface DateDetailViewProps {
    selectedDate: string;
    tasks: Task[];
    onClose: () => void;
}

function DateDetailView({ selectedDate, tasks, onClose }: DateDetailViewProps) {
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
        switch (priority) {
            case 'high': return 'bg-red-500';
            case 'medium': return 'bg-yellow-500';
            case 'low': return 'bg-gray-500';
            default: return 'bg-gray-400';
        }
    };

    return (
        <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg p-4 transition-all duration-300 ease-in-out">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3 mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{formatDate(selectedDate)}</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                {tasks.length > 0 ? tasks.map(task => (
                    <div key={task.id} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                        <div className="flex items-start">
                            <input type="checkbox" checked={task.completed} className="mt-1 mr-3 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" onChange={() => {}} />
                            <div className="flex-1">
                                <div className="flex items-center mb-1"><div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)} mr-2`}></div><span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">{task.priority} priority</span></div>
                                <p className="text-sm text-gray-700 dark:text-gray-300">{task.text}</p>
                            </div>
                        </div>
                    </div>
                )) : <p className="text-sm text-center text-gray-500 dark:text-gray-400 py-4">No tasks for this date.</p>}
            </div>
        </div>
    );
}

// --- UPDATED CALENDAR COMPONENT ---
interface CalendarProps {
    tasks: Task[];
    onDateClick: (date: string, tasks: Task[]) => void;
    selectedDate: string;
}

function Calendar({ tasks, onDateClick, selectedDate }: CalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    
    const today = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstDayWeekday = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    const navigateMonth = (direction: 'prev' | 'next') => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + (direction === 'prev' ? -1 : 1));
            return newDate;
        });
    };
    
    const getTasksForDate = (date: number) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
        return tasks.filter(task => task.date === dateStr);
    };
    
    const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
        switch (priority) {
            case 'high': return 'bg-red-500';
            case 'medium': return 'bg-yellow-500';
            case 'low': return 'bg-gray-500';
            default: return 'bg-gray-400';
        }
    };
    
    const renderCalendarDays = () => {
        const days = [];
        for (let i = 0; i < firstDayWeekday; i++) {
            days.push(<div key={`empty-${i}`} className="aspect-square bg-gray-50 dark:bg-gray-800/50"></div>);
        }
        
        for (let date = 1; date <= daysInMonth; date++) {
            const dayTasks = getTasksForDate(date);
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
            const isCurrentDay = today.getDate() === date && today.getMonth() === month && today.getFullYear() === year;
            const isSelectedDay = selectedDate === dateStr;

            days.push(
                <div 
                    key={date} 
                    onClick={() => onDateClick(dateStr, dayTasks)}
                    className={`aspect-square p-2 flex flex-col hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer ${isCurrentDay && !isSelectedDay ? 'bg-blue-50 dark:bg-blue-900/20' : ''} ${isSelectedDay ? 'border-2 border-blue-500 bg-blue-100 dark:bg-blue-900/30' : 'bg-white dark:bg-gray-800'}`}
                >
                    <div className={`text-sm font-medium mb-1 ${isCurrentDay ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'}`}>
                        {date}
                    </div>
                    <div className="flex-grow overflow-hidden space-y-1">
                        {dayTasks.map(task => (
                            <div key={task.id} className={`w-full h-1.5 rounded-full ${getPriorityColor(task.priority)}`} title={task.text}></div>
                        ))}
                    </div>
                </div>
            );
        }
        
        return days;
    };
    
    return (
        <div className="h-full bg-white dark:bg-gray-800 p-4">
            <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{monthNames[month]} {year}</h2><div className="flex items-center space-x-1"><button onClick={() => navigateMonth('prev')} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"><ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" /></button><button onClick={() => navigateMonth('next')} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"><ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" /></button></div></div>
            <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                {weekdays.map(day => (<div key={day} className="p-2 bg-gray-50 dark:bg-gray-800 text-center text-xs font-medium text-gray-600 dark:text-gray-400">{day}</div>))}
                {renderCalendarDays()}
            </div>
        </div>
    );
}


// --- DATA & TASK MANAGER ---
const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: '/dashboard' }];
const today = new Date();
const todayStr = today.toISOString().split('T')[0];
const nextWeekDate = new Date(); nextWeekDate.setDate(today.getDate() + 7); const nextWeekStr = nextWeekDate.toISOString().split('T')[0];
const nextMonthDate = new Date(); nextMonthDate.setMonth(today.getMonth() + 1); const nextMonthStr = nextMonthDate.toISOString().split('T')[0];
const anotherDateThisMonth = new Date(); anotherDateThisMonth.setDate(today.getDate() + 3); const anotherDateThisMonthStr = anotherDateThisMonth.toISOString().split('T')[0];
const personalTasks: Task[] = [{ id: 1, text: "Finish the quarterly performance review document.", completed: false, priority: 'high', date: todayStr }, { id: 2, text: "Schedule a dentist appointment for next month.", completed: false, priority: 'medium', date: todayStr }, { id: 3, text: "Pay the electricity bill before the due date.", completed: false, priority: 'high', date: anotherDateThisMonthStr }, { id: 4, text: "Prepare slides for the upcoming Monday presentation.", completed: false, priority: 'high', date: nextWeekStr }, { id: 5, text: "Book flights for the planned vacation in August.", completed: false, priority: 'medium', date: nextWeekStr }, { id: 6, text: "Plan the agenda for the project kickoff meeting.", completed: false, priority: 'low', date: nextMonthStr }];
const divisionTasks: Task[] = [{ id: 10, text: "Team meeting preparation and agenda creation.", completed: false, priority: 'high', date: todayStr }, { id: 11, text: "Review and approve budget proposals from departments.", completed: false, priority: 'high', date: anotherDateThisMonthStr }, { id: 12, text: "Conduct performance evaluations for team members.", completed: false, priority: 'medium', date: nextWeekStr }, { id: 13, text: "Organize training sessions for new software.", completed: false, priority: 'medium', date: nextWeekStr }, { id: 14, text: "Strategic planning session for the next quarter.", completed: false, priority: 'low', date: nextMonthStr }];

type SectionKey = 'today' | 'nextWeek' | 'upcoming';

function TaskManager({ tasks }: { tasks: Task[] }) {
    const [expandedSections, setExpandedSections] = useState<Record<SectionKey, boolean>>({ today: true, nextWeek: true, upcoming: true });
    
    const toggleSection = (section: SectionKey) => setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));

    const categorizeTasks = (tasksToCategorize: Task[]) => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        const endOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);
        return {
            today: tasksToCategorize.filter(t => new Date(t.date + 'T00:00:00').getTime() === startOfToday.getTime()),
            nextWeek: tasksToCategorize.filter(t => { const d = new Date(t.date + 'T00:00:00'); return d >= startOfTomorrow && d <= endOfWeek; }),
            upcoming: tasksToCategorize.filter(t => new Date(t.date + 'T00:00:00') > endOfWeek),
        };
    };

    const currentTasks = categorizeTasks(tasks);
    const getPriorityIcon = (priority: 'high' | 'medium' | 'low') => {
        switch (priority) {
            case 'high': return <div className="w-2 h-2 rounded-full bg-gradient-to-r from-red-400 to-red-600 mr-2 flex-shrink-0 shadow-sm"></div>;
            case 'medium': return <div className="w-2 h-2 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 mr-2 flex-shrink-0 shadow-sm"></div>;
            case 'low': return <div className="w-2 h-2 rounded-full bg-gradient-to-r from-gray-400 to-gray-600 mr-2 flex-shrink-0 shadow-sm"></div>;
            default: return <div className="w-2 h-2 rounded-full bg-gradient-to-r from-gray-300 to-gray-500 mr-2 flex-shrink-0 shadow-sm"></div>;
        }
    };

    const TaskSection: FC<{ title: string; tasks: Task[]; sectionKey: SectionKey; gradient: string }> = ({ title, tasks, sectionKey, gradient }) => (
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/20 overflow-hidden">
            <button onClick={() => toggleSection(sectionKey)} className="flex items-center justify-between w-full p-4 hover:bg-white/80 dark:hover:bg-gray-700/80 transition-all duration-200">
                <div className="flex items-center"><div className={`w-3 h-3 rounded-full bg-gradient-to-r ${gradient} mr-3`}></div><h3 className="font-semibold text-gray-800 dark:text-gray-200">{title}</h3><span className="ml-2 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full">{tasks.length}</span></div>
                <div className={`transform transition-transform duration-200 ${expandedSections[sectionKey] ? 'rotate-180' : ''}`}><ChevronDown className="w-4 h-4 text-gray-500" /></div>
            </button>
            {expandedSections[sectionKey] && (<div className="px-4 pb-4 space-y-3">{tasks.slice(0, 3).map(task => (<div key={task.id} className="group"><div className="flex items-start p-3 bg-white/50 dark:bg-gray-700/50 rounded-lg hover:bg-white/80 dark:hover:bg-gray-700/80 transition-all duration-200 hover:shadow-md"><input type="checkbox" checked={task.completed} className="mt-1 mr-3 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2" onChange={() => { }} /><div className="flex-1 min-w-0"><div className="flex items-center mb-1">{getPriorityIcon(task.priority)}<span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{task.priority} priority</span></div><p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-2">{task.text}</p></div><div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"><button className="p-1 text-gray-400 hover:text-indigo-500 transition-colors"><Edit3 className="w-3 h-3" /></button></div></div></div>))} {tasks.length > 3 && (<div className="text-center pt-2"><span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100/80 dark:bg-gray-700/80 px-3 py-1 rounded-full">+{tasks.length - 3} more tasks</span></div>)}</div>)}
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


export default function Dashboard() {
    const { auth } = usePage<{ auth: { user: { name: string } } }>().props;
const userName = auth?.user?.name || 'User';

    const [activeView, setActiveView] = useState('personal');
    
    const [dateDetail, setDateDetail] = useState<{ selectedDate: string; selectedTasks: Task[] }>({
        selectedDate: '',
        selectedTasks: []
    });

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
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex flex-col p-6 rounded-xl"><h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Welcome, {userName}</h1><p className="text-sm text-neutral-600 dark:text-neutral-400">Here's your schedule for {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}.</p></div>
            
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
                                <button onClick={() => setActiveView('personal')} className={`flex items-center px-3 py-1 rounded text-xs font-medium transition-colors ${activeView === 'personal' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}><User className="w-3 h-3 mr-1" />Personal</button>
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

