import { apiUrl } from "@client/utils/api";
import { ROUTES } from "@common/api/routes";
import { useState } from "react";

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

export const CardImage = (props: {
  name: string;
  variant: "thumbnail" | "fullsize";
}) => {
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    <img
      className="game-card__image"
      src={apiUrl(
        `${ROUTES.cards.path}/images/${slugify(props.name)}.${props.variant}.png`,
      )}
      onError={() => setFailed(true)}
      alt={props.name}
    />
  );
};
