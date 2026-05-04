import { useCallback, useEffect, useRef, useState } from "react";

type SubmissionResult = { ok: true } | { ok: false; error: string };

type UseSubmissionHook = {
  submitting: boolean;
  error: string | null;
  /** Use to fire the given asynchronous submission handler and set `submitting` to true. */
  handle: (handler: () => Promise<SubmissionResult>) => Promise<void>;
};

/******************************************************************************
 * ### useSubmission
 *
 * Tracks the state of a user-initiated submission process, exposing a
 * `submitting` flag that can be used for debouncing and providing feedback.
 *
 * Two modes:
 * - One-shot: if `pendingSnapshot` is not defined, `submitting` will only be
 *   held true while the handler is running.
 *
 * - Polling-aware: if `pendingSnapshot` is defined, `submitting` is held true
 *   even after the handler resolves, until the snapshot changes. Use to keep
 *   the UI locked until a follow-up poll confirms that the remote state has
 *   advanced. Combine with `pollError` to ensure that a failed post-submit
 *   poll request does not keep the UI locked indefinitely.
 ******************************************************************************/
export function useSubmission(opts?: {
  /** If defined, a true `submitting` state will be locked until a different value is passed. Use with an etag or update timestamp when polling. */
  pendingSnapshot?: string | null;
  /** If `pendingSnapshot` is defined, a true `submitting` state will be released upon a change in the value passed. */
  pollError?: string | null;
}): UseSubmissionHook {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prevSnapshotRef = useRef<string | null>(null);
  const prevPollErrorRef = useRef<string | null>(null);
  const pollingAware = opts?.pendingSnapshot !== undefined;
  const pendingSnapshot = opts?.pendingSnapshot ?? null;
  const pollError = opts?.pollError ?? null;

  const handle = useCallback(
    async (handler: () => Promise<SubmissionResult>) => {
      if (submitting) return;
      prevSnapshotRef.current = pendingSnapshot;
      prevPollErrorRef.current = pollError;
      setSubmitting(true);
      setError(null);
      try {
        const result = await handler();
        if (!result.ok) {
          setError(result.error);
          setSubmitting(false);
          return;
        }
        if (!pollingAware) setSubmitting(false);
      } catch {
        setError("Network error.");
        setSubmitting(false);
      }
    },
    [submitting, pendingSnapshot, pollError, pollingAware],
  );

  // Polling-aware unlock: release once the snapshot advances past what was
  // current at submit time.
  useEffect(() => {
    if (!submitting || !pollingAware) return;
    if (pendingSnapshot && pendingSnapshot !== prevSnapshotRef.current) {
      setSubmitting(false);
      prevSnapshotRef.current = null;
    }
  }, [submitting, pollingAware, pendingSnapshot]);

  // Failsafe: if the bound poll errors out post-submit, release the lock so
  // the UI doesn't deadlock waiting for a poll that will never arrive. Only
  // fires for errors that newly appear after submit. Pre-existing errors
  // shouldn't trigger this immediately on click.
  useEffect(() => {
    if (!submitting || !pollingAware || !pollError) return;
    if (pollError === prevPollErrorRef.current) return;
    setSubmitting(false);
    setError("Couldn't confirm submission. Please refresh.");
    prevSnapshotRef.current = null;
  }, [submitting, pollingAware, pollError]);

  return { submitting, error, handle };
}
