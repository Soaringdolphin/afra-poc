// types.ts

export interface ScenarioState {
  month: number; // current month, 0–12
  income: number;
  housingCost: number;
  basicExpenses: number;
  variableExpenses: number; // adjustable over time by user choices
  cash: number;             // acts as cash savings by default
  investments: number;
  investmentApr: number;    // e.g. 0.05 for 5% annual
  debtBalance: number;
  debtApr: number;          // e.g. 0.1999 for 19.99 percent
  goalType: "pay_off_debt" | "build_cash_buffer";
  goalAmount: number;
}

/**
 * One month's set of user decisions.
 * If a field is omitted, it defaults to 0 in the engine,
 * except debtPayment, which defaults to the computed minimum.
 */
export interface ScenarioChoice {
  /** How much of leftover cash to move into investments this month */
  investContribution?: number;

  /** Total payment toward debt this month (not just extra) */
  debtPayment?: number;

  /**
   * Change to monthly variable expenses.
   * Negative = spend less, positive = spend more.
   * This persists in state.variableExpenses.
   */
  variableExpenseAdjustment?: number;
}

export interface MonthResult {
  newState: ScenarioState;
  interestCharged: number;    // interest added this month before payment
  totalDebtPayment: number;   // actual amount paid toward debt this month
  cashChange: number;         // delta in cash vs previous month
  minPaymentDue: number;      // 25 + interest for this month
  metMinimum: boolean;        // whether totalDebtPayment >= minPaymentDue

  // Planned vs actual allocations for this month
  plannedInvest: number;       // what the player tried to invest
  plannedDebtPayment: number;  // what the player tried to pay toward debt
  actualInvest: number;        // what actually went into investments
  actualDebtPayment: number;   // what actually went to debt
  availableForAllocation: number; // cash available after bills
  wasScaled: boolean;          // true if the plan was scaled down
}

export interface ScenarioConfig {
  id: string;
  title: string;
  description: string;
  initialState: ScenarioState;
  totalMonths: number;
}
