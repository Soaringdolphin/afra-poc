// engine.ts
import type { ScenarioState, ScenarioChoice, MonthResult } from "./types";

export function runMonth(
  state: ScenarioState,
  choice: ScenarioChoice
): MonthResult {
  let cash = state.cash;
  let debtBalanceStart = state.debtBalance;

  // Track investments separately: starting balance vs new contributions
  const startingInvestments = state.investments;
  let investments = startingInvestments;

  // 1. Apply variable expense adjustment for this month and going forward
  const variableAdjustment = choice.variableExpenseAdjustment ?? 0;
  const newVariableExpenses = Math.max(
    0,
    state.variableExpenses + variableAdjustment
  );

  // 2. Add income
  cash += state.income;

  // 3. Subtract fixed + variable expenses (using adjusted variable expenses)
  cash -= state.housingCost;
  cash -= state.basicExpenses;
  cash -= newVariableExpenses;

  // Cash cannot go below negative infinity mathematically, but for the sim
  // we just allow negative cash to signal "overdrawn" if that ever happens.
  // For most paths, cash should stay >= 0 if the scenario is reasonable.
  let cashAfterBills = cash;

  // 4. Investment growth on starting investments only
  const monthlyInvestmentRate = state.investmentApr / 12;
  const investmentInterest = startingInvestments * monthlyInvestmentRate;
  investments += investmentInterest;

  // 5. Compute this month's debt interest and minimum payment
  const monthlyDebtRate = state.debtApr / 12;
  const interestForMonth = debtBalanceStart * monthlyDebtRate;

  // Minimum is 25 + interest for the month
  const minPaymentDue = debtBalanceStart > 0 ? 25 + interestForMonth : 0;

  // Total owed before payment is previous balance plus this month's interest
  const debtOwedThisCycle = debtBalanceStart + interestForMonth;

  // 6. Decide how much to invest and how much to pay toward debt from leftover cash
  const availableForAllocation = Math.max(0, cashAfterBills);

  const requestedInvest = Math.max(0, choice.investContribution ?? 0);

  const requestedDebtPayment =
    choice.debtPayment !== undefined
      ? Math.max(0, choice.debtPayment)
      : minPaymentDue;

  let plannedInvest = requestedInvest;
  let plannedDebtPayment = requestedDebtPayment;

  const totalPlanned = plannedInvest + plannedDebtPayment;

  let wasScaled = false;

  if (totalPlanned > availableForAllocation && totalPlanned > 0) {
    const scale = availableForAllocation / totalPlanned;
    plannedInvest = Math.floor(plannedInvest * scale);
    plannedDebtPayment = Math.floor(plannedDebtPayment * scale);
    wasScaled = true;
  }

  // 7. Apply investment contribution
  const actualInvest = Math.min(plannedInvest, Math.max(0, cashAfterBills));
  cashAfterBills -= actualInvest;
  investments += actualInvest;

  // 8. Apply debt payment, capped by what is owed and remaining cash
  const maxDebtPayable = debtOwedThisCycle;
  const actualDebtPayment = Math.min(
    plannedDebtPayment,
    maxDebtPayable,
    Math.max(0, cashAfterBills)
  );

  cashAfterBills -= actualDebtPayment;

  // New debt balance is what was owed this cycle minus what got paid
  const debtBalanceEnd = Math.max(0, debtOwedThisCycle - actualDebtPayment);

  // 9. Construct new state
  const newState: ScenarioState = {
    ...state,
    month: state.month + 1,
    cash: cashAfterBills,
    debtBalance: debtBalanceEnd,
    investments,
    variableExpenses: newVariableExpenses,
  };

  const cashChange = newState.cash - state.cash;

  const metMinimum =
    minPaymentDue === 0 || actualDebtPayment + 0.01 >= minPaymentDue;

  const result: MonthResult = {
    newState,
    interestCharged: interestForMonth,
    totalDebtPayment: actualDebtPayment,
    cashChange,
    minPaymentDue,
    metMinimum,
    plannedInvest: requestedInvest,
    plannedDebtPayment: requestedDebtPayment,
    actualInvest,
    actualDebtPayment,
    availableForAllocation,
    wasScaled,
  };

  return result;
}
