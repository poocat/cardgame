const thumnailCardAspectRatio = 5 / 7;
export const thumbnailCardHeight = 105;
export const thumbnailCardWidth = Math.floor(
  thumbnailCardHeight * thumnailCardAspectRatio,
);
const thumbnailCardHighlightWidth = 5;
export const thumbnailCardHeaderHeight = 40;

export const thumbnailCardContainerWidth =
  thumbnailCardWidth + thumbnailCardHighlightWidth * 2;
export const thumbnailCardContainerHeight =
  thumbnailCardHeight +
  thumbnailCardHeaderHeight +
  thumbnailCardHighlightWidth * 2;

export const thumbnailCardBorderWidth = 3;
