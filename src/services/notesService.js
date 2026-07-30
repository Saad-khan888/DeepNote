import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc,
  getDocs,
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

const NOTES_COLLECTION = 'notes';
const FOLDERS_COLLECTION = 'folders';

/**
 * Create a new note
 * @param {string} userId - The user's ID
 * @param {string} title - Note title
 * @param {string} content - Note content
 * @param {string} folderId - Optional folder ID
 * @param {Array<string>} tags - Optional array of tags
 * @returns {Promise<string>} - The new note's ID
 */
export const createNote = async (userId, title = '', content = '', folderId = null, tags = []) => {
  try {
    const noteData = {
      userId,
      title,
      content,
      pinned: false,
      folderId,
      tags: tags || [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, NOTES_COLLECTION), noteData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating note:', error);
    throw error;
  }
};

/**
 * Get all notes for a user
 * @param {string} userId - The user's ID
 * @returns {Promise<Array>} - Array of note objects with document IDs
 */
export const getUserNotes = async (userId) => {
  try {
    const q = query(
      collection(db, NOTES_COLLECTION),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const notes = [];
    
    querySnapshot.forEach((doc) => {
      notes.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return notes;
  } catch (error) {
    console.error('Error getting user notes:', error);
    throw error;
  }
};

/**
 * Get a single note by ID
 * @param {string} noteId - The note's ID
 * @returns {Promise<Object|null>} - Note object or null if not found
 */
export const getNote = async (noteId) => {
  try {
    const docRef = doc(db, NOTES_COLLECTION, noteId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting note:', error);
    throw error;
  }
};

// Alias for clarity
export const getNoteById = getNote;

/**
 * Update a note
 * @param {string} noteId - The note's ID
 * @param {Object} updates - Object containing fields to update
 * @returns {Promise<void>}
 */
export const updateNote = async (noteId, updates) => {
  try {
    const docRef = doc(db, NOTES_COLLECTION, noteId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating note:', error);
    throw error;
  }
};

/**
 * Delete a note
 * @param {string} noteId - The note's ID
 * @returns {Promise<void>}
 */
export const deleteNote = async (noteId) => {
  try {
    const docRef = doc(db, NOTES_COLLECTION, noteId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting note:', error);
    throw error;
  }
};

/**
 * Toggle pin status of a note
 * @param {string} noteId - The note's ID
 * @param {boolean} pinned - New pinned status
 * @returns {Promise<void>}
 */
export const togglePinNote = async (noteId, pinned) => {
  try {
    await updateNote(noteId, { pinned });
  } catch (error) {
    console.error('Error toggling pin:', error);
    throw error;
  }
};

// ==================== FOLDER OPERATIONS ====================

/**
 * Create a new folder
 * @param {string} userId - The user's ID
 * @param {string} name - Folder name
 * @returns {Promise<string>} - The new folder's ID
 */
export const createFolder = async (userId, name) => {
  try {
    const folderData = {
      userId,
      name,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, FOLDERS_COLLECTION), folderData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating folder:', error);
    throw error;
  }
};

/**
 * Get all folders for a user
 * @param {string} userId - The user's ID
 * @returns {Promise<Array>} - Array of folder objects with document IDs
 */
export const getUserFolders = async (userId) => {
  try {
    const q = query(
      collection(db, FOLDERS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const folders = [];
    
    querySnapshot.forEach((doc) => {
      folders.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return folders;
  } catch (error) {
    console.error('Error getting user folders:', error);
    throw error;
  }
};

/**
 * Update a folder
 * @param {string} folderId - The folder's ID
 * @param {Object} updates - Object containing fields to update
 * @returns {Promise<void>}
 */
export const updateFolder = async (folderId, updates) => {
  try {
    const docRef = doc(db, FOLDERS_COLLECTION, folderId);
    await updateDoc(docRef, updates);
  } catch (error) {
    console.error('Error updating folder:', error);
    throw error;
  }
};

/**
 * Delete a folder and optionally handle its notes
 * @param {string} folderId - The folder's ID
 * @param {string} userId - The user's ID (to reassign notes)
 * @returns {Promise<void>}
 */
export const deleteFolder = async (folderId, userId) => {
  try {
    // Get all notes in this folder
    const q = query(
      collection(db, NOTES_COLLECTION),
      where('folderId', '==', folderId)
    );
    const querySnapshot = await getDocs(q);
    
    // Move notes to "no folder" (folderId: null)
    const updatePromises = [];
    querySnapshot.forEach((noteDoc) => {
      const noteRef = doc(db, NOTES_COLLECTION, noteDoc.id);
      updatePromises.push(updateDoc(noteRef, { folderId: null }));
    });
    
    await Promise.all(updatePromises);
    
    // Delete the folder
    const folderRef = doc(db, FOLDERS_COLLECTION, folderId);
    await deleteDoc(folderRef);
  } catch (error) {
    console.error('Error deleting folder:', error);
    throw error;
  }
};

/**
 * Get note count for a folder
 * @param {string} folderId - The folder's ID
 * @returns {Promise<number>} - Number of notes in the folder
 */
export const getFolderNoteCount = async (folderId) => {
  try {
    const q = query(
      collection(db, NOTES_COLLECTION),
      where('folderId', '==', folderId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('Error getting folder note count:', error);
    return 0;
  }
};
