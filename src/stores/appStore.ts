import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase as supabaseTyped } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Bypass type check for new tables
const supabase = supabaseTyped as any;

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

  isLoading: boolean;
  fetchData: () => Promise<void>;

  shortcuts: Shortcut[];
  addShortcut: (shortcut: Omit<Shortcut, 'id'>) => Promise<void>;
  updateShortcut: (id: string, shortcut: Partial<Shortcut>) => Promise<void>;
  deleteShortcut: (id: string) => Promise<void>;

  tasks: Task[];
  addTask: (task: Omit<Task, 'id'>) => Promise<void>;
  updateTask: (id: string, task: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  projects: Project[];
  addProject: (project: Omit<Project, 'id'>) => Promise<void>;
  updateProject: (id: string, project: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  notes: Note[];
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateNote: (id: string, note: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;

  teamMembers: TeamMember[];
  addTeamMember: (member: Omit<TeamMember, 'id'>) => Promise<void>;
  updateTeamMember: (id: string, member: Partial<TeamMember>) => Promise<void>;
  deleteTeamMember: (id: string) => Promise<void>;

  panelSizes: { calendar: number; projects: number; notes: number };
  setPanelSizes: (sizes: { calendar: number; projects: number; notes: number }) => void;
}

const defaultShortcuts: Omit<Shortcut, 'id'>[] = [
  { name: 'Google', url: 'https://google.com', icon: 'Search' },
  { name: 'GitHub', url: 'https://github.com', icon: 'Github' },
  { name: 'Notion', url: 'https://notion.so', icon: 'FileText' },
];

const defaultTasks: Omit<Task, 'id'>[] = [
  {
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

const defaultProjects: Omit<Project, 'id'>[] = [
  {
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
    title: 'API Integration',
    description: 'Integrate third-party APIs',
    priority: 'medium',
    status: 'backlog',
    progress: 0,
    assignees: ['2'],
  },
  {
    title: 'Documentation Update',
    description: 'Update technical documentation',
    priority: 'low',
    status: 'backlog',
    progress: 0,
    assignees: ['3'],
  },
];

const defaultNotes: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    title: 'Meeting Notes',
    content: 'Discussed project timeline and resource allocation. Need to follow up on design decisions.',
    isPinned: true,
  },
  {
    title: 'Ideas',
    content: 'New feature ideas: dark mode, notifications, integrations with Slack.',
    isPinned: false,
  },
  {
    title: 'Quick Reminder',
    content: 'Call client about contract renewal by end of week.',
    isPinned: false,
  },
];

const defaultTeamMembers: Omit<TeamMember, 'id'>[] = [
  {
    fullName: 'John Doe',
    email: 'john@example.com',
    role: 'Project Manager',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
  },
  {
    fullName: 'Jane Smith',
    email: 'jane@example.com',
    role: 'Designer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane',
  },
  {
    fullName: 'Mike Johnson',
    email: 'mike@example.com',
    role: 'Developer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
  },
];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      panelSizes: { calendar: 65, projects: 60, notes: 40 },
      setPanelSizes: (sizes) => set({ panelSizes: sizes }),

      isLoading: false,
      shortcuts: [],
      tasks: [],
      projects: [],
      notes: [],
      teamMembers: [],

      fetchData: async () => {
        set({ isLoading: true });
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            set({ isLoading: false });
            return;
          }

          // Fetch all data in parallel
          const [tasksRes, projectsRes, notesRes, shortcutsRes, teamRes] = await Promise.all([
            supabase.from('tasks').select('*'),
            supabase.from('projects').select('*'),
            supabase.from('notes').select('*'),
            supabase.from('shortcuts').select('*'),
            supabase.from('team_members').select('*'),
          ]);

          // Handle defaults if empty
          let hasData = false;
          if (tasksRes.data?.length || projectsRes.data?.length || notesRes.data?.length || shortcutsRes.data?.length || teamRes.data?.length) {
            hasData = true;
          }

          if (!hasData) {
            // Seed default data
            console.log('Seeding default data...');
            const seedPromises = [
              supabase.from('tasks').insert(defaultTasks).select(),
              supabase.from('projects').insert(defaultProjects).select(),
              supabase.from('notes').insert(defaultNotes).select(),
              supabase.from('shortcuts').insert(defaultShortcuts).select(),
              supabase.from('team_members').insert(defaultTeamMembers).select()
            ];
            const [newTasks, newProjects, newNotes, newShortcuts, newTeam] = await Promise.all(seedPromises);

            // Refresh data from the insert result
            if (newTasks.data) tasksRes.data = newTasks.data;
            if (newProjects.data) projectsRes.data = newProjects.data;
            if (newNotes.data) notesRes.data = newNotes.data;
            if (newShortcuts.data) shortcutsRes.data = newShortcuts.data;
            if (newTeam.data) teamRes.data = newTeam.data;
          }

          // Map snake_case to camelCase
          set({
            tasks: (tasksRes.data || []).map((t: any) => ({
              id: t.id,
              title: t.title,
              description: t.description,
              startDate: t.start_date,
              endDate: t.end_date,
              time: t.time,
              type: t.type,
              priority: t.priority,
              status: t.status,
              projectId: t.project_id,
              assignees: t.assignees || [], // assuming jsonb returns array
              repeat: t.repeat,
              color: t.color,
            })),
            projects: (projectsRes.data || []).map((p: any) => ({
              id: p.id,
              title: p.title,
              description: p.description,
              priority: p.priority,
              status: p.status,
              startDate: p.start_date,
              deadline: p.deadline,
              progress: p.progress,
              assignees: p.assignees || [],
            })),
            notes: (notesRes.data || []).map((n: any) => ({
              id: n.id,
              title: n.title,
              content: n.content,
              isPinned: n.is_pinned,
              color: n.color,
              createdAt: n.created_at,
              updatedAt: n.updated_at,
            })),
            shortcuts: (shortcutsRes.data || []).map((s: any) => ({
              id: s.id,
              name: s.name,
              url: s.url,
              icon: s.icon,
            })),
            teamMembers: (teamRes.data || []).map((t: any) => ({
              id: t.id,
              fullName: t.full_name,
              email: t.email,
              role: t.role,
              avatar: t.avatar,
            })),
            isLoading: false
          });

        } catch (error) {
          console.error('Error fetching data:', error);
          toast.error('Failed to load data');
          set({ isLoading: false });
        }
      },

      addShortcut: async (shortcut) => {
        try {
          const { data, error } = await supabase.from('shortcuts').insert({
            name: shortcut.name,
            url: shortcut.url,
            icon: shortcut.icon
          }).select().single();

          if (error) throw error;

          set((state) => ({
            shortcuts: [...state.shortcuts, {
              id: data.id,
              name: data.name,
              url: data.url,
              icon: data.icon
            }],
          }));
        } catch (e) {
          toast.error('Failed to add shortcut');
        }
      },
      updateShortcut: async (id, shortcut) => {
        try {
          const updates: any = {};
          if (shortcut.name) updates.name = shortcut.name;
          if (shortcut.url) updates.url = shortcut.url;
          if (shortcut.icon) updates.icon = shortcut.icon;

          const { error } = await supabase.from('shortcuts').update(updates).eq('id', id);
          if (error) throw error;

          set((state) => ({
            shortcuts: state.shortcuts.map((s) => (s.id === id ? { ...s, ...shortcut } : s)),
          }));
        } catch (e) {
          toast.error('Failed to update shortcut');
        }
      },
      deleteShortcut: async (id) => {
        try {
          const { error } = await supabase.from('shortcuts').delete().eq('id', id);
          if (error) throw error;
          set((state) => ({
            shortcuts: state.shortcuts.filter((s) => s.id !== id),
          }));
        } catch (e) {
          toast.error('Failed to delete shortcut');
        }
      },

      addTask: async (task) => {
        try {
          const { data, error } = await supabase.from('tasks').insert({
            title: task.title,
            description: task.description,
            start_date: task.startDate,
            end_date: task.endDate,
            time: task.time,
            type: task.type,
            priority: task.priority,
            status: task.status,
            project_id: task.projectId,
            assignees: task.assignees,
            repeat: task.repeat,
            color: task.color
          }).select().single();

          if (error) throw error;

          set((state) => ({
            tasks: [...state.tasks, {
              ...task,
              id: data.id
            }]
          }));
        } catch (e) {
          console.error(e);
          toast.error('Failed to add task');
        }
      },
      updateTask: async (id, task) => {
        try {
          const updates: any = {};
          if (task.title !== undefined) updates.title = task.title;
          if (task.description !== undefined) updates.description = task.description;
          if (task.startDate !== undefined) updates.start_date = task.startDate;
          if (task.endDate !== undefined) updates.end_date = task.endDate;
          if (task.time !== undefined) updates.time = task.time;
          if (task.type !== undefined) updates.type = task.type;
          if (task.priority !== undefined) updates.priority = task.priority;
          if (task.status !== undefined) updates.status = task.status;
          if (task.projectId !== undefined) updates.project_id = task.projectId;
          if (task.assignees !== undefined) updates.assignees = task.assignees;
          if (task.repeat !== undefined) updates.repeat = task.repeat;
          if (task.color !== undefined) updates.color = task.color;

          const { error } = await supabase.from('tasks').update(updates).eq('id', id);
          if (error) throw error;

          set((state) => ({
            tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...task } : t)),
          }));
        } catch (e) {
          console.error(e);
          toast.error('Failed to update task');
        }
      },
      deleteTask: async (id) => {
        try {
          const { error } = await supabase.from('tasks').delete().eq('id', id);
          if (error) throw error;
          set((state) => ({
            tasks: state.tasks.filter((t) => t.id !== id),
          }));
        } catch (e) {
          toast.error('Failed to delete task');
        }
      },

      addProject: async (project) => {
        try {
          const { data, error } = await supabase.from('projects').insert({
            title: project.title,
            description: project.description,
            priority: project.priority,
            status: project.status,
            start_date: project.startDate,
            deadline: project.deadline,
            progress: project.progress,
            assignees: project.assignees
          }).select().single();
          if (error) throw error;

          set((state) => ({
            projects: [...state.projects, { ...project, id: data.id }],
          }));
        } catch (e) {
          toast.error('Failed to add project');
        }
      },
      updateProject: async (id, project) => {
        try {
          const updates: any = {};
          if (project.title) updates.title = project.title;
          if (project.description) updates.description = project.description;
          if (project.priority) updates.priority = project.priority;
          if (project.status) updates.status = project.status;
          if (project.startDate) updates.start_date = project.startDate;
          if (project.deadline) updates.deadline = project.deadline;
          if (project.progress !== undefined) updates.progress = project.progress;
          if (project.assignees) updates.assignees = project.assignees;

          const { error } = await supabase.from('projects').update(updates).eq('id', id);
          if (error) throw error;

          set((state) => ({
            projects: state.projects.map((p) => (p.id === id ? { ...p, ...project } : p)),
          }));
        } catch (e) {
          toast.error('Failed to update project');
        }
      },
      deleteProject: async (id) => {
        try {
          const { error } = await supabase.from('projects').delete().eq('id', id);
          if (error) throw error;
          set((state) => ({
            projects: state.projects.filter((p) => p.id !== id),
          }));
        } catch (e) {
          toast.error('Failed to delete project');
        }
      },

      addNote: async (note) => {
        try {
          const { data, error } = await supabase.from('notes').insert({
            title: note.title,
            content: note.content,
            is_pinned: note.isPinned,
            color: note.color,
            // timestamps auto generated by DB
          }).select().single();
          if (error) throw error;

          set((state) => ({
            notes: [
              ...state.notes,
              {
                ...note,
                id: data.id,
                createdAt: data.created_at,
                updatedAt: data.updated_at
              },
            ],
          }));
        } catch (e) {
          toast.error('Failed to add note');
        }
      },
      updateNote: async (id, note) => {
        try {
          const updates: any = { updated_at: new Date().toISOString() };
          if (note.title) updates.title = note.title;
          if (note.content) updates.content = note.content;
          if (note.isPinned !== undefined) updates.is_pinned = note.isPinned;
          if (note.color) updates.color = note.color;

          const { data, error } = await supabase.from('notes').update(updates).eq('id', id).select().single();
          if (error) throw error;

          set((state) => ({
            notes: state.notes.map((n) =>
              n.id === id ? { ...n, ...note, updatedAt: data.updated_at } : n
            ),
          }));
        } catch (e) {
          toast.error('Failed to update note');
        }
      },
      deleteNote: async (id) => {
        try {
          const { error } = await supabase.from('notes').delete().eq('id', id);
          if (error) throw error;
          set((state) => ({
            notes: state.notes.filter((n) => n.id !== id),
          }));
        } catch (e) {
          toast.error('Failed to delete note');
        }
      },

      addTeamMember: async (member) => {
        try {
          const { data, error } = await supabase.from('team_members').insert({
            full_name: member.fullName,
            email: member.email,
            role: member.role,
            avatar: member.avatar
          }).select().single();
          if (error) throw error;

          set((state) => ({
            teamMembers: [...state.teamMembers, { ...member, id: data.id }],
          }));
        } catch (e) {
          toast.error('Failed to add team member');
        }
      },
      updateTeamMember: async (id, member) => {
        try {
          const updates: any = {};
          if (member.fullName) updates.full_name = member.fullName;
          if (member.email) updates.email = member.email;
          if (member.role) updates.role = member.role;
          if (member.avatar) updates.avatar = member.avatar;

          const { error } = await supabase.from('team_members').update(updates).eq('id', id);
          if (error) throw error;

          set((state) => ({
            teamMembers: state.teamMembers.map((m) => (m.id === id ? { ...m, ...member } : m)),
          }));
        } catch (e) {
          toast.error('Failed to update team member');
        }
      },
      deleteTeamMember: async (id) => {
        try {
          const { error } = await supabase.from('team_members').delete().eq('id', id);
          if (error) throw error;
          set((state) => ({
            teamMembers: state.teamMembers.filter((m) => m.id !== id),
          }));
        } catch (e) {
          toast.error('Failed to delete team member');
        }
      },
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        panelSizes: state.panelSizes
      }),
    }
  )
);
