import type { CSSProperties } from "react";
import { colors } from "../colors";

const thumbnailChipRadius = 9;
const thumbnailChipFontSize = 10;
const detailedChipRadius = 19;
const detailedChipFontSize = 18;

const commonChipCounterProps: CSSProperties = {
  alignItems: "center",
  alignContent: "center",
  justifyContent: "center",
  textAlign: "center",
  borderRadius: "50%",
  backgroundColor: colors.chips.alpha(1),
};

/******************************************************************************
 * ### ChipCounterBadge
 *
 * A zero-height container used for positioning chip counters on the edge
 * of other elements.
 ******************************************************************************/
export const ChipCounterBadge = (props: { children: React.ReactNode }) => {
  return (
    <div style={{ width: "100%", height: 0, position: "relative", top: 0 }}>
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "15%",
          transform: "translateY(50%)",
        }}
      >
        {props.children}
      </div>
    </div>
  );
};

/******************************************************************************
 * ### ThumbnailChipCounter
 *
 * A small chip counter, used for thumbnail-sized cards.
 ******************************************************************************/
export const ThumbnailChipCounter = (props: { count: number }) => {
  return (
    <div
      style={{
        width: thumbnailChipRadius * 2,
        height: thumbnailChipRadius * 2,
        fontSize: thumbnailChipFontSize,
        ...commonChipCounterProps,
      }}
    >
      {props.count}
    </div>
  );
};

/******************************************************************************
 * ### DetailedChipCounter
 *
 * Larger chip counters, used on detail-sized cards or larger chip pools.
 ******************************************************************************/
export const DetailedChipCounter = (props: { count: number }) => {
  return (
    <div
      style={{
        width: detailedChipRadius * 2,
        height: detailedChipRadius * 2,
        fontSize: detailedChipFontSize,
        ...commonChipCounterProps,
      }}
    >
      {props.count}
    </div>
  );
};
