import { Copy } from "@client/components";
import { Box } from "@client/components/layout";
import { apiUrl, useApiQuery } from "@client/utils/api";
import { ROUTES } from "@common/api/routes";

export const Rulebook = () => {
  const url = apiUrl(`${ROUTES.copy.path}/rules`);

  const { data, error } = useApiQuery({
    key: url,
    fetch: async (signal) => {
      const response = await fetch(url, { method: "GET", signal });
      if (!response.ok)
        throw new Error(`HTTP ${response.status} (${response.statusText})`);
      return response;
    },
    parse: async (response) => {
      return response.text();
    },
  });

  if (error) return <Box spacing="lg">Rules are not available.</Box>;
  if (!data) return null;

  return (
    <Box spacing="lg">
      <Copy>{data}</Copy>
    </Box>
  );
};
