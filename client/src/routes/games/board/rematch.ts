import { apiUrl, assertHttpSuccess, useApiQuery } from "@client/utils/api";
import { usePoller } from "@client/utils/usePoller";
import { useSubmission } from "@client/utils/useSubmission";
import { ROUTES } from "@common/api/routes";
import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import type z from "zod";

type RoomsGetOneResponse = z.infer<
  typeof ROUTES.rooms.methods.getOne.schemas.responseBody
>;

export type RematchProps =
  | {
      role: "host";
      startingRematch: boolean;
      startRematch: () => void;
    }
  | {
      role: "guest";
      rematchReady: boolean;
      goToRematch: () => void;
    }
  | { role: "spectator" }
  | { role: "unknown room" }
  | { role: null };

/******************************************************************************
 * ### useRematch
 *
 * Resolves the room that spawned the current game, watches it for a rematch,
 * and exposes the callbacks needed by `GameOverMenu`. Idle until `gameOver`
 * is true — at which point it fetches the room id, then polls the room until
 * a rematch game appears.
 ******************************************************************************/
export const useRematch = (opts: {
  gameId: string | undefined;
  playerId: string | null;
  gameOver: boolean;
}): RematchProps => {
  const { gameId, playerId, gameOver } = opts;
  const navigate = useNavigate();
  const submission = useSubmission();

  const room = useApiQuery({
    key: gameId ?? "",
    skip: !gameOver || !gameId,
    fetch: async (signal) => {
      const response = await fetch(
        apiUrl(`${ROUTES.rooms.path}?gameId=${gameId}`),
        {
          method: "GET",
          signal,
        },
      );
      assertHttpSuccess(response);
      return response;
    },
    parse: async (response) => {
      const json = await response.json();
      return ROUTES.rooms.methods.getByGame.schemas.responseBody.parse(json);
    },
  });
  const roomId = room.data?.roomId;

  const roomUrl = useMemo(() => {
    if (!roomId || !playerId) return null;
    return apiUrl(`${ROUTES.rooms.path}/${roomId}?playerId=${playerId}`);
  }, [roomId, playerId]);

  const getPollingEnabled = useCallback(
    (data: RoomsGetOneResponse) =>
      data.gameId === null || data.gameId === gameId,
    [gameId],
  );

  const poller = usePoller<RoomsGetOneResponse>({
    url: roomUrl,
    getData: async (response) => {
      const payload = await response.json();
      return ROUTES.rooms.methods.getOne.schemas.responseBody.parse(payload);
    },
    getIntervalMs: () => 2000,
    getPollingEnabled,
  });

  const hostId = poller.data?.digest.host.id;
  const rematchReady = poller.data !== null && poller.data.gameId !== gameId;

  const startRematch = useCallback(() => {
    if (!roomId || !playerId) return;
    return submission.handle(async () => {
      const response = await fetch(
        apiUrl(`${ROUTES.rooms.path}/${roomId}?playerId=${playerId}`),
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameId: null }),
        },
      );
      if (!response.ok) {
        return {
          ok: false,
          error: `Rematch request failed: ${response.status}`,
        };
      }
      navigate(`/rooms/${roomId}?playerId=${playerId}`);
      return { ok: true };
    });
  }, [roomId, playerId, navigate, submission.handle]);

  // Navigates back to the room.
  const goToRematch = useCallback(() => {
    if (!rematchReady || !roomId || !playerId) return;
    navigate(`/rooms/${roomId}?playerId=${playerId}`);
  }, [rematchReady, roomId, playerId, navigate]);

  if (!gameOver) {
    // Can't rematch if the game isn't over.
    return { role: null };
  }
  if (!playerId) {
    // Observer is not a player.
    return { role: "spectator" };
  }
  if (room.loading) {
    // Game is over, observer is a player, but room hasn't been looked up yet.
    return { role: null };
  }
  if (room.error) {
    // Room lookup failed. Can happen after host initiates a rematch if the
    // observer reloads the page.
    return { role: "unknown room" };
  }
  if (hostId === undefined) {
    // Room lookup successful, but host information is unknown.
    return { role: null };
  }
  if (hostId === playerId) {
    // Host info known. Observer is host.
    return {
      role: "host",
      startingRematch: submission.submitting,
      startRematch,
    };
  }
  return { role: "guest", rematchReady, goToRematch };
};
