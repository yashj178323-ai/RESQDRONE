import { useCallback, useEffect, useState } from 'react';

/**
 * Application-level focus mode. It hides the shell chrome rather than entering
 * browser fullscreen, so the operator keeps their tab bar and alerts.
 */
let listeners: ((value: boolean) => void)[] = [];
let current = false;

export function useFocusMode() {
  const [focus, setFocus] = useState(current);

  useEffect(() => {
    const listener = (value: boolean) => setFocus(value);
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  const set = useCallback((value: boolean) => {
    current = value;
    listeners.forEach((l) => l(value));
  }, []);

  const toggle = useCallback(() => set(!current), [set]);

  return { focus, set, toggle };
}
