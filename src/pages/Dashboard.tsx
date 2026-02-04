import { useMemo } from 'react';
import {
  CheckSquare,
  FolderKanban,
  Users,
  Clock,
  StickyNote,
  TrendingUp,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/appStore';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { AppLayout } from '@/components/layout/AppLayout';

export default function Dashboard() {
  const navigate = useNavigate();
  const { tasks, projects, notes, teamMembers } = useAppStore();

  const stats = useMemo(() => {
    const today = new Date();
    const nextWeek = addDays(today, 7);

    const pendingTasks = tasks.filter((t) => t.status === 'pending').length;
    const inProgressTasks = tasks.filter((t) => t.status === 'in-progress').length;
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;

    const upcomingDeadlines = tasks.filter((t) => {
      const endDate = new Date(t.endDate);
      return isAfter(endDate, today) && isBefore(endDate, nextWeek);
    }).length;

    const scheduledProjects = projects.filter((p) => p.status !== 'backlog').length;
    const backlogProjects = projects.filter((p) => p.status === 'backlog').length;

    return {
      totalTasks: tasks.length,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      totalProjects: projects.length,
      scheduledProjects,
      backlogProjects,
      teamCount: teamMembers.length,
      notesCount: notes.length,
      upcomingDeadlines,
    };
  }, [tasks, projects, notes, teamMembers]);

  const taskStatusData = [
    { name: 'Pending', value: stats.pendingTasks, color: 'hsl(var(--warning))' },
    { name: 'In Progress', value: stats.inProgressTasks, color: 'hsl(var(--primary))' },
    { name: 'Completed', value: stats.completedTasks, color: 'hsl(var(--success))' },
  ];

  const projectData = [
    { name: 'Scheduled', value: stats.scheduledProjects },
    { name: 'Backlog', value: stats.backlogProjects },
    { name: 'In Progress', value: projects.filter((p) => p.status === 'in-progress').length },
    { name: 'Completed', value: projects.filter((p) => p.status === 'completed').length },
  ];

  const recentNotes = notes.slice(0, 4).sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  const upcomingTasks = tasks
    .filter((t) => t.status !== 'completed')
    .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
    .slice(0, 5);

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your overview.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tasks</p>
                <p className="text-3xl font-bold text-foreground mt-1">{stats.totalTasks}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <CheckSquare className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm">
              <span className="text-success font-medium">{stats.completedTasks}</span>
              <span className="text-muted-foreground">completed</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Projects</p>
                <p className="text-3xl font-bold text-foreground mt-1">{stats.totalProjects}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <FolderKanban className="h-6 w-6 text-success" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm">
              <span className="text-primary font-medium">{stats.scheduledProjects}</span>
              <span className="text-muted-foreground">scheduled</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Team Members</p>
                <p className="text-3xl font-bold text-foreground mt-1">{stats.teamCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-warning" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Active collaborators</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Upcoming Deadlines</p>
                <p className="text-3xl font-bold text-foreground mt-1">{stats.upcomingDeadlines}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-destructive" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Within 7 days</span>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Task Status Chart */}
          <div className="panel-container p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">Task Status</h2>
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-8">
              <div className="w-40 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={taskStatusData}
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {taskStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-3">
                {taskStatusData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium text-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Project Progress Chart */}
          <div className="panel-container p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">Project Overview</h2>
              <FolderKanban className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectData}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                  <YAxis axisLine={false} tickLine={false} fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Tasks */}
          <div className="panel-container">
            <div className="panel-header">
              <h2 className="text-lg font-semibold text-foreground">Upcoming Tasks</h2>
              <button
                onClick={() => navigate('/tasks')}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {upcomingTasks.length > 0 ? (
                upcomingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                    onClick={() => navigate('/tasks')}
                  >
                    <div className={`w-2 h-2 rounded-full bg-task-${task.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(task.endDate), 'MMM d, yyyy')}
                        {task.time && ` at ${task.time}`}
                      </p>
                    </div>
                    <span className={`priority-badge priority-${task.priority}`}>
                      {task.priority}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No upcoming tasks
                </p>
              )}
            </div>
          </div>

          {/* Recent Notes */}
          <div className="panel-container">
            <div className="panel-header">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <StickyNote className="h-5 w-5" />
                Recent Notes
              </h2>
              <button
                onClick={() => navigate('/tasks')}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {recentNotes.length > 0 ? (
                recentNotes.map((note) => (
                  <div
                    key={note.id}
                    className="note-item"
                    onClick={() => navigate('/tasks')}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-medium text-foreground">{note.title}</h3>
                      {note.isPinned && (
                        <span className="text-xs bg-warning/20 text-warning px-2 py-0.5 rounded-full">
                          Pinned
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {note.content}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(note.updatedAt), 'MMM d, h:mm a')}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No notes yet
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
