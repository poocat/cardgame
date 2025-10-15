import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type UsePollerHook<TData> = {
  /** The most recently fetched data. */
  data: TData | null;
  /** Indicates that the poller is currently fetching new data. */
  loading: boolean;
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
 * A hook to support a specific polling procedure using HTTP GET and HEAD
 * requests to an endpoint that provides the "last updated" timestamp for
 * the associated date in the response headers.
 *
 * 1. GET fetch resource, get "last updated" timestamp from headers and store.
 * 2. Check data for whether to keep polling. If not, skip to 6.
 * 3. HEAD fetch after delay for the latest "last updated" timestamp.
 * 4. If no change in the timestamp from server, go back to 3.
 * 5. Else, go back to 1.
 * 6. Wait for user to initiate another fetch, then go back to 1.
 ******************************************************************************/
export function usePoller<TData extends object>(args: {
  /** The endpoint for the resource to poll/fetch. */
  url: string;
  /** Specifies what the polling interval should be, based on how long the poller has been polling. */
  getIntervalMs: (elapsedTimeMs: number) => number;
  /** Specifies how the timestamp is extracted from the GET and HEAD response headers. */
  getLastUpdated: (headers: Headers) => Date | null;
  /** Specifies how data is extracted from the GET response. */
  getData: (response: Response) => Promise<TData>;
  /** Specifies the conditions under which to continue polling. */
  getPollingEnabled: (data: TData) => boolean;
  /** Query params that will be appended to the url when fetching data with a GET request. */
  fetchQuery?: Record<string, string>;
}): UsePollerHook<TData> {
  const [polling, setPolling] = useState(true);
  const [pollCount, setPollCount] = useState(0);
  const [elapsedTimeMs, setElapsedTimeMs] = useState(0);
  const [data, setData] = useState<TData | null>(null);
  const [loading, setLoading] = useState(false);
  const lastUpdatedRef = useRef<Date | null>(null);
  const intervalIdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Build a stable url for fetching the resource.
  const fetchUrl = useMemo(() => {
    if (!args.fetchQuery) return args.url;
    const params = new URLSearchParams(args.fetchQuery);
    return `${args.url}?${params.toString()}`;
  }, [args.url, args.fetchQuery]);

  // Use to fetch the resource in full.
  const fetchResource = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(fetchUrl, { method: "GET" });
      const newData = await args.getData(response);
      setData(newData);
      lastUpdatedRef.current = args.getLastUpdated(response.headers);
    } finally {
      setLoading(false);
    }
  }, [fetchUrl, args.getData, args.getLastUpdated]);

  // Use to fetch the headers, in order to get the latest update timestamp.
  const fetchLastUpdatedAt = useCallback(async () => {
    try {
      const response = await fetch(args.url, { method: "HEAD" });
      if (!response.ok) throw new Error(`HEAD failed: ${response.status}`);
      const current = args.getLastUpdated(response.headers);
      const prev = lastUpdatedRef.current;
      if (current && current.getTime() !== prev?.getTime()) {
        await fetchResource();
      }
    } catch (err) {
      console.error("[usePoller] Error:", err);
    }
  }, [args.url, args.getLastUpdated, fetchResource]);

  // Use to update the polling count and elapsed time.
  const updatePollClock = (intervalMs: number) => {
    setPollCount((i) => i + 1);
    setElapsedTimeMs((t) => t + intervalMs);
  };

  // Manage change in polling state.
  if (polling) {
    if (data && !args.getPollingEnabled(data)) {
      setPolling(false);
    }
  } else {
    if (!data || args.getPollingEnabled(data)) {
      setPolling(true);
      setPollCount(0);
      setElapsedTimeMs(0);
      fetchLastUpdatedAt().then(() => updatePollClock(0));
    }
  }
  if (pollCount >= 100) {
    setPolling(false);
  }

  // Setup polling loop.
  useEffect(() => {
    if (!polling) {
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
      return;
    }
    const nextIntervalMs = args.getIntervalMs(elapsedTimeMs);
    const poll = async () => {
      fetchLastUpdatedAt().then(() => updatePollClock(nextIntervalMs));
    };
    intervalIdRef.current = setInterval(poll, nextIntervalMs);
    return () => {
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
    };
  }, [polling, fetchLastUpdatedAt, args.getIntervalMs, elapsedTimeMs]);

  return polling
    ? {
        data,
        loading,
        polling: true,
        pollCount,
        pollTimeMs: elapsedTimeMs,
        fetchOnce: undefined,
      }
    : {
        data,
        loading,
        polling: false,
        pollCount,
        pollTimeMs: elapsedTimeMs,
        fetchOnce: fetchResource,
      };
}
