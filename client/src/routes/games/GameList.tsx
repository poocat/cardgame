import { Box, Stack } from "@client/components";
import { useApiQuery } from "@client/utils/api";
import { ROUTES } from "@common/api/routes";
import { Link } from "react-router";

export const GameList = () => {
  const url = `${ROUTES.games.path}`;

  const { data, error } = useApiQuery({
    key: url,
    fetch: async (signal) => {
      const response = await fetch(url, { method: "GET", signal });
      if (!response.ok)
        throw new Error(`HTTP ${response.status} (${response.statusText})`);
      return response;
    },
    parse: async (response) => {
      const json = await response.json();
      return ROUTES.games.methods.getMany.schemas.responseBody.parse(json);
    },
  });

  if (error) {
    return (
      <Box spacing="md" color="error">
        {error.message}
      </Box>
    );
  }
  return (
    <Box spacing="lg">
      <Stack orientation="vertical" spacing="md">
        {data?.games?.map((g) => (
          <Box key={g.gameId} spacing="sm" size="md" border="dark">
            <Link to={`/games/${g.gameId}`}>{g.gameId}</Link>
            <div>Last updated at: {g.updatedAt}</div>
          </Box>
        ))}
      </Stack>
    </Box>
  );
};
