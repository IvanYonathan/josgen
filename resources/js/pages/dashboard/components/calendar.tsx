import { Task } from '@/types/todo-list/task';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface CalendarProps {
    tasks: Task[];
    onDateClick: (date: string, tasks: Task[]) => void;
    selectedDate: string;
}

export function Calendar({ tasks, onDateClick, selectedDate }: Readonly<CalendarProps>) {
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
        setCurrentDate((prev) => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + (direction === 'prev' ? -1 : 1));
            return newDate;
        });
    };

    const getTasksForDate = (date: number) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
        return tasks.filter((task) => task.date === dateStr);
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
                    className={`flex aspect-square cursor-pointer flex-col p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${isCurrentDay && !isSelectedDay 
                        ? 'bg-blue-50 dark:bg-blue-900/20' : ''} ${isSelectedDay 
                        ? 'border-2 border-blue-500 bg-blue-100 dark:bg-blue-900/30' : 'bg-white dark:bg-gray-800'}`}
                    >
                    <div
                        className={`mb-1 text-sm font-medium ${isCurrentDay ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'}`}
                    >
                        {date}
                    </div>
                    <div className="flex-grow space-y-1 overflow-hidden">
                        {dayTasks.map((task) => (
                            <div key={task.id} className={`h-1.5 w-full rounded-full ${getPriorityColor(task.priority)}`} title={task.text}></div>
                        ))}
                    </div>
                </div>,
            );
        }

        return days;
    };

    return (
        <div className="h-full bg-white p-4 dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {monthNames[month]} {year}
                </h2>
                <div className="flex items-center space-x-1">
                    <button onClick={() => navigateMonth('prev')} className="rounded p-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700">
                        <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </button>
                    <button onClick={() => navigateMonth('next')} className="rounded p-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700">
                        <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200 dark:border-gray-700 dark:bg-gray-700">
                {weekdays.map((day) => (
                    <div key={day} className="bg-gray-50 p-2 text-center text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                        {day}
                    </div>
                ))}
                {renderCalendarDays()}
            </div>
        </div>
    );
}