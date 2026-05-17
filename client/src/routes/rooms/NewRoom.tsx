import { Button, Copy, Input } from "@client/components";
import { Box, Stack } from "@client/components/layout";
import { apiUrl, assertHttpSuccess, useApiQuery } from "@client/utils/api";
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
      const response = await fetch(apiUrl(ROUTES.rooms.path), {
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

  // Fetch welcome note.
  const welcomeCopyUrl = apiUrl(`${ROUTES.copy.path}/welcome`);
  const { data: welcomeNote } = useApiQuery({
    key: welcomeCopyUrl,
    fetch: async (signal) => {
      const response = await fetch(welcomeCopyUrl, { method: "GET", signal });
      assertHttpSuccess(response);
      return response;
    },
    parse: async (response) => {
      return response.text();
    },
  });

  return (
    <div style={{ minHeight: "100vh" }}>
      <Box spacing="lg">
        <Stack spacing="lg" orientation="vertical">
          {welcomeNote && (
            <Box spacing="lg" border="dark">
              <Copy>{welcomeNote}</Copy>
            </Box>
          )}
          <Box border="dark" spacing="md" color="secondary">
            <Stack spacing="lg" orientation="horizontal">
              <Input
                size="md"
                value={hostName}
                placeholder="your name"
                onChange={(value) => setHostName(value)}
              />
              <Button
                color="primary"
                border="dark"
                size="md"
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
    </div>
  );
};
