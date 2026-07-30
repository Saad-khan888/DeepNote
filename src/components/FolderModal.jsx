import { useState, useEffect } from 'react';
import { HiX } from 'react-icons/hi';
import './FolderModal.css';

const FolderModal = ({ isOpen, onClose, onSubmit, folder = null, mode = 'create' }) => {
  const [folderName, setFolderName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFolderName(folder?.name || '');
      setError('');
    }
  }, [isOpen, folder]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!folderName.trim()) {
      setError('Folder name is required');
      return;
    }

    onSubmit(folderName.trim());
    setFolderName('');
    setError('');
  };

  const handleClose = () => {
    setFolderName('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="folder-modal-overlay" onClick={handleClose}>
      <div className="folder-modal" onClick={(e) => e.stopPropagation()}>
        <div className="folder-modal-header">
          <h3>{mode === 'create' ? 'New Folder' : 'Rename Folder'}</h3>
          <button className="close-btn" onClick={handleClose}>
            <HiX />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="folder-modal-body">
            <input
              type="text"
              className="folder-name-input"
              placeholder="Folder name"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              autoFocus
            />
            {error && <p className="error-message">{error}</p>}
          </div>

          <div className="folder-modal-footer">
            <button type="button" className="btn-cancel" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="btn-submit">
              {mode === 'create' ? 'Create' : 'Rename'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FolderModal;
