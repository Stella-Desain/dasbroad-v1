import { useState, useMemo } from 'react';
import { icons, Search, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
}

const commonIcons = [
  'Link', 'Home', 'Search', 'Mail', 'Calendar', 'FileText', 'Folder', 'Star',
  'Heart', 'Bookmark', 'Globe', 'Cloud', 'Music', 'Video', 'Image', 'Camera',
  'Phone', 'MessageCircle', 'Bell', 'Clock', 'Map', 'MapPin', 'Navigation',
  'Briefcase', 'CreditCard', 'ShoppingCart', 'ShoppingBag', 'Gift', 'Truck',
  'Package', 'Archive', 'Box', 'Database', 'Server', 'Code', 'Terminal',
  'Github', 'Gitlab', 'Twitter', 'Linkedin', 'Facebook', 'Instagram', 'Youtube',
  'Slack', 'Figma', 'Trello', 'Dribbble', 'Twitch', 'Discord', 'Chrome',
  'Settings', 'Tool', 'Wrench', 'Hammer', 'Lightbulb', 'Zap', 'Target',
  'Flag', 'Award', 'Trophy', 'Medal', 'Crown', 'Gem', 'Diamond',
  'Users', 'User', 'UserPlus', 'UserCheck', 'Building', 'Building2', 'Store',
  'Coffee', 'Pizza', 'Apple', 'Cake', 'Cookie', 'Wine', 'Beer',
  'Sun', 'Moon', 'CloudSun', 'CloudRain', 'Snowflake', 'Umbrella', 'Wind',
  'Rocket', 'Plane', 'Car', 'Bus', 'Train', 'Ship', 'Bike',
  'Gamepad', 'Puzzle', 'Dice', 'Bot', 'Ghost', 'Skull', 'Bug',
];

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const SelectedIcon = icons[value as keyof typeof icons] || icons.Link;

  const filteredIcons = useMemo(() => {
    if (!search) return commonIcons;
    return commonIcons.filter((name) =>
      name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const handleSelect = (iconName: string) => {
    onChange(iconName);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-3 w-full px-4 py-3 rounded-lg border border-input bg-background hover:bg-muted transition-colors">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
            <SelectedIcon className="h-5 w-5 text-foreground" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground">Click to change icon</p>
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search icons..."
              className="pl-9"
            />
          </div>
        </div>
        <ScrollArea className="h-64 p-3">
          <div className="grid grid-cols-6 gap-2">
            {filteredIcons.map((iconName) => {
              const Icon = icons[iconName as keyof typeof icons];
              if (!Icon) return null;
              return (
                <button
                  key={iconName}
                  onClick={() => handleSelect(iconName)}
                  className={cn(
                    'p-2.5 rounded-lg hover:bg-muted transition-colors flex items-center justify-center',
                    value === iconName && 'bg-primary/10 ring-2 ring-primary'
                  )}
                  title={iconName}
                >
                  <Icon className="h-5 w-5 text-foreground" />
                </button>
              );
            })}
          </div>
          {filteredIcons.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">
              No icons found
            </p>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
