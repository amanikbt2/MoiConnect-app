import { useState, useRef, useEffect, useCallback } from 'react';
import { Platform, Keyboard } from 'react-native';

export interface UseSearchFocusOptions {
  onDismiss?: () => void;
  blurDelayMs?: number;
}

/**
 * Smart hook for search input focus management:
 * - Shows autocomplete suggestions only while focused
 * - Automatically dismisses on blur or when clicking / tapping outside
 * - Supports keyboard dismissal, Escape key, and safe debounce for suggestion item selection
 */
export function useSearchFocus(options: UseSearchFocusOptions = {}) {
  const { onDismiss, blurDelayMs = 200 } = options;
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<any>(null);
  const blurTimerRef = useRef<any>(null);

  const handleSearchFocus = useCallback(() => {
    if (blurTimerRef.current) {
      clearTimeout(blurTimerRef.current);
      blurTimerRef.current = null;
    }
    setIsSearchFocused(true);
  }, []);

  const handleSearchBlur = useCallback(() => {
    if (blurTimerRef.current) {
      clearTimeout(blurTimerRef.current);
    }
    blurTimerRef.current = setTimeout(() => {
      setIsSearchFocused(false);
      onDismiss?.();
    }, blurDelayMs);
  }, [blurDelayMs, onDismiss]);

  const closeSearch = useCallback(() => {
    if (blurTimerRef.current) {
      clearTimeout(blurTimerRef.current);
      blurTimerRef.current = null;
    }
    setIsSearchFocused(false);
    onDismiss?.();
    try {
      Keyboard.dismiss();
    } catch {
      // Ignore in environments where Keyboard is unavailable
    }
  }, [onDismiss]);

  // Click outside & Escape key listeners for Web / Desktop
  useEffect(() => {
    if (Platform.OS !== 'web' || !isSearchFocused) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (!searchContainerRef.current) return;
      const target = e.target as Node | null;
      if (target && typeof searchContainerRef.current.contains === 'function') {
        if (!searchContainerRef.current.contains(target)) {
          closeSearch();
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeSearch();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSearchFocused, closeSearch]);

  // Clean up blur timer on unmount
  useEffect(() => {
    return () => {
      if (blurTimerRef.current) {
        clearTimeout(blurTimerRef.current);
      }
    };
  }, []);

  return {
    isSearchFocused,
    setIsSearchFocused,
    searchContainerRef,
    handleSearchFocus,
    handleSearchBlur,
    closeSearch,
  };
}
