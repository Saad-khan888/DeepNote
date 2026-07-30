import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getNoteById, updateNote, deleteNote } from '../services/notesService';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import './NoteDetail.css';

const NoteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [note, setNote] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    loadNote();
  }, [id, currentUser]);

  const loadNote = async () => {
    try {
      setLoading(true);
      setNotFound(false);
      const noteData = await getNoteById(id);
      
      if (!noteData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      if (noteData.userId !== currentUser.uid) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setNote(noteData);
      setTitle(noteData.title);
      setContent(noteData.content);
    } catch (error) {
      console.error('Error loading note:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateNote(id, { title, content });
      setNote({ ...note, title, content });
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save note. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset to original values
    setTitle(note.title);
    setContent(note.content);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      try {
        await deleteNote(id);
        navigate('/dashboard');
      } catch (error) {
        console.error('Error deleting note:', error);
        alert('Failed to delete note. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="note-detail-container">
        <LoadingSpinner message="Loading note..." />
      </div>
    );
  }

  if (notFound || !note) {
    return (
      <div className="note-detail-container">
        <EmptyState
          title="Note not found"
          message="The note you're looking for doesn't exist or you don't have access to it."
          actionText="Back to Dashboard"
          actionLink="/dashboard"
        />
      </div>
    );
  }

  return (
    <div className="note-detail-container">
      <header className="note-header">
        <div className="header-left">
          <Link to="/dashboard" className="btn-back">← Back to Dashboard</Link>
        </div>
        <div className="header-actions">
          {!isEditing ? (
            <>
              <button onClick={() => setIsEditing(true)} className="btn-edit">
                Edit
              </button>
              <button onClick={handleDelete} className="btn-delete">
                Delete
              </button>
            </>
          ) : (
            <>
              <button onClick={handleCancelEdit} className="btn-secondary" disabled={saving}>
                Cancel
              </button>
              <button onClick={handleSave} className="btn-save" disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </>
          )}
        </div>
      </header>

      <main className="note-content">
        {!isEditing ? (
          <>
            <h1 className="note-title">{note.title || 'Untitled'}</h1>
            <div className="note-body">
              {note.content || <em className="empty-content">No content yet</em>}
            </div>
          </>
        ) : (
          <>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note Title"
              className="title-input"
              disabled={saving}
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start writing your note..."
              className="content-textarea"
              rows={20}
              disabled={saving}
            />
          </>
        )}
      </main>
    </div>
  );
};

export default NoteDetail;
