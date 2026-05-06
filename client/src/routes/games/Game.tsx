import { Box } from "@client/components/layout";
import { useAttention } from "@client/utils/useAttention";
import { usePoller } from "@client/utils/usePoller";
import { useSubmission } from "@client/utils/useSubmission";
import { ROUTES } from "@common/api/routes";
import { useCallback, useMemo } from "react";
import { useParams, useSearchParams } from "react-router";
import type z from "zod";
import { GameBoard } from "./board";
import { useChoice } from "./board/choice";
import { useDialog } from "./board/dialog";
import { useRematch } from "./board/rematch";
import { useSelector } from "./board/selector";

type GamesGetOneResponseBody = z.infer<
  typeof ROUTES.games.methods.getOne.schemas.responseBody
>;
type GamesPatchRequestBody = z.infer<
  typeof ROUTES.games.methods.patch.schemas.requestBody
>;

export const Game = () => {
  const { gameId } = useParams();

  const [query] = useSearchParams();
  const observingPlayerId = query.get("playerId");

  const baseUrl = `/api/games/${gameId}`;
  const url = observingPlayerId
    ? `${baseUrl}?playerId=${observingPlayerId}`
    : baseUrl;

  // Polling:
  const poller = usePoller<GamesGetOneResponseBody>({
    url,
    getData: async (response) => {
      const payload = await response.json();
      return ROUTES.games.methods.getOne.schemas.responseBody.parse(payload);
    },
    getIntervalMs: (elapsedTimeMs) => {
      if (elapsedTimeMs < 1 * 60 * 1000) {
        return 1000; // Once per second for the first minute.
      } else if (elapsedTimeMs < 5 * 60 * 1000) {
        return 5000; // Once every 5 s after the first minute.
      } else {
        return 10000; // Once every 10 s after first 5 minutes.
      }
    },
    // Stop polling when the observing player is making a choice, or when the
    // game ends.
    getPollingEnabled: (data) =>
      data.digest.activity.choice.choosingPlayerId !== observingPlayerId &&
      data.digest.winner === null,
  });

  // Memoize the game data, as it only changes with the "last updated" time.
  // biome-ignore lint/correctness/useExhaustiveDependencies: the timestamp is good enough
  const game = useMemo(() => {
    return poller?.data?.digest;
  }, [poller.data?.updatedAt]);

  const currentChoice = game?.activity.choice;
  const currentChoiceName = currentChoice?.name;
  const observingPlayerIsChoosing =
    game?.activity.choice.choosingPlayerId === observingPlayerId;

  useAttention({
    message: !poller.polling ? "Polling stopped!" : null,
    audio: "short",
  });
  useAttention({
    message:
      !poller.polling && observingPlayerIsChoosing ? "Choice required!" : null,
    audio: "short",
  });
  useAttention({
    message: game?.winner ? `${game.winner.name} won!` : null,
    audio: "long",
  });

  const dialog = useDialog();
  const selector = useSelector({
    min: currentChoice?.min ?? 0,
    max: currentChoice?.max ?? 9999,
  });

  // Defer local cleanup until the next poll confirms the submission so the
  // dialog and selection stay visible while the lock is held.
  const onSubmissionConfirmed = useCallback(() => {
    selector.clearValues();
    dialog.close();
  }, [selector.clearValues, dialog.close]);

  const submission = useSubmission({
    pollingAware: true,
    pendingSnapshot: poller.data?.updatedAt ?? null,
    pollError: poller.error,
    onSuccess: onSubmissionConfirmed,
  });
  const choice = useChoice(game?.activity);
  const rematch = useRematch({
    gameId,
    playerId: observingPlayerId,
    gameOver: game?.winner != null,
  });

  // Submission:
  const submitChoice = useCallback(async () => {
    if (
      !gameId ||
      !observingPlayerId ||
      !observingPlayerIsChoosing ||
      !currentChoiceName ||
      !poller.fetchOnce
    ) {
      return;
    }
    const fetchOnce = poller.fetchOnce;
    await submission.handle(async () => {
      const payload: GamesPatchRequestBody = {
        decision: {
          playerId: observingPlayerId,
          name: currentChoiceName,
          values: selector.selectedValues,
        },
      };
      const response = await fetch(url, {
        method: "PATCH",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok || response.status === 204) {
        fetchOnce();
        return { ok: true };
      }
      if (response.status === 409) {
        await fetchOnce();
        return { ok: false, error: "Board updated. Please re-submit." };
      }
      const msg = await response
        .json()
        .catch(() => ({ message: "Unknown error" }));
      return { ok: false, error: msg.message ?? "Submission failed." };
    });
  }, [
    gameId,
    observingPlayerId,
    currentChoiceName,
    selector.selectedValues,
    observingPlayerIsChoosing,
    poller.fetchOnce,
    submission.handle,
    url,
  ]);

  const errors: string[] = [];
  if (poller.error) errors.push(poller.error);
  if (submission.error) errors.push(submission.error);

  return (
    <div>
      <Box spacing="md">
        {poller.polling ? (
          <span>Polled {poller.pollCount} times..</span>
        ) : (
          <span>Not polling...</span>
        )}
      </Box>
      {game && (
        <GameBoard
          game={game}
          onSubmitChoice={submitChoice}
          submitting={submission.submitting}
          choiceProps={choice}
          selectorProps={selector}
          dialogProps={dialog}
          rematchProps={rematch}
          errors={errors}
        />
      )}
    </div>
  );
};
