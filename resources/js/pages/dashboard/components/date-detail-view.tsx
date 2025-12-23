import { Task } from '@/types/todo-list/task';

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
            day: 'numeric',
        });
    };

    const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
        switch (priority) {
            case 'high':
                return 'bg-red-500';
            case 'medium':
                return 'bg-yellow-500';
            case 'low':
                return 'bg-gray-500';
            default:
                return 'bg-gray-400';
        }
    };

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4 transition-all duration-300 ease-in-out dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-3 flex items-center justify-between border-b border-gray-200 pb-3 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{formatDate(selectedDate)}</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div className="max-h-48 space-y-3 overflow-y-auto pr-2">
                {tasks.length > 0 ? (
                    tasks.map((task) => (
                        <div key={task.id} className="rounded-md bg-gray-100 p-2 dark:bg-gray-700">
                            <div className="flex items-start">
                                <input
                                    type="checkbox"
                                    checked={task.completed}
                                    className="mt-1 mr-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    onChange={() => {}}
                                />
                                <div className="flex-1">
                                    <div className="mb-1 flex items-center">
                                        <div className={`h-2 w-2 rounded-full ${getPriorityColor(task.priority)} mr-2`}></div>
                                        <span className="text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                                            {task.priority} priority
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">{task.text}</p>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">No tasks for this date.</p>
                )}
            </div>
        </div>
    );
}