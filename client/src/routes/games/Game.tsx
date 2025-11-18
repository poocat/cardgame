import { memo, useCallback, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router";
import z from "zod";
import { usePoller } from "@client/hooks/usePoller";
import { ROUTES } from "@common/api/routes";

type GamesGetOneResponseBody = z.infer<
  typeof ROUTES.games.methods.getOne.schemas.responseBody
>;
type GamesPatchRequestBody = z.infer<
  typeof ROUTES.games.methods.patch.schemas.requestBody
>;

export const Game = () => {
  const { gameId } = useParams();

  const [query, setQuery] = useSearchParams();
  const playerId = query.get("playerId");

  const url = useMemo(() => {
    const base = `/api/games/${gameId}`;
    return playerId ? `${base}?playerId=${playerId}` : base;
  }, [gameId, playerId]);

  const [choices, setChoices] = useState<string[]>([]);

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
      data.digest.activity.choice.choosingPlayerId !== playerId,
  });

  // Memoize the game data, as is only changes with the "last updated" time.
  const game = useMemo(() => {
    return poller?.data?.digest;
  }, [poller.data?.updatedAt]);
  const choosing = useMemo(() => !poller.polling, [poller.polling]);

  // Submission:
  const handleSubmitChoices = useCallback(async () => {
    if (gameId && playerId && choosing && game && poller.fetchOnce) {
      const payload: GamesPatchRequestBody = {
        decision: {
          playerId: playerId,
          name: game.activity?.choice?.name ?? "",
          values: choices,
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
          setChoices([]);
        });
    }
  }, [gameId, playerId, game, choosing, poller.fetchOnce]);

  // Choice value setters:
  const handleAddChoice = useCallback((value: string) => {
    setChoices((current) => [...current, value]);
  }, []);
  const handleRemoveChoice = useCallback((value: string) => {
    setChoices((current) => {
      const idx = current.findIndex((v) => v === value);
      return [...current.slice(0, idx), ...current.slice(idx)];
    });
  }, []);

  return (
    <div>
      {poller.polling ? (
        <div>Polled {poller.pollCount} times..</div>
      ) : (
        <div>Not polling... {poller.error && `(${poller.error})`}</div>
      )}
      <>
        <hr />
        {game && (
          <PlayArea
            game={game}
            choosing={choosing}
            handleAddChoice={handleAddChoice}
            handleRemoveChoice={handleRemoveChoice}
            handleSubmitChoices={handleSubmitChoices}
          />
        )}
      </>
    </div>
  );
};

const PlayArea = memo(
  (props: {
    game: GamesGetOneResponseBody["digest"];
    choosing: boolean;
    handleAddChoice: (value: string) => void;
    handleRemoveChoice: (value: string) => void;
    handleSubmitChoices: () => void;
  }) => {
    return (
      <>
        <div>Current Activity: {JSON.stringify(props.game.activity)}</div>
        {props.choosing && (
          <div>
            {(props.game.activity?.choice?.values ?? []).map((v: any) => (
              <div key={v}>
                <input
                  id={v}
                  value={v}
                  type="checkbox"
                  onChange={(e) =>
                    e.target.checked
                      ? props.handleAddChoice(v)
                      : props.handleRemoveChoice(v)
                  }
                />
                <label htmlFor={v}>{v}</label>
              </div>
            ))}
            <div>
              <button onClick={props.handleSubmitChoices}>
                Submit Choices
              </button>
            </div>
          </div>
        )}
      </>
    );
  },
);
