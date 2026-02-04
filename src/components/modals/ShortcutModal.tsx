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
import { useAppStore, Shortcut } from '@/stores/appStore';
import { IconPicker } from '@/components/common/IconPicker';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface ShortcutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shortcut: Shortcut | null;
}

export function ShortcutModal({ open, onOpenChange, shortcut }: ShortcutModalProps) {
  const { addShortcut, updateShortcut, deleteShortcut } = useAppStore();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [icon, setIcon] = useState('Link');
  const [errors, setErrors] = useState<{ name?: string; url?: string }>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const isEditing = !!shortcut;

  useEffect(() => {
    if (shortcut) {
      setName(shortcut.name);
      setUrl(shortcut.url);
      setIcon(shortcut.icon);
    } else {
      setName('');
      setUrl('');
      setIcon('Link');
    }
    setErrors({});
  }, [shortcut, open]);

  const validateUrl = (value: string) => {
    if (!value) return false;
    try {
      let urlToTest = value;
      if (!value.startsWith('http://') && !value.startsWith('https://')) {
        urlToTest = 'https://' + value;
      }
      new URL(urlToTest);
      return true;
    } catch {
      return false;
    }
  };

  const handleSave = () => {
    const newErrors: { name?: string; url?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!url.trim()) {
      newErrors.url = 'URL is required';
    } else if (!validateUrl(url)) {
      newErrors.url = 'Please enter a valid URL';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    let finalUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      finalUrl = 'https://' + url;
    }

    if (isEditing && shortcut) {
      updateShortcut(shortcut.id, { name, url: finalUrl, icon });
    } else {
      addShortcut({ name, url: finalUrl, icon });
    }

    onOpenChange(false);
  };

  const handleDelete = () => {
    if (shortcut) {
      deleteShortcut(shortcut.id);
      setDeleteDialogOpen(false);
      onOpenChange(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Shortcut' : 'Add Shortcut'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                placeholder="e.g., Google Drive"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setErrors((prev) => ({ ...prev, url: undefined }));
                }}
                placeholder="e.g., https://drive.google.com"
                className={errors.url ? 'border-destructive' : ''}
              />
              {errors.url && (
                <p className="text-xs text-destructive">{errors.url}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Icon</Label>
              <IconPicker value={icon} onChange={setIcon} />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {isEditing && (
              <Button
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
                className="w-full sm:w-auto"
              >
                Delete
              </Button>
            )}
            <div className="flex-1" />
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {isEditing ? 'Save Changes' : 'Add Shortcut'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Shortcut</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{shortcut?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
