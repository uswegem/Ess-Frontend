import { useCallback, useEffect, useRef, useState } from 'react';

const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
const SYNC_STORAGE_KEY = 'idle-logout-event';

// Idle-based session timeout, app-wide. Tracks user activity and forces logout after
// `timeout` ms of inactivity, showing a countdown warning starting `warningTime` ms before
// that. Multi-tab: a logout in one tab (or a natural timeout there) broadcasts via a
// storage event so every other open tab logs out too, rather than staying authenticated.
export function useIdleLogout({ enabled, timeout, warningTime, onLogout }) {
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(Math.ceil(warningTime / 1000));

  const warningTimerRef = useRef(null);
  const logoutTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  const clearAllTimers = useCallback(() => {
    clearTimeout(warningTimerRef.current);
    clearTimeout(logoutTimerRef.current);
    clearInterval(countdownIntervalRef.current);
  }, []);

  const doLogout = useCallback(
    (broadcast = true) => {
      clearAllTimers();
      setShowWarning(false);
      if (broadcast) {
        localStorage.setItem(SYNC_STORAGE_KEY, String(Date.now()));
      }
      onLogout();
    },
    [clearAllTimers, onLogout]
  );

  const resetTimers = useCallback(() => {
    if (!enabled) return;
    clearAllTimers();
    setShowWarning(false);
    setCountdown(Math.ceil(warningTime / 1000));

    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      let remaining = Math.ceil(warningTime / 1000);
      setCountdown(remaining);
      countdownIntervalRef.current = setInterval(() => {
        remaining -= 1;
        setCountdown(remaining);
        if (remaining <= 0) {
          clearInterval(countdownIntervalRef.current);
        }
      }, 1000);
    }, Math.max(timeout - warningTime, 0));

    logoutTimerRef.current = setTimeout(() => {
      doLogout(true);
    }, timeout);
  }, [enabled, timeout, warningTime, clearAllTimers, doLogout]);

  useEffect(() => {
    if (!enabled) {
      clearAllTimers();
      setShowWarning(false);
      return undefined;
    }

    resetTimers();

    const handleActivity = () => {
      resetTimers();
    };
    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, handleActivity));

    const handleStorage = (e) => {
      if (e.key === SYNC_STORAGE_KEY) {
        doLogout(false);
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, handleActivity));
      window.removeEventListener('storage', handleStorage);
      clearAllTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return {
    showWarning,
    countdown,
    stayLoggedIn: resetTimers,
    logoutNow: () => doLogout(true),
  };
}
