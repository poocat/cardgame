import type { KeyboardEvent, ReactNode } from "react";

export const Dialog = (props: {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      props.onClose();
    }
  };

  return (
    props.isOpen && (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}
        role="dialog" // TODO!!! NOT SURE TWO DIALOGS SHOULD BE NESTED!!!
        onClick={props.onClose}
        onKeyDown={handleKeyDown}
      >
        <div
          role="dialog"
          tabIndex={-1}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={handleKeyDown}
        >
          {props.children}
        </div>
      </div>
    )
  );
};
