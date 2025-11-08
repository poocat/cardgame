import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router";
import z from "zod";
import { usePoller } from "@client/hooks/usePoller";
import { ROUTES } from "@common/api/routes";

type RoomsGetOneResponseBody = z.infer<
  typeof ROUTES.rooms.methods.getOne.schemas.responseBody
>;

export const Room = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { roomId } = useParams();

  const [query, setQuery] = useSearchParams();
  const playerId = query.get("playerId");

  const url = useMemo(() => {
    const base = `/api/rooms/${roomId}`;
    return playerId ? `${base}?playerId=${playerId}` : base;
  }, [roomId, playerId]);

  // Polling:
  const poller = usePoller<RoomsGetOneResponseBody>({
    url,
    getData: async (response) => {
      const payload = await response.json();
      return ROUTES.rooms.methods.getOne.schemas.responseBody.parse(payload);
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
    getPollingEnabled: () => true, // Poll constantly
  });

  const playerIsHost = poller.data?.host.id === playerId;

  const [guestName, setGuestName] = useState("");

  // Once the game has started, redirect.
  const gameId = poller.data?.gameId ?? null;
  useEffect(() => {
    if (gameId) {
      let gameUrl = `/games/${gameId}`;
      if (playerId) gameUrl = gameUrl + `?` + new URLSearchParams({ playerId });
      navigate(gameUrl);
    }
  }, [gameId]);

  const submitGuestDisabled = playerIsHost || !guestName;
  const handleSubmitGuest = useCallback(async () => {
    if (submitGuestDisabled) return;
    try {
      const payload = ROUTES.rooms.methods.postGuest.schemas.requestBody.parse({
        guestName,
      });
      const body = JSON.stringify(payload);
      const response = await fetch(`${url}/guests`, {
        method: "POST",
        body,
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const j = await response.json();
        const d = ROUTES.rooms.methods.postGuest.schemas.responseBody.parse(j);
        setQuery({ playerId: d.playerId });
      }
    } catch (error) {
      console.error(error);
    }
  }, [url, guestName, submitGuestDisabled]);

  const startGameDisabled = !playerIsHost || !roomId;
  const handleStartGame = useCallback(async () => {
    if (startGameDisabled) return;
    try {
      const payload = ROUTES.games.methods.post.schemas.requestBody.parse({
        roomId: roomId,
        hostId: playerId,
      });
      const body = JSON.stringify(payload);
      const response = await fetch(`/api/games`, {
        method: "POST",
        body,
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const j = await response.json();
        const d = ROUTES.games.methods.post.schemas.responseBody.parse(j);
        console.log(d);
      }
    } catch (error) {
      console.error(error);
    }
  }, [startGameDisabled, roomId]);

  return (
    <div>
      <div>
        Share: <Link to={location.pathname}>{location.pathname}</Link>
      </div>
      {poller.polling ? (
        <div>Polled {poller.pollCount} times..</div>
      ) : (
        <div>Not polling... {poller.error && `(${poller.error})`}</div>
      )}
      {poller.data && (
        <div>
          <hr />
          <div>Host: {poller.data.host.name}</div>
          <div>
            Guests: {poller.data.guests.map((guest) => guest.name).join(", ")}
          </div>
        </div>
      )}
      {playerIsHost && (
        <div>
          <div>
            <button disabled={startGameDisabled} onClick={handleStartGame}>
              Start game
            </button>
          </div>
        </div>
      )}
      {!playerId && (
        <div>
          <div>
            <input
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
            />
          </div>
          <div>
            <button
              onClick={handleSubmitGuest}
              disabled={playerIsHost || !guestName}
            >
              Join game
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
