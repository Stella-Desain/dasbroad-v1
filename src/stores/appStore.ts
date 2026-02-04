import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Shortcut {
  id: string;
  name: string;
  url: string;
  icon: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  time?: string;
  type: 'task' | 'event';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in-progress' | 'completed';
  projectId?: string;
  assignees: string[];
  repeat: 'none' | 'daily' | 'weekly' | 'monthly';
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

export interface Project {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'backlog' | 'scheduled' | 'in-progress' | 'completed';
  startDate?: string;
  deadline?: string;
  progress: number;
  assignees: string[];
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
  color?: string;
}

export interface TeamMember {
  id: string;
  fullName: string;
  email: string;
  role: string;
  avatar: string;
}

interface AppState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  shortcuts: Shortcut[];
  addShortcut: (shortcut: Omit<Shortcut, 'id'>) => void;
  updateShortcut: (id: string, shortcut: Partial<Shortcut>) => void;
  deleteShortcut: (id: string) => void;
  
  tasks: Task[];
  addTask: (task: Omit<Task, 'id'>) => void;
  updateTask: (id: string, task: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  
  projects: Project[];
  addProject: (project: Omit<Project, 'id'>) => void;
  updateProject: (id: string, project: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  
  notes: Note[];
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateNote: (id: string, note: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  
  teamMembers: TeamMember[];
  addTeamMember: (member: Omit<TeamMember, 'id'>) => void;
  updateTeamMember: (id: string, member: Partial<TeamMember>) => void;
  deleteTeamMember: (id: string) => void;
  
  panelSizes: { calendar: number; projects: number; notes: number };
  setPanelSizes: (sizes: { calendar: number; projects: number; notes: number }) => void;
}

const defaultShortcuts: Shortcut[] = [
  { id: '1', name: 'Google', url: 'https://google.com', icon: 'Search' },
  { id: '2', name: 'GitHub', url: 'https://github.com', icon: 'Github' },
  { id: '3', name: 'Notion', url: 'https://notion.so', icon: 'FileText' },
];

const defaultTasks: Task[] = [
  {
    id: '1',
    title: 'Team Meeting',
    description: 'Weekly sync with the team',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    time: '10:00',
    type: 'event',
    priority: 'medium',
    status: 'pending',
    assignees: ['1', '2'],
    repeat: 'weekly',
    color: 'blue',
  },
  {
    id: '2',
    title: 'Project Review',
    description: 'Review Q4 project progress',
    startDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    time: '14:30',
    type: 'task',
    priority: 'high',
    status: 'pending',
    assignees: ['1'],
    repeat: 'none',
    color: 'green',
  },
  {
    id: '3',
    title: 'Design Sprint',
    description: 'UI/UX design workshop',
    startDate: new Date(Date.now() + 172800000).toISOString().split('T')[0],
    endDate: new Date(Date.now() + 345600000).toISOString().split('T')[0],
    type: 'event',
    priority: 'medium',
    status: 'in-progress',
    assignees: ['2', '3'],
    repeat: 'none',
    color: 'purple',
  },
];

const defaultProjects: Project[] = [
  {
    id: '1',
    title: 'Website Redesign',
    description: 'Complete overhaul of company website',
    priority: 'high',
    status: 'scheduled',
    startDate: new Date().toISOString().split('T')[0],
    deadline: new Date(Date.now() + 604800000).toISOString().split('T')[0],
    progress: 45,
    assignees: ['1', '2'],
  },
  {
    id: '2',
    title: 'Mobile App Development',
    description: 'Build cross-platform mobile application',
    priority: 'critical',
    status: 'in-progress',
    startDate: new Date(Date.now() - 604800000).toISOString().split('T')[0],
    deadline: new Date(Date.now() + 1209600000).toISOString().split('T')[0],
    progress: 30,
    assignees: ['1', '3'],
  },
  {
    id: '3',
    title: 'API Integration',
    description: 'Integrate third-party APIs',
    priority: 'medium',
    status: 'backlog',
    progress: 0,
    assignees: ['2'],
  },
  {
    id: '4',
    title: 'Documentation Update',
    description: 'Update technical documentation',
    priority: 'low',
    status: 'backlog',
    progress: 0,
    assignees: ['3'],
  },
];

const defaultNotes: Note[] = [
  {
    id: '1',
    title: 'Meeting Notes',
    content: 'Discussed project timeline and resource allocation. Need to follow up on design decisions.',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    isPinned: true,
  },
  {
    id: '2',
    title: 'Ideas',
    content: 'New feature ideas: dark mode, notifications, integrations with Slack.',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
    isPinned: false,
  },
  {
    id: '3',
    title: 'Quick Reminder',
    content: 'Call client about contract renewal by end of week.',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    isPinned: false,
  },
];

const defaultTeamMembers: TeamMember[] = [
  {
    id: '1',
    fullName: 'John Doe',
    email: 'john@example.com',
    role: 'Project Manager',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
  },
  {
    id: '2',
    fullName: 'Jane Smith',
    email: 'jane@example.com',
    role: 'Designer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane',
  },
  {
    id: '3',
    fullName: 'Mike Johnson',
    email: 'mike@example.com',
    role: 'Developer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
  },
];

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      
      shortcuts: defaultShortcuts,
      addShortcut: (shortcut) =>
        set((state) => ({
          shortcuts: [...state.shortcuts, { ...shortcut, id: Date.now().toString() }],
        })),
      updateShortcut: (id, shortcut) =>
        set((state) => ({
          shortcuts: state.shortcuts.map((s) => (s.id === id ? { ...s, ...shortcut } : s)),
        })),
      deleteShortcut: (id) =>
        set((state) => ({
          shortcuts: state.shortcuts.filter((s) => s.id !== id),
        })),
      
      tasks: defaultTasks,
      addTask: (task) =>
        set((state) => ({
          tasks: [...state.tasks, { ...task, id: Date.now().toString() }],
        })),
      updateTask: (id, task) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...task } : t)),
        })),
      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        })),
      
      projects: defaultProjects,
      addProject: (project) =>
        set((state) => ({
          projects: [...state.projects, { ...project, id: Date.now().toString() }],
        })),
      updateProject: (id, project) =>
        set((state) => ({
          projects: state.projects.map((p) => (p.id === id ? { ...p, ...project } : p)),
        })),
      deleteProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
        })),
      
      notes: defaultNotes,
      addNote: (note) =>
        set((state) => ({
          notes: [
            ...state.notes,
            {
              ...note,
              id: Date.now().toString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        })),
      updateNote: (id, note) =>
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, ...note, updatedAt: new Date().toISOString() } : n
          ),
        })),
      deleteNote: (id) =>
        set((state) => ({
          notes: state.notes.filter((n) => n.id !== id),
        })),
      
      teamMembers: defaultTeamMembers,
      addTeamMember: (member) =>
        set((state) => ({
          teamMembers: [...state.teamMembers, { ...member, id: Date.now().toString() }],
        })),
      updateTeamMember: (id, member) =>
        set((state) => ({
          teamMembers: state.teamMembers.map((m) => (m.id === id ? { ...m, ...member } : m)),
        })),
      deleteTeamMember: (id) =>
        set((state) => ({
          teamMembers: state.teamMembers.filter((m) => m.id !== id),
        })),
      
      panelSizes: { calendar: 65, projects: 60, notes: 40 },
      setPanelSizes: (sizes) => set({ panelSizes: sizes }),
    }),
    {
      name: 'app-storage',
    }
  )
);
