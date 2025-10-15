import { useEffect, useState } from "react";
import {
  Routes,
  Route,
  Outlet,
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router";
import { z } from "zod";
import {
  gamesGetManyResponseBodySchema,
  gamesGetOneResponseBodySchema,
  gamesPatchRequestBodySchema,
  gamesPostResponseBodySchema,
} from "@common/api/schemas";
import { usePoller } from "@client/hooks/usePoller";

type GamesGetManyResponseBody = z.infer<typeof gamesGetManyResponseBodySchema>;
type GamesGetOneResponseBody = z.infer<typeof gamesGetOneResponseBodySchema>;
type GamesPatchRequestBody = z.infer<typeof gamesPatchRequestBodySchema>;

const GameList = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<GamesGetManyResponseBody | null>(null);

  useEffect(() => {
    const fetchGameList = async () => {
      try {
        const response = await fetch("/api/games", {
          method: "GET",
        });
        if (response.ok) {
          const j = await response.json();
          const d = gamesGetManyResponseBodySchema.parse(j);
          setData(d);
        } else {
          setError(`Could not fetch games: ${response.statusText}`);
        }
      } catch (error) {
        setError(`Error: ${error}`);
      }
    };
    if (data === null && error === null) {
      fetchGameList();
    }
  }, [data, error]);
  return (
    <div>
      <div>Games:</div>
      {error && <div>{error}</div>}
      {data?.games?.map((g: any) => (
        <div>
          <Link key={g.gameId} to={`/${g.gameId}`}>
            {g.gameId}
          </Link>
        </div>
      ))}
      <div>
        <button
          onClick={async () => {
            try {
              const response = await fetch("/api/games", { method: "POST" });
              if (response.ok) {
                const j = await response.json();
                const d = gamesPostResponseBodySchema.parse(j);
                navigate(`/${d.gameId}`);
              }
            } catch (error) {
              console.error(error);
            }
          }}
        >
          New Game
        </button>
      </div>
    </div>
  );
};

const Game = () => {
  const { gameId } = useParams();
  const url = `/api/games/${gameId}`;

  const [query, setQuery] = useSearchParams();
  const playerId = query.get("playerId");

  const [choices, setChoices] = useState<string[]>([]);

  // Polling:
  const poller = usePoller<GamesGetOneResponseBody>({
    url,
    fetchQuery: playerId ? { playerId } : {},
    getData: async (response) => {
      const payload = await response.json();
      return gamesGetOneResponseBodySchema.parse(payload);
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
    getLastUpdated: (headers) => {
      const ts = headers.get("x-last-updated-at");
      return ts ? new Date(ts) : null;
    },
    getPollingEnabled: (data) =>
      data.data.activity.currentChoice.choosingPlayerId !== playerId,
  });

  // Submission:
  // (Not memoized, because it depends on practically everything...)
  const handleSubmitChoices = async () => {
    if (!poller.polling) {
      const payload: GamesPatchRequestBody = {
        decision: {
          playerId: playerId ?? "",
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
        <div>Not polling...</div>
      )}
      {poller.loading ? (
        <div>Loading...</div>
      ) : (
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
      )}
    </div>
  );
};

const Layout = () => {
  return (
    <div>
      <div>
        <Link to="/">Cardgame</Link>
      </div>
      <Outlet />
    </div>
  );
};

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<GameList />} />
          <Route path=":gameId" element={<Game />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
