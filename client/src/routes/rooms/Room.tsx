import { Button, Input } from "@client/components";
import { Box, Stack } from "@client/components/layout";
import { usePoller } from "@client/utils/usePoller";
import { ROUTES } from "@common/api/routes";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router";
import type z from "zod";

type RoomsGetOneResponseBody = z.infer<
  typeof ROUTES.rooms.methods.getOne.schemas.responseBody
>;

export const Room = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { roomId } = useParams();

  const [query, setQuery] = useSearchParams();
  const playerId = query.get("playerId");

  const [gameStarting, setGameStarting] = useState(false);

  const url = useMemo(() => {
    const base = `${ROUTES.rooms.path}/${roomId}`;
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
        return 5000; // Once every 5 s for after the first minute.
      } else {
        return 10000; // Once every 10 s after first 5 minutes.
      }
    },
    getPollingEnabled: () => true, // Poll constantly
  });

  const playerIsHost = poller.data?.digest.host.id === playerId;

  const [guestName, setGuestName] = useState("");

  // Once the game has started, redirect.
  const gameId = poller.data?.gameId ?? null;
  useEffect(() => {
    if (gameId) {
      let gameUrl = `/games/${gameId}`;
      if (playerId) gameUrl = `${gameUrl}?${new URLSearchParams({ playerId })}`;
      navigate(gameUrl);
    }
  }, [gameId, navigate, playerId]);

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
  }, [url, guestName, setQuery, submitGuestDisabled]);

  const startGameDisabled = !playerIsHost || !roomId;
  const handleStartGame = useCallback(async () => {
    /**
     * Does not immediately start a game. Instead makes request to start the
     * game. When the game is ready, it will be reflected in the room data,
     * which won't arrive until the next poll.
     */
    if (startGameDisabled) return;
    try {
      const payload = ROUTES.games.methods.post.schemas.requestBody.parse({
        roomId: roomId,
        hostId: playerId,
      });
      const body = JSON.stringify(payload);
      const response = await fetch(ROUTES.games.path, {
        method: "POST",
        body,
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        setGameStarting(true);
      }
    } catch (error) {
      console.error(error);
    }
  }, [startGameDisabled, roomId, playerId]);

  return (
    <Box spacing="lg">
      <Stack orientation="vertical" spacing="lg">
        {poller.polling ? (
          <div>Polled {poller.pollCount} times..</div>
        ) : (
          <div>Not polling... {poller.error && `(${poller.error})`}</div>
        )}
        <Box border="dark" color="secondary" spacing="md">
          <Stack orientation="vertical" spacing="sm">
            <Box>
              Share: <Link to={location.pathname}>{location.pathname}</Link>
            </Box>
            {playerIsHost && (
              <Box>
                (If playing against yourself, open the link in a new window, add
                a player to the room, then return here to start the game.)
              </Box>
            )}
          </Stack>
        </Box>
        Host:
        <Box size="md" border="dark" spacing="md">
          {poller.data?.digest.host.name ?? "..."}
        </Box>
        Guests:
        {poller.data?.digest.guests.map((guest) => (
          <Box size="md" border="dark" key={guest.id} spacing="lg">
            {guest.name}
          </Box>
        ))}
        {playerIsHost ? (
          <Button
            border="dark"
            color="chip"
            size="lg"
            onClick={handleStartGame}
            disabled={gameStarting}
          >
            {gameStarting ? "Starting..." : "Start Game"}
          </Button>
        ) : playerId ? (
          <Box>Waiting for host to start...</Box>
        ) : (
          <Box border="dark" spacing="md" color="secondary">
            <Stack spacing="lg" orientation="horizontal">
              <Input
                size="md"
                placeholder="your name"
                value={guestName}
                onChange={(value) => setGuestName(value)}
              />
              <Button
                border="dark"
                color="primary"
                size="md"
                disabled={playerIsHost || !guestName}
                onClick={handleSubmitGuest}
              >
                Join Game
              </Button>
            </Stack>
          </Box>
        )}
      </Stack>
    </Box>
  );
};
