import { useState } from 'react';
import { Plus, StickyNote, Pin, Trash2, Search } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAppStore, Note } from '@/stores/appStore';
import { toast } from 'sonner';

export function NotesPanel() {
  const { notes, addNote, updateNote, deleteNote } = useAppStore();
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  const filteredNotes = notes
    .filter(
      (note) =>
        note.title.toLowerCase().includes(search.toLowerCase()) ||
        note.content.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  const handleAddNote = () => {
    if (!newTitle.trim() && !newContent.trim()) {
      setIsAddingNew(false);
      return;
    }

    addNote({
      title: newTitle || 'Untitled',
      content: newContent,
      isPinned: false,
    });

    setNewTitle('');
    setNewContent('');
    setIsAddingNew(false);
    toast.success('Note added');
  };

  const handleEditNote = (note: Note) => {
    setEditingId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
  };

  const handleSaveEdit = () => {
    if (!editingId) return;

    updateNote(editingId, {
      title: editTitle || 'Untitled',
      content: editContent,
    });

    setEditingId(null);
    setEditTitle('');
    setEditContent('');
    toast.success('Note updated');
  };

  const handleTogglePin = (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    updateNote(note.id, { isPinned: !note.isPinned });
    toast.success(note.isPinned ? 'Note unpinned' : 'Note pinned');
  };

  const handleDeleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNote(id);
    toast.success('Note deleted');
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <StickyNote className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">Notes</h2>
          <span className="text-xs text-muted-foreground">({notes.length})</span>
        </div>
        <button
          onClick={() => setIsAddingNew(true)}
          className="icon-button text-primary"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-muted rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
        {/* Add New Note Form */}
        {isAddingNew && (
          <div className="note-item animate-scale-in">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Note title"
              className="w-full font-medium bg-transparent outline-none mb-2"
              autoFocus
            />
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Write your note..."
              className="w-full text-sm text-muted-foreground bg-transparent outline-none resize-none h-16"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  setIsAddingNew(false);
                  setNewTitle('');
                  setNewContent('');
                }}
                className="btn-secondary text-xs py-1 px-3"
              >
                Cancel
              </button>
              <button onClick={handleAddNote} className="btn-primary text-xs py-1 px-3">
                Save
              </button>
            </div>
          </div>
        )}

        {filteredNotes.length > 0 ? (
          filteredNotes.map((note) => (
            <div
              key={note.id}
              onClick={() => editingId !== note.id && handleEditNote(note)}
              className={cn(
                'note-item group',
                editingId === note.id && 'ring-2 ring-primary'
              )}
            >
              {editingId === note.id ? (
                <>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full font-medium bg-transparent outline-none mb-2"
                    autoFocus
                  />
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full text-sm text-muted-foreground bg-transparent outline-none resize-none h-20"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(null);
                      }}
                      className="btn-secondary text-xs py-1 px-3"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveEdit();
                      }}
                      className="btn-primary text-xs py-1 px-3"
                    >
                      Save
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-foreground text-sm truncate">
                      {note.title}
                    </h3>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleTogglePin(note, e)}
                        className={cn(
                          'p-1 rounded hover:bg-muted',
                          note.isPinned && 'text-warning'
                        )}
                      >
                        <Pin className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteNote(note.id, e)}
                        className="p-1 rounded hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  {note.isPinned && (
                    <span className="inline-flex items-center gap-1 text-xs text-warning mb-1">
                      <Pin className="h-3 w-3" />
                      Pinned
                    </span>
                  )}
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {note.content}
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-2">
                    {format(new Date(note.updatedAt), 'MMM d, h:mm a')}
                  </p>
                </>
              )}
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <StickyNote className="h-10 w-10 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              {search ? 'No notes found' : 'Click + to add your first note'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
