import { TaskList } from './task-list';
import { Project } from '@/types/project/project';

interface TaskTabProps {
  project: Project;
  onTasksChange: () => void;
  onAddTask: () => void;
  canManage: boolean;
}

export function TaskTab({ project, onTasksChange, onAddTask, canManage }: TaskTabProps) {
  return (
    <TaskList
      project={project}
      tasks={project.tasks || []}
      onTasksChange={onTasksChange}
      onAddTask={onAddTask}
      canManage={canManage}
    />
  );
}
