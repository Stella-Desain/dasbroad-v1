import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Plus,
  ExternalLink,
  Pencil,
  CheckSquare,
  Users,
  icons,
  Link,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/authStore';
import { ShortcutModal } from '@/components/modals/ShortcutModal';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare, path: '/tasks' },
  { id: 'calendar', label: 'Calendar', icon: Calendar, path: '/calendar' },
  { id: 'team', label: 'Team', icon: Users, path: '/team' },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { sidebarCollapsed, toggleSidebar, shortcuts, deleteShortcut } = useAppStore();
  const { logout } = useAuthStore();
  const [shortcutModalOpen, setShortcutModalOpen] = useState(false);
  const [editingShortcut, setEditingShortcut] = useState<typeof shortcuts[0] | null>(null);
  const [hoveredShortcut, setHoveredShortcut] = useState<string | null>(null);

  const handleLogout = async () => {
    await logout();
    navigate('/auth', { replace: true });
  };

  const handleShortcutClick = (url: string, e: React.MouseEvent) => {
    e.preventDefault();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleEditShortcut = (shortcut: typeof shortcuts[0], e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingShortcut(shortcut);
    setShortcutModalOpen(true);
  };

  const getIcon = (iconName: string) => {
    return icons[iconName as keyof typeof icons] || Link;
  };

  const MenuItem = ({ item }: { item: typeof menuItems[0] }) => {
    const isActive = location.pathname === item.path;
    const Icon = item.icon;

    const button = (
      <button
        onClick={() => navigate(item.path)}
        className={cn(
          'menu-item w-full',
          isActive ? 'menu-item-active' : 'menu-item-inactive'
        )}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        {!sidebarCollapsed && <span>{item.label}</span>}
      </button>
    );

    if (sidebarCollapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
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
          'fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border sidebar-transition z-40 flex flex-col',
          sidebarCollapsed ? 'w-[72px]' : 'w-[280px]'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <CheckSquare className="h-5 w-5 text-primary-foreground" />
            </div>
            {!sidebarCollapsed && (
              <span className="font-semibold text-foreground">TaskFlow</span>
            )}
          </div>
          <button
            onClick={toggleSidebar}
            className="icon-button text-muted-foreground hover:text-foreground"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin">
          {/* Primary */}
          {!sidebarCollapsed && (
            <p className="px-4 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Primary
            </p>
          )}
          <nav className="space-y-1 mb-6">
            {menuItems.map((item) => (
              <MenuItem key={item.id} item={item} />
            ))}
          </nav>

          {/* Shortcuts */}
          {!sidebarCollapsed && (
            <p className="px-4 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Shortcuts
            </p>
          )}
          <div className="space-y-1">
            {shortcuts.map((shortcut) => {
              const Icon = getIcon(shortcut.icon);
              const button = (
                <button
                  key={shortcut.id}
                  onClick={(e) => handleShortcutClick(shortcut.url, e)}
                  onMouseEnter={() => setHoveredShortcut(shortcut.id)}
                  onMouseLeave={() => setHoveredShortcut(null)}
                  className="menu-item menu-item-inactive w-full group relative"
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <>
                      <span className="flex-1 text-left truncate">{shortcut.name}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                        <button
                          onClick={(e) => handleEditShortcut(shortcut, e)}
                          className="p-1 hover:bg-muted rounded"
                        >
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                        </button>
                      </div>
                    </>
                  )}
                </button>
              );

              if (sidebarCollapsed) {
                return (
                  <Tooltip key={shortcut.id}>
                    <TooltipTrigger asChild>{button}</TooltipTrigger>
                    <TooltipContent side="right">
                      {shortcut.name}
                      <ExternalLink className="h-3 w-3 ml-1 inline" />
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return button;
            })}

            {/* Add Shortcut */}
            {sidebarCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => {
                      setEditingShortcut(null);
                      setShortcutModalOpen(true);
                    }}
                    className="menu-item menu-item-inactive w-full"
                  >
                    <Plus className="h-5 w-5 flex-shrink-0" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Add Shortcut</TooltipContent>
              </Tooltip>
            ) : (
              <button
                onClick={() => {
                  setEditingShortcut(null);
                  setShortcutModalOpen(true);
                }}
                className="menu-item menu-item-inactive w-full border border-dashed border-border"
              >
                <Plus className="h-5 w-5 flex-shrink-0" />
                <span className="text-muted-foreground">Add Shortcut</span>
              </button>
            )}
          </div>
        </div>

        {/* Logout */}
        <div className="border-t border-sidebar-border p-3">
          {sidebarCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleLogout}
                  className="menu-item menu-item-inactive w-full hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="h-5 w-5 flex-shrink-0" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Logout</TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={handleLogout}
              className="menu-item menu-item-inactive w-full hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              <span>Logout</span>
            </button>
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
