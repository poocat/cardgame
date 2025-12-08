import {
  ChoiceContext,
  DialogContext,
  SelectorContext,
  SubmitContext,
  useChoiceContext,
  useDialogContext,
  useSelectorContext,
} from "@client/routes/games/board/contexts";
import { usePoller } from "@client/utils/usePoller";
import { ROUTES } from "@common/api/routes";
import { useCallback, useMemo } from "react";
import { useParams, useSearchParams } from "react-router";
import type z from "zod";
import { GameBoard } from "./board";

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
        return 10000; // Once every 10 s for after the first minute.
      } else {
        return 60000; // Once every minute after first 5 minutes.
      }
    },
    getPollingEnabled: (data) =>
      data.digest.activity.choice.choosingPlayerId !== observingPlayerId,
  });

  // Memoize the game data, as is only changes with the "last updated" time.
  // biome-ignore lint/correctness/useExhaustiveDependencies: the timestamp is good enough
  const game = useMemo(() => {
    return poller?.data?.digest;
  }, [poller.data?.updatedAt]);

  const ovservingPlayerChoosing = !poller.polling;

  const selectorContext = useSelectorContext(game);
  const choiceContext = useChoiceContext(game);
  const dialogContext = useDialogContext();

  // Submission:
  const submitChoices = useCallback(async () => {
    if (
      gameId &&
      observingPlayerId &&
      ovservingPlayerChoosing &&
      game &&
      poller.fetchOnce
    ) {
      const payload: GamesPatchRequestBody = {
        decision: {
          playerId: observingPlayerId,
          name: game.activity?.choice?.name ?? "",
          values: selectorContext.selectedValues,
        },
      };
      const body = JSON.stringify(payload);
      await fetch(url, {
        method: "PATCH",
        body,
        headers: {
          "Content-Type": "application/json",
        },
      })
        .catch((reason) => console.error(reason))
        .then(() => {
          poller.fetchOnce();
          selectorContext.clearValues();
          dialogContext.close();
        });
    }
  }, [
    gameId,
    observingPlayerId,
    game,
    selectorContext.selectedValues,
    selectorContext.clearValues,
    dialogContext.close,
    ovservingPlayerChoosing,
    poller.fetchOnce,
    url,
  ]);

  const submitContext = useMemo(
    () => ({
      submit: submitChoices,
      canSubmit: choiceContext.forObserver && !selectorContext.moreValuesNeeded,
    }),
    [
      submitChoices,
      choiceContext.forObserver,
      selectorContext.moreValuesNeeded,
    ],
  );

  return (
    <div>
      <hr />
      <div style={{ padding: 5 }}>
        {poller.polling ? (
          <span>Polled {poller.pollCount} times..</span>
        ) : (
          <span>Not polling... {poller.error && `(${poller.error})`}</span>
        )}
      </div>
      {game && (
        <SelectorContext.Provider value={selectorContext}>
          <ChoiceContext.Provider value={choiceContext}>
            <DialogContext.Provider value={dialogContext}>
              <SubmitContext.Provider value={submitContext}>
                <GameBoard game={game} />
              </SubmitContext.Provider>
            </DialogContext.Provider>
          </ChoiceContext.Provider>
        </SelectorContext.Provider>
      )}
    </div>
  );
};
