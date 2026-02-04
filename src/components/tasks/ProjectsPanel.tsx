import { useState } from 'react';
import { Plus, FolderKanban, Calendar, Users } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAppStore, Project } from '@/stores/appStore';
import { ProjectModal } from './ProjectModal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function ProjectsPanel() {
  const { projects, teamMembers } = useAppStore();
  const [activeTab, setActiveTab] = useState<'scheduled' | 'backlog'>('scheduled');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const filteredProjects = projects.filter((project) => {
    if (activeTab === 'scheduled') {
      return project.status !== 'backlog';
    }
    return project.status === 'backlog';
  });

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setModalOpen(true);
  };

  const handleAddProject = () => {
    setSelectedProject(null);
    setModalOpen(true);
  };

  const getAssignees = (assigneeIds: string[]) => {
    return assigneeIds
      .map((id) => teamMembers.find((m) => m.id === id))
      .filter(Boolean)
      .slice(0, 3);
  };

  const priorityColors = {
    low: 'priority-low',
    medium: 'priority-medium',
    high: 'priority-high',
    critical: 'priority-critical',
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <FolderKanban className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">Projects</h2>
        </div>
        <button onClick={handleAddProject} className="icon-button text-primary">
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {(['scheduled', 'backlog'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 py-2.5 text-sm font-medium transition-colors capitalize',
              activeTab === tab
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Project List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
        {filteredProjects.length > 0 ? (
          filteredProjects.map((project) => {
            const assignees = getAssignees(project.assignees);
            
            return (
              <div
                key={project.id}
                onClick={() => handleProjectClick(project)}
                className="project-card"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-medium text-foreground text-sm truncate">
                    {project.title}
                  </h3>
                  <span className={cn('priority-badge text-xs', priorityColors[project.priority])}>
                    {project.priority}
                  </span>
                </div>

                {project.deadline && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{format(new Date(project.deadline), 'MMM d, yyyy')}</span>
                  </div>
                )}

                {project.status !== 'backlog' && (
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium text-foreground">{project.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {assignees.length > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="flex -space-x-2">
                      {assignees.map((member) => (
                        <Avatar key={member!.id} className="h-6 w-6 border-2 border-card">
                          <AvatarImage src={member!.avatar} alt={member!.fullName} />
                          <AvatarFallback className="text-xs bg-muted">
                            {member!.fullName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    {project.assignees.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{project.assignees.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FolderKanban className="h-10 w-10 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              {activeTab === 'scheduled'
                ? 'No scheduled projects yet'
                : 'No projects in backlog'}
            </p>
            <button
              onClick={handleAddProject}
              className="text-sm text-primary hover:underline mt-2"
            >
              Add a project
            </button>
          </div>
        )}
      </div>

      <ProjectModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        project={selectedProject}
      />
    </div>
  );
}
