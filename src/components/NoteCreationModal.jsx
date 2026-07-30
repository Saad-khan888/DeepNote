import { useState } from 'react';
import { HiX, HiFolder, HiTag, HiPlus } from 'react-icons/hi';
import './NoteCreationModal.css';

const NoteCreationModal = ({ isOpen, onClose, onSubmit, folders = [] }) => {
  const [selectedFolder, setSelectedFolder] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = () => {
    onSubmit({
      folderId: selectedFolder || null,
      tags
    });
    // Reset form
    setSelectedFolder('');
    setTags([]);
    setTagInput('');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content note-creation-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Note</h2>
          <button className="close-btn" onClick={onClose}>
            <HiX />
          </button>
        </div>

        <div className="modal-body">
          {/* Folder Selection */}
          <div className="form-section">
            <label className="form-label">
              <HiFolder className="label-icon" />
              Add to Folder
            </label>
            <select
              className="folder-select"
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
            >
              <option value="">None (Uncategorized)</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tags Input */}
          <div className="form-section">
            <label className="form-label">
              <HiTag className="label-icon" />
              Tags
            </label>
            <div className="tag-input-container">
              <input
                type="text"
                className="tag-input"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a tag and press Enter"
              />
              <button 
                className="add-tag-btn" 
                onClick={handleAddTag}
                disabled={!tagInput.trim()}
              >
                <HiPlus />
              </button>
            </div>

            {/* Display Tags */}
            {tags.length > 0 && (
              <div className="tags-list">
                {tags.map((tag, index) => (
                  <span key={index} className="tag-badge">
                    {tag}
                    <button 
                      className="remove-tag-btn" 
                      onClick={() => handleRemoveTag(tag)}
                    >
                      <HiX />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-create" onClick={handleSubmit}>
            Create Note
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoteCreationModal;
