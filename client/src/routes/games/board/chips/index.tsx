import type { CSSProperties } from "react";
import { colors } from "../colors";

const thumbnailChipRadius = 7;
const thumbnailChipFontSize = 8;
const detailedChipRadius = 10;
const detailedChipFontSize = 12;

const commonStyle: CSSProperties = {
  justifyContent: "center",
  alignContent: "center",
  backgroundColor: colors.chips.alpha(0.5),
};

/******************************************************************************
 * ### ThumbnailChipCounter
 ******************************************************************************/
export const ThumbnailChipCounter = (props: { count: number }) => {
  return (
    <div
      style={{
        width: thumbnailChipRadius * 2,
        height: thumbnailChipRadius * 2,
        borderRadius: thumbnailChipRadius,
        fontSize: thumbnailChipFontSize,
        ...commonStyle,
      }}
    >
      {props.count}
    </div>
  );
};

/******************************************************************************
 * ### DetailedChipCounter
 ******************************************************************************/
export const DetailedChipCounter = (props: { count: number }) => {
  return (
    <div
      style={{
        width: detailedChipRadius * 2,
        height: detailedChipRadius * 2,
        borderRadius: detailedChipRadius,
        fontSize: detailedChipFontSize,
        ...commonStyle,
      }}
    >
      {props.count}
    </div>
  );
};
