import { Task } from "@/types/todo-list/task";
import { ChevronDown, Edit3 } from "lucide-react";
import { FC, useState } from "react";

type SectionKey = 'today' | 'nextWeek' | 'upcoming';

export function TaskManager({ tasks }: Readonly<{ tasks: Task[] }>) {
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