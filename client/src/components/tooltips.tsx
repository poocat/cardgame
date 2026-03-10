import * as RTooltip from "@radix-ui/react-tooltip";
import "./styles.css";

export const TooltipProvider = (props: { children: React.ReactNode }) => {
  return (
    <RTooltip.Provider delayDuration={0}>{props.children}</RTooltip.Provider>
  );
};

export const Tooltip = (props: {
  children: React.ReactNode;
  content: React.ReactNode;
  side: "right" | "top" | "bottom" | "left";
}) => {
  return (
    <RTooltip.Root>
      <RTooltip.Trigger asChild>
        <span>{props.children}</span>
      </RTooltip.Trigger>
      <RTooltip.Portal>
        <RTooltip.Content side={props.side} className="tooltip-content">
          {props.content}
          <RTooltip.Arrow className="tooltip-arrow" />
        </RTooltip.Content>
      </RTooltip.Portal>
    </RTooltip.Root>
  );
};
