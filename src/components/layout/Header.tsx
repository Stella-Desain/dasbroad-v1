import { Menu, Bell, Search, Settings, HelpCircle, Grip } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Header() {
  const { user, logout } = useAuthStore();
  const { toggleSidebar } = useAppStore();

  const avatarAlt = user?.fullName ? `${user.fullName} avatar` : 'User avatar';

  return (
    <header className="fixed top-0 left-0 w-full h-[64px] bg-background border-b border-border z-50 flex items-center justify-between px-4">
      {/* Left: Hamburger & Logo */}
      <div className="flex items-center gap-2 md:w-[256px]">
        <button
          onClick={toggleSidebar}
          className="p-3 rounded-full hover:bg-muted text-foreground/70"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div className="flex items-center gap-2 pr-4">
          <span className="text-[22px] text-foreground/80 tracking-tight" style={{ fontFamily: 'Product Sans, sans-serif' }}>
            <span className="font-bold text-primary mr-0.5">Vibe</span>
            Calendar
          </span>
        </div>
      </div>

      {/* Center: Search Bar (Google Style) */}
      <div className="flex-1 max-w-[720px] mx-4 hidden md:block">
        <div className="flex items-center gap-3 bg-secondary/50 focus-within:bg-background focus-within:shadow-md transition-all rounded-[8px] px-4 py-2.5 max-w-[500px]">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search"
            className="bg-transparent border-none outline-none text-base w-full text-foreground placeholder:text-muted-foreground font-normal"
          />
        </div>
      </div>

      {/* Right: Icons & Profile */}
      <div className="flex items-center gap-2 sm:gap-4 pl-2">
        <button className="icon-button text-muted-foreground hover:bg-muted/50 p-2.5 rounded-full hidden sm:block">
          <HelpCircle className="h-6 w-6" />
        </button>
        <button className="icon-button text-muted-foreground hover:bg-muted/50 p-2.5 rounded-full hidden sm:block">
          <Settings className="h-6 w-6" />
        </button>

        {/* Apps Grid */}
        <button className="icon-button text-muted-foreground hover:bg-muted/50 p-2.5 rounded-full mr-1 hidden sm:block">
          <Grip className="h-6 w-6" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full p-1 hover:bg-muted/50 transition-colors ml-1">
              <Avatar className="h-8 w-8 sm:h-9 sm:w-9 border border-border/20">
                <AvatarImage src={user?.avatar} alt={avatarAlt} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                  {user?.fullName?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 p-2 rounded-xl">
            <div className="flex items-center gap-3 p-2 mb-2">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback>{user?.fullName?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{user?.fullName}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="rounded-lg cursor-pointer">Manage your Account</DropdownMenuItem>
            <DropdownMenuItem className="rounded-lg cursor-pointer">Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => void logout()}
              className="text-destructive rounded-lg cursor-pointer"
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
