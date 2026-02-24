/**
 * Grammar Check Module
 * Integrates with LanguageTool API for grammar checking
 */
class GrammarModule {
  constructor() {
    this.API_URL = 'https://api.languagetool.org/v2/check';
    this.LANGUAGE = 'en-US';
    this.REQUEST_TIMEOUT = 10000; // 10 seconds
    this.statsKey = 'student-helper-stats';
  }

  escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  async fetchWithTimeout(url, options = {}, timeout = 5000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async check(text) {
    try {
      // Validate input
      Validators.validateTextInput(text, 10, 5000);

      const sanitizedText = Validators.sanitizeInput(text);

      const response = await this.fetchWithTimeout(
        this.API_URL,
        {
          method: 'POST',
          body: new URLSearchParams({
            text: sanitizedText,
            language: this.LANGUAGE
          })
        },
        this.REQUEST_TIMEOUT
      );

      const data = await response.json();
      const matches = data.matches || [];

      // Update stats
      this.updateStats();

      return {
        errors: matches,
        message: matches.length > 0
          ? `Found ${matches.length} issue${matches.length !== 1 ? 's' : ''}`
          : 'No errors found! ✓'
      };
    } catch (error) {
      console.error('Grammar check failed:', error);
      throw error;
    }
  }

  displayResults(result) {
    const resultsDiv = document.getElementById('grammar-results');
    if (!resultsDiv) return;

    if (result.errors.length === 0) {
      resultsDiv.innerHTML = `
        <div class="card grammar-success-card">
          <p class="grammar-success-text">✓ ${this.escapeHtml(result.message)}</p>
        </div>
      `;
      return;
    }

    let html = '<div class="grammar-results-list">';

    result.errors.forEach((error, index) => {
      const suggestions = (error.replacements || [])
        .slice(0, 3)
        .map((r) => `<code>${this.escapeHtml(r.value)}</code>`)
        .join(', ');

      html += `
        <div class="card grammar-issue-card">
          <div class="grammar-issue-header">
            <strong class="grammar-issue-title">Issue ${index + 1}:</strong>
            <span class="grammar-issue-desc">${this.escapeHtml(error.rule.description)}</span>
          </div>
          <div class="grammar-context">
            <em>"${this.escapeHtml(error.context.text)}"</em>
          </div>
          ${suggestions ? `<div class="grammar-suggestions">
            <strong>Suggestions:</strong> ${suggestions}
          </div>` : ''}
        </div>
      `;
    });

    html += '</div>';
    resultsDiv.innerHTML = html;
  }

  updateStats() {
    try {
      const stats = storage.get(this.statsKey) || {
        notesCreated: 0,
        grammarChecks: 0,
        flashcards: 0,
        classes: 0
      };

      stats.grammarChecks = (stats.grammarChecks || 0) + 1;
      storage.set(this.statsKey, stats);
      window.dispatchEvent(new CustomEvent('stats-updated', { detail: stats }));
    } catch (error) {
      console.error('Failed to update stats:', error);
    }
  }
}

// Create global instance
const grammarModule = new GrammarModule();

// Setup event listeners
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupGrammarListeners);
} else {
  setupGrammarListeners();
}

function setupGrammarListeners() {
  const checkBtn = document.getElementById('check-grammar-btn');
  const inputField = document.getElementById('grammar-input');

  if (checkBtn) {
    checkBtn.addEventListener('click', async () => {
      const text = inputField.value;

      if (!text.trim()) {
        ErrorHandler.showNotification('Please enter some text to check', 'error');
        return;
      }

      checkBtn.disabled = true;
      checkBtn.innerHTML = '<span class="spinner"></span> Checking...';

      try {
        const result = await grammarModule.check(text);
        grammarModule.displayResults(result);
        ErrorHandler.showNotification(result.message, 'info');
      } catch (error) {
        ErrorHandler.showNotification(error.message, 'error');
      } finally {
        checkBtn.disabled = false;
        checkBtn.innerHTML = 'Check Grammar';
      }
    });

    // Allow Enter key to trigger check
    inputField.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        checkBtn.click();
      }
    });
  }
}
