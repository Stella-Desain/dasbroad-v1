import { useState } from 'react';
import { Plus, Search, Pencil, Trash2, Mail, Users } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAppStore, TeamMember } from '@/stores/appStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TeamMemberModal } from '@/components/team/TeamMemberModal';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function Team() {
  const { teamMembers, deleteTeamMember } = useAppStore();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);

  const filteredMembers = teamMembers.filter(
    (member) =>
      member.fullName.toLowerCase().includes(search.toLowerCase()) ||
      member.email.toLowerCase().includes(search.toLowerCase()) ||
      member.role.toLowerCase().includes(search.toLowerCase())
  );

  const handleEditMember = (member: TeamMember) => {
    setSelectedMember(member);
    setModalOpen(true);
  };

  const handleAddMember = () => {
    setSelectedMember(null);
    setModalOpen(true);
  };

  const handleDeleteClick = (member: TeamMember) => {
    setMemberToDelete(member);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (memberToDelete) {
      deleteTeamMember(memberToDelete.id);
      toast.success('Team member removed');
      setDeleteDialogOpen(false);
      setMemberToDelete(null);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Team</h1>
            <p className="text-muted-foreground">
              Manage your team members and their roles
            </p>
          </div>
          <button onClick={handleAddMember} className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Member
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members..."
            className="form-input pl-10"
          />
        </div>

        {/* Team Grid */}
        {filteredMembers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMembers.map((member) => (
              <div key={member.id} className="panel-container p-5 group">
                <div className="flex items-start gap-4">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={member.avatar} alt={member.fullName} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                      {member.fullName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">
                      {member.fullName}
                    </h3>
                    <p className="text-sm text-primary font-medium">{member.role}</p>
                    <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      <span className="truncate">{member.email}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEditMember(member)}
                    className="btn-secondary flex-1 flex items-center justify-center gap-2 py-2"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(member)}
                    className="btn-ghost flex items-center justify-center gap-2 py-2 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center panel-container">
            <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-1">
              {search ? 'No members found' : 'No team members yet'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {search
                ? 'Try adjusting your search'
                : 'Get started by adding your first team member'}
            </p>
            {!search && (
              <button onClick={handleAddMember} className="btn-primary">
                Add Member
              </button>
            )}
          </div>
        )}
      </div>

      <TeamMemberModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        member={selectedMember}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{memberToDelete?.fullName}" from the team? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
