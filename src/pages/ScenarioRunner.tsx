// src/pages/ScenarioRunner.tsx
import { useMemo, useState } from "react";
import { creditCardScenario } from "../core/scenarios";
import type { ScenarioState, MonthResult, ScenarioChoice, AllocationPlan } from "../core/types";
import { runMonth } from "../core/engine";

function toPlan(ids: string[]): AllocationPlan {
  return { priority: ids, amounts: Object.fromEntries(ids.map((id) => [id, 0])) };
}

export default function ScenarioRunner() {
  const [scenario] = useState(creditCardScenario);
  const [state, setState] = useState<ScenarioState>(scenario.initialState);
  const [history, setHistory] = useState<MonthResult[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  // New UI model: per-category adjustments and explicit allocation plans
  const [wantsAdjust, setWantsAdjust] = useState<Record<string, number>>({});
  const [needsAdjust, setNeedsAdjust] = useState<Record<string, number>>({});
  const [debtPlan, setDebtPlan] = useState<AllocationPlan>(() => toPlan(scenario.initialState.debts.map((d) => d.id)));
  const [investPlan, setInvestPlan] = useState<AllocationPlan>(() => toPlan(scenario.initialState.investments.map((i) => i.id)));
  const [showNotices, setShowNotices] = useState(false);

  const totalPlannedDebt = useMemo(() => Object.values(debtPlan.amounts).reduce((a, b) => a + (b || 0), 0), [debtPlan]);
  const totalPlannedInvest = useMemo(() => Object.values(investPlan.amounts).reduce((a, b) => a + (b || 0), 0), [investPlan]);

  function handleReset() {
    setState(scenario.initialState);
    setHistory([]);
    setIsFinished(false);
    setWantsAdjust({});
    setNeedsAdjust({});
    setDebtPlan(toPlan(scenario.initialState.debts.map((d) => d.id)));
    setInvestPlan(toPlan(scenario.initialState.investments.map((i) => i.id)));
  }

  function handleNextMonth() {
    if (isFinished) return;
    const choice: ScenarioChoice = {
      variableWantsAdjust: wantsAdjust,
      variableNeedsAdjust: needsAdjust,
      debtPlan,
      investPlan,
    };

    const result = runMonth(state, choice);

    setState(result.newState);
    setHistory((prev) => [...prev, result]);

    if (result.newState.month >= scenario.totalMonths) {
      setIsFinished(true);
    }
    // clear one-time adjustments
    setWantsAdjust({});
    setNeedsAdjust({});
    // show notices modal if anything to report
    const missedMins = result.debtSummaries.filter((d) => !d.metMinimum);
    const unpaidFixed = result.fixedSummaries.filter((f) => f.newArrears > 0);
    setShowNotices(missedMins.length > 0 || unpaidFixed.length > 0);
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
        <h2 className="sectionTitle">Snapshot</h2>
        <div className="metrics">
          <div className="metric"><span className="label">Month</span><span className="value">{state.month}</span></div>
          <div className="metric"><span className="label">Income</span><span className="value">${state.income.toFixed(2)}</span></div>
          <div className="metric"><span className="label">Cash</span><span className="value">${state.cash.toFixed(2)}</span></div>
          <div className="metric"><span className="label">Debts total</span><span className="value">${state.debts.reduce((a, d) => a + d.balance, 0).toFixed(2)}</span></div>
          <div className="metric"><span className="label">Investments total</span><span className="value">${state.investments.reduce((a, i) => a + i.balance, 0).toFixed(2)}</span></div>
          <div className="metric"><span className="label">Net worth</span><span className="value">${(state.cash + state.investments.reduce((a,i)=>a+i.balance,0) - state.debts.reduce((a,d)=>a+d.balance,0)).toFixed(2)}</span></div>
        </div>
      </section>

      <section className="card">
        <h2 className="sectionTitle">Variable wants</h2>
        <div className="formGrid">
          {state.variableWants.map((c) => (
            <label key={c.id} className="field">
              <span className="fieldLabel">{c.name}</span>
              <span className="subtext">Planned ${c.planned.toFixed(2)} • Enter delta (e.g., -50 to spend less)</span>
              <input
                type="number"
                className="input"
                placeholder="Adjustment this month"
                value={String(wantsAdjust[c.id] ?? "")}
                onChange={(e) => setWantsAdjust((prev) => ({ ...prev, [c.id]: e.target.value === "" ? undefined as any : Number(e.target.value) }))}
              />
              <span className="subtext">This month total: ${(c.planned + (Number(wantsAdjust[c.id]) || 0)).toFixed(2)}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="sectionTitle">Variable needs</h2>
        <div className="formGrid">
          {state.variableNeeds.map((c) => (
            <label key={c.id} className="field">
              <span className="fieldLabel">{c.name}</span>
              <span className="subtext">Planned ${c.planned.toFixed(2)} • Enter delta (e.g., +25 to spend more)</span>
              <input
                type="number"
                className="input"
                placeholder="Adjustment this month"
                value={String(needsAdjust[c.id] ?? "")}
                onChange={(e) => setNeedsAdjust((prev) => ({ ...prev, [c.id]: e.target.value === "" ? undefined as any : Number(e.target.value) }))}
              />
              <span className="subtext">This month total: ${(c.planned + (Number(needsAdjust[c.id]) || 0)).toFixed(2)}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="sectionTitle">Fixed expenses (priority order)</h2>
        <div className="metrics">
          {state.fixedExpenses.map((f) => (
            <div key={f.id} className="metric">
              <span className="label">{f.name}</span>
              <div className="valueGroup">
                <span className="value">Base ${f.baseMonthly.toFixed(2)}</span>
                <span className="subtext arrears">Arrears ${f.arrears.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="sectionTitle">Debt plan</h2>
        <div className="formGrid">
          {debtPlan.priority.map((id) => {
            const d = state.debts.find((x) => x.id === id)!;
            const minDisplay = (d.minimumRule?.base ?? 25) + d.balance * (d.apr / 12);
            return (
              <div key={id} className="field">
                <span className="fieldLabel">
                  {d.name} — bal ${d.balance.toFixed(2)} — APR {(d.apr * 100).toFixed(2)}% — suggested min ${minDisplay.toFixed(2)}
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="number"
                    className="input"
                    min={0}
                    value={String(debtPlan.amounts[id] ?? 0)}
                    onChange={(e) => setDebtPlan((prev) => ({ priority: prev.priority, amounts: { ...prev.amounts, [id]: Number(e.target.value) } }))}
                  />
                  {state.debts.length > 1 && (
                    <>
                      <button className="btn small" onClick={() => setDebtPlan((p) => {
                        const idx = p.priority.indexOf(id);
                        if (idx <= 0) return p;
                        const newP = [...p.priority];
                        [newP[idx - 1], newP[idx]] = [newP[idx], newP[idx - 1]];
                        return { priority: newP, amounts: { ...p.amounts } };
                      })}>↑ Priority</button>
                      <button className="btn small" onClick={() => setDebtPlan((p) => {
                        const idx = p.priority.indexOf(id);
                        if (idx < 0 || idx >= p.priority.length - 1) return p;
                        const newP = [...p.priority];
                        [newP[idx + 1], newP[idx]] = [newP[idx], newP[idx + 1]];
                        return { priority: newP, amounts: { ...p.amounts } };
                      })}>↓ Priority</button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <p className="muted">Total planned debt payments: ${totalPlannedDebt.toFixed(2)}</p>
      </section>

      <section className="card">
        <h2 className="sectionTitle">Investment plan</h2>
        <div className="formGrid">
          {investPlan.priority.map((id) => {
            const i = state.investments.find((x) => x.id === id)!;
            return (
              <div key={id} className="field">
                <span className="fieldLabel">{i.name} — bal ${i.balance.toFixed(2)} — APR {(i.apr * 100).toFixed(2)}%</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="number"
                    className="input"
                    min={0}
                    value={String(investPlan.amounts[id] ?? 0)}
                    onChange={(e) => setInvestPlan((prev) => ({ priority: prev.priority, amounts: { ...prev.amounts, [id]: Number(e.target.value) } }))}
                  />
                  {state.investments.length > 1 && (
                    <>
                      <button className="btn small" onClick={() => setInvestPlan((p) => {
                        const idx = p.priority.indexOf(id);
                        if (idx <= 0) return p;
                        const newP = [...p.priority];
                        [newP[idx - 1], newP[idx]] = [newP[idx], newP[idx - 1]];
                        return { priority: newP, amounts: { ...p.amounts } };
                      })}>↑ Priority</button>
                      <button className="btn small" onClick={() => setInvestPlan((p) => {
                        const idx = p.priority.indexOf(id);
                        if (idx < 0 || idx >= p.priority.length - 1) return p;
                        const newP = [...p.priority];
                        [newP[idx + 1], newP[idx]] = [newP[idx], newP[idx + 1]];
                        return { priority: newP, amounts: { ...p.amounts } };
                      })}>↓ Priority</button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <p className="muted">Total planned contributions: ${totalPlannedInvest.toFixed(2)}</p>
      </section>

      <section className="actions">
        <button onClick={handleNextMonth} disabled={isFinished} className="btn primary">
          {isFinished ? "Scenario complete" : "Run next month"}
        </button>
        <button onClick={handleReset} className="btn">
          Reset
        </button>
      </section>

      {showNotices && history.length > 0 && (() => {
        const last = history[history.length - 1];
        const missedMins = last.debtSummaries.filter((d) => !d.metMinimum);
        const unpaidFixed = last.fixedSummaries.filter((f) => f.newArrears > 0);
        return (
          <div className="modalBackdrop" onClick={() => setShowNotices(false)}>
            <div className="modalCard" onClick={(e) => e.stopPropagation()}>
              <div className="modalHeader">
                <h3 className="modalTitle">Notices</h3>
                <button className="closeBtn" aria-label="Close" onClick={() => setShowNotices(false)}>×</button>
              </div>
              {missedMins.length > 0 && (
                <p className="warning">Missed suggested minimums: {missedMins.map((d) => d.name).join(", ")}</p>
              )}
              {unpaidFixed.length > 0 && (
                <p className="warning">Unpaid fixed expenses (arrears added): {unpaidFixed.map((f) => f.name).join(", ")}</p>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                <button className="btn primary" onClick={() => setShowNotices(false)}>Okay</button>
              </div>
            </div>
          </div>
        );
      })()}

      <section className="history">
        <h2 className="sectionTitle">Monthly history</h2>
        {history.length === 0 && <p className="muted">No months run yet.</p>}
        {history.map((m, index) => (
          <div key={index} className="card">
            <strong className="sectionTitle">Month {index + 1}</strong>
            <div className="historySection">
              <h4 className="historyTitle">Overview</h4>
              <div className="historyGrid">
                <div className="historyMetric"><span className="historyLabel">Cash change</span><div className="historyValue">${m.cashChange.toFixed(2)}</div></div>
                <div className="historyMetric"><span className="historyLabel">Net worth change</span><div className="historyValue">${m.netWorthChange.toFixed(2)}</div></div>
                <div className="historyMetric"><span className="historyLabel">Wants</span><div className="historyValue">${m.wantsSummary.actual.toFixed(2)} / ${m.wantsSummary.planned.toFixed(2)}</div></div>
                <div className="historyMetric"><span className="historyLabel">Needs</span><div className="historyValue">${m.needsSummary.actual.toFixed(2)} / ${m.needsSummary.planned.toFixed(2)}</div></div>
              </div>
            </div>
            <div className="historySection">
              <h4 className="historyTitle">Fixed expenses</h4>
              <div className="historyGrid">
              {m.fixedSummaries.map((f) => (
                <div key={f.id} className="historyMetric"><span className="historyLabel">{f.name} Paid</span><div className="historyValue">${f.paid.toFixed(2)} / ${f.due.toFixed(2)} {f.newArrears > 0 ? <span className="arrears">(Arrears ${f.newArrears.toFixed(2)})</span> : <span>(OK)</span>}</div></div>
              ))}
              </div>
            </div>
            <div className="historySection">
              <h4 className="historyTitle">Debts</h4>
              <div className="historyGrid">
              {m.debtSummaries.map((d) => (
                <div key={d.id} className="historyMetric"><span className="historyLabel">{d.name}</span><div className="historyValue">Paid ${d.actualPayment.toFixed(2)} • Interest ${d.interest.toFixed(2)} • {d.metMinimum ? 'Met Minimum' : <span className="arrears">Missed Minimum</span>}</div></div>
              ))}
              </div>
            </div>
            <div className="historySection">
              <h4 className="historyTitle">Investments</h4>
              <div className="historyGrid">
              {m.investmentSummaries.map((i) => (
                <div key={i.id} className="historyMetric"><span className="historyLabel">{i.name}</span><div className="historyValue">Contrib ${i.actualContribution.toFixed(2)} • Growth ${i.growth.toFixed(2)}</div></div>
              ))}
              </div>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
