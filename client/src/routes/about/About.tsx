import { Copy } from "@client/components";
import { Box, PageTitle } from "@client/components/layout";
import { apiUrl, assertHttpSuccess, useApiQuery } from "@client/utils/api";
import { ROUTES } from "@common/api/routes";

export const About = () => {
  const url = apiUrl(`${ROUTES.copy.path}/about`);

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

  return (
    <>
      <PageTitle>About</PageTitle>
      {loading && <Box spacing="lg">Loading...</Box>}
      {error && <Box spacing="lg">"About" not available.</Box>}
      {data && (
        <Box spacing="lg">
          <Copy>{data}</Copy>
        </Box>
      )}
    </>
  );
};
