import { useEffect, useRef } from 'react';

/**
 * Smart HTTP Polling Hook for Render Free Tier & React.
 *
 * Supports both signatures:
 * 1) usePolling(asyncCallback, intervalMs, enabled, deps)
 * 2) usePolling(asyncCallback, { intervalMs, enabled, pauseOnHidden }, deps)
 *
 * Guarantees:
 * - Tab-switching in single-browser multi-tab testing never permanently halts polling.
 * - Sequential execution prevents request stacking on network latency.
 * - Immediate poll trigger on tab focus (visibilitychange) ensures fresh telemetry.
 */
export const usePolling = (
  asyncCallback,
  intervalOrOptions = 3000,
  enabledParam = true,
  deps = []
) => {
  let intervalMs = 3000;
  let enabled = true;
  let pauseOnHidden = false; // Default false so multi-tab demo syncs smoothly

  if (typeof intervalOrOptions === 'object' && intervalOrOptions !== null) {
    intervalMs = Number(intervalOrOptions.intervalMs) || 3000;
    enabled = intervalOrOptions.enabled !== undefined ? Boolean(intervalOrOptions.enabled) : true;
    pauseOnHidden = Boolean(intervalOrOptions.pauseOnHidden);
  } else {
    intervalMs = Number(intervalOrOptions) || 3000;
    enabled = Boolean(enabledParam);
  }

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
      // If configured to pause on hidden tab, skip this tick but still keep loop alive
      if (pauseOnHidden && typeof document !== 'undefined' && document.hidden) {
        if (isSubscribed && enabled) {
          timerRef.current = setTimeout(executePoll, intervalMs);
        }
        return;
      }

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

    // Immediate re-poll on tab visibility change
    const handleVisibilityChange = () => {
      if (typeof document === 'undefined') return;
      if (!document.hidden && enabled && isSubscribed) {
        if (timerRef.current) clearTimeout(timerRef.current);
        executePoll();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      isSubscribed = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (activeControllerRef.current) {
        try {
          activeControllerRef.current.abort();
        } catch (_) {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs, enabled, pauseOnHidden, ...deps]);
};

export default usePolling;
