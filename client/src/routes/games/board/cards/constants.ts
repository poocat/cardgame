const thumnailCardAspectRatio = 5 / 7;
export const thumbnailCardHeight = 70;
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

const detailCardAspectRatio = 5 / 7;
export const detailCardHeight = 420;
export const detailCardWidth = Math.floor(
  detailCardHeight * detailCardAspectRatio,
);
export const detailCardFooterHeight = 150;
