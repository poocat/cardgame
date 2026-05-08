import { CONFIG } from "@client/config";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

/******************************************************************************
 * ### apiUrl
 *
 * Prepends the configured API base URL to the given route path.
 ******************************************************************************/
export function apiUrl(path: string): string {
  return `${CONFIG.apiBaseUrl}${path}`;
}

type ApiQueryErrorType = "fetch" | "parse";
type ApiQueryError = { type: ApiQueryErrorType; message: string };

/******************************************************************************
 * ### useApiQuery
 *
 * A generic, if somewhat limited, hook for performing requests.
 *
 * A "generic query hook" is a problem already solved by TanStack Query or
 * Vercel SWR, but for a simple-enough use case, serves the application and
 * helps me understand the fetch API, abort signaling, callback references,
 * et cetera.
 ******************************************************************************/
export function useApiQuery<TResponse, TData>(opts: {
  /** Use to invalidate the current data. Changing the key will trigger a refetch. */
  key: string;
  /** When true, the query is disabled: no fetch runs, and `refetch()` is a no-op. Toggle to `false` to (re)enable. Existing `data` is retained across toggles; `loading` and `error` are reset. */
  skip?: boolean;
  /** Use to implement the "fetch" portion of the query. If any errors are caught in-flight, will be surfaced with "fetch" error type. */
  fetch: (signal: AbortSignal) => Promise<TResponse>;
  /** Use to implement the "parsing" portion of the query. If any errors are caught in-flight, will be indicated with "parse" error type.  */
  parse: (response: TResponse) => Promise<TData>;
}): {
  data: TData | undefined;
  error: ApiQueryError | null;
  /** True while waiting for `fetch` and `parse` to resolve. */
  loading: boolean;
  refetch: () => void;
} {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TData | undefined>(undefined);
  const [error, setError] = useState<ApiQueryError | null>(null);

  /**
   * Set up mechanism for refetching based on user input.
   */
  const [refetchCount, setRefetchCount] = useState(0);
  const refetch = () => setRefetchCount((n) => n + 1);

  /**
   * Use the "latest ref" pattern to ensure that the effect (below) always
   * uses the latest version of the `fetch` and `parse` callbacks, which
   * are not guaranteed to be referentially stable (the caller might not memoize
   * them).
   *
   * This lets us avoid having to use the callbacks as effect dependencies.
   */
  const fetchRef = useRef(opts.fetch);
  const parseRef = useRef(opts.parse);
  useLayoutEffect(() => {
    fetchRef.current = opts.fetch;
    parseRef.current = opts.parse;
  });

  /**
   * Execution of the query. Runs once on mount, and again whenever the refetch
   * counter is bumped.
   */
  useEffect(() => {
    // Linter wants us to use all the deps.
    void opts.key;
    void refetchCount;
    /**
     * If skipping, reset "loading" flag and null the error, then return.
     * Preserve data, so toggling "skip" doesn't invalidate previous queries.
     */
    if (opts.skip) {
      setLoading(false);
      setError(null);
      return;
    }
    // Create an abort controller for this query.
    const abortController = new AbortController();
    setLoading(true);
    setError(null);
    /**
     * Setup and call asynchronous function.
     *
     * Effects are synchronous, but we can start an asynchronous process.
     *
     * Uses the IIAF (Immediately Invoked Anonymous Function) pattern.
     */
    (async () => {
      let phase: ApiQueryErrorType = "fetch";
      try {
        // Attempt the "fetch" and "parse" phases in series, capturing the phase
        // in case an error gets thrown. So long as effect is not aborted, set
        // data once it finishes parsing.
        const response = await fetchRef.current(abortController.signal);
        phase = "parse";
        const parsed = await parseRef.current(response);
        if (!abortController.signal.aborted) {
          setData(parsed);
        }
      } catch (e) {
        // If any exceptions were thrown, so long as effect is not aborted,
        // surface the error.
        if (!abortController.signal.aborted) {
          const message = e instanceof Error ? e.message : String(e);
          setError({ type: phase, message });
          console.error(`${phase} error: ${message}`);
        }
      } finally {
        // Regardless if of exception is thrown or caught, so long as effect is
        // not aborted, reset "loading" flag.
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    })();
    /**
     * If dependencies change in rapid succession, the abort controller will
     * send an "abort" signal.
     */
    return () => abortController.abort();
  }, [refetchCount, opts.key, opts.skip]);

  return {
    data,
    error,
    loading,
    refetch,
  };
}
