import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { HiOutlineTrash } from 'react-icons/hi';
import { RiPushpinFill, RiPushpinLine } from 'react-icons/ri';
import './NoteCard.css';

const NoteCard = ({ note, onDelete, onTogglePin }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/note/${note.id}`);
  };

  const handlePinClick = (e) => {
    e.stopPropagation();
    onTogglePin(note.id, note.pinned);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this note?')) {
      onDelete(note.id);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  // Get content preview (first ~100 characters)
  const getContentPreview = (content) => {
    if (!content) return 'No content';
    return content.length > 100 ? content.substring(0, 100) + '...' : content;
  };

  return (
    <div className="note-card" onClick={handleClick}>
      <div className="note-card-header">
        <h3>{note.title || 'Untitled'}</h3>
        <button 
          onClick={handlePinClick} 
          title={note.pinned ? 'Unpin note' : 'Pin note'}
          className="pin-button"
        >
          {note.pinned ? <RiPushpinFill /> : <RiPushpinLine />}
        </button>
      </div>
      <p className="note-preview">
        {getContentPreview(note.content)}
      </p>
      <div className="note-card-footer">
        <span className="note-date">Updated {formatDate(note.updatedAt)}</span>
        <button onClick={handleDeleteClick} title="Delete note" className="delete-button">
          <HiOutlineTrash />
        </button>
      </div>
    </div>
  );
};

export default NoteCard;
