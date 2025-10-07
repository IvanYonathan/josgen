import { Task } from '@/types/todo-list/task';

// Date utilities for mock data
const today = new Date();
const todayStr = today.toISOString().split('T')[0];

const nextWeekDate = new Date();
nextWeekDate.setDate(today.getDate() + 7);
const nextWeekStr = nextWeekDate.toISOString().split('T')[0];

const nextMonthDate = new Date();
nextMonthDate.setMonth(today.getMonth() + 1);
const nextMonthStr = nextMonthDate.toISOString().split('T')[0];

const anotherDateThisMonth = new Date();
anotherDateThisMonth.setDate(today.getDate() + 3);
const anotherDateThisMonthStr = anotherDateThisMonth.toISOString().split('T')[0];

// Mock personal tasks
export const personalTasks: Task[] = [
    {
        id: 1,
        text: "Finish the quarterly performance review document.",
        completed: false,
        priority: 'high',
        date: todayStr
    },
    {
        id: 2,
        text: "Schedule a dentist appointment for next month.",
        completed: false,
        priority: 'medium',
        date: todayStr
    },
    {
        id: 3,
        text: "Pay the electricity bill before the due date.",
        completed: false,
        priority: 'high',
        date: anotherDateThisMonthStr
    },
    {
        id: 4,
        text: "Prepare slides for the upcoming Monday presentation.",
        completed: false,
        priority: 'high',
        date: nextWeekStr
    },
    {
        id: 5,
        text: "Book flights for the planned vacation in August.",
        completed: false,
        priority: 'medium',
        date: nextWeekStr
    },
    {
        id: 6,
        text: "Plan the agenda for the project kickoff meeting.",
        completed: false,
        priority: 'low',
        date: nextMonthStr
    }
];

// Mock division tasks
export const divisionTasks: Task[] = [
    {
        id: 10,
        text: "Team meeting preparation and agenda creation.",
        completed: false,
        priority: 'high',
        date: todayStr
    },
    {
        id: 11,
        text: "Review and approve budget proposals from departments.",
        completed: false,
        priority: 'high',
        date: anotherDateThisMonthStr
    },
    {
        id: 12,
        text: "Conduct performance evaluations for team members.",
        completed: false,
        priority: 'medium',
        date: nextWeekStr
    },
    {
        id: 13,
        text: "Organize training sessions for new software.",
        completed: false,
        priority: 'medium',
        date: nextWeekStr
    },
    {
        id: 14,
        text: "Strategic planning session for the next quarter.",
        completed: false,
        priority: 'low',
        date: nextMonthStr
    }
];
