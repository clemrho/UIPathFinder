import React from 'react';

interface Task {
  id: number;
  title: string;
  type: string;
  date: string;
  status: string;
}

interface TaskTimelineProps {
  tasks: Task[];
  onDeleteTask: (id: number) => void;
  onToggleStatus: (id: number) => void;
}

const ArrowRightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export function TaskTimeline({ tasks, onDeleteTask, onToggleStatus }: TaskTimelineProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-sm text-gray-600 mb-4">
        <span>Title & Type</span>
        <span className="ml-auto">D = 10/17</span>
      </div>

      {tasks.map((task, index) => (
        <div key={task.id} className="flex items-start gap-4">
          <button
            onClick={() => onToggleStatus(task.id)}
            className={`mt-1 size-4 shrink-0 rounded border transition-all ${
              task.status === 'completed'
                ? 'bg-sky-500 border-sky-500 text-white'
                : 'bg-white border-gray-300 hover:border-gray-400'
            }`}
          >
            {task.status === 'completed' && (
              <span className="flex items-center justify-center">
                <CheckIcon />
              </span>
            )}
          </button>
          
          <div className="flex-1">
            <div 
              className={`border-2 rounded-lg p-4 transition-all ${
                task.status === 'completed' 
                  ? 'border-gray-300 bg-gray-50 opacity-60' 
                  : 'border-gray-400 bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className={`mb-1 ${task.status === 'completed' ? 'line-through text-gray-500' : ''}`}>
                    {task.title}
                  </h3>
                  <p className="text-sm text-gray-500">{task.type}</p>
                  <p className="text-sm text-gray-400 mt-2">{task.date}</p>
                </div>
                <button
                  onClick={() => onDeleteTask(task.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          </div>

          {index < tasks.length - 1 && (
            <span className="text-gray-400 mt-4">
              <ArrowRightIcon />
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
