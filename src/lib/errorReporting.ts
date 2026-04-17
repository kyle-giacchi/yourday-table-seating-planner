/**
 * Global error reporting setup.
 * In development: logs to console.
 * In production: could POST to an API endpoint (future enhancement).
 */
export function initErrorReporting(): void {
  window.addEventListener('error', (event) => {
    if (import.meta.env.DEV) {
      console.error('[ErrorReporting] Uncaught error:', event.error);
    }
    // Future: POST to /api/errors
  });

  window.addEventListener('unhandledrejection', (event) => {
    if (import.meta.env.DEV) {
      console.error('[ErrorReporting] Unhandled promise rejection:', event.reason);
    }
    // Future: POST to /api/errors
  });
}
