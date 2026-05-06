import { useCallback, useEffect, useRef, useState } from "react";

type SubmissionResult = { ok: true } | { ok: false; error: string };

type UseSubmissionHook = {
  submitting: boolean;
  error: string | null;
  /** Use to fire the given asynchronous submission handler and set `submitting` to true. */
  handle: (handler: () => Promise<SubmissionResult>) => Promise<void>;
};

type UseSubmissionOpts = (
  | { pollingAware?: false }
  | {
      pollingAware: true;
      /** Lock is held until this value changes. Use an etag or update timestamp from the bound poll. */
      pendingSnapshot: string | null;
      /** If this changes after submit, the lock is released as a failsafe against a deadlocked UI when the poll itself errors. */
      pollError?: string | null;
    }
) & {
  /**
   * Fires once a submission is confirmed:
   * - non-polling-aware: immediately when the handler returns `{ ok: true }`.
   * - polling-aware: after the snapshot advances post-success.
   *
   * Does NOT fire on `{ ok: false }` or on the failsafe pollError release.
   *
   * Use for local UI cleanup that must wait for the remote state to catch up
   * (e.g. closing a dialog, clearing the user's selection).
   */
  onSuccess?: () => void;
};

/******************************************************************************
 * ### useSubmission
 *
 * Tracks the state of a user-initiated submission process, exposing a
 * `submitting` flag that can be used for debouncing and providing feedback.
 *
 * Two modes:
 * - if `pollingAware` is false or undefined `submitting` will only be held
 *   true while the handler is running.
 * - if `pollingAware` is true, `submitting` is held true even after the handler
 *   resolves, until the snapshot changes. Use to keep the UI locked until a
 *   follow-up poll confirms that the remote state has advanced. Combine with
 *   `pollError` to ensure that a failed post-submit poll request does not keep
 *   the UI locked indefinitely.
 ******************************************************************************/
export function useSubmission(opts?: UseSubmissionOpts): UseSubmissionHook {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prevSnapshotRef = useRef<string | null>(null);
  const prevPollErrorRef = useRef<string | null>(null);

  const handlerSucceededRef = useRef(false);
  const onSuccessRef = useRef(opts?.onSuccess);
  onSuccessRef.current = opts?.onSuccess;

  const pollingAware = opts?.pollingAware === true;
  const pendingSnapshot = opts?.pollingAware ? opts.pendingSnapshot : null;
  const pollError = (opts?.pollingAware ? opts.pollError : null) ?? null;

  const handle = useCallback(
    async (handler: () => Promise<SubmissionResult>) => {
      if (submitting) return;
      prevSnapshotRef.current = pendingSnapshot;
      prevPollErrorRef.current = pollError;
      handlerSucceededRef.current = false;
      setSubmitting(true);
      setError(null);
      try {
        const result = await handler();
        if (!result.ok) {
          // Capture error and release lock.
          setError(result.error);
          setSubmitting(false);
        } else if (!pollingAware) {
          // Release lock, fire success handler immediately.
          setSubmitting(false);
          onSuccessRef.current?.();
        } else if (prevSnapshotRef.current !== pendingSnapshot) {
          // If a poll advanced the snapshot during the handler, the
          // snapshot-advance effect already released the lock — fire onSuccess
          // inline.
          onSuccessRef.current?.();
        } else {
          // Wait for next poll or error.
          handlerSucceededRef.current = true;
        }
      } catch {
        setError("Network error.");
        setSubmitting(false);
      }
    },
    [submitting, pendingSnapshot, pollError, pollingAware],
  );

  // Polling-aware unlock: release once the snapshot advances past what was
  // current at submit time. Fires onSuccess only if the handler actually
  // succeeded (not when the failsafe path zeroed the ref). Advances the ref
  // to the new snapshot so a still-in-flight handler can detect that the
  // snapshot moved out from under it.
  useEffect(() => {
    if (!submitting || !pollingAware) return;
    if (pendingSnapshot && pendingSnapshot !== prevSnapshotRef.current) {
      setSubmitting(false);
      prevSnapshotRef.current = pendingSnapshot;
      if (handlerSucceededRef.current) {
        handlerSucceededRef.current = false;
        onSuccessRef.current?.();
      }
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
    // Leave prevSnapshotRef at its submit-time value so an in-flight handler
    // can tell its lock was released by the failsafe (ref unchanged) rather
    // than by a snapshot advance (ref moved), and skip onSuccess accordingly.
    handlerSucceededRef.current = false;
  }, [submitting, pollingAware, pollError]);

  return { submitting, error, handle };
}
