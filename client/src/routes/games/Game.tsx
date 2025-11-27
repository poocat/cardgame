import {
  ChoiceContext,
  SelectorContext,
  useChoice,
  useChoiceContext,
  useSelector,
  useSelectorContext,
} from "@client/routes/games/choices";
import { usePoller } from "@client/utils/usePoller";
import { ROUTES } from "@common/api/routes";
import { memo, useCallback, useMemo } from "react";
import { useParams, useSearchParams } from "react-router";
import type z from "zod";
import { GameBoard } from "./board";

type GamesGetOneResponseBody = z.infer<
  typeof ROUTES.games.methods.getOne.schemas.responseBody
>;
type GamesPatchRequestBody = z.infer<
  typeof ROUTES.games.methods.patch.schemas.requestBody
>;

const ValueSelect = (props: { value: string; label?: string }) => {
  const { value, label } = props;
  const choice = useChoice();
  const selectable = choice.checkValue(props.value);
  const selector = useSelector();
  const { checkValue, addValue, removeValue } = selector.handlers(value);
  const selected = checkValue();
  return (
    <span>
      <input
        id={value}
        type="checkbox"
        disabled={!selectable}
        checked={selected}
        onChange={() => (checkValue() ? removeValue() : addValue())}
      />
      {label && <label htmlFor={value}>{label}</label>}
    </span>
  );
};

export const Game = () => {
  const { gameId } = useParams();

  const [query] = useSearchParams();
  const observingPlayerId = query.get("playerId");

  const url = useMemo(() => {
    const base = `/api/games/${gameId}`;
    return observingPlayerId ? `${base}?playerId=${observingPlayerId}` : base;
  }, [gameId, observingPlayerId]);

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
  const ovservingPlayerChoosing = useMemo(
    () => !poller.polling,
    [poller.polling],
  );

  // TODO!!! Should take the submission handler!!!
  const selectorContext = useSelectorContext(game);

  // TODO!!! Move to game board component???
  const choiceContext = useChoiceContext(game);

  // Submission:
  const handleSubmitChoices = useCallback(async () => {
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
          values: selectorContext.chosen,
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
        .finally(() => {
          poller.fetchOnce();
          selectorContext.clear();
        });
    }
  }, [
    gameId,
    observingPlayerId,
    game,
    selectorContext.chosen,
    selectorContext.clear,
    ovservingPlayerChoosing,
    poller.fetchOnce,
    url,
  ]);

  return (
    <div>
      {poller.polling ? (
        <div>Polled {poller.pollCount} times..</div>
      ) : (
        <div>Not polling... {poller.error && `(${poller.error})`}</div>
      )}
      <hr />
      {game && (
        <ChoiceContext.Provider value={choiceContext}>
          <SelectorContext.Provider value={selectorContext}>
            <Debug
              game={game}
              choosing={ovservingPlayerChoosing}
              handleSubmitChoices={handleSubmitChoices}
            />
            <GameBoard game={game} />
          </SelectorContext.Provider>
        </ChoiceContext.Provider>
      )}
    </div>
  );
};

const Debug = memo(
  (props: {
    game: GamesGetOneResponseBody["digest"];
    choosing: boolean;
    handleSubmitChoices: () => void;
  }) => {
    return (
      <>
        <div>Current Activity: {JSON.stringify(props.game.activity)}</div>
        {props.choosing && (
          <div>
            {/*  */}
            {(props.game.activity?.choice?.values ?? []).map(({ value }) => (
              <div key={value}>
                <ValueSelect
                  key={value}
                  value={value}
                  label={`${props.game.activity.choice.type} ${value}`}
                />
              </div>
            ))}
            <div>
              <button type="button" onClick={props.handleSubmitChoices}>
                Submit Choices
              </button>
            </div>
          </div>
        )}
      </>
    );
  },
);
