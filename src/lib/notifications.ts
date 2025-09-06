/**
 * Centralized notification system that integrates with the processing indicator
 * Replaces toast notifications with a unified top-center notification
 */

export interface NotificationOptions {
  message: string;
  duration?: number; // Duration in milliseconds, default 3000
  type?: 'info' | 'success' | 'error' | 'warning';
  generationId?: string; // Optional generation ID for progress reset
}

/**
 * Show a notification in the centralized processing indicator
 */
export function showNotification(options: NotificationOptions) {
  const { message, duration = 3000, type = 'info', generationId } = options;
  
  // Add type prefix for different notification types
  let prefixedMessage = message;
  switch (type) {
    case 'success':
      prefixedMessage = `✓ ${message}`;
      break;
    case 'error':
      prefixedMessage = `✗ ${message}`;
      break;
    case 'warning':
      prefixedMessage = `⚠ ${message}`;
      break;
    case 'info':
    default:
      prefixedMessage = message;
      break;
  }
  
  // Dispatch custom event to LoadingOverlay
  const event = new CustomEvent('app-notification', {
    detail: {
      message: prefixedMessage,
      duration,
      type,
      generationId
    }
  });
  
  window.dispatchEvent(event);
}

/**
 * Convenience functions for different notification types
 */
export const notify = {
  info: (message: string, duration?: number) => 
    showNotification({ message, duration, type: 'info' }),
    
  success: (message: string, duration?: number) => 
    showNotification({ message, duration, type: 'success' }),
    
  error: (message: string, duration?: number) => 
    showNotification({ message, duration, type: 'error' }),
    
  warning: (message: string, duration?: number) => 
    showNotification({ message, duration, type: 'warning' }),
};
