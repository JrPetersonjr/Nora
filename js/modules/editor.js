/**
 * Editor Module
 * Manages CKEditor instance and auto-save functionality
 */
class EditorModule {
  constructor() {
    this.editor = null;
    this.isLoading = false;
    this.STORAGE_KEY = 'student-helper-editor-content';
    this.AUTOSAVE_INTERVAL = 30000; // 30 seconds
    this.autosaveTimer = null;
    this.statsKey = 'student-helper-stats';
  }

  async init() {
    if (this.isLoading || this.editor) {
      console.log('[Editor] Already initialized or loading');
      return;
    }
    this.isLoading = true;
    console.log('[Editor] Starting initialization...');
    try {
      const placeholder = document.querySelector('#editor-content');
      if (!placeholder) {
        throw new Error('#editor-content element not found in DOM');
      }
      console.log('[Editor] Found placeholder element');
      
      // Show loading state
      placeholder.style.minHeight = '400px';
      placeholder.innerHTML = '';
      
      // Create editor instance
      if (!window.ClassicEditor) {
        throw new Error('CKEditor ClassicEditor not loaded. Check if CDN script is loaded.');
      }
      console.log('[Editor] CKEditor available, creating instance...');
      
      this.editor = await ClassicEditor.create(placeholder, {
        toolbar: [
          'heading', '|',
          'bold', 'italic', 'link', '|',
          'bulletedList', 'numberedList', 'blockQuote', '|',
          'insertTable', '|',
          'undo', 'redo'
        ],
        placeholder: 'Write your report, essay, or notes here...'
      });
      console.log('[Editor] CKEditor instance created successfully');
      
      // Restore previous content
      this.restoreContent();
      console.log('[Editor] Content restored');
      
      // Setup auto-save
      this.setupAutoSave();
      console.log('[Editor] Auto-save configured');
      
      // Save on page unload
      window.addEventListener('beforeunload', () => this.saveContent());
      console.log('[Editor] Unload listener attached');
      console.log('[Editor] Initialization complete!');
    } catch (error) {
      console.error('[Editor] Initialization failed:', error.message, error);
      placeholder.innerHTML = `<div style="padding: 20px; color: red;">Error loading editor: ${error.message}</div>`;
      if (typeof ErrorHandler !== 'undefined' && ErrorHandler.showNotification) {
        ErrorHandler.showNotification('Failed to load editor: ' + error.message, 'error');
      }
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  setupAutoSave() {
    // Auto-save every 30 seconds
    this.autosaveTimer = setInterval(() => {
      this.saveContent(true);
    }, this.AUTOSAVE_INTERVAL);

    // Also save on content change (debounced)
    let saveTimeout;
    this.editor.model.document.on('change', () => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        this.saveContent(true);
      }, 3000); // Save 3 seconds after last change
    });
  }

  saveContent(isAutoSave = false) {
    try {
      if (!this.editor) return;

      const content = this.editor.getData();
      storage.set(this.STORAGE_KEY, content);

      if (isAutoSave) {
        this.showAutoSaveStatus('saved');
      }

      // Update stats
      this.updateStats();
      if (window.incrementStat) window.incrementStat('notes');

      return true;
    } catch (error) {
      console.error('Failed to save content:', error);
      if (isAutoSave) {
        this.showAutoSaveStatus('error');
      }
      return false;
    }
  }

  restoreContent() {
    try {
      const savedContent = storage.get(this.STORAGE_KEY);
      if (!this.editor) return;

      if (savedContent && String(savedContent).trim()) {
        this.editor.setData(savedContent);
      } else {
        // Start with a clean document so temporary loading text never persists.
        this.editor.setData('<p></p>');
      }
    } catch (error) {
      console.error('Failed to restore content:', error);
    }
  }

  showAutoSaveStatus(status) {
    const statusEl = document.getElementById('autosave-status');
    if (!statusEl) return;

    statusEl.classList.add('visible');
    statusEl.classList.remove('saving', 'saved');

    if (status === 'saved') {
      statusEl.textContent = '✓ Saved';
      statusEl.classList.add('saved');
      setTimeout(() => {
        statusEl.classList.remove('visible');
      }, 2000);
    } else if (status === 'error') {
      statusEl.textContent = '✗ Error saving';
      statusEl.classList.add('error');
    }
  }

  getContent() {
    return this.editor ? this.editor.getData() : '';
  }

  setContent(content) {
    if (this.editor) {
      this.editor.setData(content);
    }
  }

  clearContent() {
    if (this.editor) {
      this.editor.setData('');
      storage.remove(this.STORAGE_KEY);
      this.updateStats();
    }
  }

  exportAsText() {
    const content = this.getContent();
    // Remove HTML tags for plain text export
    const plainText = content.replace(/<[^>]*>/g, '').trim();
    
    // Create download link
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(plainText));
    element.setAttribute('download', 'notes.txt');
    element.style.display = 'none';
    
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    this.updateStats();
  }

  updateStats() {
    try {
      const content = this.getContent();
      const stats = storage.get(this.statsKey) || {
        notesCreated: 0,
        grammarChecks: 0,
        flashcards: 0,
        classes: 0
      };

      if (content.trim().length > 0) {
        stats.notesCreated = 1; // Mark that notes have been created
      }

      storage.set(this.statsKey, stats);
      window.dispatchEvent(new CustomEvent('stats-updated', { detail: stats }));
    } catch (error) {
      console.error('Failed to update stats:', error);
    }
  }

  destroy() {
    if (this.autosaveTimer) {
      clearInterval(this.autosaveTimer);
    }
    if (this.editor) {
      this.editor.destroy();
      this.editor = null;
    }
  }
}

// Initialize when DOM is ready
const editorModule = new EditorModule();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => editorModule.init());
} else {
  editorModule.init();
}
