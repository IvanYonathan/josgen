import React from 'react';
import { Head, Link } from '@inertiajs/react';

export default function DivisionToDoList() {
    const tasks = [
        { id: 1, title: 'Prepare Quarterly Report', status: 'Pending' },
        { id: 2, title: 'Team Meeting', status: 'Completed' },
        { id: 3, title: 'Update Project Plan', status: 'In Progress' },
    ];

    return (
        <>
            <Head title="Division To-Do List" />
            <div className="p-6">
                <h1 className="text-2xl font-bold mb-4">Division To-Do List</h1>
                <div className="bg-white shadow rounded-lg p-4">
                    <table className="w-full border-collapse border border-gray-200">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-gray-300 px-4 py-2 text-left">Task</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tasks.map((task) => (
                                <tr key={task.id} className="hover:bg-gray-50">
                                    <td className="border border-gray-300 px-4 py-2">{task.title}</td>
                                    <td className="border border-gray-300 px-4 py-2">{task.status}</td>
                                    <td className="border border-gray-300 px-4 py-2">
                                        <Link
                                            href={`/toDoList/division/${task.id}`}
                                            className="text-blue-500 hover:underline"
                                        >
                                            View
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}