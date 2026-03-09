import { Decisions } from "@server/game/runtime/Decisions";
import { describe, expect, it } from "vitest";

describe("Decisions", () => {
  describe("getValues", () => {
    it("returns all values for the given name", () => {
      const decisions = new Decisions([
        { name: "targetChips", playerId: "alice", values: ["ch1", "ch2"] },
        { name: "targetCard", playerId: "alice", values: ["c1"] },
      ]);
      expect(decisions.getValues({ name: "targetChips" })).toEqual([
        "ch1",
        "ch2",
      ]);
    });

    it("returns values filtered by playerId", () => {
      const decisions = new Decisions([
        { name: "targetChips", playerId: "alice", values: ["ch1"] },
        { name: "targetChips", playerId: "bob", values: ["ch3"] },
      ]);
      expect(
        decisions.getValues({ name: "targetChips", playerId: "alice" }),
      ).toEqual(["ch1"]);
    });

    it("aggregates values from multiple decisions with the same name", () => {
      const decisions = new Decisions([
        { name: "targetChips", playerId: "alice", values: ["ch1"] },
        { name: "targetChips", playerId: "bob", values: ["ch2"] },
      ]);
      expect(decisions.getValues({ name: "targetChips" })).toEqual([
        "ch1",
        "ch2",
      ]);
    });

    it("returns empty array when name not found", () => {
      const decisions = new Decisions([
        { name: "targetChips", playerId: "alice", values: ["ch1"] },
      ]);
      expect(decisions.getValues({ name: "nonexistent" })).toEqual([]);
    });
  });

  describe("getPlayerIds", () => {
    it("returns unique player IDs for the given name", () => {
      const decisions = new Decisions([
        { name: "targetChips", playerId: "alice", values: ["ch1"] },
        { name: "targetChips", playerId: "bob", values: ["ch2"] },
        { name: "otherChoice", playerId: "charlie", values: ["x"] },
      ]);
      expect(decisions.getPlayerIds({ name: "targetChips" }).sort()).toEqual([
        "alice",
        "bob",
      ]);
    });

    it("deduplicates player IDs", () => {
      const decisions = new Decisions([
        { name: "targetChips", playerId: "alice", values: ["ch1"] },
        { name: "targetChips", playerId: "alice", values: ["ch2"] },
      ]);
      expect(decisions.getPlayerIds({ name: "targetChips" })).toEqual([
        "alice",
      ]);
    });

    it("returns empty array when name not found", () => {
      const decisions = new Decisions([]);
      expect(decisions.getPlayerIds({ name: "anything" })).toEqual([]);
    });
  });
});
