import { Task } from "@/types/todo-list/task";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

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