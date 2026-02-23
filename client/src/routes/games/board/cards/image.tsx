import { useState } from "react";
import type { CardType } from "../types";

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

export const CardImage = (props: { name: string; type: CardType }) => {
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    <img
      className={`game-card__image game-card__image--${props.type}`}
      src={`/api/cards/images/${slugify(props.name)}.svg`}
      onError={() => setFailed(true)}
      alt={props.name}
    />
  );
};
