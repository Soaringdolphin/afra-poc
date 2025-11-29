// src/core/scenarios.ts
import type { ScenarioConfig } from "./types";

export const creditCardScenario: ScenarioConfig = {
  id: "credit_card_poc",
  title: "First Job, First Credit Card",
  description:
    "You're 24, earning a steady income. Keep it simple: one card, one starter investment, and a few bills.",
  totalMonths: 12,

  initialState: {
    month: 0,
    cash: 600,
    income: 3000,

    variableWants: [
      { id: "fun", name: "Fun", planned: 200 },
      { id: "dining", name: "Dining out", planned: 100 },
    ],

    variableNeeds: [
      { id: "groceries", name: "Groceries", planned: 350 },
      { id: "transport", name: "Transport", planned: 150 },
    ],

    fixedExpenses: [
      { id: "rent", name: "Rent", baseMonthly: 1400, arrears: 0 },
      { id: "utilities", name: "Utilities", baseMonthly: 150, arrears: 0 },
      { id: "phone", name: "Phone", baseMonthly: 60, arrears: 0 },
    ],

    debts: [
      { id: "cc1", name: "Credit Card", balance: 3500, apr: 0.1999, minimumRule: { base: 25 } },
    ],

    investments: [
      { id: "starter", name: "Starter Index Fund", balance: 0, apr: 0.07 },
    ],
  },
};

export const scenarios: ScenarioConfig[] = [creditCardScenario];

const CUSTOM_STORE_KEY = "afra:customScenarios";

export function saveCustomScenario(config: ScenarioConfig) {
  try {
    const raw = localStorage.getItem(CUSTOM_STORE_KEY);
    const map: Record<string, ScenarioConfig> = raw ? JSON.parse(raw) : {};
    map[config.id] = config;
    localStorage.setItem(CUSTOM_STORE_KEY, JSON.stringify(map));
  } catch {}
}

export function getScenarioById(id: string): ScenarioConfig | undefined {
  // Presets first
  const preset = scenarios.find((s) => s.id === id);
  if (preset) return preset;
  // Then custom from localStorage
  try {
    const raw = localStorage.getItem(CUSTOM_STORE_KEY);
    if (!raw) return undefined;
    const map: Record<string, ScenarioConfig> = JSON.parse(raw);
    return map[id];
  } catch {
    return undefined;
  }
}
