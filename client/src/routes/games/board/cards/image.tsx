import { useState } from "react";

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

export const CardImage = (props: {
  name: string;
  size: "thumbnail" | "fullsize";
}) => {
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    <img
      className="game-card__image"
      src={`/api/cards/images/${slugify(props.name)}.${props.size}.png`}
      onError={() => setFailed(true)}
      alt={props.name}
    />
  );
};
