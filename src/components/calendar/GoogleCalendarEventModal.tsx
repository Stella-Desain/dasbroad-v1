import { useState, useEffect, useMemo } from 'react';
import { format, addHours, setHours, setMinutes, parseISO } from 'date-fns';
import {
  X,
  Clock,
  MapPin,
  AlignLeft,
  Users,
  Bell,
  Repeat,
  Palette,
  Trash2,
  Calendar,
  ChevronDown,
  Video,
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';

export interface CalendarEvent {
  id?: string;
  title: string;
  description?: string;
  location?: string;
  startDate: Date;
  endDate: Date;
  startTime?: string;
  endTime?: string;
  isAllDay: boolean;
  colorId?: string;
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'weekdays';
  guests?: string[];
  reminders?: Array<{ method: 'email' | 'popup'; minutes: number }>;
  googleEventId?: string;
}

interface GoogleCalendarEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: CalendarEvent | null;
  selectedDate?: Date | null;
  onSave: (event: CalendarEvent) => Promise<void>;
  onDelete?: (eventId: string) => Promise<void>;
}

const eventColors = [
  { id: '1', name: 'Lavender', bg: 'bg-[#a4bdfc]', color: '#a4bdfc' },
  { id: '2', name: 'Sage', bg: 'bg-[#7ae7bf]', color: '#7ae7bf' },
  { id: '3', name: 'Grape', bg: 'bg-[#dbadff]', color: '#dbadff' },
  { id: '4', name: 'Flamingo', bg: 'bg-[#ff887c]', color: '#ff887c' },
  { id: '5', name: 'Banana', bg: 'bg-[#fbd75b]', color: '#fbd75b' },
  { id: '6', name: 'Tangerine', bg: 'bg-[#ffb878]', color: '#ffb878' },
  { id: '7', name: 'Peacock', bg: 'bg-[#46d6db]', color: '#46d6db' },
  { id: '8', name: 'Graphite', bg: 'bg-[#e1e1e1]', color: '#e1e1e1' },
  { id: '9', name: 'Blueberry', bg: 'bg-[#5484ed]', color: '#5484ed' },
  { id: '10', name: 'Basil', bg: 'bg-[#51b749]', color: '#51b749' },
  { id: '11', name: 'Tomato', bg: 'bg-[#dc2127]', color: '#dc2127' },
];

const recurrenceOptions = [
  { value: 'none', label: 'Does not repeat' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Annually' },
  { value: 'weekdays', label: 'Every weekday (Mon-Fri)' },
];

const reminderOptions = [
  { value: 0, label: 'At time of event' },
  { value: 5, label: '5 minutes before' },
  { value: 10, label: '10 minutes before' },
  { value: 15, label: '15 minutes before' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' },
  { value: 1440, label: '1 day before' },
  { value: 10080, label: '1 week before' },
];

const timeSlots = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? '00' : '30';
  const hourStr = hour.toString().padStart(2, '0');
  return `${hourStr}:${minute}`;
});

export function GoogleCalendarEventModal({
  open,
  onOpenChange,
  event,
  selectedDate,
  onSave,
  onDelete,
}: GoogleCalendarEventModalProps) {
  const isEditing = !!event?.id;

  const defaultStartDate = selectedDate || new Date();
  const defaultStartTime = format(addHours(setMinutes(new Date(), 0), 1), 'HH:mm');
  const defaultEndTime = format(addHours(setMinutes(new Date(), 0), 2), 'HH:mm');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState<Date>(defaultStartDate);
  const [endDate, setEndDate] = useState<Date>(defaultStartDate);
  const [startTime, setStartTime] = useState(defaultStartTime);
  const [endTime, setEndTime] = useState(defaultEndTime);
  const [isAllDay, setIsAllDay] = useState(false);
  const [colorId, setColorId] = useState('9');
  const [recurrence, setRecurrence] = useState<CalendarEvent['recurrence']>('none');
  const [guests, setGuests] = useState<string[]>([]);
  const [guestInput, setGuestInput] = useState('');
  const [reminders, setReminders] = useState<Array<{ method: 'email' | 'popup'; minutes: number }>>([
    { method: 'popup', minutes: 30 },
  ]);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [showMoreOptions, setShowMoreOptions] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      if (event) {
        setTitle(event.title);
        setDescription(event.description || '');
        setLocation(event.location || '');
        setStartDate(event.startDate);
        setEndDate(event.endDate);
        setStartTime(event.startTime || defaultStartTime);
        setEndTime(event.endTime || defaultEndTime);
        setIsAllDay(event.isAllDay);
        setColorId(event.colorId || '9');
        setRecurrence(event.recurrence || 'none');
        setGuests(event.guests || []);
        setReminders(event.reminders || [{ method: 'popup', minutes: 30 }]);
      } else {
        setTitle('');
        setDescription('');
        setLocation('');
        setStartDate(selectedDate || new Date());
        setEndDate(selectedDate || new Date());
        setStartTime(defaultStartTime);
        setEndTime(defaultEndTime);
        setIsAllDay(false);
        setColorId('9');
        setRecurrence('none');
        setGuests([]);
        setReminders([{ method: 'popup', minutes: 30 }]);
      }
      setShowMoreOptions(false);
    }
  }, [open, event, selectedDate]);

  const selectedColor = useMemo(() => 
    eventColors.find(c => c.id === colorId) || eventColors[8],
  [colorId]);

  const handleAddGuest = () => {
    if (guestInput.trim() && guestInput.includes('@')) {
      setGuests([...guests, guestInput.trim()]);
      setGuestInput('');
    }
  };

  const handleRemoveGuest = (email: string) => {
    setGuests(guests.filter(g => g !== email));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Please add a title');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        id: event?.id,
        title,
        description,
        location,
        startDate,
        endDate,
        startTime: isAllDay ? undefined : startTime,
        endTime: isAllDay ? undefined : endTime,
        isAllDay,
        colorId,
        recurrence,
        guests,
        reminders,
        googleEventId: event?.googleEventId,
      });
      onOpenChange(false);
      toast.success(isEditing ? 'Event updated' : 'Event created');
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error('Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!event?.id || !onDelete) return;
    
    try {
      await onDelete(event.id);
      setDeleteDialogOpen(false);
      onOpenChange(false);
      toast.success('Event deleted');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden max-h-[90vh] flex flex-col">
          {/* Header with color accent */}
          <div 
            className="h-2 w-full transition-colors"
            style={{ backgroundColor: selectedColor.color }}
          />
          
          <div className="flex-1 overflow-y-auto">
            <div className="p-5 space-y-4">
              {/* Title Input */}
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Add title"
                className="w-full text-2xl font-normal border-none outline-none bg-transparent placeholder:text-muted-foreground/60 text-foreground"
                autoFocus
              />

              {/* Event Type Tabs (simplified) */}
              <div className="flex items-center gap-4 border-b border-border pb-3">
                <button className="text-sm font-medium text-primary border-b-2 border-primary pb-2">
                  Event
                </button>
                <button className="text-sm font-medium text-muted-foreground pb-2">
                  Task
                </button>
              </div>

              {/* Date & Time Section */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-1" />
                  <div className="flex-1 space-y-3">
                    {/* Start Date/Time Row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="text-sm hover:bg-muted px-2 py-1 rounded transition-colors">
                            {format(startDate, 'EEE, MMM d, yyyy')}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarPicker
                            mode="single"
                            selected={startDate}
                            onSelect={(date) => {
                              if (date) {
                                setStartDate(date);
                                if (endDate < date) setEndDate(date);
                              }
                            }}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>

                      {!isAllDay && (
                        <>
                          <select
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="text-sm bg-transparent hover:bg-muted px-2 py-1 rounded outline-none cursor-pointer"
                          >
                            {timeSlots.map(time => (
                              <option key={time} value={time}>{time}</option>
                            ))}
                          </select>
                          <span className="text-muted-foreground">–</span>
                          <select
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="text-sm bg-transparent hover:bg-muted px-2 py-1 rounded outline-none cursor-pointer"
                          >
                            {timeSlots.map(time => (
                              <option key={time} value={time}>{time}</option>
                            ))}
                          </select>
                        </>
                      )}

                      {startDate.toDateString() !== endDate.toDateString() && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="text-sm hover:bg-muted px-2 py-1 rounded transition-colors">
                              {format(endDate, 'EEE, MMM d, yyyy')}
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarPicker
                              mode="single"
                              selected={endDate}
                              onSelect={(date) => date && setEndDate(date)}
                              disabled={(date) => date < startDate}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>

                    {/* All Day Toggle */}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isAllDay}
                        onChange={(e) => setIsAllDay(e.target.checked)}
                        className="rounded border-muted-foreground"
                      />
                      <span className="text-sm text-muted-foreground">All day</span>
                    </label>

                    {/* Multi-day toggle */}
                    {startDate.toDateString() === endDate.toDateString() && (
                      <button
                        onClick={() => setEndDate(addHours(startDate, 24))}
                        className="text-sm text-primary hover:underline"
                      >
                        Add end date
                      </button>
                    )}
                  </div>
                </div>

                {/* Recurrence */}
                <div className="flex items-center gap-3 pl-8">
                  <Repeat className="h-4 w-4 text-muted-foreground" />
                  <select
                    value={recurrence}
                    onChange={(e) => setRecurrence(e.target.value as CalendarEvent['recurrence'])}
                    className="text-sm bg-transparent hover:bg-muted px-2 py-1 rounded outline-none cursor-pointer flex-1"
                  >
                    {recurrenceOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Guests */}
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-muted-foreground mt-2" />
                <div className="flex-1 space-y-2">
                  <input
                    type="email"
                    value={guestInput}
                    onChange={(e) => setGuestInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddGuest()}
                    placeholder="Add guests"
                    className="w-full text-sm border-none outline-none bg-transparent placeholder:text-muted-foreground"
                  />
                  {guests.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {guests.map(guest => (
                        <span
                          key={guest}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-xs"
                        >
                          {guest}
                          <button onClick={() => handleRemoveGuest(guest)}>
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Video conferencing placeholder */}
              <div className="flex items-center gap-3">
                <Video className="h-5 w-5 text-muted-foreground" />
                <button className="text-sm text-primary hover:underline">
                  Add Google Meet video conferencing
                </button>
              </div>

              {/* Location */}
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Add location"
                  className="flex-1 text-sm border-none outline-none bg-transparent placeholder:text-muted-foreground"
                />
              </div>

              {/* Description */}
              <div className="flex items-start gap-3">
                <AlignLeft className="h-5 w-5 text-muted-foreground mt-1" />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add description"
                  className="flex-1 text-sm border-none outline-none bg-transparent placeholder:text-muted-foreground resize-none min-h-[60px]"
                />
              </div>

              {/* More Options Toggle */}
              <button
                onClick={() => setShowMoreOptions(!showMoreOptions)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronDown className={cn('h-4 w-4 transition-transform', showMoreOptions && 'rotate-180')} />
                More options
              </button>

              {/* Extended Options */}
              {showMoreOptions && (
                <div className="space-y-4 pt-2 border-t border-border">
                  {/* Color Picker */}
                  <div className="flex items-center gap-3">
                    <Palette className="h-5 w-5 text-muted-foreground" />
                    <div className="flex gap-1">
                      {eventColors.map(c => (
                        <button
                          key={c.id}
                          onClick={() => setColorId(c.id)}
                          className={cn(
                            'w-6 h-6 rounded-full transition-all',
                            c.bg,
                            colorId === c.id && 'ring-2 ring-offset-2 ring-foreground'
                          )}
                          title={c.name}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Reminders */}
                  <div className="flex items-start gap-3">
                    <Bell className="h-5 w-5 text-muted-foreground mt-1" />
                    <div className="flex-1 space-y-2">
                      <span className="text-sm text-muted-foreground">Reminders</span>
                      {reminders.map((reminder, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <select
                            value={reminder.method}
                            onChange={(e) => {
                              const newReminders = [...reminders];
                              newReminders[index].method = e.target.value as 'email' | 'popup';
                              setReminders(newReminders);
                            }}
                            className="text-sm bg-muted px-2 py-1 rounded outline-none"
                          >
                            <option value="popup">Notification</option>
                            <option value="email">Email</option>
                          </select>
                          <select
                            value={reminder.minutes}
                            onChange={(e) => {
                              const newReminders = [...reminders];
                              newReminders[index].minutes = parseInt(e.target.value);
                              setReminders(newReminders);
                            }}
                            className="text-sm bg-muted px-2 py-1 rounded outline-none flex-1"
                          >
                            {reminderOptions.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => setReminders(reminders.filter((_, i) => i !== index))}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => setReminders([...reminders, { method: 'popup', minutes: 10 }])}
                        className="text-sm text-primary hover:underline"
                      >
                        Add reminder
                      </button>
                    </div>
                  </div>

                  {/* Calendar selector placeholder */}
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm">My Calendar</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t border-border bg-muted/30">
            <div>
              {isEditing && onDelete && (
                <button
                  onClick={() => setDeleteDialogOpen(true)}
                  className="p-2 rounded-full hover:bg-destructive/10 text-destructive transition-colors"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{title}"? This action cannot be undone.
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
