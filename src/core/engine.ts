// engine.ts
import type {
  ScenarioState,
  ScenarioChoice,
  MonthResult,
  ExpenseSpendSummary,
  FixedExpenseSummary,
  DebtSummary,
  InvestmentSummary,
} from "./types";

function clampNonNegative(n: number): number {
  return n < 0 ? 0 : n;
}

function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}

export function runMonth(state: ScenarioState, choice: ScenarioChoice): MonthResult {
  let cash = state.cash;

  // Snapshots at start of month for interest/growth
  const debtStart = state.debts.map((d) => ({ ...d }));
  const investStart = state.investments.map((i) => ({ ...i }));

  const netWorthStart =
    state.cash + sum(state.investments.map((i) => i.balance)) - sum(state.debts.map((d) => d.balance));

  // 1) Income
  cash += state.income;

  // 2) Variable wants (planned spend, no arrears). Allow per-category temporary adjustment.
  const wants = state.variableWants.map((c) => {
    const delta = choice.variableWantsAdjust?.[c.id] ?? 0;
    return { ...c, planned: clampNonNegative(c.planned + delta) };
  });
  let wantsActual = 0;
  for (const w of wants) {
    const pay = Math.min(w.planned, Math.max(0, cash));
    wantsActual += pay;
    cash -= pay;
    if (cash <= 0) cash = 0;
  }
  const wantsSummary: ExpenseSpendSummary = { planned: sum(wants.map((w) => w.planned)), actual: wantsActual };

  // 3) Variable needs (planned spend, no arrears). Allow per-category temporary adjustment.
  const needs = state.variableNeeds.map((c) => {
    const delta = choice.variableNeedsAdjust?.[c.id] ?? 0;
    return { ...c, planned: clampNonNegative(c.planned + delta) };
  });
  let needsActual = 0;
  for (const n of needs) {
    const pay = Math.min(n.planned, Math.max(0, cash));
    needsActual += pay;
    cash -= pay;
    if (cash <= 0) cash = 0;
  }
  const needsSummary: ExpenseSpendSummary = { planned: sum(needs.map((n) => n.planned)), actual: needsActual };

  // 4) Fixed expenses (base + arrears), priority order as listed; unpaid becomes new arrears.
  const fixedSummaries: FixedExpenseSummary[] = [];
  const fixedUpdated = state.fixedExpenses.map((f) => ({ ...f }));
  for (const f of fixedUpdated) {
    const due = f.baseMonthly + f.arrears;
    const paid = Math.min(due, Math.max(0, cash));
    cash -= paid;
    if (cash <= 0) cash = 0;
    const newArrears = due - paid;
    f.arrears = newArrears; // carryover
    fixedSummaries.push({ id: f.id, name: f.name, due, paid, newArrears });
  }

  // 5) Debts: interest on start balances, then payments with priority capping.
  const debtSummaries: DebtSummary[] = [];
  const debtsUpdated = state.debts.map((d) => ({ ...d }));

  // Compute owed this cycle per debt from start snapshot
  const owedThisCycleById: Record<string, number> = {};
  const interestById: Record<string, number> = {};
  for (const d of debtStart) {
    const monthlyRate = d.apr / 12;
    const interest = d.balance * monthlyRate;
    interestById[d.id] = interest;
    owedThisCycleById[d.id] = d.balance + interest;
  }

  // Priority capping using user plan
  const debtPlanPriority = choice.debtPlan?.priority ?? [];
  const debtPlanAmounts = choice.debtPlan?.amounts ?? {};

  const actualPaidById: Record<string, number> = {};

  for (const id of debtPlanPriority) {
    const planned = clampNonNegative(debtPlanAmounts[id] ?? 0);
    const owed = clampNonNegative(owedThisCycleById[id] ?? 0);
    const pay = Math.min(planned, Math.max(0, cash), owed);
    actualPaidById[id] = (actualPaidById[id] ?? 0) + pay;
    cash -= pay;
    if (cash <= 0) cash = 0;
  }

  // Apply payments to updated debts and build summaries
  for (const d of debtsUpdated) {
    const interest = interestById[d.id] ?? 0;
    const owed = (owedThisCycleById[d.id] ?? d.balance);
    const planned = clampNonNegative(debtPlanAmounts[d.id] ?? 0);
    const actual = clampNonNegative(actualPaidById[d.id] ?? 0);
    const endBalance = Math.max(0, owed - actual);
    d.balance = endBalance;
    const suggestedMinimum = d.balance > 0 ? ((d.minimumRule?.base ?? 25) + interest) : 0;
    const metMinimum = suggestedMinimum === 0 || actual + 0.0001 >= suggestedMinimum;
    debtSummaries.push({
      id: d.id,
      name: d.name,
      startBalance: (debtStart.find((s) => s.id === d.id)?.balance ?? d.balance + actual - interest),
      interest,
      owedThisCycle: owed,
      plannedPayment: planned,
      actualPayment: actual,
      suggestedMinimum,
      metMinimum,
      endBalance,
    });
  }

  // 6) Investments: contributions with priority capping, then growth on start balances.
  const investmentSummaries: InvestmentSummary[] = [];
  const investsUpdated = state.investments.map((i) => ({ ...i }));

  const investPlanPriority = choice.investPlan?.priority ?? [];
  const investPlanAmounts = choice.investPlan?.amounts ?? {};
  const actualContribById: Record<string, number> = {};

  for (const id of investPlanPriority) {
    const planned = clampNonNegative(investPlanAmounts[id] ?? 0);
    const pay = Math.min(planned, Math.max(0, cash));
    actualContribById[id] = (actualContribById[id] ?? 0) + pay;
    cash -= pay;
    if (cash <= 0) cash = 0;
  }

  // Apply contributions
  for (const i of investsUpdated) {
    const contrib = clampNonNegative(actualContribById[i.id] ?? 0);
    i.balance += contrib;
  }

  // Growth from starting balances only
  for (const i of investsUpdated) {
    const startBal = investStart.find((s) => s.id === i.id)?.balance ?? i.balance;
    const monthlyRate = i.apr / 12;
    const growth = startBal * monthlyRate;
    i.balance += growth;
  }

  // Build investment summaries
  for (const i of investsUpdated) {
    const startBal = investStart.find((s) => s.id === i.id)?.balance ?? i.balance;
    const planned = clampNonNegative(investPlanAmounts[i.id] ?? 0);
    const actual = clampNonNegative(actualContribById[i.id] ?? 0);
    const monthlyRate = i.apr / 12;
    const growth = startBal * monthlyRate;
    investmentSummaries.push({
      id: i.id,
      name: i.name,
      startBalance: startBal,
      plannedContribution: planned,
      actualContribution: actual,
      growth,
      endBalance: i.balance,
    });
  }

  // New state
  const newState: ScenarioState = {
    ...state,
    month: state.month + 1,
    cash: cash,
    fixedExpenses: fixedUpdated,
    debts: debtsUpdated,
    investments: investsUpdated,
    // variable groups remain as in state; planned amounts are not persisted from adjustments
  };

  const netWorthEnd = newState.cash + sum(newState.investments.map((i) => i.balance)) - sum(newState.debts.map((d) => d.balance));

  const result: MonthResult = {
    newState,
    cashChange: newState.cash - state.cash,
    wantsSummary,
    needsSummary,
    fixedSummaries,
    debtSummaries,
    investmentSummaries,
    netWorthStart,
    netWorthEnd,
    netWorthChange: netWorthEnd - netWorthStart,
  };

  return result;
}
