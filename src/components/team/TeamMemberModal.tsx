import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppStore, TeamMember } from '@/stores/appStore';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface TeamMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: TeamMember | null;
}

const roles = [
  'Admin',
  'Project Manager',
  'Designer',
  'Developer',
  'QA Engineer',
  'Marketing',
  'Sales',
  'Support',
  'Member',
];

export function TeamMemberModal({ open, onOpenChange, member }: TeamMemberModalProps) {
  const { addTeamMember, updateTeamMember } = useAppStore();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: 'Member',
    avatar: '',
  });

  const [errors, setErrors] = useState<{ fullName?: string; email?: string }>({});

  const isEditing = !!member;

  useEffect(() => {
    if (member) {
      setFormData({
        fullName: member.fullName,
        email: member.email,
        role: member.role,
        avatar: member.avatar,
      });
    } else {
      setFormData({
        fullName: '',
        email: '',
        role: 'Member',
        avatar: '',
      });
    }
    setErrors({});
  }, [member, open]);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const memberData = {
      fullName: formData.fullName,
      email: formData.email,
      role: formData.role,
      avatar: formData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.fullName}`,
    };

    if (isEditing && member) {
      updateTeamMember(member.id, memberData);
      toast.success('Team member updated');
    } else {
      addTeamMember(memberData);
      toast.success('Team member added');
    }

    onOpenChange(false);
  };

  const previewAvatar = formData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.fullName || 'default'}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Team Member' : 'Add Team Member'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Avatar Preview */}
          <div className="flex justify-center">
            <Avatar className="h-20 w-20">
              <AvatarImage src={previewAvatar} alt={formData.fullName} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {formData.fullName.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => {
                setFormData({ ...formData, fullName: e.target.value });
                setErrors((prev) => ({ ...prev, fullName: undefined }));
              }}
              placeholder="John Doe"
              className={errors.fullName ? 'border-destructive' : ''}
            />
            {errors.fullName && (
              <p className="text-xs text-destructive">{errors.fullName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              placeholder="john@example.com"
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="form-input"
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatar">Avatar URL (optional)</Label>
            <Input
              id="avatar"
              value={formData.avatar}
              onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
              placeholder="https://example.com/avatar.jpg"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to auto-generate an avatar
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {isEditing ? 'Save Changes' : 'Add Member'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
