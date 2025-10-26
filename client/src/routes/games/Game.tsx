import { useMemo, useState } from "react";
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
    getLastModified: (headers) => {
      const ts = headers.get("Last-Modified");
      return ts ? new Date(ts) : null;
    },
    getPollingEnabled: (data) =>
      data.data.activity.currentChoice.choosingPlayerId !== playerId,
  });

  // Submission:
  // (Not memoized, because it depends on practically everything...)
  const handleSubmitChoices = async () => {
    if (gameId && playerId && !poller.polling) {
      const payload: GamesPatchRequestBody = {
        decision: {
          playerId: playerId,
          name: poller.data?.data?.activity?.currentChoice?.name ?? "",
          values: choices,
        },
      };
      const body = JSON.stringify(payload);
      try {
        const response = await fetch(url, {
          method: "PATCH",
          body,
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (response.ok) {
          poller.fetchOnce();
          setChoices([]);
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <div>
      {poller.polling ? (
        <div>Polled {poller.pollCount} times..</div>
      ) : (
        <div>Not polling... {poller.error && `(${poller.error})`}</div>
      )}
      <>
        {poller.data && (
          <div>
            <label htmlFor="player-select">Playing As: </label>
            <select
              id="player-select"
              value={playerId ?? ""}
              onChange={(e) => setQuery({ playerId: e.target.value })}
            >
              {poller.data?.data.players.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
              <option value="">Spectator</option>
            </select>
          </div>
        )}
        <hr />
        <div>
          Current Activity: {JSON.stringify(poller.data?.data.activity)}
        </div>
        <hr />
        {!poller.polling && (
          <>
            <div>
              {(poller.data?.data?.activity?.currentChoice?.values ?? []).map(
                (v: any) => (
                  <div key={v}>
                    <input
                      id={v}
                      value={v}
                      type="checkbox"
                      onChange={(e) =>
                        setChoices((current) =>
                          e.target.checked
                            ? [...current, v]
                            : current?.filter((c) => c !== v),
                        )
                      }
                    />
                    <label htmlFor={v}>{v}</label>
                  </div>
                ),
              )}
            </div>
            <div>
              <button onClick={handleSubmitChoices}>Submit Choices</button>
            </div>
          </>
        )}
      </>
    </div>
  );
};
