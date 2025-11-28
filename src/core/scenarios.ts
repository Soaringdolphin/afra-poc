// src/core/scenarios.ts
import type { ScenarioConfig } from "./types";

export const creditCardScenario: ScenarioConfig = {
  id: "credit_card_poc",
  title: "First Job, First Credit Card",
  description:
    "You're 24, earning a steady income, with a single credit card balance and a simple goal.",
  totalMonths: 12,

  initialState: {
    month: 0,
    income: 3000,
    housingCost: 1400,
    basicExpenses: 800,
    variableExpenses: 300,
    cash: 600,
    investments: 0,
    investmentApr: 0.03,      // 3% annual on simple starter investments
    debtBalance: 3500,
    debtApr: 0.1999,          // 19.99 percent
    goalType: "pay_off_debt",
    goalAmount: 0,
  },
};

// Export a collection so you can easily add more later
export const scenarios: ScenarioConfig[] = [
  creditCardScenario,
  // future: secondScenario,
  // future: thirdScenario,
];

// Optional helper if you want to grab by id in the UI
export function getScenarioById(id: string): ScenarioConfig | undefined {
  return scenarios.find((s) => s.id === id);
}
