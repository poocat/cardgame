import { ButtonBase } from "@client/components";
import type { CSSProperties } from "react";
import { colors } from "../palette";
import {
  thumbnailCardContainerHeight,
  thumbnailCardContainerWidth,
  thumbnailCardHeaderHeight,
  thumbnailCardHeight,
  thumbnailCardWidth,
} from "./constants";
import "./styles.css";
import type { ThumbnailCardHighlightVariant } from "./types";

export type ThumbnailHighlight = "selectable" | "selected" | "none";

export const ThumbnailContainer = (props: {
  highlight: ThumbnailHighlight;
  children?: React.ReactNode;
}) => {
  const classNames = [
    "game-card-container",
    `game-card-container--${props.highlight}`,
  ];
  const className = classNames.join(" ");
  return <div className={className}>{props.children}</div>;
};

export const Thumbnail = (props: {
  onClick?: () => void;
  variant: "producer" | "consumer" | "placeholder";
  label?: React.ReactNode;
}) => {
  const classNames = ["game-card", `game-card--${props.variant}`];
  if (props.onClick) classNames.push("game-card--clickable");
  const className = classNames.join(" ");

  const content = <div className={className}>{props.label}</div>;
  return props.onClick ? (
    <ButtonBase onClick={props.onClick}>{content}</ButtonBase>
  ) : (
    content
  );
};

//
//
//
//
//
//
//
//

const thumbnailCardHighlightVariantStyles = {
  default: {
    backgroundColor: "inherit",
  },
  observerCanChooseCard: {
    backgroundColor: colors.cards.alpha(0.5),
  },
  observerHasChosenCard: {
    backgroundColor: colors.cards.alpha(1),
  },
  observerCanChooseActionOnCard: {
    backgroundColor: colors.actions.alpha(0.5),
  },
  observerCanChooseChipOnCard: {
    backgroundColor: colors.chips.alpha(0.5),
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
export const CardThumbnailHeader = (props: {
  cardId: string;
  cardName: string;
  selectDisabled: boolean;
  cardSelected: boolean;
  onChange: () => void;
}) => {
  const commonStyleProps: CSSProperties = {
    paddingBlock: 2, // vertical
    paddingInline: 10, // horizontal
    fontSize: 10,

    display: "flex",
    flexDirection: "row",
  };
  return !props.selectDisabled ? (
    <ButtonBase onClick={props.onChange}>
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
  exhausted: boolean;
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

          backgroundColor: props.exhausted ? colors.board.scale(0.9) : "white",

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
