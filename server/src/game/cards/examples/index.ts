import type { CardMap } from "@server/game/types";
import { exampleConsumer } from "./exampleConsumer";
import { exampleProducer } from "./exampleProducer";
import { exampleProducerThatCanDie } from "./exampleProducerThatCanDie";
import { exampleProducerThatInvolvesAllPlayers } from "./exampleProducerThatInvolvesAllPlayers";

export const cards = {
  exampleConsumer,
  exampleProducer,
  exampleProducerThatCanDie,
  exampleProducerThatInvolvesAllPlayers,
} as const satisfies CardMap;
