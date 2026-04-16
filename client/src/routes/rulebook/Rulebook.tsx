import { Copy } from "@client/components";
import { Box } from "@client/components/layout";
import { ROUTES } from "@common/api/routes";
import { useEffect, useState } from "react";

export const Rulebook = () => {
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`${ROUTES.copy.path}/rules`)
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.text();
      })
      .then(setContent)
      .catch(() => setError(true));
  }, []);

  if (error) return <Box spacing="lg">Rules are not available.</Box>;
  if (content === null) return null;

  return (
    <Box spacing="lg">
      <Copy>{content}</Copy>
    </Box>
  );
};
