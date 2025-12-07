import { ButtonBase } from "@client/components";
import { type CSSProperties, useCallback } from "react";
import { colors } from "../colors";
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
    backgroundColor: colors.cards.alpha(0.25),
  },
  observerHasChosenCard: {
    backgroundColor: colors.cards.alpha(0.5),
  },
  observerCanChooseActionOnCard: {
    backgroundColor: colors.actions.alpha(0.25),
  },
  observerCanChooseChipOnCard: {
    backgroundColor: colors.chips.alpha(0.25),
  },
  otherPlayerChoosing: {
    backgroundColor: "rgba(0, 0, 0, 0.25)",
  },
  chosenPreviously: {
    backgroundColor: "rgba(0, 0, 0, 0.25)",
  },
} as const satisfies Record<ThumbnailCardHighlightVariant, CSSProperties>;

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

        textAlign: "center",
        alignContent: "end",
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
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        // Oh look, this will basically "tap" the card..
        // transform: "rotate(10deg)",
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

    display: "flex",
    flexDirection: "row",
  };
  return props.cardSelectable ? (
    <ButtonBase onClick={clickHandler}>
      <div style={{ ...commonStyleProps }}>
        <span>{props.cardName}</span>
      </div>
    </ButtonBase>
  ) : (
    <div style={{ ...commonStyleProps }}>
      <span>{props.cardName}</span>
    </div>
  );
};

/******************************************************************************
 * ### CardThumbnailFaceUp
 ******************************************************************************/
export const CardThumbnailFaceUp = (props: {
  cardType: string;
  numChips: number;
  onClick: () => void;
}) => {
  return (
    <ButtonBase onClick={props.onClick}>
      <div
        style={{
          width: thumbnailCardWidth,
          height: thumbnailCardHeight,

          border: "1px solid",
          borderRadius: 5,

          backgroundColor: "white",

          fontSize: 10,
        }}
      >
        <div>{props.cardType}</div>
      </div>
    </ButtonBase>
  );
};

/******************************************************************************
 * ### CardThumbnailFaceDown
 ******************************************************************************/
export const CardThumbnailFaceDown = () => {
  return (
    <div
      style={{
        width: thumbnailCardWidth,
        height: thumbnailCardHeight,

        border: "1px solid",
        borderRadius: 3,

        backgroundColor: "gray",

        fontSize: 10,
      }}
    />
  );
};

/******************************************************************************
 * ### CardThumbnailPlaceholder
 ******************************************************************************/
export const CardThumbnailPlaceholder = () => {
  return (
    <div
      style={{
        width: thumbnailCardWidth,
        height: thumbnailCardHeight,

        border: "1px dashed",
        borderRadius: 3,

        backgroundColor: "transparent",

        fontSize: 10,
      }}
    />
  );
};
