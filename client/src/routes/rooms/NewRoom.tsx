import { Button, Input } from "@client/components";
import { Box, Stack } from "@client/components/layout";
import { useSubmission } from "@client/utils/useSubmission";
import { ROUTES } from "@common/api/routes";
import { useState } from "react";
import { useNavigate } from "react-router";

export const NewRoom = () => {
  const navigate = useNavigate();

  const [hostName, setHostName] = useState("");
  const submission = useSubmission();

  const handleSubmit = () => {
    if (!hostName) return;
    return submission.handle(async () => {
      const payload = ROUTES.rooms.methods.post.schemas.requestBody.parse({
        hostName,
      });
      const response = await fetch(ROUTES.rooms.path, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        return {
          ok: false,
          error: `Couldn't create room (${response.status}).`,
        };
      }
      const j = await response.json();
      const d = ROUTES.rooms.methods.post.schemas.responseBody.parse(j);
      navigate(`/rooms/${d.roomId}?playerId=${d.hostId}`);
      return { ok: true };
    });
  };

  return (
    <Box spacing="lg">
      <Stack spacing="lg" orientation="vertical">
        <Box border="dark" spacing="md" color="secondary">
          <Stack spacing="lg" orientation="horizontal">
            <Input
              size="lg"
              value={hostName}
              placeholder="your name"
              onChange={(value) => setHostName(value)}
            />
            <Button
              color="primary"
              border="dark"
              size="lg"
              disabled={!hostName || submission.submitting}
              onClick={handleSubmit}
            >
              {submission.submitting ? "Creating..." : "Create Room"}
            </Button>
          </Stack>
        </Box>
        {submission.error && (
          <Box fullWidth spacing="md" color="error">
            {submission.error}
          </Box>
        )}
      </Stack>
    </Box>
  );
};
