import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getNoteById, updateNote, createNote, getUserFolders } from '../services/notesService';
import { 
  summarizeNote, 
  generateTitle, 
  rewriteForClarity, 
  rephraseContent, 
  expandIdeas 
} from '../services/aiService';
import { 
  HiChevronLeft, 
  HiOutlineTrash,
  HiOutlinePencil,
  HiOutlineViewList,
  HiOutlineViewGridAdd,
  HiOutlineCheckCircle,
  HiChevronDown,
  HiChevronRight,
  HiFolder,
  HiTag,
  HiX,
  HiSparkles,
  HiLightBulb,
  HiDocumentText,
  HiRefresh
} from 'react-icons/hi';
import { 
  RiBold, 
  RiItalic, 
  RiUnderline, 
  RiStrikethrough,
  RiH1,
  RiH2,
  RiH3,
  RiListOrdered,
  RiListCheck2,
  RiPaintBrushLine,
  RiPushpinFill,
  RiPushpinLine,
  RiArchiveLine,
  RiArchiveFill
} from 'react-icons/ri';
import { HiOutlineLogout } from 'react-icons/hi';
import { formatDistanceToNow } from 'date-fns';
import FolderModal from '../components/FolderModal';
import avatarImage from '../assets/avatar.jfif';
import appLogo from '../assets/deepNote-app-logo.png';
import './NoteEditor.css';

const NoteEditor = () => {
  const { noteId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const [note, setNote] = useState(null);
  const [title, setTitle] = useState('');
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeBlock, setActiveBlock] = useState(null);
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [showMetadata, setShowMetadata] = useState(false);
  const [showRephrasingMenu, setShowRephrasingMenu] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiModalView, setAiModalView] = useState('main'); // 'main' or 'rephrase'
  const [previewContent, setPreviewContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [recentNotes, setRecentNotes] = useState([]);
  const [isPinned, setIsPinned] = useState(false);
  const [isArchived, setIsArchived] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage for saved theme preference
    const savedTheme = localStorage.getItem('darkMode');
    return savedTheme ? JSON.parse(savedTheme) : false;
  });
  const editorRef = useRef(null);

  // Apply dark mode class to body
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  useEffect(() => {
    loadFolders();
    loadRecentNotes();
    
    // Check if this is a newly created note from Dashboard
    const isNewNote = location.state?.isNewNote;
    const returnFolder = location.state?.returnFolder;
    
    if (noteId && noteId !== 'new' && !isNewNote) {
      // Existing note - load it
      loadNote();
    } else {
      // New note - skip loading, set defaults immediately
      setTitle('');
      setBlocks([{ id: Date.now(), type: 'text', content: '', data: {} }]);
      // Set the folder from the context where the note was created
      setSelectedFolder(returnFolder !== 'all' ? returnFolder : null);
      setLoading(false);
      
      // Don't clear the navigation state yet - we need it for the Back button
    }
  }, [noteId]);

  const loadRecentNotes = async () => {
    try {
      const { getUserNotes } = await import('../services/notesService');
      const userNotes = await getUserNotes(currentUser.uid);
      
      // Sort by updatedAt and get top 5, excluding current note
      const sorted = userNotes
        .filter(n => n.id !== noteId)
        .sort((a, b) => {
          const aDate = a.updatedAt?.toDate?.() || a.updatedAt || new Date(0);
          const bDate = b.updatedAt?.toDate?.() || b.updatedAt || new Date(0);
          return bDate - aDate;
        })
        .slice(0, 5);
      
      setRecentNotes(sorted);
    } catch (error) {
      console.error('Error loading recent notes:', error);
    }
  };

  const loadFolders = async () => {
    try {
      const userFolders = await getUserFolders(currentUser.uid);
      setFolders(userFolders);
    } catch (error) {
      console.error('Error loading folders:', error);
    }
  };

  const loadNote = async () => {
    try {
      setLoading(true);
      const noteData = await getNoteById(noteId);
      if (noteData) {
        setNote(noteData);
        setTitle(noteData.title || 'Untitled Note');
        setSelectedFolder(noteData.folderId || null);
        setTags(noteData.tags || []);
        setIsPinned(noteData.pinned || false);
        setIsArchived(noteData.archived || false);
        
        // Parse content as JSON blocks or create default
        try {
          const parsedBlocks = JSON.parse(noteData.content || '[]');
          setBlocks(parsedBlocks.length > 0 ? parsedBlocks : [{ id: Date.now(), type: 'text', content: '', data: {} }]);
        } catch {
          setBlocks([{ id: Date.now(), type: 'text', content: noteData.content || '', data: {} }]);
        }
      }
    } catch (error) {
      console.error('Error loading note:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveNote = async () => {
    try {
      const content = JSON.stringify(blocks);
      const updateData = { 
        title, 
        content, 
        folderId: selectedFolder,
        tags,
        pinned: isPinned,
        archived: isArchived
      };
      
      if (noteId && noteId !== 'new') {
        await updateNote(noteId, updateData);
      } else {
        const newNoteId = await createNote(currentUser.uid, title, content, selectedFolder, tags);
        navigate(`/editor/${newNoteId}`, { replace: true });
      }
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  // Auto-save with debounce
  useEffect(() => {
    if (!loading && (title || blocks.length > 0)) {
      const debounce = setTimeout(() => {
        saveNote();
      }, 1000);
      return () => clearTimeout(debounce);
    }
  }, [title, blocks, selectedFolder, tags, isPinned, isArchived]);

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

  const handleTagKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const addBlock = (type) => {
    const newBlock = {
      id: Date.now(),
      type,
      content: '',
      data: type === 'checklist' ? { items: [{ id: Date.now(), text: '', checked: false }] } 
           : type === 'collapsible' ? { title: 'Collapsible Section', collapsed: false, content: '' }
           : type === 'sketch' ? { drawing: null }
           : {}
    };
    setBlocks([...blocks, newBlock]);
  };

  const updateBlock = (blockId, updates) => {
    setBlocks(blocks.map(block => 
      block.id === blockId ? { ...block, ...updates } : block
    ));
  };

  const deleteBlock = (blockId) => {
    setBlocks(blocks.filter(block => block.id !== blockId));
  };

  const applyFormat = (command, value = null) => {
    document.execCommand(command, false, value);
  };

  // AI Assistant handlers
  const handleSummarizeNote = async () => {
    if (aiLoading) return;
    
    try {
      setAiLoading(true);
      setAiError(null);
      
      const content = originalContent || blocks.map(block => {
        if (block.type === 'text') {
          const div = document.createElement('div');
          div.innerHTML = block.content;
          return div.textContent || div.innerText || '';
        }
        return '';
      }).join('\n');

      if (!content.trim()) {
        alert('No content to summarize');
        setAiLoading(false);
        return;
      }

      const summary = await summarizeNote(content);
      setPreviewContent(summary);
      
    } catch (error) {
      console.error('Error summarizing:', error);
      setAiError(error.message);
      alert('Failed to summarize note: ' + error.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleGenerateTitle = async () => {
    if (aiLoading) return;
    
    try {
      setAiLoading(true);
      setAiError(null);
      
      const content = originalContent || blocks.map(block => {
        if (block.type === 'text') {
          const div = document.createElement('div');
          div.innerHTML = block.content;
          return div.textContent || div.innerText || '';
        }
        return '';
      }).join('\n');

      if (!content.trim()) {
        alert('No content to generate title from');
        setAiLoading(false);
        return;
      }

      const newTitle = await generateTitle(content);
      setTitle(newTitle);
      setShowAiModal(false);
      
    } catch (error) {
      console.error('Error generating title:', error);
      setAiError(error.message);
      alert('Failed to generate title: ' + error.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleRewriteForClarity = async () => {
    if (aiLoading) return;
    
    try {
      setAiLoading(true);
      setAiError(null);
      
      const content = originalContent || blocks.map(block => {
        if (block.type === 'text') {
          const div = document.createElement('div');
          div.innerHTML = block.content;
          return div.textContent || div.innerText || '';
        }
        return '';
      }).join('\n');

      if (!content.trim()) {
        alert('No content to rewrite');
        setAiLoading(false);
        return;
      }

      const rewritten = await rewriteForClarity(content);
      setPreviewContent(rewritten);
      
    } catch (error) {
      console.error('Error rewriting:', error);
      setAiError(error.message);
      alert('Failed to rewrite content: ' + error.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSmartRephrase = async (style) => {
    if (aiLoading) return;
    
    try {
      setAiLoading(true);
      setAiError(null);
      
      const content = originalContent || blocks.map(block => {
        if (block.type === 'text') {
          const div = document.createElement('div');
          div.innerHTML = block.content;
          return div.textContent || div.innerText || '';
        }
        return '';
      }).join('\n');

      if (!content.trim()) {
        alert('No content to rephrase');
        setAiLoading(false);
        return;
      }

      const rephrased = await rephraseContent(content, style);
      setPreviewContent(rephrased);
      setAiModalView('main');
      
    } catch (error) {
      console.error('Error rephrasing:', error);
      setAiError(error.message);
      alert('Failed to rephrase content: ' + error.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyChanges = () => {
    if (!previewContent) return;
    
    // Convert plain text to HTML (preserve line breaks)
    const htmlContent = previewContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => `<p>${line}</p>`)
      .join('');
    
    // Update the first text block or create a new one
    const firstTextBlock = blocks.find(b => b.type === 'text');
    if (firstTextBlock) {
      updateBlock(firstTextBlock.id, { content: htmlContent });
    } else {
      const newBlock = {
        id: Date.now(),
        type: 'text',
        content: htmlContent,
        data: {}
      };
      setBlocks([newBlock, ...blocks]);
    }
    
    setShowAiModal(false);
    setPreviewContent('');
    setOriginalContent('');
  };

  const handleOpenAiModal = () => {
    // Get all text content when opening modal
    const content = blocks.map(block => {
      if (block.type === 'text') {
        const div = document.createElement('div');
        div.innerHTML = block.content;
        return div.textContent || div.innerText || '';
      }
      return '';
    }).join('\n\n');
    
    setOriginalContent(content);
    setPreviewContent(content);
    setShowAiModal(true);
    setAiModalView('main');
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const getContentPreview = (content) => {
    if (!content) return 'No content';
    
    try {
      const blocks = JSON.parse(content);
      if (Array.isArray(blocks)) {
        for (const block of blocks) {
          if (block.type === 'text' && block.content) {
            const div = document.createElement('div');
            div.innerHTML = block.content;
            const text = div.textContent || div.innerText || '';
            if (text.trim()) return text.trim().substring(0, 80);
          }
        }
      }
    } catch {
      return content.substring(0, 80);
    }
    
    return 'No content';
  };

  const navigateToNote = (note) => {
    const returnView = location.state?.returnView || 'home';
    const returnFolder = location.state?.returnFolder || 'all';
    navigate(`/editor/${note.id}`, {
      state: {
        returnView,
        returnFolder
      }
    });
  };

  const handleTogglePin = () => {
    setIsPinned(!isPinned);
  };

  const handleToggleArchive = () => {
    setIsArchived(!isArchived);
    // Optionally navigate back to dashboard after archiving
    if (!isArchived) {
      setTimeout(() => {
        const returnView = location.state?.returnView || 'home';
        const returnFolder = location.state?.returnFolder || 'all';
        navigate('/dashboard', { state: { view: returnView, folder: returnFolder } });
      }, 1500);
    }
  };

  if (loading) {
    return (
      <div className="editor-container">
        <div className="loading-container">Loading...</div>
      </div>
    );
  }

  return (
    <div className="editor-layout" dir="ltr">
      {/* Mobile Header */}
      <div className="mobile-editor-header">
        <button 
          className="mobile-back-btn" 
          onClick={() => {
            const returnView = location.state?.returnView || 'home';
            const returnFolder = location.state?.returnFolder || 'all';
            navigate('/dashboard', { state: { view: returnView, folder: returnFolder } });
          }}
        >
          <HiChevronLeft />
        </button>
        
        <div className="mobile-header-actions">
          <button 
            className={`mobile-action-icon ${isPinned ? 'active' : ''}`}
            onClick={handleTogglePin}
            title={isPinned ? 'Unpin note' : 'Pin note'}
          >
            {isPinned ? <RiPushpinFill /> : <RiPushpinLine />}
          </button>
          <button 
            className={`mobile-action-icon ${isArchived ? 'active' : ''}`}
            onClick={handleToggleArchive}
            title={isArchived ? 'Unarchive note' : 'Archive note'}
          >
            {isArchived ? <RiArchiveFill /> : <RiArchiveLine />}
          </button>
          <button 
            className="mobile-action-icon ai-icon"
            onClick={handleOpenAiModal}
            title="AI Assistant"
          >
            <HiSparkles />
          </button>
        </div>
      </div>

      {/* Left Sidebar - Navigation */}
      <aside className="editor-sidebar-left">
        <div className="sidebar-header">
          <div className="app-brand">
            <img src={appLogo} alt="DeepNote Logo" className="brand-icon-img" />
            <span className="brand-name">DeepNote</span>
          </div>
        </div>

        <button className="sidebar-back-btn" onClick={() => {
          const returnView = location.state?.returnView || 'home';
          const returnFolder = location.state?.returnFolder || 'all';
          navigate('/dashboard', { state: { view: returnView, folder: returnFolder } });
        }}>
          <HiChevronLeft />
          <span>Back to Dashboard</span>
        </button>

        <div className="sidebar-metadata">
          <div className="metadata-section">
            <label className="metadata-label">
              <HiFolder />
              Folder
            </label>
            <select
              className="metadata-select"
              value={selectedFolder || ''}
              onChange={(e) => setSelectedFolder(e.target.value || null)}
            >
              <option value="">None (Uncategorized)</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </div>

          {/* Pin and Archive Actions */}
          <div className="note-actions">
            <button 
              className={`action-btn ${isPinned ? 'active' : ''}`}
              onClick={handleTogglePin}
              title={isPinned ? 'Unpin note' : 'Pin note'}
            >
              {isPinned ? <RiPushpinFill /> : <RiPushpinLine />}
              <span>{isPinned ? 'Pinned' : 'Pin'}</span>
            </button>
            <button 
              className={`action-btn ${isArchived ? 'active' : ''}`}
              onClick={handleToggleArchive}
              title={isArchived ? 'Unarchive note' : 'Archive note'}
            >
              {isArchived ? <RiArchiveFill /> : <RiArchiveLine />}
              <span>{isArchived ? 'Archived' : 'Archive'}</span>
            </button>
          </div>

          <div className="save-status">
            <span className="save-indicator">● Saved</span>
          </div>
        </div>
      </aside>

      {/* Main Content - Note Editor */}
      <main className="editor-main">
        <div className="editor-content-area">
          {/* Title */}
          <input
            type="text"
            className="note-title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled Note"
          />

          {/* Body Content */}
          <div className="blocks-container">
            {blocks.map((block, index) => (
              <Block
                key={block.id}
                block={block}
                onUpdate={(updates) => updateBlock(block.id, updates)}
                onDelete={() => deleteBlock(block.id)}
                isActive={activeBlock === block.id}
                onFocus={() => setActiveBlock(block.id)}
              />
            ))}

            <button className="add-block-btn" onClick={() => addBlock('text')}>
              + Add content
            </button>
          </div>

          {/* Tags Section */}
          <div className="tags-section">
            <label className="tags-label">
              <HiTag />
              Tags
            </label>
            <div className="tag-input-wrapper">
              <input
                type="text"
                className="tag-input-field"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleTagKeyPress}
                placeholder="Add a tag..."
              />
              <button 
                className="tag-add-btn" 
                onClick={handleAddTag}
                disabled={!tagInput.trim()}
              >
                Add
              </button>
            </div>

            {tags.length > 0 && (
              <div className="tags-display">
                {tags.map((tag, index) => (
                  <span key={index} className="tag-badge-editor">
                    {tag}
                    <button 
                      className="tag-remove-btn" 
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

        {/* Formatting Toolbar - Bottom Sticky */}
        <div className="formatting-toolbar">
          <div className="format-group">
            <button 
              className="format-btn" 
              onClick={() => applyFormat('bold')}
              title="Bold (Ctrl+B)"
            >
              <RiBold />
            </button>
            <button 
              className="format-btn" 
              onClick={() => applyFormat('italic')}
              title="Italic (Ctrl+I)"
            >
              <RiItalic />
            </button>
            <button 
              className="format-btn" 
              onClick={() => applyFormat('underline')}
              title="Underline (Ctrl+U)"
            >
              <RiUnderline />
            </button>
            <button 
              className="format-btn" 
              onClick={() => applyFormat('strikeThrough')}
              title="Strikethrough"
            >
              <RiStrikethrough />
            </button>
          </div>

          <div className="format-divider"></div>

          <div className="format-group">
            <button 
              className="format-btn" 
              onClick={() => applyFormat('formatBlock', 'h1')}
              title="Heading 1"
            >
              <RiH1 />
            </button>
            <button 
              className="format-btn" 
              onClick={() => applyFormat('formatBlock', 'h2')}
              title="Heading 2"
            >
              <RiH2 />
            </button>
            <button 
              className="format-btn" 
              onClick={() => applyFormat('formatBlock', 'h3')}
              title="Heading 3"
            >
              <RiH3 />
            </button>
          </div>

          <div className="format-divider"></div>

          <div className="format-group">
            <button 
              className="format-btn" 
              onClick={() => applyFormat('insertUnorderedList')}
              title="Bullet List"
            >
              <HiOutlineViewList />
            </button>
            <button 
              className="format-btn" 
              onClick={() => applyFormat('insertOrderedList')}
              title="Numbered List"
            >
              <RiListOrdered />
            </button>
            <button 
              className="format-btn" 
              onClick={() => addBlock('checklist')}
              title="Checklist"
            >
              <RiListCheck2 />
            </button>
          </div>

          <div className="format-divider"></div>

          <div className="format-group">
            <button 
              className="format-btn" 
              onClick={() => addBlock('collapsible')}
              title="Collapsible Section"
            >
              <HiOutlineViewGridAdd />
            </button>
            <button 
              className="format-btn" 
              onClick={() => addBlock('sketch')}
              title="Sketch"
            >
              <RiPaintBrushLine />
            </button>
          </div>

          <div className="format-divider"></div>

          <div className="format-group">
            <button 
              className="format-btn ai-btn" 
              onClick={handleOpenAiModal}
              title="AI Assistant"
            >
              <HiSparkles />
            </button>
          </div>
        </div>
      </main>

      {/* Right Sidebar - Other Notes */}
      <aside className="editor-sidebar-right">
        <h3 className="sidebar-right-title">Recent Notes</h3>
        {recentNotes.length > 0 ? (
          <div className="recent-notes-list">
            {recentNotes.map((note) => (
              <div
                key={note.id}
                className="recent-note-card"
                onClick={() => navigateToNote(note)}
              >
                <h4 className="recent-note-title">{note.title || 'Untitled'}</h4>
                <p className="recent-note-preview">{getContentPreview(note.content)}</p>
                <span className="recent-note-time">{formatTime(note.updatedAt)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="sidebar-right-placeholder">No recent notes</p>
        )}
      </aside>

      {/* AI Assistant Modal */}
      {showAiModal && (
        <div className="ai-modal-overlay" onClick={() => setShowAiModal(false)}>
          <div className="ai-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ai-modal-header">
              <h2 className="ai-modal-title">
                <HiSparkles />
                AI Assistant
              </h2>
              <button className="ai-modal-close" onClick={() => setShowAiModal(false)}>
                <HiX />
              </button>
            </div>

            <div className="ai-modal-body">
              {/* Content Preview */}
              <div className="ai-content-preview">
                <div className="preview-label">Content Preview</div>
                <div className="preview-text">
                  {aiLoading ? (
                    <div className="preview-loading">
                      <div className="ai-loading-spinner"></div>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    previewContent || 'No content available'
                  )}
                </div>
              </div>

              {/* Error Display */}
              {aiError && (
                <div className="ai-modal-error">
                  <span>{aiError}</span>
                  <button onClick={() => setAiError(null)}>
                    <HiX />
                  </button>
                </div>
              )}

              {/* AI Actions */}
              {aiModalView === 'main' ? (
                <div className="ai-actions">
                  <button 
                    className="ai-action-button"
                    onClick={handleSummarizeNote}
                    disabled={aiLoading}
                  >
                    <HiSparkles />
                    Summarize
                  </button>

                  <button 
                    className="ai-action-button"
                    onClick={handleRewriteForClarity}
                    disabled={aiLoading}
                  >
                    <HiRefresh />
                    Rewrite for Clarity
                  </button>

                  <button 
                    className="ai-action-button"
                    onClick={handleGenerateTitle}
                    disabled={aiLoading}
                  >
                    <HiLightBulb />
                    Generate Title
                  </button>

                  <button 
                    className="ai-action-button"
                    onClick={() => handleSmartRephrase('fix-grammar')}
                    disabled={aiLoading}
                  >
                    <HiOutlineCheckCircle />
                    Fix Grammar
                  </button>

                  <button 
                    className="ai-action-button"
                    onClick={() => setAiModalView('rephrase')}
                    disabled={aiLoading}
                  >
                    <HiOutlinePencil />
                    Smart Rephrase
                    <HiChevronRight />
                  </button>
                </div>
              ) : (
                <div className="ai-actions">
                  <button 
                    className="ai-back-button"
                    onClick={() => setAiModalView('main')}
                  >
                    <HiChevronLeft />
                    Back
                  </button>

                  <div className="ai-rephrase-title">Choose a Tone</div>

                  <button 
                    className="ai-action-button"
                    onClick={() => handleSmartRephrase('professional')}
                    disabled={aiLoading}
                  >
                    Professional
                  </button>

                  <button 
                    className="ai-action-button"
                    onClick={() => handleSmartRephrase('formal')}
                    disabled={aiLoading}
                  >
                    Formal
                  </button>

                  <button 
                    className="ai-action-button"
                    onClick={() => handleSmartRephrase('shorter')}
                    disabled={aiLoading}
                  >
                    Shorter
                  </button>

                  <button 
                    className="ai-action-button"
                    onClick={() => handleSmartRephrase('friendly')}
                    disabled={aiLoading}
                  >
                    Friendly
                  </button>

                  <button 
                    className="ai-action-button"
                    onClick={() => handleSmartRephrase('academic')}
                    disabled={aiLoading}
                  >
                    Academic
                  </button>
                </div>
              )}

              {/* Apply Button */}
              {previewContent && previewContent !== originalContent && !aiLoading && (
                <button 
                  className="ai-apply-button"
                  onClick={handleApplyChanges}
                >
                  Apply Changes
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Block Component
const Block = ({ block, onUpdate, onDelete, isActive, onFocus }) => {
  const contentRef = useRef(null);

  // Update content when block.content changes
  useEffect(() => {
    if (contentRef.current && block.type === 'text') {
      // Only update if the content is different from what's in the DOM
      const currentHtml = contentRef.current.innerHTML;
      const newHtml = block.content || '';
      
      if (currentHtml !== newHtml) {
        // Save cursor position
        const selection = window.getSelection();
        const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
        const cursorPosition = range ? range.startOffset : 0;
        
        // Update content
        contentRef.current.innerHTML = newHtml;
        
        // Restore cursor position if we were focused
        if (document.activeElement === contentRef.current && range) {
          try {
            const newRange = document.createRange();
            const textNode = contentRef.current.firstChild;
            if (textNode) {
              const safePosition = Math.min(cursorPosition, textNode.length);
              newRange.setStart(textNode, safePosition);
              newRange.collapse(true);
              selection.removeAllRanges();
              selection.addRange(newRange);
            }
          } catch (e) {
            // Ignore cursor restoration errors
          }
        }
      }
    }
  }, [block.content, block.type]);

  const handleContentChange = () => {
    if (contentRef.current) {
      onUpdate({ content: contentRef.current.innerHTML });
    }
  };

  if (block.type === 'text') {
    return (
      <div className={`block block-text ${isActive ? 'active' : ''}`}>
        <div
          ref={contentRef}
          className="editable-content"
          contentEditable
          suppressContentEditableWarning
          onInput={handleContentChange}
          onFocus={onFocus}
          placeholder="Start typing..."
          dir="ltr"
        />
        <button className="delete-block-btn" onClick={onDelete}>
          <HiOutlineTrash />
        </button>
      </div>
    );
  }

  if (block.type === 'checklist') {
    return <ChecklistBlock block={block} onUpdate={onUpdate} onDelete={onDelete} />;
  }

  if (block.type === 'collapsible') {
    return <CollapsibleBlock block={block} onUpdate={onUpdate} onDelete={onDelete} />;
  }

  if (block.type === 'sketch') {
    return <SketchBlock block={block} onUpdate={onUpdate} onDelete={onDelete} />;
  }

  return null;
};

// Checklist Block Component
const ChecklistBlock = ({ block, onUpdate, onDelete }) => {
  const addItem = () => {
    const newItems = [...block.data.items, { id: Date.now(), text: '', checked: false }];
    onUpdate({ data: { ...block.data, items: newItems } });
  };

  const updateItem = (itemId, updates) => {
    const newItems = block.data.items.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    );
    onUpdate({ data: { ...block.data, items: newItems } });
  };

  const deleteItem = (itemId) => {
    const newItems = block.data.items.filter(item => item.id !== itemId);
    onUpdate({ data: { ...block.data, items: newItems } });
  };

  return (
    <div className="block block-checklist">
      <div className="checklist-items">
        {block.data.items.map((item) => (
          <div key={item.id} className="checklist-item">
            <input
              type="checkbox"
              checked={item.checked}
              onChange={(e) => updateItem(item.id, { checked: e.target.checked })}
              className="checkbox-input"
            />
            <input
              type="text"
              value={item.text}
              onChange={(e) => updateItem(item.id, { text: e.target.value })}
              className="checklist-text"
              placeholder="Task"
            />
            <button onClick={() => deleteItem(item.id)} className="delete-item-btn">
              <HiOutlineTrash />
            </button>
          </div>
        ))}
      </div>
      <button className="add-item-btn" onClick={addItem}>
        + Add item
      </button>
      <button className="delete-block-btn" onClick={onDelete}>
        <HiOutlineTrash />
      </button>
    </div>
  );
};

// Collapsible Block Component
const CollapsibleBlock = ({ block, onUpdate, onDelete }) => {
  const toggleCollapse = () => {
    onUpdate({ data: { ...block.data, collapsed: !block.data.collapsed } });
  };

  return (
    <div className="block block-collapsible">
      <div className="collapsible-header" onClick={toggleCollapse}>
        <button className="collapse-icon">
          {block.data.collapsed ? <HiChevronRight /> : <HiChevronDown />}
        </button>
        <input
          type="text"
          value={block.data.title}
          onChange={(e) => onUpdate({ data: { ...block.data, title: e.target.value } })}
          onClick={(e) => e.stopPropagation()}
          className="collapsible-title"
          placeholder="Section title"
        />
        <button className="delete-block-btn" onClick={onDelete}>
          <HiOutlineTrash />
        </button>
      </div>
      {!block.data.collapsed && (
        <div className="collapsible-content">
          <textarea
            value={block.data.content}
            onChange={(e) => onUpdate({ data: { ...block.data, content: e.target.value } })}
            className="collapsible-textarea"
            placeholder="Content..."
          />
        </div>
      )}
    </div>
  );
};

// Sketch Block Component
const SketchBlock = ({ block, onUpdate, onDelete }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(2);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && block.data.drawing) {
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = block.data.drawing;
    }
  }, []);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      const canvas = canvasRef.current;
      onUpdate({ data: { drawing: canvas.toDataURL() } });
      setIsDrawing(false);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onUpdate({ data: { drawing: null } });
  };

  return (
    <div className="block block-sketch">
      <div className="sketch-controls">
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="color-picker"
        />
        <input
          type="range"
          min="1"
          max="10"
          value={lineWidth}
          onChange={(e) => setLineWidth(e.target.value)}
          className="line-width-slider"
        />
        <button onClick={clearCanvas} className="clear-canvas-btn">Clear</button>
        <button className="delete-block-btn" onClick={onDelete}>
          <HiOutlineTrash />
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={800}
        height={400}
        className="sketch-canvas"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
    </div>
  );
};

export default NoteEditor;
