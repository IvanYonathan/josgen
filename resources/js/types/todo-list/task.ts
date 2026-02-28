export interface Task {
    id: number;
    text: string;
    completed: boolean;
    description: string;
    priority: 'high' | 'medium' | 'low';
    date: string;
}