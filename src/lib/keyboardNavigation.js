/**
 * 200X Builder - Keyboard Navigation System
 * Accessibility-first keyboard shortcuts and navigation
 * 
 * @version 3.0.0
 * @status ENHANCED
 */

import { useEffect, useCallback, useRef } from 'react';

// Keyboard shortcut definitions
const KEYBOARD_SHORTCUTS = {
  // Navigation
  'goHome': { key: 'h', modifiers: ['alt'], description: 'Go to home page' },
  'goBack': { key: 'ArrowLeft', modifiers: ['alt'], description: 'Go back' },
  'goForward': { key: 'ArrowRight', modifiers: ['alt'], description: 'Go forward' },
  'focusSearch': { key: 'k', modifiers: ['meta'], description: 'Focus search' },
  
  // Page-specific
  'save': { key: 's', modifiers: ['meta'], description: 'Save' },
  'refresh': { key: 'r', modifiers: ['meta'], description: 'Refresh data' },
  'print': { key: 'p', modifiers: ['meta'], description: 'Print' },
  
  // Accessibility
  'toggleTheme': { key: 't', modifiers: ['alt'], description: 'Toggle theme' },
  'skipToContent': { key: 'Enter', modifiers: [], description: 'Skip to main content', target: 'data-skip-link' },
  
  // Admin
  'openGodMode': { key: 'g', modifiers: ['alt', 'shift'], description: 'Open God Mode', adminOnly: true },
  'toggleDebug': { key: 'd', modifiers: ['alt', 'shift'], description: 'Toggle debug mode', adminOnly: true },
};

/**
 * Check if modifiers match
 */
const matchModifiers = (event, modifiers) => {
  if (!modifiers || modifiers.length === 0) return true;
  
  return modifiers.every(mod => {
    switch (mod) {
      case 'meta':
        return event.metaKey || event.ctrlKey;
      case 'ctrl':
        return event.ctrlKey;
      case 'alt':
        return event.altKey;
      case 'shift':
        return event.shiftKey;
      default:
        return false;
    }
  });
};

/**
 * React hook for keyboard shortcuts
 */
export const useKeyboardShortcut = (shortcutKey, callback, deps = []) => {
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  useEffect(() => {
    const shortcut = KEYBOARD_SHORTCUTS[shortcutKey];
    if (!shortcut) {
      console.warn(`Keyboard shortcut "${shortcutKey}" not found`);
      return;
    }
    
    const handleKeyDown = (event) => {
      // Don't trigger if user is typing in an input
      if (event.target.matches('input, textarea, [contenteditable]')) {
        return;
      }
      
      if (event.key === shortcut.key && matchModifiers(event, shortcut.modifiers)) {
        event.preventDefault();
        callbackRef.current(event);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcutKey, ...deps]);
};

/**
 * React hook for multiple keyboard shortcuts
 */
export const useKeyboardShortcuts = (shortcuts, deps = []) => {
  const callbacksRef = useRef(shortcuts);
  
  useEffect(() => {
    callbacksRef.current = shortcuts;
  }, [shortcuts]);
  
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Don't trigger if user is typing in an input
      if (event.target.matches('input, textarea, [contenteditable]')) {
        return;
      }
      
      for (const [key, callback] of Object.entries(callbacksRef.current)) {
        const shortcut = KEYBOARD_SHORTCUTS[key];
        if (!shortcut) continue;
        
        if (event.key === shortcut.key && matchModifiers(event, shortcut.modifiers)) {
          event.preventDefault();
          callback(event);
          break;
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, deps);
};

/**
 * Focus trap for modals and dialogs
 */
export const useFocusTrap = (isActive, containerRef) => {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;
    
    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    // Focus first element
    firstElement.focus();
    
    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };
    
    container.addEventListener('keydown', handleTabKey);
    return () => container.removeEventListener('keydown', handleTabKey);
  }, [isActive, containerRef]);
};

/**
 * Skip to content link
 */
export const SkipToContent = () => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-[1000] px-4 py-2 rounded font-semibold"
      style={{
        background: 'var(--brand-primary)',
        color: 'var(--text-inverse)'
      }}
      data-skip-link
    >
      Skip to main content
    </a>
  );
};

/**
 * Keyboard navigation help dialog
 */
export const KeyboardShortcutsHelp = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  
  const groupedShortcuts = Object.entries(KEYBOARD_SHORTCUTS).reduce((acc, [key, shortcut]) => {
    const category = shortcut.adminOnly ? 'Admin' : 
                     key.startsWith('go') ? 'Navigation' :
                     key.startsWith('toggle') || key === 'skipToContent' ? 'Accessibility' :
                     'General';
    
    if (!acc[category]) acc[category] = [];
    acc[category].push({ key, ...shortcut });
    return acc;
  }, {});
  
  const formatModifiers = (modifiers) => {
    return modifiers.map(m => {
      switch (m) {
        case 'meta': return '⌘';
        case 'ctrl': return 'Ctrl';
        case 'alt': return 'Alt';
        case 'shift': return 'Shift';
        default: return m;
      }
    }).join(' + ');
  };
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)' }}
      onClick={onClose}
    >
      <div 
        className="max-w-2xl w-full rounded-xl p-6 animate-scale-in"
        style={{
          background: 'var(--bg-glass)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--border-default)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
          Keyboard Shortcuts
        </h2>
        
        <div className="grid gap-6">
          {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--brand-primary)' }}>
                {category}
              </h3>
              <div className="space-y-2">
                {shortcuts.map(shortcut => (
                  <div key={shortcut.key} className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{shortcut.description}</span>
                    <kbd className="px-2 py-1 rounded text-sm font-mono" style={{ background: 'var(--bg-tertiary)' }}>
                      {formatModifiers(shortcut.modifiers)} {shortcut.modifiers.length > 0 ? '+' : ''} {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <button
          onClick={onClose}
          className="mt-6 w-full py-2 px-4 rounded-lg font-semibold"
          style={{ background: 'var(--brand-primary)', color: 'var(--text-inverse)' }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

/**
 * Announce page changes for screen readers
 */
export const usePageAnnounce = (pageName) => {
  useEffect(() => {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = `Navigated to ${pageName}`;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, [pageName]);
};

/**
 * Trap focus within element
 */
export const trapFocus = (element) => {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  if (focusableElements.length === 0) return () => {};
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  const handleTabKey = (e) => {
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  };
  
  element.addEventListener('keydown', handleTabKey);
  firstElement.focus();
  
  return () => element.removeEventListener('keydown', handleTabKey);
};

/**
 * Export all keyboard shortcuts for help display
 */
export const getAllKeyboardShortcuts = () => KEYBOARD_SHORTCUTS;

export default {
  useKeyboardShortcut,
  useKeyboardShortcuts,
  useFocusTrap,
  usePageAnnounce,
  SkipToContent,
  KeyboardShortcutsHelp,
  trapFocus,
  getAllKeyboardShortcuts,
  KEYBOARD_SHORTCUTS
};
