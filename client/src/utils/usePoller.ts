import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type UsePollerHook<TData> = {
  /** The most recently fetched data. */
  data: TData | null;
  error: string | null;
  pollCount: number;
  pollTimeMs: number;
} & (
  | {
      polling: true;
      fetchOnce: undefined;
    }
  | {
      polling: false;
      /** When poller is not currently polling, use to fetch manually. Can be used following requests that change the resource state, to jumpstart the polling loop. */
      fetchOnce: () => Promise<void>;
    }
);

/******************************************************************************
 * ### usePoller
 *
 * A hook to support a polling procedure on an endpoint that will accept a
 * "If-Modified-Since" header.
 *
 * 1. GET fetch resource, store ETag.
 * 2. Check data for whether to keep polling. If not, skip to 5.
 * 3. GET fetch after delay with "If-None-Match" header.
 * 4. If game is unmodified, go back to 3, else go back to 2.
 * 5. Wait for user to initiate another fetch, then go back to 1.
 *
 * If any fetch fails, the poller will stop polling until either the component
 * it's used in unmounts or the returned `fetchOnce` is called and runs without
 * error.
 *
 ******************************************************************************/
export function usePoller<TData extends object>(args: {
  /** The endpoint for the resource to poll/fetch. */
  url: string;
  /** Specifies what the polling interval should be, based on how long the poller has been polling. */
  getIntervalMs: (elapsedTimeMs: number) => number;
  /** Specifies how data is extracted from the GET response body. */
  getData: (response: Response) => Promise<TData>;
  /** Specifies the conditions under which to continue polling. */
  getPollingEnabled: (data: TData) => boolean;
}): UsePollerHook<TData> {
  const [polling, setPolling] = useState(true);
  const [pollCount, setPollCount] = useState(0);
  const [elapsedTimeMs, setElapsedTimeMs] = useState(0);
  const [data, setData] = useState<TData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const etag = useRef<string | null>(null);
  const intervalIdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Use to fetch the data, using the last updated timestamp to check if any
  // changes have been made to the resource.
  const fetchResource = useCallback(async () => {
    try {
      const headers =
        etag.current && polling
          ? { "If-None-Match": etag.current.toString() }
          : undefined;
      const response = await fetch(args.url, {
        method: "GET",
        cache: "no-store",
        headers,
      });
      if (response.status === 304) {
        // Not modified.
      } else if (response.ok) {
        etag.current = response.headers.get("ETag");
        const newData = await args.getData(response);
        setData(newData);
      } else {
        throw new Error(`Fetch failed: ${response.status}`);
      }
      setError(null);
    } catch (err) {
      const msg = `Poller Error: ${err}`;
      console.error("Poller Error:", err);
      setError(msg);
    }
  }, [polling, args.url, args.getData]);

  // Use to update the polling count and elapsed time.
  const updatePollClock = useCallback((intervalMs: number) => {
    setPollCount((i) => i + 1);
    setElapsedTimeMs((t) => t + intervalMs);
  }, []);

  // Examine the latest data to find out if polling should continue.
  const pollingEnabled = useMemo(
    () => !data || args.getPollingEnabled(data),
    [data, args.getPollingEnabled],
  );

  // Manage change in polling state.
  if (polling) {
    if (error || !pollingEnabled) {
      setPolling(false);
    }
  } else {
    if (!error && pollingEnabled) {
      setPolling(true);
      setPollCount(0);
      setElapsedTimeMs(0);
      fetchResource().then(() => updatePollClock(0));
    }
  }

  // Setup polling loop.
  useEffect(() => {
    if (!polling) {
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
      return;
    }
    const nextIntervalMs = args.getIntervalMs(elapsedTimeMs);
    const poll = async () => {
      fetchResource().then(() => updatePollClock(nextIntervalMs));
    };
    intervalIdRef.current = setInterval(poll, nextIntervalMs);
    return () => {
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
    };
  }, [
    polling,
    fetchResource,
    args.getIntervalMs,
    elapsedTimeMs,
    updatePollClock,
  ]);

  return polling
    ? {
        data,
        error,
        polling: true,
        pollCount,
        pollTimeMs: elapsedTimeMs,
        fetchOnce: undefined,
      }
    : {
        data,
        error,
        polling: false,
        pollCount,
        pollTimeMs: elapsedTimeMs,
        fetchOnce: fetchResource,
      };
}
