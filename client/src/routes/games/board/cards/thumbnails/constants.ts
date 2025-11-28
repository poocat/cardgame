const thumnailCardAspectRatio = 5 / 7;
export const thumbnailCardHeight = 105;
export const thumbnailCardWidth = Math.floor(
  thumbnailCardHeight * thumnailCardAspectRatio,
);
const thumbnailCardHighlightWidth = 10;
export const thumbnailCardHeaderHeight = 25;

export const thumbnailCardContainerWidth =
  thumbnailCardWidth + thumbnailCardHighlightWidth * 2;
export const thumbnailCardContainerHeight =
  thumbnailCardHeight +
  thumbnailCardHeaderHeight +
  thumbnailCardHighlightWidth * 2;

export const thumbnailCardBorderWidth = 3;
