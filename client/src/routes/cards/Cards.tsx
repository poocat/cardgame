import { Box } from "@client/components/layout";
import { CardFace } from "@client/features/cards/face";
import { apiUrl, assertHttpSuccess, useApiQuery } from "@client/utils/api";
import type { Message } from "@client/utils/messages";
import { useMessages } from "@client/utils/messages";
import { ROUTES } from "@common/api/routes";
import { cardTypes } from "@common/game/enums";
import { useMemo } from "react";
import "./styles.css";

/******************************************************************************
 * ### Cards
 *
 * A view of every card that has been implemented.
 ******************************************************************************/
export const Cards = () => {
  const url = apiUrl(ROUTES.cards.path);
  const { lookup } = useMessages();

  const { data, loading, error } = useApiQuery({
    key: url,
    fetch: async (signal) => {
      const response = await fetch(url, { method: "GET", signal });
      assertHttpSuccess(response);
      return response;
    },
    parse: async (response) => {
      const json = await response.json();
      return ROUTES.cards.methods.getMany.schemas.responseBody.parse(json);
    },
  });

  /**
   * Registry is not ordered, and endpoint has no query parameters.
   *
   * For now, order by card type, then subtype, then title.
   */
  const cards = useMemo(() => {
    if (!data) return [];
    const label = (message: Message | null | undefined) =>
      message ? lookup(message.key, { textOnly: true }).value : "";
    return [...data.cards].sort(
      (a, b) =>
        cardTypes.indexOf(a.type) - cardTypes.indexOf(b.type) ||
        label(a.subtype).localeCompare(label(b.subtype)) ||
        label(a.display).localeCompare(label(b.display)),
    );
  }, [data, lookup]);

  if (loading) return <Box spacing="lg">Loading...</Box>;
  if (error) return <Box spacing="lg">Cards are not available.</Box>;
  if (!data) return null;

  return (
    <div className="card-catalog-grid">
      {cards.map((card) => (
        <CardFace key={card.name} card={card} />
      ))}
    </div>
  );
};
