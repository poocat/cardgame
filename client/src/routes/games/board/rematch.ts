import { usePoller } from "@client/utils/usePoller";
import { useSubmission } from "@client/utils/useSubmission";
import { ROUTES } from "@common/api/routes";
import { useCallback, useEffect, useMemo, useState } from "react";
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

  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomLookupStatus, setRoomLookupStatus] = useState<
    "pending" | "done" | "failed"
  >("pending");
  const submission = useSubmission();

  // Once the game ends, look up the room that spawned it.
  // Note, if a "guest" reloads the page after the "host" has already initiated
  // a rematch, they'll get a 404 error, as the connection between game and room
  // will be broken.
  useEffect(() => {
    if (!gameOver || !gameId || roomId) return;
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`${ROUTES.rooms.path}?gameId=${gameId}`);
        if (cancelled) return;
        if (!response.ok) setRoomLookupStatus("failed");
        else {
          const payload = await response.json();
          const parsed =
            ROUTES.rooms.methods.getByGame.schemas.responseBody.parse(payload);
          setRoomId(parsed.roomId);
          setRoomLookupStatus("done");
        }
      } catch (err) {
        if (cancelled) return;
        setRoomLookupStatus("failed");
        console.error(err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [gameOver, gameId, roomId]);

  const roomUrl = useMemo(() => {
    if (!roomId || !playerId) return null;
    return `${ROUTES.rooms.path}/${roomId}?playerId=${playerId}`;
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

  const startRematch = useCallback(
    () =>
      submission.handle(async () => {
        if (!roomId || !playerId) return { ok: true };
        const response = await fetch(
          `${ROUTES.rooms.path}/${roomId}?playerId=${playerId}`,
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
      }),
    [roomId, playerId, navigate, submission.handle],
  );

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
  if (roomLookupStatus === "pending") {
    // Game is over, observer is a player, but room hasn't been looked up yet.
    return { role: null };
  }
  if (roomLookupStatus === "failed") {
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
