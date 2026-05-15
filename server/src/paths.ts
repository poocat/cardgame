import path from "node:path";

type PrivatePaths = Record<
  "cardImages" | "cards" | "copy" | "iconMap" | "icons" | "locales",
  string | null
>;

export function createPrivatePaths(root: string | null): PrivatePaths {
  if (!root) {
    return {
      cards: null,
      cardImages: null,
      copy: null,
      iconMap: null,
      icons: null,
      locales: null,
    };
  }
  return {
    cardImages: path.join(root, "cards", "images"),
    cards: path.join(root, "cards"),
    copy: path.join(root, "copy"),
    iconMap: path.join(root, "icons", "map.json"),
    icons: path.join(root, "icons"),
    locales: path.join(root, "text", "locales"),
  };
}
