import { Box } from "@client/components/layout";
import { useAttention } from "@client/utils/useAttention";
import { usePoller } from "@client/utils/usePoller";
import { ROUTES } from "@common/api/routes";
import { useCallback, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router";
import type z from "zod";
import { GameBoard } from "./board";
import { useChoice } from "./board/choice";
import { useDialog } from "./board/dialog";
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

  const [submitError, setSubmitError] = useState<string | null>(null);

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
  const choice = useChoice(game?.activity);

  // Submission:
  const submitChoice = useCallback(async () => {
    if (
      gameId &&
      observingPlayerId &&
      observingPlayerIsChoosing &&
      currentChoiceName &&
      poller.fetchOnce
    ) {
      setSubmitError(null);
      const payload: GamesPatchRequestBody = {
        decision: {
          playerId: observingPlayerId,
          name: currentChoiceName,
          values: selector.selectedValues,
        },
      };
      const body = JSON.stringify(payload);
      try {
        const response = await fetch(url, {
          method: "PATCH",
          body,
          headers: { "Content-Type": "application/json" },
        });
        if (response.ok || response.status === 204) {
          poller.fetchOnce();
          selector.clearValues();
          dialog.close();
        } else if (response.status === 409) {
          await poller.fetchOnce();
          setSubmitError("Board updated. Please re-submit.");
        } else {
          const msg = await response
            .json()
            .catch(() => ({ message: "Unknown error" }));
          setSubmitError(msg.message ?? "Submission failed.");
        }
      } catch {
        setSubmitError("Network error.");
      }
    }
  }, [
    gameId,
    observingPlayerId,
    currentChoiceName,
    selector.selectedValues,
    selector.clearValues,
    dialog.close,
    observingPlayerIsChoosing,
    poller.fetchOnce,
    url,
  ]);

  const errors: string[] = [];
  if (poller.error) errors.push(poller.error);
  if (submitError) errors.push(submitError);

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
          choiceProps={choice}
          selectorProps={selector}
          dialogProps={dialog}
          errors={errors}
        />
      )}
    </div>
  );
};
