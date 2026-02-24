/**
 * Student Helper Main App
 * Coordinates sections, settings, and shared UI actions
 */
class StudentHelper {
  constructor() {
    this.currentSection = 'dashboard';
    this.statsKey = 'student-helper-stats';
    this.isMobileQuery = window.matchMedia('(max-width: 768px)');
  }

  init() {
    this.setupNavigation();
    this.setupMobileNavigation();
    this.loadStats();
    this.setupStatsListener();
    this.applySectionFromUrl();
    this.registerServiceWorker();
  }

  setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach((link) => {
      const sectionName = link.dataset.section;
      link.addEventListener('click', (event) => {
        event.preventDefault();
        this.showSection(sectionName);
      });
    });
  }

  setActiveNav(sectionName) {
    document.querySelectorAll('.nav-link').forEach((link) => {
      link.classList.toggle('active', link.dataset.section === sectionName);
    });
  }

  showSection(sectionName) {
    const selectedSection = document.getElementById(sectionName);
    if (!selectedSection) {
      return;
    }

    document.querySelectorAll('.section').forEach((section) => {
      section.classList.remove('active');
    });

    selectedSection.classList.add('active');
    this.currentSection = sectionName;
    this.setActiveNav(sectionName);
    if (this.isMobileQuery.matches) {
      this.closeMobileNavigation();
    }
    this.handleSectionLoad(sectionName);
  }

  setupMobileNavigation() {
    this.mobileNavToggle = document.getElementById('mobile-nav-toggle');
    this.mobileNavOverlay = document.getElementById('mobile-nav-overlay');

    if (!this.mobileNavToggle || !this.mobileNavOverlay) {
      return;
    }

    this.mobileNavToggle.addEventListener('click', () => {
      if (document.body.classList.contains('nav-open')) {
        this.closeMobileNavigation();
      } else {
        this.openMobileNavigation();
      }
    });

    this.mobileNavOverlay.addEventListener('click', () => {
      this.closeMobileNavigation();
    });

    const closeOnDesktop = (event) => {
      if (!event.matches) {
        this.closeMobileNavigation();
      }
    };
    if (typeof this.isMobileQuery.addEventListener === 'function') {
      this.isMobileQuery.addEventListener('change', closeOnDesktop);
    } else if (typeof this.isMobileQuery.addListener === 'function') {
      this.isMobileQuery.addListener(closeOnDesktop);
    }
  }

  openMobileNavigation() {
    if (!this.mobileNavToggle) {
      return;
    }
    document.body.classList.add('nav-open');
    this.mobileNavToggle.setAttribute('aria-expanded', 'true');
  }

  closeMobileNavigation() {
    if (!this.mobileNavToggle) {
      return;
    }
    document.body.classList.remove('nav-open');
    this.mobileNavToggle.setAttribute('aria-expanded', 'false');
  }

  applySectionFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const requestedSection = params.get('section');
    if (requestedSection && document.getElementById(requestedSection)) {
      this.showSection(requestedSection);
      return;
    }

    this.showSection('dashboard');
  }

  handleSectionLoad(sectionName) {
    switch (sectionName) {
      case 'editor':
        if (typeof editorModule !== 'undefined' && editorModule && !editorModule.editor && !editorModule.isLoading) {
          editorModule.init().catch((error) => {
            console.error('Failed to initialize editor on section load:', error);
          });
        }
        break;
      case 'flashcards':
        if (window.flashcardsModule && typeof flashcardsModule.renderSets === 'function') {
          flashcardsModule.renderSets();
        }
        break;
      case 'classes':
        if (window.classesModule && typeof classesModule.renderClasses === 'function') {
          classesModule.renderClasses();
        }
        break;
      case 'calendar':
        if (typeof window.refreshCalendar === 'function') {
          window.refreshCalendar();
        }
        break;
      case 'projects':
        if (typeof window.refreshProjects === 'function') {
          window.refreshProjects();
        }
        break;
      case 'dashboard':
        this.updateDashboard();
        break;
      default:
        break;
    }
  }

  loadStats() {
    const stats = storage.get(this.statsKey) || {
      notesCreated: 0,
      grammarChecks: 0,
      flashcards: 0,
      classes: 0
    };

    this.updateStatsUI(stats);
  }

  updateStatsUI(stats) {
    const statElements = {
      'stat-notes': stats.notesCreated || 0,
      'stat-flashcards': stats.flashcards || 0,
      'stat-classes': stats.classes || 0,
      'stat-checkups': stats.grammarChecks || 0
    };

    Object.entries(statElements).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = value;
      }
    });
  }

  updateDashboard() {
    const stats = storage.get(this.statsKey) || {
      notesCreated: 0,
      grammarChecks: 0,
      flashcards: 0,
      classes: 0
    };

    this.updateStatsUI(stats);

    const activityDiv = document.getElementById('dashboard-activity');
    if (!activityDiv) {
      return;
    }

    const activity = [];
    if (stats.notesCreated > 0) activity.push('Notes created');
    if (stats.classes > 0) activity.push(`${stats.classes} class${stats.classes !== 1 ? 'es' : ''}`);
    if (stats.flashcards > 0) activity.push(`${stats.flashcards} flashcard${stats.flashcards !== 1 ? 's' : ''}`);
    if (stats.grammarChecks > 0) activity.push(`${stats.grammarChecks} grammar check${stats.grammarChecks !== 1 ? 's' : ''}`);

    if (!activity.length) {
      activityDiv.textContent = 'Start using Nora to see your activity here!';
      return;
    }

    activityDiv.innerHTML = activity.map((item) => `- ${item}`).join('<br>');
  }

  setupStatsListener() {
    window.addEventListener('stats-updated', () => {
      this.loadStats();
      if (this.currentSection === 'dashboard') {
        this.updateDashboard();
      }
      if (this.currentSection === 'calendar' && typeof window.refreshCalendar === 'function') {
        window.refreshCalendar();
      }
    });
  }

  registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      return;
    }
    if (!window.location.protocol.startsWith('http')) {
      return;
    }

    navigator.serviceWorker.register('./sw.js').catch((error) => {
      console.warn('Service Worker registration failed:', error);
    });
  }
}

// Initialize app when DOM is ready
function initializeApp() {
  if (window.ErrorHandler && typeof ErrorHandler.init === 'function') {
    ErrorHandler.init();
  }

  if (typeof editorModule !== 'undefined' && editorModule && typeof editorModule.init === 'function') {
    editorModule.init().catch((error) => {
      console.error('Editor initialization failed:', error);
      if (window.ErrorHandler && typeof ErrorHandler.showNotification === 'function') {
        ErrorHandler.showNotification('Failed to load editor', 'error');
      }
    });
  }

  window.studentHelperApp = new StudentHelper();
  window.studentHelperApp.init();

  setupEditorButtons();
  setupSettings();
  setupDataManagement();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

function setupEditorButtons() {
  const clearBtn = document.getElementById('clear-editor-btn');
  const exportBtn = document.getElementById('export-notes-btn');

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (!confirm('Are you sure you want to clear all notes? This cannot be undone.')) {
        return;
      }
      if (typeof editorModule !== 'undefined' && editorModule && typeof editorModule.clearContent === 'function') {
        editorModule.clearContent();
        ErrorHandler.showNotification('Notes cleared', 'info');
      }
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      if (typeof editorModule !== 'undefined' && editorModule && typeof editorModule.exportAsText === 'function') {
        editorModule.exportAsText();
        ErrorHandler.showNotification('Notes exported as text file', 'success');
      }
    });
  }
}

function setupSettings() {
  try {
    const UNLOCK_PHRASE = ':Gemini33';
    const YT_KEY_ENC = 'student-helper-youtube-key-enc';
    const AI_KEY_ENC = 'student-helper-ai-api-key-enc';

    const saveBtn = document.getElementById('save-settings-btn');
    const youtubeInput = document.getElementById('youtubeApiKey');
    const apiAccessPromptInput = document.getElementById('apiAccessPrompt');
    const unlockApiBtn = document.getElementById('unlock-api-btn');
    const apiLockStatus = document.getElementById('api-lock-status');
    const apiProxyInput = document.getElementById('apiProxyUrl');
    const plagiarismApiInput = document.getElementById('plagiarismApiUrl');
    const aiApiKeyInput = document.getElementById('aiApiKey');
    const aiModelInput = document.getElementById('aiModel');
    const aiApiBaseUrlInput = document.getElementById('aiApiBaseUrl');
    const userNameInput = document.getElementById('userName');
    const themeSelect = document.getElementById('themeSelect');

    const storedLegacyYoutubeKey = storage.get('student-helper-youtube-key') || '';
    const storedApiProxyUrl = storage.get('student-helper-api-proxy-url') || 'http://127.0.0.1:8787';
    const storedPlagiarismApi = storage.get('student-helper-plagiarism-api-url') || 'http://127.0.0.1:8765';
    const storedLegacyAiKey = storage.get('student-helper-ai-api-key') || '';
    const storedYoutubeKeyEnc = storage.get(YT_KEY_ENC) || '';
    const storedAiApiKeyEnc = storage.get(AI_KEY_ENC) || '';
    const storedAiModel = storage.get('student-helper-ai-model') || 'gemini-1.5-flash';
    const storedAiApiBaseUrl = storage.get('student-helper-ai-api-base-url') || 'https://api.openai.com/v1';
    const storedName = storage.get('student-helper-username') || '';
    const storedTheme = storage.get('student-helper-theme') || 'dark';

    if (youtubeInput) youtubeInput.value = '';
    if (apiProxyInput) apiProxyInput.value = storedApiProxyUrl;
    if (plagiarismApiInput) plagiarismApiInput.value = storedPlagiarismApi;
    if (aiApiKeyInput) aiApiKeyInput.value = '';
    if (aiModelInput) aiModelInput.value = storedAiModel;
    if (aiApiBaseUrlInput) aiApiBaseUrlInput.value = storedAiApiBaseUrl;
    if (userNameInput) userNameInput.value = storedName;
    if (themeSelect) themeSelect.value = storedTheme;
    window.YOUTUBE_API_KEY = '';
    window.API_PROXY_URL = storedApiProxyUrl;
    window.PLAGIARISM_API_URL = storedPlagiarismApi;
    window.AI_API_KEY = '';
    window.API_KEYS_UNLOCKED = false;
    window.AI_MODEL = storedAiModel;
    window.AI_API_BASE_URL = storedAiApiBaseUrl;

    const hasAnyStoredApiKey = Boolean(storedYoutubeKeyEnc || storedAiApiKeyEnc || storedLegacyYoutubeKey || storedLegacyAiKey);
    if (apiLockStatus) {
      apiLockStatus.textContent = hasAnyStoredApiKey ? 'API keys are locked' : 'No encrypted API keys saved';
    }

    function toBase64(bytes) {
      const array = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
      let binary = '';
      array.forEach((b) => { binary += String.fromCharCode(b); });
      return btoa(binary);
    }

    function fromBase64(value) {
      const binary = atob(value);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    }

    async function deriveKey(passphrase, saltBytes) {
      const encoder = new TextEncoder();
      const baseKey = await crypto.subtle.importKey(
        'raw',
        encoder.encode(passphrase),
        'PBKDF2',
        false,
        ['deriveKey']
      );
      return crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: saltBytes,
          iterations: 120000,
          hash: 'SHA-256'
        },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
    }

    async function encryptValue(value, passphrase) {
      const encoder = new TextEncoder();
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const key = await deriveKey(passphrase, salt);
      const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoder.encode(value)
      );
      return JSON.stringify({
        v: 1,
        salt: toBase64(salt),
        iv: toBase64(iv),
        data: toBase64(new Uint8Array(ciphertext))
      });
    }

    async function decryptValue(payloadJson, passphrase) {
      const payload = JSON.parse(payloadJson);
      const salt = fromBase64(payload.salt);
      const iv = fromBase64(payload.iv);
      const data = fromBase64(payload.data);
      const key = await deriveKey(passphrase, salt);
      const plain = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        data
      );
      return new TextDecoder().decode(plain);
    }

    async function migrateLegacyIfNeeded(passphrase) {
      if (storedLegacyYoutubeKey && !storedYoutubeKeyEnc) {
        const enc = await encryptValue(storedLegacyYoutubeKey, passphrase);
        storage.set(YT_KEY_ENC, enc);
        storage.remove('student-helper-youtube-key');
      }
      if (storedLegacyAiKey && !storedAiApiKeyEnc) {
        const enc = await encryptValue(storedLegacyAiKey, passphrase);
        storage.set(AI_KEY_ENC, enc);
        storage.remove('student-helper-ai-api-key');
      }
    }

    async function unlockApiKeys() {
      const promptValue = apiAccessPromptInput ? apiAccessPromptInput.value.trim() : '';
      if (promptValue !== UNLOCK_PHRASE) {
        ErrorHandler.showNotification('Incorrect access API prompt', 'error');
        if (apiLockStatus) apiLockStatus.textContent = 'Unlock failed';
        return false;
      }

      try {
        await migrateLegacyIfNeeded(promptValue);
        const ytEnc = storage.get(YT_KEY_ENC) || '';
        const aiEnc = storage.get(AI_KEY_ENC) || '';

        window.YOUTUBE_API_KEY = ytEnc ? await decryptValue(ytEnc, promptValue) : '';
        window.AI_API_KEY = aiEnc ? await decryptValue(aiEnc, promptValue) : '';
        window.API_KEYS_UNLOCKED = true;

        if (youtubeInput) youtubeInput.value = window.YOUTUBE_API_KEY || '';
        if (aiApiKeyInput) aiApiKeyInput.value = window.AI_API_KEY || '';
        if (apiLockStatus) apiLockStatus.textContent = 'API keys unlocked in this session';
        ErrorHandler.showNotification('API keys unlocked', 'success');
        return true;
      } catch (error) {
        window.API_KEYS_UNLOCKED = false;
        window.YOUTUBE_API_KEY = '';
        window.AI_API_KEY = '';
        if (apiLockStatus) apiLockStatus.textContent = 'Unlock failed';
        ErrorHandler.showNotification('Could not unlock encrypted API keys', 'error');
        return false;
      }
    }

    if (unlockApiBtn) {
      unlockApiBtn.addEventListener('click', () => {
        unlockApiKeys();
      });
    }

    applyTheme(storedTheme);

    if (!saveBtn) {
      return;
    }

    saveBtn.addEventListener('click', async () => {
      const key = youtubeInput ? youtubeInput.value.trim() : '';
      const accessPrompt = apiAccessPromptInput ? apiAccessPromptInput.value.trim() : '';
      const apiProxyUrl = apiProxyInput ? apiProxyInput.value.trim() : 'http://127.0.0.1:8787';
      const plagiarismApiUrl = plagiarismApiInput ? plagiarismApiInput.value.trim() : 'http://127.0.0.1:8765';
      const aiApiKey = aiApiKeyInput ? aiApiKeyInput.value.trim() : '';
      const aiModel = aiModelInput ? aiModelInput.value.trim() : 'gemini-1.5-flash';
      const aiApiBaseUrl = aiApiBaseUrlInput ? aiApiBaseUrlInput.value.trim() : 'https://api.openai.com/v1';
      const name = userNameInput ? userNameInput.value.trim() : '';
      const theme = themeSelect ? themeSelect.value : 'dark';

      if ((key || aiApiKey) && accessPrompt !== UNLOCK_PHRASE) {
        ErrorHandler.showNotification('Type :Gemini33 in Access API Prompt to save API keys', 'error');
        return;
      }

      try {
        if (key) {
          const encKey = await encryptValue(key, UNLOCK_PHRASE);
          storage.set(YT_KEY_ENC, encKey);
        } else {
          storage.remove(YT_KEY_ENC);
        }
        storage.remove('student-helper-youtube-key');
      } catch (_) {
        ErrorHandler.showNotification('Failed to encrypt YouTube key', 'error');
        return;
      }

      const sanitizedApiUrl = plagiarismApiUrl || 'http://127.0.0.1:8765';
      const sanitizedProxyUrl = apiProxyUrl || 'http://127.0.0.1:8787';
      storage.set('student-helper-api-proxy-url', sanitizedProxyUrl);
      window.API_PROXY_URL = sanitizedProxyUrl;

      storage.set('student-helper-plagiarism-api-url', sanitizedApiUrl);
      window.PLAGIARISM_API_URL = sanitizedApiUrl;

      try {
        if (aiApiKey) {
          const encAiKey = await encryptValue(aiApiKey, UNLOCK_PHRASE);
          storage.set(AI_KEY_ENC, encAiKey);
        } else {
          storage.remove(AI_KEY_ENC);
        }
        storage.remove('student-helper-ai-api-key');
      } catch (_) {
        ErrorHandler.showNotification('Failed to encrypt AI key', 'error');
        return;
      }
      storage.set('student-helper-ai-model', aiModel || 'gemini-1.5-flash');
      storage.set('student-helper-ai-api-base-url', aiApiBaseUrl || 'https://api.openai.com/v1');
      window.AI_API_KEY = accessPrompt === UNLOCK_PHRASE ? aiApiKey : '';
      window.YOUTUBE_API_KEY = accessPrompt === UNLOCK_PHRASE ? key : '';
      window.API_KEYS_UNLOCKED = accessPrompt === UNLOCK_PHRASE;
      window.AI_MODEL = aiModel || 'gemini-1.5-flash';
      window.AI_API_BASE_URL = aiApiBaseUrl || 'https://api.openai.com/v1';

      if (name) {
        storage.set('student-helper-username', name);
      } else {
        storage.remove('student-helper-username');
      }

      storage.set('student-helper-theme', theme);
      applyTheme(theme);
      if (apiLockStatus) {
        apiLockStatus.textContent = window.API_KEYS_UNLOCKED ? 'API keys unlocked in this session' : 'API keys are locked';
      }
      ErrorHandler.showNotification('Settings saved', 'success');
      window.dispatchEvent(new CustomEvent('settings-updated'));
    });
  } catch (error) {
    console.error('Failed to setup settings UI:', error);
  }
}

function applyTheme(theme) {
  try {
    const body = document.body;
    if (!body) {
      return;
    }

    body.classList.remove('theme-dark', 'theme-light');
    body.classList.add(theme === 'light' ? 'theme-light' : 'theme-dark');
  } catch (error) {
    console.error('applyTheme failed', error);
  }
}

function setupDataManagement() {
  const exportBtn = document.getElementById('export-data-btn');
  const importBtn = document.getElementById('import-data-btn');
  const importInput = document.getElementById('import-data-file');
  const clearBtn = document.getElementById('clear-data-btn');

  const dataKeys = () => storage.keys().filter((key) => key && key.startsWith('student-helper-'));

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const payload = {
        exportedAt: new Date().toISOString(),
        app: 'nora-student-helper',
        version: '1.1.0',
        data: {}
      };

      dataKeys().forEach((key) => {
        payload.data[key] = storage.get(key);
      });

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `nora-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);

      ErrorHandler.showNotification('Backup exported', 'success');
    });
  }

  if (importBtn && importInput) {
    importBtn.addEventListener('click', () => importInput.click());

    importInput.addEventListener('change', async () => {
      const file = importInput.files && importInput.files[0];
      if (!file) {
        return;
      }

      try {
        const raw = await file.text();
        const parsed = JSON.parse(raw);
        const data = parsed && typeof parsed === 'object' && parsed.data ? parsed.data : parsed;
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid import file format');
        }

        Object.entries(data).forEach(([key, value]) => {
          if (key.startsWith('student-helper-')) {
            storage.set(key, value);
          }
        });

        ErrorHandler.showNotification('Data imported. Refreshing...', 'success');
        setTimeout(() => window.location.reload(), 600);
      } catch (error) {
        ErrorHandler.showNotification('Import failed: ' + error.message, 'error');
      } finally {
        importInput.value = '';
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (!confirm('Clear all Student Helper data? This cannot be undone.')) {
        return;
      }

      dataKeys().forEach((key) => storage.remove(key));
      ErrorHandler.showNotification('All app data cleared', 'info');
      setTimeout(() => window.location.reload(), 500);
    });
  }
}

// Helper to increment simple stats from legacy callers
window.incrementStat = function incrementStat(key) {
  try {
    const statsKey = 'student-helper-stats';
    const stats = storage.get(statsKey) || {
      notesCreated: 0,
      grammarChecks: 0,
      flashcards: 0,
      classes: 0
    };

    switch (key) {
      case 'notes':
        stats.notesCreated = (stats.notesCreated || 0) + 1;
        break;
      case 'grammar':
        stats.grammarChecks = (stats.grammarChecks || 0) + 1;
        break;
      case 'flashcard':
      case 'flashcards':
        stats.flashcards = (stats.flashcards || 0) + 1;
        break;
      case 'class':
      case 'classes':
        stats.classes = (stats.classes || 0) + 1;
        break;
      default:
        break;
    }

    storage.set(statsKey, stats);
    window.dispatchEvent(new CustomEvent('stats-updated', { detail: stats }));
    return stats;
  } catch (error) {
    console.error('incrementStat failed:', error);
    return null;
  }
};
