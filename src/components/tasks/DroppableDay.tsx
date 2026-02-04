import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface DroppableDayProps {
  id: string;
  children: ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export function DroppableDay({ id, children, className, onClick }: DroppableDayProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      className={cn(
        className,
        isOver && 'bg-primary/10 ring-2 ring-primary ring-inset'
      )}
    >
      {children}
    </div>
  );
}
