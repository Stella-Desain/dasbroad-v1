import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { AppLayout } from '@/components/layout/AppLayout';
import { CalendarPanel } from '@/components/tasks/CalendarPanel';
import { ProjectsPanel } from '@/components/tasks/ProjectsPanel';
import { NotesPanel } from '@/components/tasks/NotesPanel';
import { useAppStore } from '@/stores/appStore';

export default function Tasks() {
  const { panelSizes, setPanelSizes } = useAppStore();

  const handleLayout = (sizes: number[]) => {
    if (sizes.length === 2) {
      setPanelSizes({
        calendar: sizes[0],
        projects: panelSizes.projects,
        notes: panelSizes.notes,
      });
    }
  };

  const handleRightLayout = (sizes: number[]) => {
    if (sizes.length === 2) {
      setPanelSizes({
        calendar: panelSizes.calendar,
        projects: sizes[0],
        notes: sizes[1],
      });
    }
  };

  return (
    <AppLayout>
      <div className="h-[calc(100vh-112px)] animate-fade-in">
        <PanelGroup direction="horizontal" onLayout={handleLayout}>
          {/* Calendar Panel */}
          <Panel defaultSize={panelSizes.calendar} minSize={40}>
            <div className="h-full panel-container overflow-hidden">
              <CalendarPanel />
            </div>
          </Panel>

          <PanelResizeHandle className="w-2 bg-transparent hover:bg-primary/10 transition-colors cursor-col-resize" />

          {/* Right Side Panels */}
          <Panel defaultSize={100 - panelSizes.calendar} minSize={25}>
            <PanelGroup direction="vertical" onLayout={handleRightLayout}>
              {/* Projects Panel */}
              <Panel defaultSize={panelSizes.projects} minSize={25}>
                <div className="h-full panel-container overflow-hidden">
                  <ProjectsPanel />
                </div>
              </Panel>

              <PanelResizeHandle className="h-2 bg-transparent hover:bg-primary/10 transition-colors cursor-row-resize" />

              {/* Notes Panel */}
              <Panel defaultSize={panelSizes.notes} minSize={20}>
                <div className="h-full panel-container overflow-hidden">
                  <NotesPanel />
                </div>
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>
    </AppLayout>
  );
}
