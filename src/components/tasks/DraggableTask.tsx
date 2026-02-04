import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { Task } from '@/stores/appStore';

interface DraggableTaskProps {
  task: Task;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
  isDragging?: boolean;
}

export function DraggableTask({ task, onClick, className, isDragging }: DraggableTaskProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
  });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={cn(
        'task-pill cursor-grab active:cursor-grabbing',
        className,
        isDragging && 'opacity-50'
      )}
    >
      {task.time && (
        <span className="font-medium mr-1">{task.time}</span>
      )}
      {task.title}
    </div>
  );
}
