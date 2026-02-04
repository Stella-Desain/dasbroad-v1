import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { X, Pencil, Trash2, Bell, Calendar, Clock, FileText, User } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useAppStore, Task } from '@/stores/appStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { TimeInput } from '@/components/ui/time-input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface TaskDetailModalProps {
  task: Task | null;
  onClose: () => void;
}

export function TaskDetailModal({ task, onClose }: TaskDetailModalProps) {
  const { updateTask, deleteTask, teamMembers } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editedTask, setEditedTask] = useState<Task | null>(null);

  useEffect(() => {
    if (task) {
      setEditedTask({ ...task });
      setIsEditing(false);
    }
  }, [task]);

  if (!task || !editedTask) return null;

  const handleSave = () => {
    updateTask(task.id, editedTask);
    toast.success('Task updated');
    setIsEditing(false);
  };

  const handleDelete = () => {
    deleteTask(task.id);
    toast.success('Task deleted');
    setDeleteDialogOpen(false);
    onClose();
  };

  const getAssigneeNames = () => {
    return task.assignees
      .map((id) => teamMembers.find((m) => m.id === id)?.fullName)
      .filter(Boolean)
      .join(', ');
  };

  const priorityColors = {
    low: 'priority-low',
    medium: 'priority-medium',
    high: 'priority-high',
    critical: 'priority-critical',
  };

  const statusColors = {
    pending: 'bg-warning/20 text-warning',
    'in-progress': 'bg-primary/20 text-primary',
    completed: 'bg-success/20 text-success',
  };

  return (
    <>
      <Dialog open={!!task} onOpenChange={() => onClose()}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <span className={cn('priority-badge', priorityColors[task.priority])}>
                {task.priority}
              </span>
              <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', statusColors[task.status])}>
                {task.status.replace('-', ' ')}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={cn('icon-button', isEditing && 'bg-primary/10 text-primary')}
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => setDeleteDialogOpen(true)}
                className="icon-button hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button onClick={onClose} className="icon-button">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {isEditing ? (
              <>
                <input
                  type="text"
                  value={editedTask.title}
                  onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                  className="form-input text-lg font-semibold"
                />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Start Date</label>
                    <input
                      type="date"
                      value={editedTask.startDate}
                      onChange={(e) => setEditedTask({ ...editedTask, startDate: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">End Date</label>
                    <input
                      type="date"
                      value={editedTask.endDate}
                      onChange={(e) => setEditedTask({ ...editedTask, endDate: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Time</label>
                  <TimeInput
                    value={editedTask.time || ''}
                    onChange={(val) => setEditedTask({ ...editedTask, time: val })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Priority</label>
                    <select
                      value={editedTask.priority}
                      onChange={(e) => setEditedTask({ ...editedTask, priority: e.target.value as Task['priority'] })}
                      className="form-input"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Status</label>
                    <select
                      value={editedTask.status}
                      onChange={(e) => setEditedTask({ ...editedTask, status: e.target.value as Task['status'] })}
                      className="form-input"
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Description</label>
                  <textarea
                    value={editedTask.description}
                    onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                    className="form-input h-24 resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button onClick={() => setIsEditing(false)} className="btn-secondary flex-1">
                    Cancel
                  </button>
                  <button onClick={handleSave} className="btn-primary flex-1">
                    Save Changes
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-foreground">{task.title}</h2>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">
                      {format(new Date(task.startDate), 'MMMM d, yyyy')}
                      {task.startDate !== task.endDate && (
                        <> - {format(new Date(task.endDate), 'MMMM d, yyyy')}</>
                      )}
                    </span>
                  </div>

                  {task.time && (
                    <div className="flex items-center gap-3 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">{task.time}</span>
                    </div>
                  )}

                  {task.assignees.length > 0 && (
                    <div className="flex items-center gap-3 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">{getAssigneeNames()}</span>
                    </div>
                  )}

                  {task.repeat !== 'none' && (
                    <div className="flex items-center gap-3 text-sm">
                      <Bell className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground capitalize">Repeats {task.repeat}</span>
                    </div>
                  )}
                </div>

                {task.description && (
                  <div className="pt-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <FileText className="h-4 w-4" />
                      Description
                    </div>
                    <p className="text-sm text-foreground bg-muted p-3 rounded-lg">
                      {task.description}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{task.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
