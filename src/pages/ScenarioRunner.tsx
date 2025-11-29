// src/pages/ScenarioRunner.tsx
import { useMemo, useState, useEffect } from "react";
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
  const [fastForwardCount, setFastForwardCount] = useState<number>(1);
  const [collapsedMonths, setCollapsedMonths] = useState<Record<number, boolean>>({});

  const STORAGE_KEY = "afra:lastCustomScenario";

  // Load last custom settings on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data?.debtPlan) setDebtPlan(data.debtPlan);
        if (data?.investPlan) setInvestPlan(data.investPlan);
        if (data?.wantsAdjust) setWantsAdjust(data.wantsAdjust);
        if (data?.needsAdjust) setNeedsAdjust(data.needsAdjust);
      }
    } catch {}
  }, []);

  // Persist settings whenever inputs change
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ wantsAdjust, needsAdjust, debtPlan, investPlan })
      );
    } catch {}
  }, [wantsAdjust, needsAdjust, debtPlan, investPlan]);

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

  // Single-month simulation handled by handleSimulate batching; no separate handler needed.

  function handleSimulate() {
    const n = Math.min(12, Math.max(1, Math.floor(fastForwardCount || 1)));
    let localState = state;
    const localHistory: MonthResult[] = [];
    let finished = isFinished;
    for (let i = 0; i < n; i++) {
      if (finished) break;
      const choice: ScenarioChoice = {
        variableWantsAdjust: wantsAdjust,
        variableNeedsAdjust: needsAdjust,
        debtPlan,
        investPlan,
      };
      const result = runMonth(localState, choice);
      localState = result.newState;
      localHistory.push(result);
      if (result.newState.month >= scenario.totalMonths) {
        finished = true;
      }
    }
    if (localHistory.length > 0) {
      setState(localState);
      setHistory((prev) => [...prev, ...localHistory]);
      setIsFinished(finished);
      setWantsAdjust({});
      setNeedsAdjust({});
      const last = localHistory[localHistory.length - 1];
      const missedMins = last.debtSummaries.filter((d) => !d.metMinimum);
      const unpaidFixed = last.fixedSummaries.filter((f) => f.newArrears > 0);
      setShowNotices(missedMins.length > 0 || unpaidFixed.length > 0);
      setCollapsedMonths((prev) => {
        const next: Record<number, boolean> = { ...prev };
        const newIndex = (history.length + localHistory.length) - 1;
        for (let i = 0; i <= newIndex; i++) {
          next[i] = i !== newIndex;
        }
        return next;
      });
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
        <h2 className="sectionTitle">Snapshot</h2>
        <div className="metrics">
          <div className="metric"><span className="label">Month</span><span className="value">{state.month}</span></div>
          <div className="metric"><span className="label">Income</span><span className="value">${state.income.toFixed(2)}</span></div>
          <div className="metric"><span className="label">Cash</span><span className="value">${state.cash.toFixed(2)}</span></div>
          <div className="metric"><span className="label">Debts Total</span><span className="value">${state.debts.reduce((a, d) => a + d.balance, 0).toFixed(2)}</span></div>
          <div className="metric"><span className="label">Investments Total</span><span className="value">${state.investments.reduce((a, i) => a + i.balance, 0).toFixed(2)}</span></div>
          <div className="metric"><span className="label">Net Worth</span><span className="value">${(state.cash + state.investments.reduce((a,i)=>a+i.balance,0) - state.debts.reduce((a,d)=>a+d.balance,0)).toFixed(2)}</span></div>
        </div>
      </section>

      <section className="card">
        <h2 className="sectionTitle">Variable Wants</h2>
        <div className="formGrid">
          {state.variableWants.map((c) => (
            <label key={c.id} className="field">
              <span className="fieldLabel">{c.name}</span>
              <span className="subtext">Planned ${c.planned.toFixed(2)} • Enter delta (e.g., -50 to spend less)</span>
              <div className="inputGroup">
                <button type="button" className="signToggle" onClick={() => setWantsAdjust((prev) => {
                  const v = Number(prev[c.id] ?? 0);
                  const flipped = v === 0 ? -0 : -v;
                  return { ...prev, [c.id]: flipped };
                })} aria-label="Toggle sign">±</button>
                <input
                  type="number"
                  inputMode="decimal"
                  step={0.01}
                  className="input"
                  placeholder="Adjustment this month"
                  value={String(wantsAdjust[c.id] ?? "")}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const num = raw === "" ? NaN : Number(raw);
                    if (isNaN(num)) {
                      setWantsAdjust((prev) => ({ ...prev, [c.id]: undefined as any }));
                    } else {
                      const rounded = Math.round(num * 100) / 100;
                      setWantsAdjust((prev) => ({ ...prev, [c.id]: rounded }));
                    }
                  }}
                  onBlur={(e) => {
                    const num = Number(e.target.value);
                    if (!isNaN(num)) {
                      const fixed = (Math.round(num * 100) / 100).toFixed(2);
                      e.target.value = fixed;
                    }
                  }}
                />
              </div>
              <span className="subtext">This month total: ${(c.planned + (Number(wantsAdjust[c.id]) || 0)).toFixed(2)}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="sectionTitle">Variable Needs</h2>
        <div className="formGrid">
          {state.variableNeeds.map((c) => (
            <label key={c.id} className="field">
              <span className="fieldLabel">{c.name}</span>
              <span className="subtext">Planned ${c.planned.toFixed(2)} • Enter delta (e.g., +25 to spend more)</span>
              <div className="inputGroup">
                <button type="button" className="signToggle" onClick={() => setNeedsAdjust((prev) => {
                  const v = Number(prev[c.id] ?? 0);
                  const flipped = v === 0 ? -0 : -v;
                  return { ...prev, [c.id]: flipped };
                })} aria-label="Toggle sign">±</button>
                <input
                  type="number"
                  inputMode="decimal"
                  step={0.01}
                  className="input"
                  placeholder="Adjustment this month"
                  value={String(needsAdjust[c.id] ?? "")}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const num = raw === "" ? NaN : Number(raw);
                    if (isNaN(num)) {
                      setNeedsAdjust((prev) => ({ ...prev, [c.id]: undefined as any }));
                    } else {
                      const rounded = Math.round(num * 100) / 100;
                      setNeedsAdjust((prev) => ({ ...prev, [c.id]: rounded }));
                    }
                  }}
                  onBlur={(e) => {
                    const num = Number(e.target.value);
                    if (!isNaN(num)) {
                      const fixed = (Math.round(num * 100) / 100).toFixed(2);
                      e.target.value = fixed;
                    }
                  }}
                />
              </div>
              <span className="subtext">This month total: ${(c.planned + (Number(needsAdjust[c.id]) || 0)).toFixed(2)}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="sectionTitle">Fixed Expenses</h2>
        <div className="metrics">
          {state.fixedExpenses.map((f) => (
            <div key={f.id} className="metric">
              <span className="label">{f.name}</span>
              <div className="valueGroup">
                <span className="value">Base ${f.baseMonthly.toFixed(2)}</span>
                {f.arrears > 0 ? (
                  <span className="subtext arrears">Arrears ${f.arrears.toFixed(2)}</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="sectionTitle">Debt</h2>
        <div className="formGrid">
          {debtPlan.priority.map((id) => {
            const d = state.debts.find((x) => x.id === id)!;
            const minDisplay = (d.minimumRule?.base ?? 25) + d.balance * (d.apr / 12);
            return (
              <div key={id} className="field">
                <span className="fieldLabel">
                  <strong>{d.name}</strong> — bal ${d.balance.toFixed(2)} — APR {(d.apr * 100).toFixed(2)}% — suggested min ${minDisplay.toFixed(2)}
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="number"
                    className="input"
                    min={0}
                    step={0.01}
                    value={String(debtPlan.amounts[id] ?? 0)}
                    onChange={(e) => {
                      const num = Number(e.target.value);
                      const rounded = isNaN(num) ? 0 : Math.max(0, Math.round(num * 100) / 100);
                      setDebtPlan((prev) => ({ priority: prev.priority, amounts: { ...prev.amounts, [id]: rounded } }));
                    }}
                    onBlur={(e) => {
                      const num = Number(e.target.value);
                      if (!isNaN(num)) e.target.value = (Math.max(0, Math.round(num * 100) / 100)).toFixed(2);
                    }}
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
        <h2 className="sectionTitle">Investments</h2>
        <div className="formGrid">
          {investPlan.priority.map((id) => {
            const i = state.investments.find((x) => x.id === id)!;
            return (
              <div key={id} className="field">
                <span className="fieldLabel"><strong>{i.name}</strong> — bal ${i.balance.toFixed(2)} — APR {(i.apr * 100).toFixed(2)}%</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="number"
                    className="input"
                    min={0}
                    step={0.01}
                    value={String(investPlan.amounts[id] ?? 0)}
                    onChange={(e) => {
                      const num = Number(e.target.value);
                      const rounded = isNaN(num) ? 0 : Math.max(0, Math.round(num * 100) / 100);
                      setInvestPlan((prev) => ({ priority: prev.priority, amounts: { ...prev.amounts, [id]: rounded } }));
                    }}
                    onBlur={(e) => {
                      const num = Number(e.target.value);
                      if (!isNaN(num)) e.target.value = (Math.max(0, Math.round(num * 100) / 100)).toFixed(2);
                    }}
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
        <div className="fastForwardBar">
          <span className="fieldLabel">Months</span>
          <input
            aria-label="Months to simulate"
            type="number"
            className="input fastInput"
            min={1}
            max={12}
            step={1}
            value={String(fastForwardCount)}
            onChange={(e) => {
              const n = Number(e.target.value);
              setFastForwardCount(isNaN(n) ? 1 : Math.min(12, Math.max(1, Math.floor(n))));
            }}
            onBlur={(e) => {
              const n = Number(e.target.value);
              e.target.value = String(Math.min(12, Math.max(1, isNaN(n) ? 1 : Math.floor(n))));
            }}
          />
        </div>
        <button onClick={handleSimulate} disabled={isFinished} className="btn primary">
          {isFinished ? "Scenario complete" : "Simulate"}
        </button>
        <button onClick={handleReset} className="btn">
          Reset
        </button>
      </section>

      {/* Floating simulate button for mobile/web to avoid long scrolls */}
      {!isFinished && (
        <button className="fab" aria-label="Simulate" onClick={handleSimulate}>
          ▶ Simulate
        </button>
      )}

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
        <h2 className="sectionTitle">Monthly History</h2>
        {history.length === 0 && <p className="muted">No months run yet.</p>}
        {[...history].slice().reverse().map((m, revIndex) => {
          const index = history.length - 1 - revIndex;
          const isCollapsed = !!collapsedMonths[index];
          return (
            <div key={index} className="card">
              <button
                className="accordionHeader"
                onClick={() => setCollapsedMonths((prev) => ({ ...prev, [index]: !isCollapsed }))}
                aria-expanded={!isCollapsed}
                aria-controls={`month-${index}-panel`}
              >
                <strong className="sectionTitle">Month {index + 1}</strong>
                <span className="accordionChevron">{isCollapsed ? "▸" : "▾"}</span>
              </button>
              {!isCollapsed && (
                <div id={`month-${index}-panel`}>
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
              )}
            </div>
          );
        })}
      </section>
    </main>
  );
}
