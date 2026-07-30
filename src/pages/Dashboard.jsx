import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  getUserNotes, 
  createNote, 
  deleteNote, 
  togglePinNote,
  updateNote,
  getUserFolders,
  createFolder,
  updateFolder,
  deleteFolder
} from '../services/notesService';
import { semanticSearchNotes } from '../services/aiService';
import { HiSearch, HiPlus, HiHome, HiFolder, HiCog, HiOutlineTrash, HiPencil, HiViewList, HiViewGrid, HiUser, HiSparkles, HiX, HiDotsVertical, HiMenu } from 'react-icons/hi';
import { RiStickyNoteFill, RiPushpinFill, RiArchiveLine, RiPushpinLine, RiArchiveFill } from 'react-icons/ri';
import { HiOutlineLogout } from 'react-icons/hi';
import { formatDistanceToNow } from 'date-fns';
import FolderModal from '../components/FolderModal';
import avatarImage from '../assets/avatar.jfif';
import appLogo from '../assets/deepNote-app-logo.png';
import './Dashboard.css';

const Dashboard = () => {
  const [notes, setNotes] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentView, setCurrentView] = useState('home'); // 'home', 'library', 'settings'
  const [selectedFolder, setSelectedFolder] = useState('all'); // 'all' or folderId
  const [sortBy, setSortBy] = useState('updated'); // 'updated', 'created', 'title'
  const [viewMode, setViewMode] = useState(() => {
    // Check localStorage for saved view mode preference
    const savedViewMode = localStorage.getItem('viewMode');
    return savedViewMode || 'list'; // 'list' or 'grid'
  });
  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage for saved theme preference
    const savedTheme = localStorage.getItem('darkMode');
    return savedTheme ? JSON.parse(savedTheme) : false;
  });
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [folderModalMode, setFolderModalMode] = useState('create'); // 'create' or 'edit'
  const [editingFolder, setEditingFolder] = useState(null);
  const [semanticSearchOpen, setSemanticSearchOpen] = useState(false);
  const [semanticQuery, setSemanticQuery] = useState('');
  const [semanticSearchLoading, setSemanticSearchLoading] = useState(false);
  const [semanticSearchResults, setSemanticSearchResults] = useState(null);
  const [isCreatingNote, setIsCreatingNote] = useState(false); // Prevent multiple note creations
  const [activeNoteMenu, setActiveNoteMenu] = useState(null); // Track which note's menu is open
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false); // Mobile sidebar state
  const [fabMenuOpen, setFabMenuOpen] = useState(false); // FAB menu state
  const [headerVisible, setHeaderVisible] = useState(true); // Navbar visibility
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Restore view and folder from navigation state if coming back from editor
  useEffect(() => {
    if (location.state?.view) {
      setCurrentView(location.state.view);
    }
    if (location.state?.folder) {
      setSelectedFolder(location.state.folder);
    }
    // Clear the state after using it
    if (location.state) {
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Close note menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeNoteMenu && !event.target.closest('.note-menu-container')) {
        setActiveNoteMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeNoteMenu]);

  useEffect(() => {
    loadData();
  }, [currentUser]);

  // Apply dark mode class to body
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    // Save preference to localStorage
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Save view mode preference to localStorage
  useEffect(() => {
    localStorage.setItem('viewMode', viewMode);
  }, [viewMode]);

  // Callback ref for main-content with auto-hide navbar functionality
  const mainContentRef = useCallback((node) => {
    if (!node) return;

    console.log('Callback ref attached to:', node);
    
    let prevScrollY = 0;

    const handleScroll = () => {
      // Only apply on mobile/tablet
      if (window.innerWidth > 1024) return;

      const currentScrollY = node.scrollTop;
      console.log('Scroll detected:', currentScrollY, 'Previous:', prevScrollY);
      
      // Show navbar when scrolling up or at the top
      if (currentScrollY < prevScrollY || currentScrollY < 10) {
        console.log('Showing navbar');
        setHeaderVisible(true);
      } 
      // Hide navbar when scrolling down
      else if (currentScrollY > prevScrollY && currentScrollY > 60) {
        console.log('Hiding navbar');
        setHeaderVisible(false);
      }
      
      prevScrollY = currentScrollY;
    };

    node.addEventListener('scroll', handleScroll, { passive: true });

    // Cleanup function won't work with callback ref, but it's okay since the element persists
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [userNotes, userFolders] = await Promise.all([
        getUserNotes(currentUser.uid),
        getUserFolders(currentUser.uid)
      ]);
      setNotes(userNotes);
      setFolders(userFolders);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotes = async () => {
    try {
      const userNotes = await getUserNotes(currentUser.uid);
      setNotes(userNotes);
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const selectNote = (note) => {
    // Pass current view context so we can return to the same place
    navigate(`/editor/${note.id}`, {
      state: {
        returnView: currentView,
        returnFolder: selectedFolder
      }
    });
  };

  const handleBackToList = () => {
    navigate('/dashboard');
  };

  const handleCreateNote = async () => {
    // Prevent multiple rapid clicks
    if (isCreatingNote) return;
    
    try {
      setIsCreatingNote(true);
      
      // Determine which folder to create the note in
      // If viewing a specific folder (not 'all'), create note in that folder
      // If viewing "All Notes" (selectedFolder === 'all'), create note without folder (null)
      const targetFolderId = (selectedFolder !== 'all') ? selectedFolder : null;
      
      const newNoteId = await createNote(currentUser.uid, '', '', targetFolderId, []);
      // Pass state to preserve the current view and folder selection when returning
      navigate(`/editor/${newNoteId}`, { 
        state: { 
          isNewNote: true,
          returnView: currentView,
          returnFolder: selectedFolder
        } 
      });
    } catch (error) {
      console.error('Error creating note:', error);
      setIsCreatingNote(false); // Reset on error
    }
    // Note: We don't reset isCreatingNote on success because we're navigating away
  };

  const handleCreateSketch = async () => {
    // Prevent multiple rapid clicks
    if (isCreatingNote) return;
    
    try {
      setIsCreatingNote(true);
      
      // Determine which folder to create the note in
      const targetFolderId = (selectedFolder !== 'all') ? selectedFolder : null;
      
      // Create note with a sketch block
      const sketchBlock = JSON.stringify([
        { id: Date.now(), type: 'sketch', content: '', data: { drawing: null } }
      ]);
      
      const newNoteId = await createNote(currentUser.uid, 'Untitled Sketch', sketchBlock, targetFolderId, []);
      // Pass state to preserve the current view and folder selection when returning
      navigate(`/editor/${newNoteId}`, { 
        state: { 
          isNewNote: true,
          returnView: currentView,
          returnFolder: selectedFolder
        } 
      });
    } catch (error) {
      console.error('Error creating sketch:', error);
      setIsCreatingNote(false); // Reset on error
    }
    // Note: We don't reset isCreatingNote on success because we're navigating away
  };

  const handleDeleteNote = async (noteId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await deleteNote(noteId);
        await loadData();
      } catch (error) {
        console.error('Error deleting note:', error);
      }
    }
  };

  const handleTogglePin = async (noteId, currentPinned, e) => {
    e.stopPropagation();
    try {
      await togglePinNote(noteId, !currentPinned);
      await loadData();
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      try {
        await logout();
        navigate('/login');
      } catch (error) {
        console.error('Error logging out:', error);
      }
    }
  };

  const handleCreateFolder = () => {
    setFolderModalMode('create');
    setEditingFolder(null);
    setFolderModalOpen(true);
  };

  const handleEditFolder = (folder, e) => {
    e.stopPropagation();
    setFolderModalMode('edit');
    setEditingFolder(folder);
    setFolderModalOpen(true);
  };

  const handleDeleteFolder = async (folderId, e) => {
    e.stopPropagation();
    const folderNotes = notes.filter(n => n.folderId === folderId);
    const message = folderNotes.length > 0 
      ? `This folder contains ${folderNotes.length} note(s). These notes will be moved to "Uncategorized". Delete folder?`
      : 'Delete this folder?';
    
    if (window.confirm(message)) {
      try {
        await deleteFolder(folderId, currentUser.uid);
        await loadData();
        if (selectedFolder === folderId) {
          setSelectedFolder('all');
        }
      } catch (error) {
        console.error('Error deleting folder:', error);
      }
    }
  };

  const handleFolderSubmit = async (folderName) => {
    try {
      if (folderModalMode === 'create') {
        await createFolder(currentUser.uid, folderName);
      } else if (folderModalMode === 'edit' && editingFolder) {
        await updateFolder(editingFolder.id, { name: folderName });
      }
      await loadData();
      setFolderModalOpen(false);
      setEditingFolder(null);
    } catch (error) {
      console.error('Error with folder operation:', error);
    }
  };

  const handleSemanticSearch = async () => {
    if (!semanticQuery.trim()) return;
    
    try {
      setSemanticSearchLoading(true);
      
      // Perform AI-powered semantic search
      const results = await semanticSearchNotes(semanticQuery, notes);
      
      // Store results and close modal
      setSemanticSearchResults(results);
      setSemanticSearchOpen(false);
      
      // Switch to appropriate view to show results
      if (currentView !== 'allnotes') {
        setCurrentView('allnotes');
      }
      
    } catch (error) {
      console.error('Semantic search error:', error);
      alert('Failed to perform semantic search. Please try again.');
    } finally {
      setSemanticSearchLoading(false);
    }
  };

  // Clear semantic search results when user changes filters
  useEffect(() => {
    if (searchQuery || currentView !== 'allnotes' || selectedFolder !== 'all') {
      setSemanticSearchResults(null);
    }
  }, [searchQuery, currentView, selectedFolder]);

  const toggleNoteMenu = (noteId, e) => {
    e.stopPropagation();
    setActiveNoteMenu(activeNoteMenu === noteId ? null : noteId);
  };

  const handleQuickPin = async (noteId, currentPinned, e) => {
    e.stopPropagation();
    try {
      await togglePinNote(noteId, !currentPinned);
      await loadData();
      setActiveNoteMenu(null);
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  const handleQuickArchive = async (noteId, currentArchived, e) => {
    e.stopPropagation();
    try {
      await updateNote(noteId, { archived: !currentArchived });
      await loadData();
      setActiveNoteMenu(null);
    } catch (error) {
      console.error('Error archiving note:', error);
    }
  };

  const handleQuickDelete = async (noteId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await deleteNote(noteId);
        await loadData();
        setActiveNoteMenu(null);
      } catch (error) {
        console.error('Error deleting note:', error);
      }
    }
  };

  // Filter notes by search query (searches across ALL folders and tags)
  const filteredNotes = notes.filter((note) => {
    // Filter out archived notes unless we're in archive view
    if (currentView !== 'archive' && note.archived) return false;
    // Only show archived notes in archive view
    if (currentView === 'archive' && !note.archived) return false;
    
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const titleMatch = note.title?.toLowerCase().includes(query);
    const contentMatch = note.content?.toLowerCase().includes(query);
    const tagMatch = note.tags?.some(tag => tag.toLowerCase().includes(query));
    return titleMatch || contentMatch || tagMatch;
  });

  // Filter by selected folder
  // Rules:
  // 1. If semantic search results exist: show those results
  // 2. If in 'archive' view: show all archived notes (no folder filtering)
  // 3. If searching: show all matching notes from current context (respect archive filter)
  // 4. If in 'allnotes' view with 'all' selected: show all notes (no folder filter)
  // 5. If in 'allnotes' view with specific folder: show only notes from that folder
  // 6. If in 'home' view: no folder filtering (show all for home sections)
  const folderFilteredNotes = (() => {
    // Semantic search results take precedence
    if (semanticSearchResults) {
      return semanticSearchResults;
    }
    
    // Archive view: show all archived notes (already filtered above)
    if (currentView === 'archive') {
      return filteredNotes;
    }
    
    // Home view: show all notes (for pinned/recent sections)
    if (currentView === 'home') {
      return filteredNotes;
    }
    
    // All Notes view with search active: show all matching notes
    if (currentView === 'allnotes' && searchQuery.trim()) {
      return filteredNotes;
    }
    
    // All Notes view with 'all' folder selected: show all notes
    if (currentView === 'allnotes' && selectedFolder === 'all') {
      return filteredNotes;
    }
    
    // All Notes view with specific folder selected: filter by folder
    if (currentView === 'allnotes' && selectedFolder !== 'all') {
      return filteredNotes.filter((note) => note.folderId === selectedFolder);
    }
    
    // Default: show all filtered notes
    return filteredNotes;
  })();

  const sortedNotes = [...folderFilteredNotes].sort((a, b) => {
    // Pinned notes always at top
    if (a.pinned !== b.pinned) return b.pinned ? 1 : -1;
    
    // Then sort by selected criteria
    if (sortBy === 'updated') {
      const aDate = a.updatedAt?.toDate?.() || a.updatedAt || new Date(0);
      const bDate = b.updatedAt?.toDate?.() || b.updatedAt || new Date(0);
      return bDate - aDate;
    } else if (sortBy === 'created') {
      const aDate = a.createdAt?.toDate?.() || a.createdAt || new Date(0);
      const bDate = b.createdAt?.toDate?.() || b.createdAt || new Date(0);
      return bDate - aDate;
    } else if (sortBy === 'title') {
      const aTitle = (a.title || 'Untitled').toLowerCase();
      const bTitle = (b.title || 'Untitled').toLowerCase();
      return aTitle.localeCompare(bTitle);
    }
    return 0;
  });

  const getPinnedNotes = () => {
    return sortedNotes.filter(note => note.pinned).slice(0, 6);
  };

  const getRecentlyCreatedNotes = () => {
    const sorted = [...notes].sort((a, b) => {
      const aDate = a.createdAt?.toDate?.() || a.createdAt || new Date(0);
      const bDate = b.createdAt?.toDate?.() || b.createdAt || new Date(0);
      return bDate - aDate;
    });
    return sorted.slice(0, 6);
  };

  const getRecentFolders = () => {
    // Get folders that have notes
    const foldersWithNotes = folders.filter(folder => {
      return notes.some(note => note.folderId === folder.id);
    });
    return foldersWithNotes.slice(0, 4);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getUserDisplayName = () => {
    if (currentUser.displayName) return currentUser.displayName;
    if (currentUser.email) return currentUser.email.split('@')[0];
    return 'User';
  };

  const getContentPreview = (content) => {
    if (!content) return 'No content';
    
    try {
      // Try to parse as JSON blocks
      const blocks = JSON.parse(content);
      if (Array.isArray(blocks)) {
        // Extract text from blocks
        for (const block of blocks) {
          if (block.type === 'text' && block.content) {
            // Strip HTML tags and get plain text
            const div = document.createElement('div');
            div.innerHTML = block.content;
            const text = div.textContent || div.innerText || '';
            if (text.trim()) return text.trim();
          } else if (block.type === 'checklist' && block.data?.items?.length > 0) {
            const firstItem = block.data.items[0];
            return firstItem.text || 'Checklist';
          } else if (block.type === 'collapsible' && block.data?.content) {
            return block.data.content;
          }
        }
      }
    } catch {
      // If not JSON, treat as plain text
      return content.substring(0, 150);
    }
    
    return 'No content';
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="loading-container">
          <img src={appLogo} alt="DeepNote Logo" className="loading-logo" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const pinnedNotes = getPinnedNotes();
  const recentlyCreatedNotes = getRecentlyCreatedNotes();
  const recentFolders = getRecentFolders();

  return (
    <div className="app-container">
      <FolderModal 
        isOpen={folderModalOpen}
        onClose={() => {
          setFolderModalOpen(false);
          setEditingFolder(null);
        }}
        onSubmit={handleFolderSubmit}
        folder={editingFolder}
        mode={folderModalMode}
      />

      {/* Mobile Sidebar Overlay */}
      <div 
        className={`mobile-sidebar-overlay ${mobileSidebarOpen ? 'active' : ''}`}
        onClick={() => setMobileSidebarOpen(false)}
      />

      {/* Semantic Search Modal */}
      {semanticSearchOpen && (
        <div className="semantic-search-overlay" onClick={() => setSemanticSearchOpen(false)}>
          <div className="semantic-search-modal" onClick={(e) => e.stopPropagation()}>
            <div className="semantic-search-header">
              <h2>
                <HiSparkles />
                AI Semantic Search
              </h2>
              <button 
                className="semantic-close-btn" 
                onClick={() => setSemanticSearchOpen(false)}
              >
                <HiX />
              </button>
            </div>
            <div className="semantic-search-body">
              <p className="semantic-search-description">
                Search your notes using natural language. Ask questions or describe what you're looking for.
              </p>
              <div className="semantic-search-input-wrapper">
                <HiSearch className="semantic-search-icon" />
                <input
                  type="text"
                  className="semantic-search-input"
                  placeholder='Try "notes about project ideas" or "what did I write about travel?"'
                  value={semanticQuery}
                  onChange={(e) => setSemanticQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSemanticSearch()}
                  autoFocus
                />
              </div>
              <button 
                className="semantic-search-btn"
                onClick={handleSemanticSearch}
                disabled={!semanticQuery.trim() || semanticSearchLoading}
              >
                {semanticSearchLoading ? (
                  <>
                    <div className="spinner-small"></div>
                    Searching...
                  </>
                ) : (
                  <>
                    <HiSparkles />
                    Search with AI
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Sidebar */}
      <aside className={`app-sidebar ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="app-brand">
            <img src={appLogo} alt="DeepNote Logo" className="brand-icon-img" />
            <span className="brand-name">DeepNote</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${currentView === 'home' ? 'active' : ''}`}
            onClick={() => {
              setCurrentView('home');
              setMobileSidebarOpen(false);
            }}
          >
            <HiHome />
            <span>Home</span>
          </button>
          <button 
            className={`nav-item ${currentView === 'allnotes' && selectedFolder === 'all' ? 'active' : ''}`}
            onClick={() => {
              setCurrentView('allnotes');
              setSelectedFolder('all'); // Reset folder filter when viewing all notes
              setMobileSidebarOpen(false);
            }}
          >
            <HiFolder />
            <span>All Notes</span>
          </button>
          <button 
            className={`nav-item ${currentView === 'archive' ? 'active' : ''}`}
            onClick={() => {
              setCurrentView('archive');
              setMobileSidebarOpen(false);
            }}
          >
            <RiArchiveLine />
            <span>Archive</span>
          </button>
          <button 
            className={`nav-item ${currentView === 'settings' ? 'active' : ''}`}
            onClick={() => {
              setCurrentView('settings');
              setMobileSidebarOpen(false);
            }}
          >
            <HiCog />
            <span>Settings</span>
          </button>
          <button 
            className={`nav-item ${currentView === 'profile' ? 'active' : ''}`}
            onClick={() => {
              setCurrentView('profile');
              setMobileSidebarOpen(false);
            }}
          >
            <HiUser />
            <span>Profile</span>
          </button>
        </nav>

        <div className="sidebar-section">
          <div className="section-header">
            <span>My Notes</span>
            <button className="add-folder-btn" onClick={handleCreateFolder} title="Create folder">
              <span>New Folder</span>
              <HiPlus />
            </button>
          </div>
          <div className="folder-list">
            {folders.map((folder) => {
              const folderNoteCount = notes.filter(n => n.folderId === folder.id).length;
              return (
                <div 
                  key={folder.id}
                  className={`folder-item ${currentView === 'allnotes' && selectedFolder === folder.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedFolder(folder.id);
                    setCurrentView('allnotes'); // Switch to all notes view when clicking a folder
                    setMobileSidebarOpen(false);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setSelectedFolder(folder.id);
                      setCurrentView('allnotes');
                      setMobileSidebarOpen(false);
                    }
                  }}
                >
                  <HiFolder />
                  <span>{folder.name} ({folderNoteCount})</span>
                  <div className="folder-actions">
                    <button 
                      className="folder-action-btn"
                      onClick={(e) => handleEditFolder(folder, e)}
                      title="Rename folder"
                    >
                      <HiPencil />
                    </button>
                    <button 
                      className="folder-action-btn danger"
                      onClick={(e) => handleDeleteFolder(folder.id, e)}
                      title="Delete folder"
                    >
                      <HiOutlineTrash />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="app-main">
        <header className={`main-header ${headerVisible ? 'show' : 'hide'}`}>
          {/* Mobile Hamburger Menu */}
          <button 
            className="mobile-hamburger"
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            title="Menu"
          >
            <HiMenu />
          </button>

          <div className="header-left">
            <div className="search-bar">
              <HiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  className="clear-search-btn"
                  onClick={() => setSearchQuery('')}
                  title="Clear search"
                >
                  <HiX />
                </button>
              )}
              <button 
                className="ai-search-btn"
                onClick={() => setSemanticSearchOpen(true)}
                title="AI Semantic Search"
              >
                <HiSparkles />
              </button>
            </div>
            <select 
              className="sort-dropdown"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="updated">Last Edited</option>
              <option value="created">Date Created</option>
              <option value="title">Title A-Z</option>
            </select>
          </div>
          <div className="header-actions">
            <div className="view-toggle">
              <button 
                className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="List view"
              >
                <HiViewList />
              </button>
              <button 
                className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid view"
              >
                <HiViewGrid />
              </button>
            </div>
            <button className="btn-new-note" onClick={handleCreateNote} disabled={isCreatingNote}>
              <HiPlus />
              <span>{isCreatingNote ? 'Creating...' : 'New Note'}</span>
            </button>
            <img 
              src={avatarImage} 
              alt="User Avatar" 
              className="user-avatar-small"
              onClick={() => setCurrentView('profile')}
              style={{ cursor: 'pointer' }}
            />
          </div>
        </header>

        <div className="main-content" ref={mainContentRef}>
          {currentView === 'home' && (
            <div className="dashboard-container">
              {/* Quick Actions */}
              <section className="dashboard-section">
                <h2 className="section-title">Quick Actions</h2>
                <div className="quick-actions">
                  <button className="quick-action-card" onClick={handleCreateNote} disabled={isCreatingNote}>
                    <div className="quick-action-icon">
                      <HiPlus />
                    </div>
                    <div className="quick-action-content">
                      <h3>{isCreatingNote ? 'Creating...' : 'New Note'}</h3>
                      <p>Create a new note</p>
                    </div>
                  </button>
                  <button className="quick-action-card" onClick={handleCreateFolder}>
                    <div className="quick-action-icon folder">
                      <HiFolder />
                    </div>
                    <div className="quick-action-content">
                      <h3>New Folder</h3>
                      <p>Organize your notes</p>
                    </div>
                  </button>
                </div>
              </section>

              {/* Pinned Notes */}
              {pinnedNotes.length > 0 && (
                <section className="dashboard-section">
                  <div className="section-header-row">
                    <h2 className="section-title">Pinned Notes</h2>
                    <span className="section-count">{pinnedNotes.length}</span>
                  </div>
                  <div className="notes-grid">
                    {pinnedNotes.map((note) => (
                      <div
                        key={note.id}
                        className="note-grid-card"
                        onClick={() => selectNote(note)}
                      >
                        <div className="note-grid-header">
                          <h3 className="note-grid-title">{note.title || 'Untitled'}</h3>
                          <div className="note-menu-container">
                            {note.pinned && <RiPushpinFill className="pin-badge-small" />}
                            <button 
                              className="note-menu-btn"
                              onClick={(e) => toggleNoteMenu(note.id, e)}
                            >
                              <HiDotsVertical />
                            </button>
                            {activeNoteMenu === note.id && (
                              <div className="note-menu-dropdown">
                                <button 
                                  className="note-menu-item"
                                  onClick={(e) => handleQuickPin(note.id, note.pinned, e)}
                                >
                                  {note.pinned ? <RiPushpinFill /> : <RiPushpinLine />}
                                  <span>{note.pinned ? 'Unpin' : 'Pin'}</span>
                                </button>
                                <button 
                                  className="note-menu-item"
                                  onClick={(e) => handleQuickArchive(note.id, note.archived, e)}
                                >
                                  {note.archived ? <RiArchiveFill /> : <RiArchiveLine />}
                                  <span>{note.archived ? 'Unarchive' : 'Archive'}</span>
                                </button>
                                <button 
                                  className="note-menu-item danger"
                                  onClick={(e) => handleQuickDelete(note.id, e)}
                                >
                                  <HiOutlineTrash />
                                  <span>Delete</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="note-grid-preview">{getContentPreview(note.content)}</p>
                        {note.tags && note.tags.length > 0 && (
                          <div className="note-tags">
                            {note.tags.slice(0, 3).map((tag, idx) => (
                              <span key={idx} className="note-tag" onClick={(e) => {
                                e.stopPropagation();
                                setSearchQuery(tag);
                              }}>
                                {tag}
                              </span>
                            ))}
                            {note.tags.length > 3 && (
                              <span className="note-tag-more">+{note.tags.length - 3}</span>
                            )}
                          </div>
                        )}
                        <p className="note-grid-time">{formatTime(note.updatedAt)}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Recently Created Notes */}
              <section className="dashboard-section">
                <div className="section-header-row">
                  <h2 className="section-title">Recently Created</h2>
                  <span className="section-count">{recentlyCreatedNotes.length}</span>
                </div>
                <div className="notes-grid">
                  {recentlyCreatedNotes.map((note) => (
                    <div
                      key={note.id}
                      className="note-grid-card"
                      onClick={() => selectNote(note)}
                    >
                      <div className="note-grid-header">
                        <h3 className="note-grid-title">{note.title || 'Untitled'}</h3>
                        <div className="note-menu-container">
                          {note.pinned && <RiPushpinFill className="pin-badge-small" />}
                          <button 
                            className="note-menu-btn"
                            onClick={(e) => toggleNoteMenu(note.id, e)}
                          >
                            <HiDotsVertical />
                          </button>
                          {activeNoteMenu === note.id && (
                            <div className="note-menu-dropdown">
                              <button 
                                className="note-menu-item"
                                onClick={(e) => handleQuickPin(note.id, note.pinned, e)}
                              >
                                {note.pinned ? <RiPushpinFill /> : <RiPushpinLine />}
                                <span>{note.pinned ? 'Unpin' : 'Pin'}</span>
                              </button>
                              <button 
                                className="note-menu-item"
                                onClick={(e) => handleQuickArchive(note.id, note.archived, e)}
                              >
                                {note.archived ? <RiArchiveFill /> : <RiArchiveLine />}
                                <span>{note.archived ? 'Unarchive' : 'Archive'}</span>
                              </button>
                              <button 
                                className="note-menu-item danger"
                                onClick={(e) => handleQuickDelete(note.id, e)}
                              >
                                <HiOutlineTrash />
                                <span>Delete</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="note-grid-preview">{getContentPreview(note.content)}</p>
                      {note.tags && note.tags.length > 0 && (
                        <div className="note-tags">
                          {note.tags.slice(0, 3).map((tag, idx) => (
                            <span key={idx} className="note-tag" onClick={(e) => {
                              e.stopPropagation();
                              setSearchQuery(tag);
                            }}>
                              {tag}
                            </span>
                          ))}
                          {note.tags.length > 3 && (
                            <span className="note-tag-more">+{note.tags.length - 3}</span>
                          )}
                        </div>
                      )}
                      <p className="note-grid-time">{formatTime(note.createdAt)}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Recent Folders */}
              {recentFolders.length > 0 && (
                <section className="dashboard-section">
                  <div className="section-header-row">
                    <h2 className="section-title">Recent Folders</h2>
                    <span className="section-count">{recentFolders.length}</span>
                  </div>
                  <div className="folder-cards">
                    {recentFolders.map((folder) => {
                      const folderNoteCount = notes.filter(n => n.folderId === folder.id).length;
                      return (
                        <div
                          key={folder.id}
                          className="folder-card"
                          onClick={() => {
                            setSelectedFolder(folder.id);
                            setCurrentView('allnotes');
                          }}
                        >
                          <div className="folder-card-icon">
                            <HiFolder />
                          </div>
                          <div className="folder-card-content">
                            <h3 className="folder-card-title">{folder.name}</h3>
                            <p className="folder-card-count">{folderNoteCount} {folderNoteCount === 1 ? 'note' : 'notes'}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Empty State */}
              {notes.length === 0 && (
                <div className="empty-state-center">
                  <RiStickyNoteFill className="empty-icon" />
                  <h3>Welcome to DeepNote</h3>
                  <p>Start by creating your first note</p>
                  <button className="btn-create-first" onClick={handleCreateNote} disabled={isCreatingNote}>
                    {isCreatingNote ? 'Creating...' : 'Create Note'}
                  </button>
                </div>
              )}
            </div>
          )}

          {currentView === 'allnotes' && (
            <div className="content-sections">
              {/* Semantic Search Results Banner */}
              {semanticSearchResults && (
                <div className="semantic-results-banner">
                  <HiSparkles />
                  <span>
                    Showing {semanticSearchResults.length} results for: <strong>"{semanticQuery}"</strong>
                  </span>
                  <button 
                    className="clear-semantic-btn"
                    onClick={() => {
                      setSemanticSearchResults(null);
                      setSemanticQuery('');
                    }}
                  >
                    <HiX />
                    Clear
                  </button>
                </div>
              )}
              
              <section className="notes-section">
                <h2 className="section-title">
                  {semanticSearchResults 
                    ? `AI Search Results (${sortedNotes.length})`
                    : selectedFolder === 'all' 
                      ? `All Notes (${sortedNotes.length})` 
                      : `${folders.find(f => f.id === selectedFolder)?.name || 'Folder'} (${sortedNotes.length})`
                  }
                </h2>
                <div className={`notes-${viewMode}`}>
                  {sortedNotes.map((note) => (
                    <div
                      key={note.id}
                      className={`note-${viewMode === 'grid' ? 'grid-card' : 'card'}`}
                      onClick={() => selectNote(note)}
                    >
                      {viewMode === 'list' ? (
                        <>
                          <div className="note-card-icon recent">
                            <RiStickyNoteFill />
                          </div>
                          <div className="note-card-content">
                            <h3 className="note-card-title">{note.title || 'Untitled'}</h3>
                            {note.tags && note.tags.length > 0 && (
                              <div className="note-tags-inline">
                                {note.tags.slice(0, 2).map((tag, idx) => (
                                  <span key={idx} className="note-tag-small" onClick={(e) => {
                                    e.stopPropagation();
                                    setSearchQuery(tag);
                                  }}>
                                    {tag}
                                  </span>
                                ))}
                                {note.tags.length > 2 && (
                                  <span className="note-tag-more-small">+{note.tags.length - 2}</span>
                                )}
                              </div>
                            )}
                            <p className="note-card-time">{formatTime(note.updatedAt)}</p>
                          </div>
                          {note.pinned && <RiPushpinFill className="pin-badge" />}
                          <div className="note-card-arrow">›</div>
                        </>
                      ) : (
                        <>
                          <div className="note-grid-header">
                            <h3 className="note-grid-title">{note.title || 'Untitled'}</h3>
                            <div className="note-menu-container">
                              {note.pinned && <RiPushpinFill className="pin-badge-small" />}
                              <button 
                                className="note-menu-btn"
                                onClick={(e) => toggleNoteMenu(note.id, e)}
                              >
                                <HiDotsVertical />
                              </button>
                              {activeNoteMenu === note.id && (
                                <div className="note-menu-dropdown">
                                  <button 
                                    className="note-menu-item"
                                    onClick={(e) => handleQuickPin(note.id, note.pinned, e)}
                                  >
                                    {note.pinned ? <RiPushpinFill /> : <RiPushpinLine />}
                                    <span>{note.pinned ? 'Unpin' : 'Pin'}</span>
                                  </button>
                                  <button 
                                    className="note-menu-item"
                                    onClick={(e) => handleQuickArchive(note.id, note.archived, e)}
                                  >
                                    {note.archived ? <RiArchiveFill /> : <RiArchiveLine />}
                                    <span>{note.archived ? 'Unarchive' : 'Archive'}</span>
                                  </button>
                                  <button 
                                    className="note-menu-item danger"
                                    onClick={(e) => handleQuickDelete(note.id, e)}
                                  >
                                    <HiOutlineTrash />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          <p className="note-grid-preview">{getContentPreview(note.content)}</p>
                          {note.tags && note.tags.length > 0 && (
                            <div className="note-tags">
                              {note.tags.slice(0, 3).map((tag, idx) => (
                                <span key={idx} className="note-tag" onClick={(e) => {
                                  e.stopPropagation();
                                  setSearchQuery(tag);
                                }}>
                                  {tag}
                                </span>
                              ))}
                              {note.tags.length > 3 && (
                                <span className="note-tag-more">+{note.tags.length - 3}</span>
                              )}
                            </div>
                          )}
                          <p className="note-grid-time">{formatTime(note.updatedAt)}</p>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                {sortedNotes.length === 0 && (
                  <div className="empty-state-center">
                    <RiStickyNoteFill className="empty-icon" />
                    <h3>No notes in library</h3>
                    <p>Notes you create will appear here</p>
                  </div>
                )}
              </section>
            </div>
          )}

          {currentView === 'archive' && (
            <div className="content-sections">
              <section className="notes-section">
                <h2 className="section-title">Archived Notes ({sortedNotes.length})</h2>
                <div className={`notes-${viewMode}`}>
                  {sortedNotes.map((note) => (
                    <div
                      key={note.id}
                      className={`note-${viewMode === 'grid' ? 'grid-card' : 'card'}`}
                      onClick={() => selectNote(note)}
                    >
                      {viewMode === 'list' ? (
                        <>
                          <div className="note-card-icon recent">
                            <RiStickyNoteFill />
                          </div>
                          <div className="note-card-content">
                            <h3 className="note-card-title">{note.title || 'Untitled'}</h3>
                            {note.tags && note.tags.length > 0 && (
                              <div className="note-tags-inline">
                                {note.tags.slice(0, 2).map((tag, idx) => (
                                  <span key={idx} className="note-tag-small" onClick={(e) => {
                                    e.stopPropagation();
                                    setSearchQuery(tag);
                                  }}>
                                    {tag}
                                  </span>
                                ))}
                                {note.tags.length > 2 && (
                                  <span className="note-tag-more-small">+{note.tags.length - 2}</span>
                                )}
                              </div>
                            )}
                            <p className="note-card-time">{formatTime(note.updatedAt)}</p>
                          </div>
                          {note.pinned && <RiPushpinFill className="pin-badge" />}
                          <div className="note-card-arrow">›</div>
                        </>
                      ) : (
                        <>
                          <div className="note-grid-header">
                            <h3 className="note-grid-title">{note.title || 'Untitled'}</h3>
                            <div className="note-menu-container">
                              {note.pinned && <RiPushpinFill className="pin-badge-small" />}
                              <button 
                                className="note-menu-btn"
                                onClick={(e) => toggleNoteMenu(note.id, e)}
                              >
                                <HiDotsVertical />
                              </button>
                              {activeNoteMenu === note.id && (
                                <div className="note-menu-dropdown">
                                  <button 
                                    className="note-menu-item"
                                    onClick={(e) => handleQuickPin(note.id, note.pinned, e)}
                                  >
                                    {note.pinned ? <RiPushpinFill /> : <RiPushpinLine />}
                                    <span>{note.pinned ? 'Unpin' : 'Pin'}</span>
                                  </button>
                                  <button 
                                    className="note-menu-item"
                                    onClick={(e) => handleQuickArchive(note.id, note.archived, e)}
                                  >
                                    {note.archived ? <RiArchiveFill /> : <RiArchiveLine />}
                                    <span>{note.archived ? 'Unarchive' : 'Archive'}</span>
                                  </button>
                                  <button 
                                    className="note-menu-item danger"
                                    onClick={(e) => handleQuickDelete(note.id, e)}
                                  >
                                    <HiOutlineTrash />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          <p className="note-grid-preview">{getContentPreview(note.content)}</p>
                          {note.tags && note.tags.length > 0 && (
                            <div className="note-tags">
                              {note.tags.slice(0, 3).map((tag, idx) => (
                                <span key={idx} className="note-tag" onClick={(e) => {
                                  e.stopPropagation();
                                  setSearchQuery(tag);
                                }}>
                                  {tag}
                                </span>
                              ))}
                              {note.tags.length > 3 && (
                                <span className="note-tag-more">+{note.tags.length - 3}</span>
                              )}
                            </div>
                          )}
                          <p className="note-grid-time">{formatTime(note.updatedAt)}</p>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                {sortedNotes.length === 0 && (
                  <div className="empty-state-center">
                    <RiArchiveLine className="empty-icon" />
                    <h3>No archived notes</h3>
                    <p>Archived notes will appear here</p>
                  </div>
                )}
              </section>
            </div>
          )}

          {currentView === 'settings' && (
            <div className="settings-view">
              <h2 className="section-title">Settings</h2>
              <div className="settings-card">
                <h3>Appearance</h3>
                <div className="settings-item">
                  <span className="settings-label">Dark Mode</span>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={darkMode}
                      onChange={toggleDarkMode}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
              <div className="settings-card">
                <h3>Application</h3>
                <div className="settings-item">
                  <span className="settings-label">Version</span>
                  <span className="settings-value">1.0.0</span>
                </div>
                <div className="settings-item">
                  <span className="settings-label">Total Notes</span>
                  <span className="settings-value">{notes.length}</span>
                </div>
                <div className="settings-item">
                  <span className="settings-label">Total Folders</span>
                  <span className="settings-value">{folders.length}</span>
                </div>
              </div>
              <div className="settings-card">
                <h3>Preferences</h3>
                <div className="settings-item">
                  <span className="settings-label">Default View</span>
                  <span className="settings-value">{viewMode === 'grid' ? 'Grid' : 'List'}</span>
                </div>
                <div className="settings-item">
                  <span className="settings-label">Default Sort</span>
                  <span className="settings-value">
                    {sortBy === 'updated' ? 'Last Edited' : sortBy === 'created' ? 'Date Created' : 'Title A-Z'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {currentView === 'profile' && (
            <div className="profile-view">
              <div className="profile-header">
                <div className="profile-avatar-large">
                  {currentUser.email?.[0].toUpperCase()}
                </div>
                <h2 className="profile-name">{getUserDisplayName()}</h2>
                <p className="profile-email">{currentUser.email}</p>
              </div>

              <div className="profile-stats">
                <div className="profile-stat-card">
                  <div className="profile-stat-icon notes">
                    <RiStickyNoteFill />
                  </div>
                  <div className="profile-stat-content">
                    <span className="profile-stat-value">{notes.length}</span>
                    <span className="profile-stat-label">Notes</span>
                  </div>
                </div>
                <div className="profile-stat-card">
                  <div className="profile-stat-icon folders">
                    <HiFolder />
                  </div>
                  <div className="profile-stat-content">
                    <span className="profile-stat-value">{folders.length}</span>
                    <span className="profile-stat-label">Folders</span>
                  </div>
                </div>
                <div className="profile-stat-card">
                  <div className="profile-stat-icon pinned">
                    <RiPushpinFill />
                  </div>
                  <div className="profile-stat-content">
                    <span className="profile-stat-value">{notes.filter(n => n.pinned).length}</span>
                    <span className="profile-stat-label">Pinned</span>
                  </div>
                </div>
              </div>

              <div className="settings-card">
                <h3>Account Details</h3>
                <div className="settings-item">
                  <span className="settings-label">Email</span>
                  <span className="settings-value">{currentUser.email}</span>
                </div>
                <div className="settings-item">
                  <span className="settings-label">User ID</span>
                  <span className="settings-value settings-value-mono">{currentUser.uid}</span>
                </div>
                <div className="settings-item">
                  <span className="settings-label">Member Since</span>
                  <span className="settings-value">
                    {formatDate(currentUser.metadata?.creationTime || currentUser.metadata?.createdAt)}
                  </span>
                </div>
                <div className="settings-item">
                  <span className="settings-label">Last Sign In</span>
                  <span className="settings-value">
                    {formatDate(currentUser.metadata?.lastSignInTime || currentUser.metadata?.lastLoginAt)}
                  </span>
                </div>
              </div>

              <div className="profile-actions">
                <button className="btn-logout" onClick={handleLogout}>
                  <HiOutlineLogout />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Floating Action Button (FAB) for Mobile */}
      <div className="fab-container">
        <div className={`fab-menu ${fabMenuOpen ? 'open' : ''}`}>
          <button 
            className="fab-menu-item" 
            onClick={() => {
              handleCreateNote();
              setFabMenuOpen(false);
            }}
            disabled={isCreatingNote}
          >
            <RiStickyNoteFill />
            <span>{isCreatingNote ? 'Creating...' : 'New Note'}</span>
          </button>
          <button 
            className="fab-menu-item" 
            onClick={() => {
              handleCreateFolder();
              setFabMenuOpen(false);
            }}
          >
            <HiFolder />
            <span>New Folder</span>
          </button>
          <button 
            className="fab-menu-item" 
            onClick={() => {
              handleCreateSketch();
              setFabMenuOpen(false);
            }}
            disabled={isCreatingNote}
          >
            <HiPencil />
            <span>{isCreatingNote ? 'Creating...' : 'New Sketch'}</span>
          </button>
        </div>
        <button 
          className={`fab-button ${fabMenuOpen ? 'open' : ''}`}
          onClick={() => setFabMenuOpen(!fabMenuOpen)}
          title="Create"
        >
          <HiPlus />
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
