import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { X, Clock, CalendarDays, FileText } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { TimeInput } from '@/components/ui/time-input';
interface TaskQuickAddProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
}

export function TaskQuickAdd({ open, onOpenChange, selectedDate }: TaskQuickAddProps) {
  const { addTask, projects } = useAppStore();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'task' | 'event'>('task');
  const [time, setTime] = useState('');
  const [showTime, setShowTime] = useState(false);
  const [deadline, setDeadline] = useState('');
  const [showDeadline, setShowDeadline] = useState(false);
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [color, setColor] = useState<'blue' | 'green' | 'yellow' | 'red' | 'purple'>('blue');

  useEffect(() => {
    if (open) {
      setTitle('');
      setType('task');
      setTime('');
      setShowTime(false);
      setDeadline('');
      setShowDeadline(false);
      setDescription('');
      setProjectId('');
      setColor('blue');
    }
  }, [open]);

  const handleSave = () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
    
    addTask({
      title,
      description,
      startDate: dateStr,
      endDate: showDeadline && deadline ? deadline : dateStr,
      time: showTime ? time : undefined,
      type,
      priority: 'medium',
      status: 'pending',
      projectId: projectId || undefined,
      assignees: [],
      repeat: 'none',
      color,
    });

    toast.success('Task created successfully');
    onOpenChange(false);
  };

  const colors = [
    { value: 'blue', bg: 'bg-primary' },
    { value: 'green', bg: 'bg-success' },
    { value: 'yellow', bg: 'bg-warning' },
    { value: 'red', bg: 'bg-destructive' },
    { value: 'purple', bg: 'bg-purple-500' },
  ] as const;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {(['event', 'task'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-colors capitalize',
                    type === t
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            <button onClick={() => onOpenChange(false)} className="icon-button">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Title Input */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add title and time"
            className="w-full text-lg font-medium border-none outline-none bg-transparent placeholder:text-muted-foreground"
            autoFocus
          />

          {/* Date Display */}
          {selectedDate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              <span>{format(selectedDate, 'EEEE, MMMM d')}</span>
            </div>
          )}

          {/* Time */}
          {showTime ? (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <TimeInput value={time} onChange={setTime} />
              <button
                onClick={() => {
                  setShowTime(false);
                  setTime('');
                }}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Remove
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowTime(true)}
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <Clock className="h-4 w-4" />
              Add time
            </button>
          )}

          {/* Deadline */}
          {showDeadline ? (
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="form-input py-2"
              />
              <button
                onClick={() => {
                  setShowDeadline(false);
                  setDeadline('');
                }}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Remove
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDeadline(true)}
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <CalendarDays className="h-4 w-4" />
              Add deadline
            </button>
          )}

          {/* Description */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add description..."
              className="w-full p-3 rounded-lg bg-muted text-sm resize-none h-20 outline-none"
            />
          </div>

          {/* Project Selector */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Project</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="form-input"
            >
              <option value="">No project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          </div>

          {/* Color Selector */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Color</label>
            <div className="flex gap-2">
              {colors.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  className={cn(
                    'w-8 h-8 rounded-full transition-all',
                    c.bg,
                    color === c.value && 'ring-2 ring-offset-2 ring-foreground'
                  )}
                />
              ))}
            </div>
          </div>

          {/* Save Button */}
          <button onClick={handleSave} className="btn-primary w-full">
            Save
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
