import { useEffect, useRef } from 'react';

/**
 * Smart HTTP Polling Hook for Render Free Tier & React.
 *
 * Features:
 * 1. Sequential execution with AbortController to cancel stale in-flight requests.
 * 2. Document visibility listener: Automatically pauses when document.hidden is true
 *    (saving battery/network) and resumes immediately upon returning to the tab.
 * 3. Prevents request stacking if a cycle takes longer than intervalMs.
 * 4. Silently handles component unmount and standard abort cancellations.
 *
 * @param {Function} asyncCallback - Async function executed on each poll tick: async ({ signal }) => { ... }
 * @param {number} intervalMs - Polling interval in milliseconds (default: 3000ms).
 * @param {boolean} enabled - Whether polling should be active (default: true).
 * @param {Array} deps - Optional dependency list that restarts the polling loop when values change.
 */
export const usePolling = (asyncCallback, intervalMs = 3000, enabled = true, deps = []) => {
  const savedCallback = useRef(asyncCallback);
  const activeControllerRef = useRef(null);
  const isExecutingRef = useRef(false);
  const timerRef = useRef(null);

  // Keep latest callback reference fresh without restarting timer
  useEffect(() => {
    savedCallback.current = asyncCallback;
  }, [asyncCallback]);

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (activeControllerRef.current) {
        try {
          activeControllerRef.current.abort();
        } catch (_) {}
      }
      return;
    }

    let isSubscribed = true;

    const executePoll = async () => {
      // Pause polling if the tab is hidden or a previous cycle is currently awaiting
      if (typeof document !== 'undefined' && document.hidden) return;
      if (isExecutingRef.current) return;

      isExecutingRef.current = true;
      const controller = new AbortController();
      activeControllerRef.current = controller;

      try {
        await savedCallback.current({ signal: controller.signal });
      } catch (err) {
        // Suppress expected cancellation errors
        const isAbort =
          err?.name === 'AbortError' ||
          err?.name === 'CanceledError' ||
          err?.code === 'ERR_CANCELED';
        if (!isAbort) {
          console.debug('[usePolling] Poll error:', err?.message || err);
        }
      } finally {
        isExecutingRef.current = false;
        if (isSubscribed && enabled) {
          // Schedule next tick sequentially to prevent stacking
          timerRef.current = setTimeout(executePoll, intervalMs);
        }
      }
    };

    // Initial immediate invocation
    executePoll();

    // Pause/Resume on tab visibility change
    const handleVisibilityChange = () => {
      if (typeof document === 'undefined') return;
      if (!document.hidden && enabled && isSubscribed) {
        if (timerRef.current) clearTimeout(timerRef.current);
        executePoll();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isSubscribed = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (activeControllerRef.current) {
        try {
          activeControllerRef.current.abort();
        } catch (_) {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs, enabled, ...deps]);
};

export default usePolling;
