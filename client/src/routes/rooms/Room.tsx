import { usePoller } from "@client/hooks/usePoller";
import { ROUTES } from "@common/api/routes";
import { useCallback, useMemo, useState } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router";
import z from "zod";

type RoomsGetOneResponseBody = z.infer<
  typeof ROUTES.rooms.methods.getOne.schemas.responseBody
>;

export const Room = () => {
  const location = useLocation();

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
    getLastModified: (headers) => {
      const ts = headers.get("Last-Modified");
      return ts ? new Date(ts) : null;
    },
    getPollingEnabled: () => true, // Poll constantly
  });

  const playerIsHost = poller.data?.host.id === playerId;
  const [guestName, setGuestName] = useState("");

  const handleSubmitGuest = useCallback(async () => {
    if (playerIsHost || !guestName) return;
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
  }, [url, playerIsHost, guestName]);

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
            <button
              onClick={() =>
                window.confirm("Sorry, this doesn't do anything yet...")
              }
            >
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
