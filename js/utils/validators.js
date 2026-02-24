/**
 * Input Validators
 * Validates and sanitizes user input for security and data integrity
 */
class Validators {
  static isEmpty(text) {
    return !text || text.trim().length === 0;
  }

  static exceedsLength(text, maxLength) {
    return text.length > maxLength;
  }

  static isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  static validateTextInput(text, minLength = 1, maxLength = 50000) {
    if (this.isEmpty(text)) {
      throw new Error('Please enter some text');
    }
    if (text.length < minLength) {
      throw new Error(`Text must be at least ${minLength} characters`);
    }
    if (this.exceedsLength(text, maxLength)) {
      throw new Error(`Text cannot exceed ${maxLength} characters`);
    }
    return true;
  }

  static sanitizeInput(text) {
    if (!text) return '';
    
    // Trim whitespace
    let sanitized = text.trim();
    
    // Limit size
    sanitized = sanitized.substring(0, 50000);
    
    // Remove potentially dangerous characters while preserving formatting
    sanitized = sanitized.replace(/[<>]/g, '');
    
    return sanitized;
  }

  static sanitizeHTML(html) {
    if (!window.DOMPurify) {
      console.warn('DOMPurify not loaded, using basic sanitization');
      return this.sanitizeInput(html);
    }
    
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
      ALLOWED_ATTR: ['href', 'title', 'target']
    });
  }

  static validateClassname(name) {
    if (this.isEmpty(name)) {
      throw new Error('Class name cannot be empty');
    }
    if (name.length > 100) {
      throw new Error('Class name is too long');
    }
    return true;
  }

  static validateFlashcardSet(name) {
    if (this.isEmpty(name)) {
      throw new Error('Flashcard set name cannot be empty');
    }
    if (name.length > 100) {
      throw new Error('Set name is too long');
    }
    return true;
  }
}
