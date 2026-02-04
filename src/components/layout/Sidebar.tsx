import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar as CalendarIcon,
  ChevronLeft,
  CheckSquare,
  Users,
  Plus,
  ExternalLink,
  Link
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/authStore';
import { ShortcutModal } from '@/components/modals/ShortcutModal';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar } from '@/components/ui/calendar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare, path: '/tasks' },
  { id: 'calendar', label: 'Calendar', icon: CalendarIcon, path: '/calendar' },
  { id: 'team', label: 'Team', icon: Users, path: '/team' },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { sidebarCollapsed, toggleSidebar, shortcuts } = useAppStore();
  const { logout } = useAuthStore();
  const [shortcutModalOpen, setShortcutModalOpen] = useState(false);
  const [editingShortcut, setEditingShortcut] = useState<typeof shortcuts[0] | null>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());

  const MenuItem = ({ item }: { item: typeof menuItems[0] }) => {
    const isActive = location.pathname === item.path;
    const Icon = item.icon;

    // Google Material Style: Rounded pills with pastel background on active
    const button = (
      <button
        onClick={() => navigate(item.path)}
        className={cn(
          'flex items-center gap-4 px-6 py-3 min-h-[48px] w-[95%] rounded-r-full text-sm font-medium transition-all duration-200 cursor-pointer mb-1',
          isActive
            ? 'bg-accent text-primary font-semibold'
            : 'text-foreground/80 hover:bg-muted'
        )}
      >
        <Icon className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-primary dark:text-primary-foreground" : "text-slate-500")} />
        {!sidebarCollapsed && <span>{item.label}</span>}
      </button>
    );

    if (sidebarCollapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => navigate(item.path)}
              className={cn(
                'flex items-center justify-center w-10 h-10 rounded-full mx-auto my-2 transition-colors',
                isActive ? 'bg-accent text-primary' : 'text-slate-500 hover:bg-muted'
              )}
            >
              <Icon className="h-5 w-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">{item.label}</TooltipContent>
        </Tooltip>
      );
    }

    return button;
  };

  return (
    <>
      <aside
        className={cn(
          'fixed left-0 top-[64px] h-[calc(100vh-64px)] bg-sidebar-background sidebar-transition z-40 flex flex-col border-none', // Removed border-r to match clean GCal look (or use border-r border-border/40)
          sidebarCollapsed ? 'w-[72px]' : 'w-[256px]'
        )}
      >
        {/* Create FAB Area - Added specific padding/margin for Google Look */}
        <div className={cn("py-4 mt-2", sidebarCollapsed ? "px-2" : "px-4")}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "flex items-center gap-3 bg-card shadow-md hover:shadow-lg border border-border/50 rounded-[16px] transition-all p-3 text-foreground",
                sidebarCollapsed ? "w-12 h-12 justify-center p-0 rounded-full" : "w-[140px] px-4 py-3"
              )}>
                <Plus className="w-8 h-8" style={{ color: "#ea4335" }} /> {/* Google Red Plus often used or Multi-color */}
                {!sidebarCollapsed && <span className="font-medium text-sm ml-1">Create</span>}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[160px] rounded-lg p-2">
              <DropdownMenuItem onClick={() => setShortcutModalOpen(true)} className="cursor-pointer">
                Event
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                Task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-2 scrollbar-thin">
          {/* Mini Calendar (Google Style) */}
          {!sidebarCollapsed && (
            <div className="px-4 pb-4 border-b border-border/40 mb-2">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md p-0"
                classNames={{
                  head_cell: "text-muted-foreground w-8 font-normal text-[0.8rem]",
                  cell: "h-8 w-8 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                  day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-primary rounded-full",
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  day_today: "bg-accent text-accent-foreground font-semibold",
                }}
              />
            </div>
          )}

          <nav className="space-y-0.5 mt-2 pr-2">
            {menuItems.map((item) => (
              <MenuItem key={item.id} item={item} />
            ))}
          </nav>

          {/* My Calendars / Projects */}
          {!sidebarCollapsed && (
            <div className="mt-6 px-6">
              <div className="flex items-center justify-between text-sm font-medium text-foreground/70 mb-3 cursor-pointer hover:bg-muted/50 p-1 -ml-1 rounded">
                <span>My Calendars</span>
                <ChevronLeft className="-rotate-90 w-4 h-4" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm text-foreground/80 cursor-pointer hover:bg-muted/50 p-1 rounded -ml-1">
                  <div className="w-4 h-4 rounded border-2 border-primary bg-primary/20 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 bg-primary rounded-[1px]" />
                  </div>
                  <span className="truncate">Bintang SSR</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-foreground/80 cursor-pointer hover:bg-muted/50 p-1 rounded -ml-1">
                  <div className="w-4 h-4 rounded border-2 border-task-blue bg-task-blue/20 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 bg-task-blue rounded-[1px]" />
                  </div>
                  <span>Tasks</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      <ShortcutModal
        open={shortcutModalOpen}
        onOpenChange={setShortcutModalOpen}
        shortcut={editingShortcut}
      />
    </>
  );
}
