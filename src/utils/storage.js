// Photo storage utility for managing captured photos
// Now integrated with Supabase for cloud storage

import { uploadPhoto, getUserPhotos, deletePhoto as supabaseDeletePhoto, getUserPhotoCount } from '../lib/supabase';

const MAX_PHOTOS = 10;

// Create a storage manager that works with Supabase
export function createPhotoStorage(userId, refreshPhotoCount) {
  let cachedPhotoCount = 0;
  let cachedPhotos = [];

  return {
    // Initialize - fetch current photo count
    async init() {
      if (userId) {
        cachedPhotoCount = await getUserPhotoCount(userId);
        cachedPhotos = await getUserPhotos(userId);
      }
      return cachedPhotoCount;
    },

    // Get all user's photos
    async getPhotos() {
      if (!userId) return [];
      cachedPhotos = await getUserPhotos(userId);
      return cachedPhotos;
    },

    // Get cached photos (for sync access)
    getCachedPhotos() {
      return cachedPhotos;
    },

    // Save a new photo to Supabase
    async savePhoto(photoDataUrl, onProgress = null) {
      console.log('[Storage] savePhoto called, userId:', userId);

      if (!userId) {
        console.error('[Storage] No userId - user not authenticated');
        return { success: false, reason: 'not_authenticated' };
      }

      if (cachedPhotoCount >= MAX_PHOTOS) {
        console.log('[Storage] Max photos reached:', cachedPhotoCount);
        return { success: false, reason: 'max_reached' };
      }

      try {
        console.log('[Storage] Uploading photo...');
        // Pass progress callback to uploadPhoto
        const result = await uploadPhoto(userId, photoDataUrl, 'Zapcom Offsite', onProgress);
        console.log('[Storage] Upload result:', result);

        if (result.success) {
          cachedPhotoCount++;
          cachedPhotos.unshift(result.photo);
          if (refreshPhotoCount) {
            await refreshPhotoCount();
          }
          return { success: true, count: cachedPhotoCount, photo: result.photo };
        } else {
          return { success: false, reason: result.error };
        }
      } catch (error) {
        console.error('[Storage] Error saving photo:', error);
        return { success: false, reason: 'error' };
      }
    },

    // Get remaining photo count
    getRemainingCount() {
      return MAX_PHOTOS - cachedPhotoCount;
    },

    // Get taken photo count
    getTakenCount() {
      return cachedPhotoCount;
    },

    // Check if can take more photos
    canTakePhoto() {
      return cachedPhotoCount < MAX_PHOTOS;
    },

    // Update cached count
    updateCount(newCount) {
      cachedPhotoCount = newCount;
    },

    // Delete specific photo
    async deletePhoto(photoId, storagePath) {
      try {
        const result = await supabaseDeletePhoto(photoId, storagePath);
        if (result.success) {
          cachedPhotoCount = Math.max(0, cachedPhotoCount - 1);
          cachedPhotos = cachedPhotos.filter(p => p.id !== photoId);
          if (refreshPhotoCount) {
            await refreshPhotoCount();
          }
        }
        return result.success;
      } catch (error) {
        console.error('Error deleting photo:', error);
        return false;
      }
    },

    // Check if roll is full
    isRollFull() {
      return cachedPhotoCount >= MAX_PHOTOS;
    }
  };
}

// Legacy photoStorage for backwards compatibility (uses local storage as fallback)
const STORAGE_KEY = 'zapcom_photos_local';
let memoryStore = [];
let storageAvailable = true;

const readFromStorage = () => {
  if (!storageAvailable) {
    return [...memoryStore];
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Local storage unavailable, falling back to memory store:', error);
    storageAvailable = false;
    return [...memoryStore];
  }
};

const writeToStorage = (photos) => {
  if (!storageAvailable) {
    memoryStore = [...photos];
    return true;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
    return true;
  } catch (error) {
    console.warn('Unable to write to local storage, using memory store:', error);
    storageAvailable = false;
    memoryStore = [...photos];
    return true;
  }
};

// Legacy local storage (kept for offline fallback)
export const photoStorage = {
  getPhotos() {
    return readFromStorage();
  },

  savePhoto(photoDataUrl) {
    try {
      const photos = readFromStorage();

      if (photos.length >= MAX_PHOTOS) {
        return { success: false, reason: 'max_reached' };
      }

      photos.push({
        id: Date.now(),
        data: photoDataUrl,
        timestamp: new Date().toISOString(),
      });

      const success = writeToStorage(photos);
      return { success, count: photos.length };
    } catch (error) {
      console.error('Error saving photo:', error);
      return { success: false, reason: 'error' };
    }
  },

  getRemainingCount() {
    return MAX_PHOTOS - this.getPhotos().length;
  },

  getTakenCount() {
    return this.getPhotos().length;
  },

  canTakePhoto() {
    return this.getTakenCount() < MAX_PHOTOS;
  },

  clearPhotos() {
    try {
      if (storageAvailable) {
        localStorage.removeItem(STORAGE_KEY);
      }
      memoryStore = [];
      return true;
    } catch (error) {
      console.error('Error clearing photos:', error);
      return false;
    }
  },

  deletePhoto(photoId) {
    try {
      const photos = readFromStorage();
      const filtered = photos.filter(p => p.id !== photoId);
      return writeToStorage(filtered);
    } catch (error) {
      console.error('Error deleting photo:', error);
      return false;
    }
  },

  isRollFull() {
    const photos = readFromStorage();
    return photos.length >= MAX_PHOTOS;
  }
};
