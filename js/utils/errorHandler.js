/**
 * Global Error Handler
 * Manages all errors and displays user-friendly notifications
 */
class ErrorHandler {
  static initialized = false;

  static init() {
    if (this.initialized) {
      return;
    }
    this.initialized = true;

    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      this.logError('Uncaught Error', event.error);
      this.showNotification('Something went wrong. Please refresh the page.', 'error');
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError('Unhandled Promise Rejection', event.reason);
      event.preventDefault();
      this.showNotification('Network error. Please try again.', 'error');
    });
  }

  static logError(type, error) {
    console.error(`[${type}]`, error);
    // In production, you could send to a logging service like Sentry
    // Sentry.captureException(error);
  }

  static showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in forwards';
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }
}

// Initialize error handling on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ErrorHandler.init());
} else {
  ErrorHandler.init();
}
