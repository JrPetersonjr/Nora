/**
 * Storage Manager
 * Handles data persistence with localStorage
 * Note: In Claude artifacts, localStorage is not available. This module provides
 * a fallback in-memory storage solution.
 */
class StorageManager {
  constructor() {
    this.memoryCache = new Map();
    this.AUTOSAVE_INTERVAL = 30000; // 30 seconds
    this.useLocalStorage = this.checkLocalStorageAvailable();
  }

  checkLocalStorageAvailable() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      console.warn('localStorage not available, using in-memory storage');
      return false;
    }
  }

  set(key, value) {
    try {
      const data = {
        value,
        timestamp: Date.now()
      };

      if (this.useLocalStorage) {
        localStorage.setItem(key, JSON.stringify(data));
      } else {
        this.memoryCache.set(key, data);
      }

      return true;
    } catch (error) {
      console.error('Storage set failed:', error);
      return false;
    }
  }

  get(key) {
    try {
      let item;

      if (this.useLocalStorage) {
        const stored = localStorage.getItem(key);
        item = stored ? JSON.parse(stored) : null;
      } else {
        item = this.memoryCache.get(key);
      }

      if (!item) return null;

      return item.value;
    } catch (error) {
      console.error('Storage get failed:', error);
      return null;
    }
  }

  remove(key) {
    try {
      if (this.useLocalStorage) {
        localStorage.removeItem(key);
      } else {
        this.memoryCache.delete(key);
      }
      return true;
    } catch (error) {
      console.error('Storage remove failed:', error);
      return false;
    }
  }

  clear() {
    try {
      if (this.useLocalStorage) {
        localStorage.clear();
      } else {
        this.memoryCache.clear();
      }
      return true;
    } catch (error) {
      console.error('Storage clear failed:', error);
      return false;
    }
  }

  keys() {
    if (this.useLocalStorage) {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        keys.push(localStorage.key(i));
      }
      return keys;
    } else {
      return Array.from(this.memoryCache.keys());
    }
  }
}

// Create global storage instance
const storage = new StorageManager();
