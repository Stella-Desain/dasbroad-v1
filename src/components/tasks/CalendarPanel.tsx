import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  RefreshCw,
  Settings2,
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  parseISO,
  isWithinInterval,
  differenceInDays,
  addDays,
} from 'date-fns';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { useAppStore, Task } from '@/stores/appStore';
import { DraggableTask } from './DraggableTask';
import { DroppableDay } from './DroppableDay';
import { toast } from 'sonner';
import {
  GoogleCalendarEventModal,
  CalendarEvent,
} from '@/components/calendar/GoogleCalendarEventModal';
import { GoogleCalendarSettings } from '@/components/calendar/GoogleCalendarSettings';
import { useGoogleCalendarStatus } from '@/hooks/useGoogleCalendarStatus';
import { supabase } from '@/integrations/supabase/client';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

// Supabase edge function URL
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// Type for cached Google Calendar event from Supabase
interface CachedGoogleEvent {
  calendar_id: string;
  event_id: string;
  status: string | null;
  html_link: string | null;
  created: string | null;
  updated: string | null;
  summary: string | null;
  description: string | null;
  location: string | null;
  color_id: string | null;
  start_json: { date?: string; dateTime?: string; timeZone?: string };
  end_json: { date?: string; dateTime?: string; timeZone?: string };
  recurrence: string[] | null;
  recurring_event_id: string | null;
  original_start_time: { date?: string; dateTime?: string; timeZone?: string } | null;
  organizer_json: { email?: string; displayName?: string; self?: boolean } | null;
  creator_json: { email?: string; displayName?: string; self?: boolean } | null;
  attendees_json: Array<{ email: string; displayName?: string; responseStatus?: string }> | null;
  reminders_json: { useDefault: boolean; overrides?: Array<{ method: string; minutes: number }> } | null;
  visibility: string | null;
  transparency: string | null;
  ical_uid: string | null;
  sequence: number | null;
  event_type: string | null;
  hangout_link: string | null;
  conference_data_json: Record<string, unknown> | null;
  attachments_json: Array<Record<string, unknown>> | null;
  extended_properties_json: Record<string, unknown> | null;
  raw_event_json: Record<string, unknown>;
  deleted: boolean;
  last_synced_at: string;
}

// Convert local Task to CalendarEvent format
function taskToCalendarEvent(task: Task): CalendarEvent {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    startDate: parseISO(task.startDate),
    endDate: parseISO(task.endDate),
    startTime: task.time,
    endTime: task.time ? format(addDays(parseISO(`2000-01-01T${task.time}`), 0), 'HH:mm') : undefined,
    isAllDay: !task.time,
    colorId: getColorId(task.color),
    recurrence: task.repeat as CalendarEvent['recurrence'],
  };
}

// Convert CalendarEvent to local Task format
function calendarEventToTask(event: CalendarEvent, existingTask?: Task): Omit<Task, 'id'> & { id?: string } {
  return {
    id: event.id,
    title: event.title,
    description: event.description || '',
    startDate: format(event.startDate, 'yyyy-MM-dd'),
    endDate: format(event.endDate, 'yyyy-MM-dd'),
    time: event.startTime,
    type: 'event',
    priority: existingTask?.priority || 'medium',
    status: existingTask?.status || 'pending',
    projectId: existingTask?.projectId,
    assignees: existingTask?.assignees || [],
    repeat: (event.recurrence === 'weekdays' || event.recurrence === 'yearly') ? 'weekly' : (event.recurrence || 'none'),
    color: getTaskColorFromId(event.colorId),
  };
}

// Map task colors to Google Calendar color IDs
function getColorId(color: Task['color']): string {
  const colorMap: Record<string, string> = {
    blue: '9',
    green: '10',
    yellow: '5',
    red: '11',
    purple: '3',
  };
  return colorMap[color] || '9';
}

// Map Google Calendar color IDs to task colors
function getTaskColorFromId(colorId?: string): Task['color'] {
  const colorMap: Record<string, Task['color']> = {
    '1': 'blue',
    '2': 'green',
    '3': 'purple',
    '4': 'red',
    '5': 'yellow',
    '6': 'yellow',
    '7': 'blue',
    '8': 'blue',
    '9': 'blue',
    '10': 'green',
    '11': 'red',
  };
  return colorMap[colorId || '9'] || 'blue';
}

// Convert cached event to CalendarEvent
function cachedEventToCalendarEvent(cached: CachedGoogleEvent): CalendarEvent {
  const isAllDay = !cached.start_json.dateTime;
  const startDate = isAllDay
    ? parseISO(cached.start_json.date!)
    : parseISO(cached.start_json.dateTime!);
  const endDate = isAllDay
    ? parseISO(cached.end_json.date!)
    : parseISO(cached.end_json.dateTime!);

  return {
    id: cached.event_id,
    googleEventId: cached.event_id,
    title: cached.summary || '(No title)',
    description: cached.description || undefined,
    location: cached.location || undefined,
    startDate,
    endDate,
    startTime: isAllDay ? undefined : format(startDate, 'HH:mm'),
    endTime: isAllDay ? undefined : format(endDate, 'HH:mm'),
    isAllDay,
    colorId: cached.color_id || undefined,
    guests: cached.attendees_json?.map(a => a.email),
  };
}

// Convert CalendarEvent to Google Calendar event format for API
function calendarEventToGoogleEvent(event: CalendarEvent) {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  if (event.isAllDay) {
    return {
      summary: event.title,
      description: event.description,
      location: event.location,
      start: { date: format(event.startDate, 'yyyy-MM-dd') },
      end: { date: format(addDays(event.endDate, 1), 'yyyy-MM-dd') },
      colorId: event.colorId,
      attendees: event.guests?.map(email => ({ email })),
    };
  }

  const startDateTime = new Date(event.startDate);
  const endDateTime = new Date(event.endDate);

  if (event.startTime) {
    const [h, m] = event.startTime.split(':').map(Number);
    startDateTime.setHours(h, m, 0, 0);
  }
  if (event.endTime) {
    const [h, m] = event.endTime.split(':').map(Number);
    endDateTime.setHours(h, m, 0, 0);
  }

  return {
    summary: event.title,
    description: event.description,
    location: event.location,
    start: { dateTime: startDateTime.toISOString(), timeZone },
    end: { dateTime: endDateTime.toISOString(), timeZone },
    colorId: event.colorId,
    attendees: event.guests?.map(email => ({ email })),
  };
}

export function CalendarPanel() {
  const { tasks, addTask, updateTask, deleteTask } = useAppStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [overflowPopup, setOverflowPopup] = useState<{ date: Date; tasks: Task[] } | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [overDate, setOverDate] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Google Calendar cache state
  const [cachedEvents, setCachedEvents] = useState<CachedGoogleEvent[]>([]);

  // Use the new hook for status management
  const { status, syncing, triggerIncrementalSync, connect } = useGoogleCalendarStatus();
  const isConnected = status?.isConnected ?? false;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Fetch events from backend API
  const fetchCachedEvents = useCallback(async () => {
    if (!isConnected) return;

    try {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      const startStr = format(monthStart, 'yyyy-MM-dd');
      const endStr = format(monthEnd, 'yyyy-MM-dd');

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/gcal-events?start=${startStr}&end=${endStr}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch events');
      }

      const result = await response.json();

      if (!result.success || !result.events) {
        setCachedEvents([]);
        return;
      }

      // Map API response to CachedGoogleEvent format
      const events: CachedGoogleEvent[] = result.events.map((event: {
        event_id: string;
        summary: string | null;
        description: string | null;
        location: string | null;
        start: { date?: string; dateTime?: string; timeZone?: string };
        end: { date?: string; dateTime?: string; timeZone?: string };
        status: string | null;
        color_id: string | null;
        html_link: string | null;
        attendees: Array<{ email: string; displayName?: string; responseStatus?: string }> | null;
        organizer: { email?: string; displayName?: string; self?: boolean } | null;
        recurrence: string[] | null;
        recurring_event_id: string | null;
        updated: string | null;
        created: string | null;
      }) => ({
        calendar_id: 'primary',
        event_id: event.event_id,
        status: event.status,
        html_link: event.html_link,
        created: event.created,
        updated: event.updated,
        summary: event.summary,
        description: event.description,
        location: event.location,
        color_id: event.color_id,
        start_json: event.start,
        end_json: event.end,
        recurrence: event.recurrence,
        recurring_event_id: event.recurring_event_id,
        original_start_time: null,
        organizer_json: event.organizer,
        creator_json: null,
        attendees_json: event.attendees,
        reminders_json: null,
        visibility: null,
        transparency: null,
        ical_uid: null,
        sequence: null,
        event_type: null,
        hangout_link: null,
        conference_data_json: null,
        attachments_json: null,
        extended_properties_json: null,
        raw_event_json: {},
        deleted: false,
        last_synced_at: new Date().toISOString(),
      }));

      setCachedEvents(events);
    } catch (error) {
      console.error('Error fetching events from API:', error);
    }
  }, [currentMonth, isConnected]);

  // ... (useEffects remain the same)

  // Calendar grid calculation
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  // Combine tasks and Google Calendar events
  const allEvents = useMemo(() => {
    const localEvents = tasks.map(taskToCalendarEvent);

    // Merge Google events that don't duplicate local tasks (by ID)
    const googleEvents = cachedEvents
      .map(cachedEventToCalendarEvent)
      .filter(gEvent => !localEvents.some(lEvent => lEvent.id === gEvent.id));

    return [...localEvents, ...googleEvents];
  }, [tasks, cachedEvents]);

  const googleCalendarEvents = useMemo(() => {
    return cachedEvents.map(cachedEventToCalendarEvent);
  }, [cachedEvents]);

  // Handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    setOverDate(over ? (over.id as string) : null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const task = tasks.find((t) => t.id === active.id);
      if (task) {
        const newDate = over.id as string; // Date string yyyy-MM-dd

        // Optimistic update
        updateTask(task.id, { startDate: newDate, endDate: newDate });

        // If it's a Google event, sync the change
        const gEvent = cachedEvents.find(e => e.event_id === task.id);
        if (gEvent && isConnected) {
          const calendarEvent = taskToCalendarEvent({ ...task, startDate: newDate, endDate: newDate });
          await handleSaveEvent(calendarEvent);
        } else {
          toast.success('Task moved to ' + newDate);
        }
      }
    }

    setActiveTask(null);
    setOverDate(null);
  };

  const handleDayClick = (date: Date, e: React.MouseEvent) => {
    // Only open if clicking the cell background, not a task
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('calendar-day-number')) {
      setSelectedDate(date);
      setSelectedEvent(null);
      setEventModalOpen(true);
    }
  };

  const handleTaskClick = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvent(taskToCalendarEvent(task));
    setEventModalOpen(true);
  };

  const handleGoogleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setEventModalOpen(true);
  };

  const handleShowMore = (date: Date, tasks: Task[], e: React.MouseEvent) => {
    e.stopPropagation();
    setOverflowPopup({ date, tasks });
  };

  const getTaskColor = (task: Task) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200',
      green: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200',
      yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200',
      red: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200',
      purple: 'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200',
    };
    return colors[task.color] || colors.blue;
  };

  const getEventColor = (event: CalendarEvent) => {
    // Map Google Calendar color IDs to our color classes
    // This is a simplified mapping
    const colorId = event.colorId || '9';
    const taskColor = getTaskColorFromId(colorId);

    const colors = {
      blue: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200',
      green: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200',
      yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200',
      red: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200',
      purple: 'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200',
    };
    return colors[taskColor] || colors.blue;
  };

  const getTasksForDay = (date: Date) => {
    return tasks.filter(task => {
      // Simple check for now, can be expanded for multi-day events logic matching getEventsForDay
      return task.startDate === format(date, 'yyyy-MM-dd');
    });
  };

  const handleSaveEvent = async (event: CalendarEvent) => {
    // Handle Google Calendar events via edge function
    if (event.googleEventId && isConnected) {
      try {
        const gEvent = calendarEventToGoogleEvent(event);
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const response = await fetch(`${SUPABASE_URL}/functions/v1/gcal-event-mutate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            action: 'update',
            eventId: event.googleEventId,
            event: gEvent,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update event');
        }

        await fetchCachedEvents();
        toast.success('Event updated');
        return;
      } catch (error) {
        console.error('Failed to update Google Calendar event:', error);
        toast.error('Failed to update event');
        return;
      }
    }

    // Handle local tasks
    const taskData = calendarEventToTask(event, event.id ? tasks.find(t => t.id === event.id) : undefined);

    if (event.id && !event.googleEventId) {
      updateTask(event.id, taskData);
      toast.success('Task updated');
    } else if (!event.googleEventId) {
      const { id, ...newTask } = taskData;
      addTask(newTask as Omit<Task, 'id'>);

      // Also create in Google Calendar if connected
      if (isConnected) {
        try {
          const gEvent = calendarEventToGoogleEvent(event);
          const { data: { session } } = await supabase.auth.getSession();
          const token = session?.access_token;

          const response = await fetch(`${SUPABASE_URL}/functions/v1/gcal-event-mutate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({
              action: 'create',
              event: gEvent,
            }),
          });

          if (response.ok) {
            await fetchCachedEvents();
          }
        } catch (error) {
          console.error('Failed to sync to Google Calendar:', error);
        }
      }
      toast.success('Event created');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    const event = allEvents.find(e => e.id === eventId);

    if (event?.googleEventId && isConnected) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const response = await fetch(`${SUPABASE_URL}/functions/v1/gcal-event-mutate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            action: 'delete',
            eventId: event.googleEventId,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to delete event');
        }

        await fetchCachedEvents();
        toast.success('Event deleted');
        return;
      } catch (error) {
        console.error('Failed to delete Google Calendar event:', error);
        toast.error('Failed to delete event');
        return;
      }
    }

    deleteTask(eventId);
    toast.success('Task deleted');
  };

  // Get events for a specific day (combining tasks and Google events)
  const getEventsForDay = (date: Date) => {
    const dayTasks = getTasksForDay(date);
    const dayGoogleEvents = googleCalendarEvents.filter((event) => {
      return isWithinInterval(date, { start: event.startDate, end: event.endDate }) ||
        isSameDay(date, event.startDate) ||
        isSameDay(date, event.endDate);
    });
    return { tasks: dayTasks, googleEvents: dayGoogleEvents };
  };

  return (
    <div className="h-full flex flex-col select-none">
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentMonth(new Date())}
                className="btn-secondary text-sm px-3 py-1.5"
              >
                Today
              </button>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="icon-button"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="icon-button"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {/* Google Calendar Controls */}
              <>
                <button
                  onClick={() => triggerIncrementalSync()}
                  disabled={syncing}
                  className="icon-button"
                  title="Sync with Google Calendar"
                >
                  <RefreshCw className={cn('h-4 w-4', syncing && 'animate-spin')} />
                </button>
                <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
                  <SheetTrigger asChild>
                    <button className="icon-button" title="Google Calendar Settings">
                      <Settings2 className="h-4 w-4" />
                    </button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Calendar Settings</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <GoogleCalendarSettings />
                    </div>
                  </SheetContent>
                </Sheet>
              </>


              <button
                onClick={() => {
                  setSelectedDate(new Date());
                  setSelectedEvent(null);
                  setEventModalOpen(true);
                }}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <Plus className="h-4 w-4" />
                Create
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="flex-1 overflow-hidden">
            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b border-border">
              {dayNames.map((day) => (
                <div
                  key={day}
                  className="px-2 py-2 text-xs font-medium text-muted-foreground text-center"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 flex-1 overflow-y-auto">
              {calendarDays.map((day, index) => {
                const { tasks: dayTasks, googleEvents: dayGoogleEvents } = getEventsForDay(day);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isTodayDate = isToday(day);
                const maxVisible = 2;
                const allDayItems = [...dayTasks, ...dayGoogleEvents];
                const visibleItems = allDayItems.slice(0, maxVisible);
                const hiddenCount = allDayItems.length - maxVisible;
                const dateStr = format(day, 'yyyy-MM-dd');
                const isDropTarget = overDate === dateStr && activeTask !== null;

                return (
                  <DroppableDay
                    key={index}
                    id={dateStr}
                    onClick={(e) => handleDayClick(day, e)}
                    className={cn(
                      'calendar-cell',
                      !isCurrentMonth && 'bg-muted/30',
                      isTodayDate && 'calendar-cell-today',
                      isDropTarget && 'bg-primary/10 ring-2 ring-primary ring-inset'
                    )}
                  >
                    <div className="flex justify-end mb-1">
                      <span
                        className={cn(
                          'calendar-day-number',
                          isTodayDate && 'calendar-day-today',
                          !isCurrentMonth && 'text-muted-foreground/50'
                        )}
                      >
                        {format(day, 'd')}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {visibleItems.map((item) => {
                        // Check if it's a task or a Google event
                        if ('projectId' in item || !('googleEventId' in item)) {
                          const task = item as Task;
                          return (
                            <DraggableTask
                              key={task.id}
                              task={task}
                              onClick={(e) => handleTaskClick(task, e)}
                              className={getTaskColor(task)}
                              isDragging={activeTask?.id === task.id}
                            />
                          );
                        } else {
                          const event = item as CalendarEvent;
                          return (
                            <div
                              key={event.id}
                              onClick={(e) => handleGoogleEventClick(event, e)}
                              className={cn('task-pill cursor-pointer', getEventColor(event))}
                            >
                              {event.startTime && (
                                <span className="font-medium mr-1">{event.startTime}</span>
                              )}
                              {event.title}
                            </div>
                          );
                        }
                      })}
                      {hiddenCount > 0 && (
                        <button
                          onClick={(e) => handleShowMore(day, dayTasks, e)}
                          className="text-xs text-primary hover:underline px-2"
                        >
                          {hiddenCount} more
                        </button>
                      )}
                    </div>
                  </DroppableDay>
                );
              })}
            </div>
          </div>

          {/* Drag Overlay */}
          <DragOverlay dropAnimation={null}>
            {activeTask && (
              <div className={cn('task-pill shadow-lg scale-105', getTaskColor(activeTask))}>
                {activeTask.time && (
                  <span className="font-medium mr-1">{activeTask.time}</span>
                )}
                {activeTask.title}
              </div>
            )}
          </DragOverlay>

          {/* Google Calendar Event Modal */}
          <GoogleCalendarEventModal
            open={eventModalOpen}
            onOpenChange={setEventModalOpen}
            event={selectedEvent}
            selectedDate={selectedDate}
            onSave={handleSaveEvent}
            onDelete={handleDeleteEvent}
          />

          {/* Overflow Popup */}
          {overflowPopup && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm">
              <div className="bg-card rounded-xl shadow-xl border border-border p-4 w-72 animate-scale-in">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">
                      {format(overflowPopup.date, 'EEE')}
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {format(overflowPopup.date, 'd')}
                    </p>
                  </div>
                  <button
                    onClick={() => setOverflowPopup(null)}
                    className="icon-button"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {overflowPopup.tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => {
                        setSelectedEvent(taskToCalendarEvent(task));
                        setEventModalOpen(true);
                        setOverflowPopup(null);
                      }}
                      className={cn('task-pill cursor-pointer', getTaskColor(task))}
                    >
                      {task.time && (
                        <span className="font-medium mr-1">{task.time}</span>
                      )}
                      {task.title}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </DndContext>
    </div>
  );
}
