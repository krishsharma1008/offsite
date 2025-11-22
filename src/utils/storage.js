// Photo storage utility for managing captured photos
// Stores up to 10 photos per session

const MAX_PHOTOS = 10;
const STORAGE_KEY = 'zapcom_photos';

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

export const photoStorage = {
  // Get all photos
  getPhotos() {
    return readFromStorage();
  },

  // Save a new photo
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

  // Get remaining photo count
  getRemainingCount() {
    return MAX_PHOTOS - this.getPhotos().length;
  },

  // Get taken photo count
  getTakenCount() {
    return this.getPhotos().length;
  },

  // Check if can take more photos
  canTakePhoto() {
    return this.getTakenCount() < MAX_PHOTOS;
  },

  // Clear all photos (reset roll)
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

  // Delete specific photo
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

  // Check if we need to prompt users for a new roll
  isRollFull() {
    const photos = readFromStorage();
    return photos.length >= MAX_PHOTOS;
  }
};
