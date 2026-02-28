import { Button, SelectButton } from "@client/components";
import { Box, Stack } from "@client/components/layout";
import type { Color } from "@client/components/types";
import { memo, useCallback } from "react";
import type { ChoiceType, ChoiceValueDigest, SelectorProps } from "./types";

/******************************************************************************
 * ### ChoiceSelectButton
 *
 * A toggle button that represents any arbitrary selectable value.
 ******************************************************************************/
const ChoiceSelectButton = (
  props: {
    choiceType: ChoiceType;
    value: string;
    label: string;
    disabled: boolean;
    selected: boolean;
  } & Pick<SelectorProps, "toggleValue">,
) => {
  const toggle = useCallback(() => {
    props.toggleValue(props.value);
  }, [props.toggleValue, props.value]);

  let color: Color = "primary";
  switch (props.choiceType) {
    case "actionId":
      color = "action";
      break;
    case "chipId":
      color = "chip";
      break;
    case "cardId":
    case "deck":
      color = "card";
      break;
  }

  return (
    <SelectButton
      size="md"
      border="dark"
      color={color}
      label={props.label}
      disabled={props.disabled}
      selected={props.selected}
      onClick={toggle}
    />
  );
};

/******************************************************************************
 * ### MenuContainer
 *
 * A container for a menu that is pinned to the bottom of the UI, used either
 * to present choices, or to explain the current activity, or to indicate that
 * a player has won the game.
 *
 * Includes a spacing element, to ensure there is always enough room at the
 * bottom of the UI to avoid the menu covering up important elements.
 ******************************************************************************/
export const MenuContainer = (props: { children?: React.ReactNode }) => {
  return (
    <>
      <div className="game-footer-spacer" />
      <div className="game-footer-menu">{props.children}</div>
    </>
  );
};

/******************************************************************************
 * ### ChoiceMenu
 *
 * Use as a child of `<MenuContainer/>` to present the current choice to the
 * choosing player.
 *
 * Sometimes redundant, as there are other controls available to choose values
 * e.g. buttons on cards. Necessary, however, for choices that have no other
 * controls designed for them (e.g. arbitrary choices, or deck choices).
 ******************************************************************************/
export const ChoiceMenu = memo(
  (
    props: {
      instructions: string;
      choiceType: ChoiceType;
      values: ChoiceValueDigest[];
      onSubmitChoice: () => void;
      submitDisabled: boolean;
    } & Pick<
      SelectorProps,
      "checkValueSelected" | "toggleValue" | "moreValuesAllowed"
    >,
  ) => {
    return (
      <Box spacing="sm">
        <Stack spacing="sm" orientation="vertical">
          <Box spacing="sm">{props.instructions}</Box>
          <Box spacing="sm">
            <Button
              border="dark"
              color="secondary"
              size="lg"
              disabled={props.submitDisabled}
              onClick={props.onSubmitChoice}
            >
              Submit Choices
            </Button>
          </Box>
          <Box spacing="sm">
            <Stack spacing="sm" orientation="horizontal">
              {props.values.map(({ value, label }) => {
                const selected = props.checkValueSelected(value);
                const disabled = !selected && !props.moreValuesAllowed;
                return (
                  <ChoiceSelectButton
                    key={value}
                    value={value}
                    label={label}
                    selected={selected}
                    disabled={disabled}
                    choiceType={props.choiceType}
                    toggleValue={props.toggleValue}
                  />
                );
              })}
            </Stack>
          </Box>
        </Stack>
      </Box>
    );
  },
);

/******************************************************************************
 * ### GameOverMenu
 ******************************************************************************/
export const GameOverMenu = (props: { winnerName: string }) => {
  return <Box spacing="lg">{props.winnerName} wins!</Box>;
};

/******************************************************************************
 * ### ExplanationMenu
 ******************************************************************************/
export const ExplanationMenu = (props: { explanation: string }) => {
  return <Box spacing="lg">{props.explanation}</Box>;
};
