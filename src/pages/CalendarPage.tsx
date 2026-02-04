import { AppLayout } from '@/components/layout/AppLayout';
import { CalendarPanel } from '@/components/tasks/CalendarPanel';

export default function CalendarPage() {
  return (
    <AppLayout>
      <div className="h-[calc(100vh-112px)] animate-fade-in">
        <div className="h-full panel-container overflow-hidden">
          <CalendarPanel />
        </div>
      </div>
    </AppLayout>
  );
}
