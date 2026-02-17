import { ROUTES } from "@common/api/routes";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import type { z } from "zod";

type GamesGetManyResponseBody = z.infer<
  typeof ROUTES.games.methods.getMany.schemas.responseBody
>;

export const GameList = () => {
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
          const d = ROUTES.games.methods.getMany.schemas.responseBody.parse(j);
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
      {data?.games?.map((g) => (
        <div key={g.gameId}>
          <Link to={`/games/${g.gameId}`}>{g.gameId}</Link>
        </div>
      ))}
    </div>
  );
};
