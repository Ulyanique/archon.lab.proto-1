import { expect, it } from "vitest";
import { russianCount } from "../src/lib/russian-count";

it("склоняет сигналы, включая исключения десятков", () => {
  const forms = ["сигнал", "сигнала", "сигналов"] as const;
  expect([0, 1, 2, 5, 11, 14, 21, 22, 111].map((n) => russianCount(n, forms))).toEqual(["0 сигналов", "1 сигнал", "2 сигнала", "5 сигналов", "11 сигналов", "14 сигналов", "21 сигнал", "22 сигнала", "111 сигналов"]);
});
