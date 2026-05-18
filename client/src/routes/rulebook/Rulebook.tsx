import { Copy } from "@client/components";
import { Box } from "@client/components/layout";
import { apiUrl, assertHttpSuccess, useApiQuery } from "@client/utils/api";
import { ROUTES } from "@common/api/routes";

export const Rulebook = () => {
  const url = apiUrl(`${ROUTES.copy.path}/rules`);

  const { data, loading, error } = useApiQuery({
    key: url,
    fetch: async (signal) => {
      const response = await fetch(url, { method: "GET", signal });
      assertHttpSuccess(response);
      return response;
    },
    parse: async (response) => {
      return response.text();
    },
  });

  if (loading) return <Box spacing="lg">Loading...</Box>;
  if (error) return <Box spacing="lg">Rules are not available.</Box>;
  if (!data) return null;

  return (
    <Box spacing="lg">
      <Copy>{data}</Copy>
    </Box>
  );
};
