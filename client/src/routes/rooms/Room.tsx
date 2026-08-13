import { Button, Input } from "@client/components";
import { Box, PageTitle, Stack } from "@client/components/layout";
import { apiUrl } from "@client/utils/api";
import { usePoller } from "@client/utils/usePoller";
import { useSubmission } from "@client/utils/useSubmission";
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

  const joinSubmission = useSubmission();

  const url = useMemo(() => {
    const base = apiUrl(`${ROUTES.rooms.path}/${roomId}`);
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

  // Hold the start-game lock until the room poll reflects the new gameId
  // (the navigation effect below then redirects). Without this, the button
  // briefly re-enables between POST success and the next poll, allowing a
  // duplicate game to be created.
  const startSubmission = useSubmission({
    pollingAware: true,
    pendingSnapshot: poller.data?.gameId ?? null,
    pollError: poller.error,
  });

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
  const handleSubmitGuest = useCallback(() => {
    if (submitGuestDisabled) return;
    return joinSubmission.handle(async () => {
      const payload = ROUTES.rooms.methods.postGuest.schemas.requestBody.parse({
        guestName,
      });
      const response = await fetch(`${url}/guests`, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        return { ok: false, error: `Couldn't join (${response.status}).` };
      }
      const j = await response.json();
      const d = ROUTES.rooms.methods.postGuest.schemas.responseBody.parse(j);
      setQuery({ playerId: d.playerId });
      return { ok: true };
    });
  }, [url, guestName, setQuery, submitGuestDisabled, joinSubmission.handle]);

  const startGameDisabled = !playerIsHost || !roomId;
  /**
   * Does not immediately start a game. Instead makes request to start the
   * game. When the game is ready, it will be reflected in the room data,
   * which won't arrive until the next poll.
   */
  const handleStartGame = useCallback(() => {
    if (startGameDisabled) return;
    return startSubmission.handle(async () => {
      const payload = ROUTES.games.methods.post.schemas.requestBody.parse({
        roomId: roomId,
        hostId: playerId,
      });
      const response = await fetch(apiUrl(ROUTES.games.path), {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        return {
          ok: false,
          error: `Couldn't start game (${response.status}).`,
        };
      }
      return { ok: true };
    });
  }, [startGameDisabled, roomId, playerId, startSubmission.handle]);

  const guests = poller.data?.digest.guests ?? [];
  const submitDisabled = guests.length < 1 || startSubmission.submitting;

  return (
    <div>
      <PageTitle>Room</PageTitle>
      {poller.error && (
        <Box fullWidth spacing="md" color="error">
          {poller.error}
        </Box>
      )}
      {(joinSubmission.error || startSubmission.error) && (
        <Box fullWidth spacing="md" color="error">
          {joinSubmission.error ?? startSubmission.error}
        </Box>
      )}
      <Box spacing="lg">
        <Stack orientation="vertical" spacing="lg">
          <Box border="dark" color="secondary" spacing="md">
            <Box>
              Share: <Link to={location.pathname}>{location.pathname}</Link>
            </Box>
          </Box>
          Host:
          <Box border="dark" spacing="md">
            {poller.data?.digest.host.name ?? "..."}
          </Box>
          Guests:
          {playerIsHost && guests.length < 1 && <Box spacing="lg">...</Box>}
          {poller.data?.digest.guests.map((guest) => (
            <Box border="dark" key={guest.id} spacing="lg">
              {guest.name}
            </Box>
          ))}
          {playerIsHost ? (
            <Button
              border="dark"
              color="chip"
              size="lg"
              onClick={handleStartGame}
              disabled={submitDisabled}
            >
              {startSubmission.submitting ? "Starting..." : "Start Game"}
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
                  disabled={
                    playerIsHost || !guestName || joinSubmission.submitting
                  }
                  onClick={handleSubmitGuest}
                >
                  {joinSubmission.submitting ? "Joining..." : "Join Game"}
                </Button>
              </Stack>
            </Box>
          )}
        </Stack>
      </Box>
    </div>
  );
};
