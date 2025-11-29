// types.ts

// Expanded engine types (small, readable, multi-account)

export interface FixedExpenseItem {
  id: string;
  name: string;
  baseMonthly: number;
  arrears: number; // carried unpaid balance, no interest in v1
}

export interface VariableCategory {
  id: string;
  name: string;
  planned: number; // planned spend per month
}

export interface DebtAccount {
  id: string;
  name: string;
  balance: number;
  apr: number; // annual percentage rate
  // Suggested minimum display helper (engine does not enforce)
  minimumRule?: {
    base: number; // e.g., 25
  };
}

export interface InvestmentAccount {
  id: string;
  name: string;
  balance: number;
  apr: number; // expected annual return
}

export interface ScenarioState {
  month: number; // current month
  cash: number;
  income: number;

  // Expenses
  variableWants: VariableCategory[];
  variableNeeds: VariableCategory[];
  fixedExpenses: FixedExpenseItem[]; // processed in listed priority order

  // Accounts
  debts: DebtAccount[];
  investments: InvestmentAccount[];
}

// Choice: user plan for the month
export interface AllocationPlan {
  // priority order of ids to fund first
  priority: string[];
  // planned amount per id
  amounts: Record<string, number>;
}

export interface ScenarioChoice {
  // Adjust planned amounts for variable categories for this month
  variableWantsAdjust?: Record<string, number>; // delta to planned
  variableNeedsAdjust?: Record<string, number>; // delta to planned

  // Fixed expenses have no choice input besides priority already in state

  // Debt payments plan (priority capping)
  debtPlan?: AllocationPlan;
  // Investment contributions plan (priority capping)
  investPlan?: AllocationPlan;
}

export interface ExpenseSpendSummary {
  planned: number;
  actual: number;
}

export interface FixedExpenseSummary {
  id: string;
  name: string;
  due: number;
  paid: number;
  newArrears: number;
}

export interface DebtSummary {
  id: string;
  name: string;
  startBalance: number;
  interest: number;
  owedThisCycle: number;
  plannedPayment: number;
  actualPayment: number;
  suggestedMinimum: number; // informational only
  metMinimum: boolean;
  endBalance: number;
}

export interface InvestmentSummary {
  id: string;
  name: string;
  startBalance: number;
  plannedContribution: number;
  actualContribution: number;
  growth: number; // from starting balance only
  endBalance: number;
}

export interface MonthResult {
  newState: ScenarioState;

  // Cash movements
  cashChange: number;

  // Expenses
  wantsSummary: ExpenseSpendSummary;
  needsSummary: ExpenseSpendSummary;
  fixedSummaries: FixedExpenseSummary[];

  // Accounts
  debtSummaries: DebtSummary[];
  investmentSummaries: InvestmentSummary[];

  // Simple metrics
  netWorthStart: number;
  netWorthEnd: number;
  netWorthChange: number;
}

export interface ScenarioConfig {
  id: string;
  title: string;
  description: string;
  initialState: ScenarioState;
  totalMonths: number;
}
