import { Button, Input } from "@client/components";
import { Box, Stack } from "@client/components/layout";
import { ROUTES } from "@common/api/routes";
import { useState } from "react";
import { useNavigate } from "react-router";

export const NewRoom = () => {
  const navigate = useNavigate();

  const [hostName, setHostName] = useState("");

  const handleSubmit = async () => {
    if (!hostName) return;
    try {
      const payload = ROUTES.rooms.methods.post.schemas.requestBody.parse({
        hostName,
      });
      const body = JSON.stringify(payload);
      const response = await fetch(ROUTES.rooms.path, {
        method: "POST",
        body,
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const j = await response.json();
        const d = ROUTES.rooms.methods.post.schemas.responseBody.parse(j);
        navigate(`/rooms/${d.roomId}?playerId=${d.hostId}`);
      }
    } catch (error) {
      console.error(error);
    }
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
              disabled={!hostName}
              onClick={handleSubmit}
            >
              Create Room
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
};
