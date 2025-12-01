import { type CSSProperties, useCallback } from "react";
import {
  thumbnailCardContainerHeight,
  thumbnailCardContainerWidth,
  thumbnailCardHeaderHeight,
  thumbnailCardHeight,
  thumbnailCardWidth,
} from "./constants";
import type { ThumbnailCardHighlightVariant } from "./types";

const thumbnailCardHighlightVariantStyles = {
  default: {
    backgroundColor: "inherit",
  },
  observerCanChooseCard: {
    backgroundColor: "rgba(0, 255, 255, 0.25)",
  },
  observerHasChosenCard: {
    backgroundColor: "rgba(0, 255, 255, 0.5)",
  },
  observerCanChooseActionOnCard: {
    backgroundColor: "rgba(0, 0, 255, 0.25)",
  },
  observerCanChooseChipOnCard: {
    backgroundColor: "rgba(255, 0, 0, 0.25)",
  },
  otherPlayerChoosing: {
    backgroundColor: "rgba(0, 0, 0, 0.25)",
  },
  chosenPreviously: {
    backgroundColor: "rgba(0, 0, 0, 0.25)",
  },
} as const satisfies Record<ThumbnailCardHighlightVariant, CSSProperties>;

const defaultButtonStyleProps: CSSProperties = {
  fontFamily: "inherit",
  borderStyle: "inherit",
  borderColor: "inherit",
  backgroundColor: "inherit",
  padding: 0,
};

/******************************************************************************
 * ### CardThumbnailContainer
 ******************************************************************************/
export const CardThumbnailContainer = (props: {
  children?: React.ReactNode;
}) => {
  return (
    <div
      style={{
        height: thumbnailCardContainerHeight,
        width: thumbnailCardContainerWidth,
      }}
    >
      {props.children}
    </div>
  );
};

/******************************************************************************
 * ### CardThumbnailHeaderContainer
 ******************************************************************************/
export const CardThumbnailHeaderContainer = (props: {
  children?: React.ReactNode;
}) => {
  return (
    <div
      style={{
        width: "100%",
        height: thumbnailCardHeaderHeight,
      }}
    >
      {props.children}
    </div>
  );
};

/******************************************************************************
 * ### CardThumbnailBodyContainer
 ******************************************************************************/
export const CardThumbnailBodyContainer = (props: {
  children?: React.ReactNode;
}) => {
  return (
    <div
      style={{
        width: "100%",
        height: thumbnailCardContainerHeight - thumbnailCardHeaderHeight,
        display: "grid",
        placeItems: "center",
      }}
    >
      {props.children}
    </div>
  );
};

/******************************************************************************
 * ### CardThumbnailHighlight
 ******************************************************************************/
export const CardThumbnailHighlight = (props: {
  variant: ThumbnailCardHighlightVariant;
  children?: React.ReactNode;
}) => {
  const highlightStyleProps =
    thumbnailCardHighlightVariantStyles[props.variant];
  const styleProps: CSSProperties = {
    width: "100%",
    height: "100%",
    borderRadius: 5,
    backgroundColor: highlightStyleProps.backgroundColor,
  };

  return <div style={{ ...styleProps }}>{props.children}</div>;
};

/******************************************************************************
 * ### CardThumbnailHeader
 *
 * The part above the card that is clickable when the card itself is part of
 * the current choice.
 ******************************************************************************/
export const CardThumbnailHeader = (
  props: {
    cardId: string;
    cardName: string;
  } & (
    | { cardSelectable: false }
    | {
        cardSelectable: true;
        cardSelected: boolean;
        onSelect: () => void;
        onDeselect: () => void;
      }
  ),
) => {
  const clickHandler = useCallback(() => {
    if (props.cardSelectable) {
      if (props.cardSelected) {
        props.onDeselect();
      } else {
        props.onSelect();
      }
    }
  }, [props]);

  const commonStyleProps: CSSProperties = {
    paddingBlock: 2, // vertical
    paddingInline: 10, // horizontal

    fontSize: 10,
    textAlign: "center",

    display: "flex",
    flexDirection: "row",
  };
  return props.cardSelectable ? (
    <button
      style={{ ...defaultButtonStyleProps }}
      type="button"
      onClick={clickHandler}
    >
      <div style={{ ...commonStyleProps }}>
        <span>{props.cardName}</span>
      </div>
    </button>
  ) : (
    <div style={{ ...commonStyleProps }}>
      <span>{props.cardName}</span>
    </div>
  );
};

export const CardThumbnailFaceUp = (props: {
  cardType: string;
  numChips: number;
  onClick: () => void;
}) => {
  return (
    <button
      type="button"
      style={{ ...defaultButtonStyleProps }}
      onClick={props.onClick}
    >
      <div
        style={{
          width: thumbnailCardWidth,
          height: thumbnailCardHeight,

          border: "1px solid",
          borderRadius: 3,

          backgroundColor: "white",

          fontSize: 10,

          display: "grid",
          placeItems: "center",
        }}
      >
        <div>{props.cardType}</div>
        {props.numChips && <div>{props.numChips}</div>}
      </div>
    </button>
  );
};

export const CardThumbnailFaceDown = () => {
  return (
    <div
      style={{
        width: thumbnailCardWidth,
        height: thumbnailCardHeight,

        border: "1px solid",
        borderRadius: 3,

        backgroundColor: "white",

        fontSize: 10,

        display: "grid",
        placeItems: "center",
      }}
    ></div>
  );
};
