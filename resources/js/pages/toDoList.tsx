import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';

interface Task {
    id: number;
    text: string;
    completed: boolean;
}

export default function ToDoList() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTask, setNewTask] = useState<string>("");

    const addTask = () => {
        if (newTask.trim() === "") return;
        const newTaskObj: Task = {
            id: Date.now(),
            text: newTask,
            completed: false,
        };
        setTasks([...tasks, newTaskObj]);
        setNewTask("");
    };

    const toggleTaskCompletion = (id: number) => {
        setTasks(tasks.map(task => 
            task.id === id ? { ...task, completed: !task.completed } : task
        ));
    };

    const deleteTask = (id: number) => {
        setTasks(tasks.filter(task => task.id !== id));
    };

    return (
        <AppLayout>
            <Head title="To-Do List" />
            <div className="p-6">
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                    To-Do List
                </h1>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                    Manage your tasks here.
                </p>

                {/* Add Task Input */}
                <div className="flex gap-2 mb-4">
                    <input
                        type="text"
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        placeholder="Add a new task"
                        className="flex-1 p-2 border rounded-md dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-100"
                    />
                    <button
                        onClick={addTask}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                        Add
                    </button>
                </div>

                {/* Task List */}
                <ul className="space-y-2">
                    {tasks.map((task) => (
                        <li
                            key={task.id}
                            className={`flex items-center justify-between p-2 border rounded-md ${
                                task.completed
                                    ? "bg-green-100 dark:bg-green-900"
                                    : "bg-white dark:bg-neutral-800"
                            }`}
                        >
                            <div
                                className={`flex-1 cursor-pointer ${
                                    task.completed
                                        ? "line-through text-neutral-500 dark:text-neutral-400"
                                        : "text-neutral-900 dark:text-neutral-100"
                                }`}
                                onClick={() => toggleTaskCompletion(task.id)}
                            >
                                {task.text}
                            </div>
                            <button
                                onClick={() => deleteTask(task.id)}
                                className="ml-4 text-red-500 hover:text-red-700"
                            >
                                Delete
                            </button>
                        </li>
                    ))}
                </ul>

                {/* No Tasks Message */}
                {tasks.length === 0 && (
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-4">
                        No tasks yet. Add a task to get started!
                    </p>
                )}
            </div>
        </AppLayout>
    );
}