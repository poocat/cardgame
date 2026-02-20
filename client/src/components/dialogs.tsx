import * as RDialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { type ReactNode, useCallback } from "react";
import "./styles.css";

/******************************************************************************
 * ### Dialog
 *
 * Modal dialog using Radix UI primitives for accessibility.
 ******************************************************************************/
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
        <RDialog.Overlay className="dialog-overlay">
          <RDialog.Content className="dialog-content">
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
