// src/pages/ScenarioRunner.tsx
import { useState } from "react";
import { creditCardScenario } from "../core/scenarios";
import type { ScenarioState, MonthResult, ScenarioChoice } from "../core/types";
import { runMonth } from "../core/engine";

export default function ScenarioRunner() {
  const [scenario] = useState(creditCardScenario);
  const [state, setState] = useState<ScenarioState>(scenario.initialState);
  const [history, setHistory] = useState<MonthResult[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [investInput, setInvestInput] = useState("");
  const [debtInput, setDebtInput] = useState("");
  const [variableInput, setVariableInput] = useState("");

  function handleReset() {
    setState(scenario.initialState);
    setHistory([]);
    setIsFinished(false);
     setInvestInput("");
     setDebtInput("");
     setVariableInput("");
  }

  function handleNextMonth() {
    if (isFinished) return;

    const investContribution =
      investInput === "" ? 0 : Number(investInput);

    const debtPayment =
      debtInput === "" ? undefined : Number(debtInput);

    const variableExpenseAdjustment =
      variableInput === "" ? 0 : Number(variableInput);

    const choice: ScenarioChoice = {
      investContribution,
      debtPayment,
      variableExpenseAdjustment,
    };

    const result = runMonth(state, choice);

    setState(result.newState);
    setHistory((prev) => [...prev, result]);

    if (result.newState.month >= scenario.totalMonths) {
      setIsFinished(true);
    }
  }

  return (
    <main className="container">
      <nav className="brandBar">
        <div className="brand">
          <span className="brandName">Afra</span>
          {/* Logo will render when /public/afralogo1.png exists */}
          <img src="/afralogo1.png" alt="Afra" className="brandLogo" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        </div>
        {/* Hidden since Home now provides entry CTA */}
      </nav>

      <header className="header">
        <h1 className="title">{scenario.title}</h1>
        <p className="subtitle">{scenario.description}</p>
      </header>

      <section className="card">
        <h2 className="sectionTitle">Current month: {state.month}</h2>
        <div className="metrics">
          <div className="metric"><span className="label">Income</span><span className="value">${state.income.toFixed(2)}</span></div>
          <div className="metric"><span className="label">Basic expenses</span><span className="value">${state.basicExpenses.toFixed(2)}</span></div>
          <div className="metric"><span className="label">Cash</span><span className="value">${state.cash.toFixed(2)}</span></div>
          <div className="metric"><span className="label">Investments</span><span className="value">${state.investments.toFixed(2)}</span></div>
          <div className="metric">
            <span className="label">Credit card balance</span>
            <div className="valueGroup">
              <span className="value">${state.debtBalance.toFixed(2)}</span>
              <span className="subtext">
                Minimum payment: $
                {(
                  state.debtBalance > 0
                    ? 25 + state.debtBalance * (state.debtApr / 12)
                    : 0
                ).toFixed(2)}
              </span>
            </div>
          </div>
          <div className="metric"><span className="label">Variable expenses</span><span className="value">${state.variableExpenses.toFixed(2)}</span></div>
          
          <div className="metric"><span className="label">Goal</span><span className="value">{state.goalType === "pay_off_debt" ? "Pay off debt" : "Build cash buffer"}</span></div>
        </div>
      </section>

      <section className="card">
        <h2 className="sectionTitle">Your plan for this month</h2>
        <div className="formGrid">
          <label className="field">
            <span className="fieldLabel">Invest this month ($)</span>
            <input
              type="number"
              min={0}
              value={investInput}
              onChange={(e) => setInvestInput(e.target.value)}
              className="input"
            />
          </label>

          <label className="field">
            <span className="fieldLabel">Total credit-card payment ($)</span>
            <input
              type="number"
              min={0}
              value={debtInput}
              onChange={(e) => setDebtInput(e.target.value)}
              placeholder="Blank = minimum only"
              className="input"
            />
          </label>

          <label className="field">
            <span className="fieldLabel">Change variable expenses ($)</span>
            <input
              type="number"
              value={variableInput}
              onChange={(e) => setVariableInput(e.target.value)}
              placeholder="Negative = spend less"
              className="input"
            />
          </label>
        </div>
      </section>

      <section className="actions">
        <button onClick={handleNextMonth} disabled={isFinished} className="btn primary">
          {isFinished ? "Scenario complete" : "Run next month"}
        </button>
        <button onClick={handleReset} className="btn">
          Reset
        </button>
      </section>

      <section className="history">
        <h2 className="sectionTitle">Monthly history</h2>
        {history.length === 0 && <p className="muted">No months run yet.</p>}
        {history.map((m, index) => (
          <div key={index} className="card">
            <strong className="sectionTitle">Month {index + 1}</strong>
            <div className="metrics">
              <div className="metric"><span className="label">Planned invest</span><span className="value">${m.plannedInvest.toFixed(2)}</span></div>
              <div className="metric"><span className="label">Actual invest</span><span className="value">${m.actualInvest.toFixed(2)}</span></div>
              <div className="metric"><span className="label">Planned debt payment</span><span className="value">${m.plannedDebtPayment.toFixed(2)}</span></div>
              <div className="metric"><span className="label">Actual debt payment</span><span className="value">${m.actualDebtPayment.toFixed(2)}</span></div>
              <div className="metric"><span className="label">Interest charged</span><span className="value">${m.interestCharged.toFixed(2)}</span></div>
              <div className="metric"><span className="label">Cash change</span><span className="value">${m.cashChange.toFixed(2)}</span></div>
              <div className="metric"><span className="label">Minimum due</span><span className="value">${m.minPaymentDue.toFixed(2)}</span></div>
              <div className="metric"><span className="label">Minimum met</span><span className="value">{m.metMinimum ? "Yes" : "No"}</span></div>
            </div>
            {m.wasScaled && (
              <p className="warning">Your plan was scaled down because there wasn&apos;t enough cash after bills.</p>
            )}
          </div>
        ))}
      </section>
    </main>
  );
}
