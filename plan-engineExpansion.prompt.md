Plan: Expand Financial Simulation Engine

Enhance the current single-account, linear month processor into a modular, extensible multi-account simulation with strategies, events, multi-goal tracking, and richer analytics. Core work splits between widening the data model, refactoring runMonth into a pipeline with pluggable strategies, introducing scenario timeline events, and adding metrics for user feedback and testing reliability. Prioritization aims for incremental complexity without blocking UI evolution.

Steps
1. Introduce extended models (DebtAccount, InvestmentAccount, Goal, TimelineEvent) in types.ts and draft ScenarioConfigV2.
2. Refactor runMonth into phased functions (events → income/expenses → interest accrual → strategy allocation → settlements) with AllocationStrategy.
3. Add multi-debt payment logic (snowball/avalanche) and emergency fund goal handling in a new strategies module.
4. Implement timeline event processing (scheduled income/expense changes) and config versioning + validation schema.
5. Add analytics collector (net worth, progress, stress indicators) building a monthly metrics array for UI and tests.
6. Create ENGINE_PLAN.txt backlog with roadmap items (accounts, strategies, events, goals, Monte Carlo, performance).

Further Considerations
1. Return model choice: deterministic APR first vs early volatility? Option A deterministic; B light noise; C full stochastic.
2. Config format: JSON (simpler) vs YAML (authoring ease) vs hybrid; pick one early to avoid migrations churn.
3. Negative cash handling: warning only vs auto short-term debt injection (overdraft) impacts strategy complexity.

(Review and adjust; I’ll refine after prioritization feedback.)

Feature Categories (What, Not How)
Core Financial Accounts
- Multiple debt accounts: balance, APR, minimum rule, type (credit card, loan).
- Multiple investment accounts: balance, expected annual return, risk label, liquidity days.
- Emergency fund reserve: target amount (e.g., months of expenses) tracked separately from cash.
- Income streams: base salary, side gig, bonus events (recurring vs one-off).
- Expense layers: fixed (housing/basic), adjustable variable, episodic one-off expense events.

Events & Timeline
- Scheduled income changes (raise at month X, bonus at month Y).
- Expense spikes (medical bill, travel) one-off or probabilistic.
- Interest rate adjustments (debt APR change, investment return regime shift).
- Strategy milestones (unlock new allocation rule at month N).

Goals System
- Multiple simultaneous goals (debt payoff, emergency fund, investment target).
- Goal prioritization metadata (priority, deadline, weighting).
- Goal progress tracking (percent toward target, forecast months remaining).
- Composite goals (net worth threshold combining accounts).

Strategy Layer
- Allocation strategy definitions (percentage of surplus, threshold triggers).
- Debt payment strategy variants (snowball, avalanche, hybrid).
- Emergency fund precedence rule (surplus diverted until target met).
- Dynamic expense adjustment strategy (reduce variable spend under stress).
- Investment diversification strategy (distribute contributions across accounts).

Risk & Volatility
- Stochastic investment returns (configurable volatility model).
- Unexpected expense probability model (difficulty modifier).
- Income variability (range or distribution around base value).
- Drawdown tracking (max decline from peak investment balance).

Analytics & Metrics
- Net worth per month (cash + investments - debts).
- Debt payoff forecast (months remaining at current pace).
- Savings rate (investments + reserve contributions / income).
- Emergency fund coverage (months of essential expenses).
- Allocation deviation (planned vs actual percentages).
- Stress indicators (negative cash incidents, scaled plan frequency).
- Interest vs principal paid breakdown per debt.
- Return metrics (monthly return, cumulative return, risk-adjusted score).

Realism Enhancements
- Tax withholding approximation (flat percentage or brackets).
- Fees (late payment, investment management, transaction).
- Inflation on adjustable expenses.
- Overdraft line (automatic short-term debt when cash < 0).
- Variable minimum payment formulas (lender rules).

Extensibility & Config
- Versioned scenario config (v2) with arrays (debts, investments, goals, events).
- External scenario file format (JSON primary, optional YAML parser).
- Timeline event scripting (trigger month + payload).
- Difficulty presets (risk, volatility, expense shock frequency).
- Validation schema (JSON Schema) for config integrity.
- Seed parameter for reproducible stochastic runs.

User Progression & Difficulty
- Skill level affecting investment return edge or strategy unlocks.
- Difficulty scaling (higher volatility, tighter minimum payment rules).
- Achievement tracking (milestones: first fully paid debt, emergency fund reached).

Simulation Modes
- Deterministic baseline run (no randomness).
- Monte Carlo batch runs for outcome distribution (time to goals, probability of shortfall).
- Fast-forward mode (auto-run until next event or goal completion).
- Scenario comparison (A/B feature sets or strategies).

Prioritized Backlog (What First)
1. Multi-debt support (DebtAccount list).
2. Multi-goal tracking (Goal array + progress calc).
3. Emergency fund reserve + coverage metric.
4. Allocation strategy (percentage-based surplus distribution).
5. Debt payment strategy (snowball/avalanche selection).
6. Analytics: net worth, savings rate, debt payoff forecast.
7. Timeline events: scheduled income change + one-off expense.
8. ScenarioConfig v2 (version + arrays + validation schema stub).
9. Stochastic investment returns (simple volatility toggle & seed).
10. Stress indicators (scaled plan frequency, negative cash count).
11. Minimum payment formula variants (configurable per debt).
12. Emergency fund precedence rule (allocation ordering).
13. Monte Carlo mode (batch run wrapper around month loop).
14. Expense inflation (annual or monthly rate field).
15. Achievement milestones (goal completion events list).

Open Questions To Clarify Scope
- Target months scale (12 vs 120+) for performance planning?
- Must emergency fund be a distinct account or flag on cash?
- Earliest introduction of randomness (Phase 1 or later)?
- Depth of tax modeling (flat rate vs deferred phase)?
- How strict should negative cash consequences be (warning vs overdraft debt)?
- UI expectations for multi-goal display (stacked progress bars, aggregated score)?