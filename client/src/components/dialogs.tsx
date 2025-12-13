import * as RDialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

import { type ReactNode, useCallback } from "react";

export const Dialog = (props: {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
}) => {
  const onOpenChange = useCallback(
    (open: boolean) => {
      if (!open) props.onClose();
    },
    [props.onClose],
  );

  return (
    <RDialog.Root open={props.isOpen} onOpenChange={onOpenChange}>
      <RDialog.Portal>
        <RDialog.Overlay
          style={{
            backgroundColor: "rgba(0,0,0,0.5)",
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/*  */}
          <RDialog.Content>
            <VisuallyHidden>
              <RDialog.Title>{props.title}</RDialog.Title>
              <RDialog.Description>{props.description}</RDialog.Description>
            </VisuallyHidden>
            {props.children}
          </RDialog.Content>
        </RDialog.Overlay>
      </RDialog.Portal>
    </RDialog.Root>
  );
};
