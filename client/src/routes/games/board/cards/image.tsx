import { useState } from "react";

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

export function CardImage({ cardName }: { cardName: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    <img
      className="game-card__image"
      src={`/api/cards/images/${slugify(cardName)}.svg`}
      onError={() => setFailed(true)}
      alt={cardName}
    />
  );
}
