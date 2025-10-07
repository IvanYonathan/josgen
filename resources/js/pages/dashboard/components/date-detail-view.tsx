import { Task } from "@/types/todo-list/task";

interface DateDetailViewProps {
    selectedDate: string;
    tasks: Task[];
    onClose: () => void;
}

export function DateDetailView({ selectedDate, tasks, onClose }: Readonly<DateDetailViewProps>) {
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