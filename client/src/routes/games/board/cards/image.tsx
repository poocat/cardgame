import { useState } from "react";
import type { CardType } from "../types";

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

export const ThumbnailCardImage = (props: { name: string; type: CardType }) => {
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    <img
      className="game-card__image"
      src={`/api/cards/images/thumbnail/${slugify(props.name)}.svg`}
      onError={() => setFailed(true)}
      alt={props.name}
    />
  );
};

export const DetailCardImage = (props: { name: string }) => {
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    <img
      className={`game-dialog__card__image`}
      src={`/api/cards/images/fullsize/${slugify(props.name)}.svg`}
      onError={() => setFailed(true)}
      alt={props.name}
    />
  );
};
