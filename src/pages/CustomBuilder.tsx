// src/pages/CustomBuilder.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveCustomScenario } from "../core/scenarios";
import type { ScenarioConfig } from "../core/types";

export default function CustomBuilder() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("Custom Scenario");
  const [description, setDescription] = useState("Your personalized setup.");
  const [cash, setCash] = useState(1000);
  const [income, setIncome] = useState(3000);
  const [variableWants, setVariableWants] = useState<Array<{ name: string; planned: number }>>([
    { name: "Fun", planned: 200 },
    { name: "Dining out", planned: 100 },
  ]);
  const [variableNeeds, setVariableNeeds] = useState<Array<{ name: string; planned: number }>>([
    { name: "Groceries", planned: 350 },
    { name: "Transport", planned: 150 },
  ]);
  const [fixedExpenses, setFixedExpenses] = useState<Array<{ name: string; baseMonthly: number }>>([
    { name: "Rent", baseMonthly: 1400 },
    { name: "Utilities", baseMonthly: 150 },
    { name: "Phone", baseMonthly: 60 },
  ]);
  const [debts, setDebts] = useState<Array<{ name: string; balance: number; apr: number; minimumBase?: number }>>([
    { name: "Credit Card", balance: 3500, apr: 0.1999, minimumBase: 25 },
  ]);
  const [investments, setInvestments] = useState<Array<{ name: string; balance: number; apr: number }>>([
    { name: "Starter Index Fund", balance: 0, apr: 0.07 },
  ]);

  function handleCreate() {
    const id = `custom-${Date.now()}`;
    const config: ScenarioConfig = {
      id,
      title,
      description,
      totalMonths: 12,
      initialState: {
        month: 0,
        cash,
        income,
        variableWants: variableWants.map((v, idx) => ({ id: `vw${idx}`, name: v.name, planned: v.planned })),
        variableNeeds: variableNeeds.map((v, idx) => ({ id: `vn${idx}`, name: v.name, planned: v.planned })),
        fixedExpenses: fixedExpenses.map((f, idx) => ({ id: `fx${idx}`, name: f.name, baseMonthly: f.baseMonthly, arrears: 0 })),
        debts: debts.map((d, idx) => ({ id: `db${idx}`, name: d.name, balance: d.balance, apr: d.apr, minimumRule: d.minimumBase ? { base: d.minimumBase } : undefined })),
        investments: investments.map((i, idx) => ({ id: `iv${idx}`, name: i.name, balance: i.balance, apr: i.apr })),
      },
    };
    saveCustomScenario(config);
    navigate(`/scenario/${id}/overview`);
  }

  return (
    <main className="container">
      <section className="card">
        <h2 className="sectionTitle">Build Custom Scenario</h2>
        <div className="formGrid">
          <label className="field">
            <span className="fieldLabel">Title</span>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="field">
            <span className="fieldLabel">Description</span>
            <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <label className="field">
            <span className="fieldLabel">Starting Cash</span>
            <input type="number" className="input" value={cash} onChange={(e) => setCash(Number(e.target.value) || 0)} />
          </label>
          <label className="field">
            <span className="fieldLabel">Monthly Income</span>
            <input type="number" className="input" value={income} onChange={(e) => setIncome(Number(e.target.value) || 0)} />
          </label>
        </div>

        {/* Variable Wants */}
        <h3 className="sectionTitle" style={{ marginTop: 16 }}>Variable Wants</h3>
        {variableWants.map((v, idx) => (
          <div key={idx} className="formGrid rowControls">
            <button
              className="btn icon danger"
              aria-label="Remove want"
              onClick={() => setVariableWants((arr) => arr.filter((_, i) => i !== idx))}
            >×</button>
            <label className="field">
              <span className="fieldLabel">Name</span>
              <input className="input" value={v.name} onChange={(e) => setVariableWants((arr) => arr.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))} />
            </label>
            <label className="field">
              <span className="fieldLabel">Planned / month</span>
              <input type="number" className="input" value={v.planned} onChange={(e) => setVariableWants((arr) => arr.map((x, i) => i === idx ? { ...x, planned: Number(e.target.value) || 0 } : x))} />
            </label>
          </div>
        ))}
        <div className="sectionControls">
          <button className="btn primary small" onClick={() => setVariableWants((arr) => [...arr, { name: "New want", planned: 0 }])}>Add Want</button>
        </div>

        {/* Variable Needs */}
        <h3 className="sectionTitle" style={{ marginTop: 16 }}>Variable Needs</h3>
        {variableNeeds.map((v, idx) => (
          <div key={idx} className="formGrid rowControls">
            <button
              className="btn icon danger"
              aria-label="Remove need"
              onClick={() => setVariableNeeds((arr) => arr.filter((_, i) => i !== idx))}
            >×</button>
            <label className="field">
              <span className="fieldLabel">Name</span>
              <input className="input" value={v.name} onChange={(e) => setVariableNeeds((arr) => arr.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))} />
            </label>
            <label className="field">
              <span className="fieldLabel">Planned / month</span>
              <input type="number" className="input" value={v.planned} onChange={(e) => setVariableNeeds((arr) => arr.map((x, i) => i === idx ? { ...x, planned: Number(e.target.value) || 0 } : x))} />
            </label>
          </div>
        ))}
        <div className="sectionControls">
          <button className="btn primary small" onClick={() => setVariableNeeds((arr) => [...arr, { name: "New need", planned: 0 }])}>Add Need</button>
        </div>

        {/* Fixed Expenses */}
        <h3 className="sectionTitle" style={{ marginTop: 16 }}>Fixed Expenses</h3>
        {fixedExpenses.map((f, idx) => (
          <div key={idx} className="formGrid rowControls">
            <button
              className="btn icon danger"
              aria-label="Remove fixed expense"
              onClick={() => setFixedExpenses((arr) => arr.filter((_, i) => i !== idx))}
            >×</button>
            <label className="field">
              <span className="fieldLabel">Name</span>
              <input className="input" value={f.name} onChange={(e) => setFixedExpenses((arr) => arr.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))} />
            </label>
            <label className="field">
              <span className="fieldLabel">Base monthly</span>
              <input type="number" className="input" value={f.baseMonthly} onChange={(e) => setFixedExpenses((arr) => arr.map((x, i) => i === idx ? { ...x, baseMonthly: Number(e.target.value) || 0 } : x))} />
            </label>
          </div>
        ))}
        <div className="sectionControls">
          <button className="btn primary small" onClick={() => setFixedExpenses((arr) => [...arr, { name: "New fixed", baseMonthly: 0 }])}>Add Fixed Expense</button>
        </div>

        {/* Debts */}
        <h3 className="sectionTitle" style={{ marginTop: 16 }}>Debts</h3>
        {debts.map((d, idx) => (
          <div key={idx} className="formGrid rowControls">
            <button
              className="btn icon danger"
              aria-label="Remove debt"
              onClick={() => setDebts((arr) => arr.filter((_, i) => i !== idx))}
            >×</button>
            <label className="field">
              <span className="fieldLabel">Name</span>
              <input className="input" value={d.name} onChange={(e) => setDebts((arr) => arr.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))} />
            </label>
            <label className="field">
              <span className="fieldLabel">Balance</span>
              <input type="number" className="input" value={d.balance} onChange={(e) => setDebts((arr) => arr.map((x, i) => i === idx ? { ...x, balance: Number(e.target.value) || 0 } : x))} />
            </label>
            <label className="field">
              <span className="fieldLabel">APR (%)</span>
              <input
                type="number"
                step={0.01}
                className="input"
                value={Math.round(d.apr * 100 * 100) / 100}
                onChange={(e) => {
                  const raw = Number(e.target.value) || 0;
                  const decimal = raw > 1 ? raw / 100 : raw; // allow 19 to mean 0.19
                  setDebts((arr) => arr.map((x, i) => i === idx ? { ...x, apr: decimal } : x));
                }}
              />
            </label>
            <label className="field">
              <span className="fieldLabel">Minimum base</span>
              <input type="number" className="input" value={d.minimumBase ?? 0} onChange={(e) => setDebts((arr) => arr.map((x, i) => i === idx ? { ...x, minimumBase: Number(e.target.value) || 0 } : x))} />
            </label>
          </div>
        ))}
        <div className="sectionControls">
          <button className="btn primary small" onClick={() => setDebts((arr) => [...arr, { name: "New debt", balance: 0, apr: 0.2, minimumBase: 25 }])}>Add Debt</button>
        </div>

        {/* Investments */}
        <h3 className="sectionTitle" style={{ marginTop: 16 }}>Investments</h3>
        {investments.map((i, idx) => (
          <div key={idx} className="formGrid rowControls">
            <button
              className="btn icon danger"
              aria-label="Remove investment"
              onClick={() => setInvestments((arr) => arr.filter((_, ii) => ii !== idx))}
            >×</button>
            <label className="field">
              <span className="fieldLabel">Name</span>
              <input className="input" value={i.name} onChange={(e) => setInvestments((arr) => arr.map((x, ii) => ii === idx ? { ...x, name: e.target.value } : x))} />
            </label>
            <label className="field">
              <span className="fieldLabel">Balance</span>
              <input type="number" className="input" value={i.balance} onChange={(e) => setInvestments((arr) => arr.map((x, ii) => ii === idx ? { ...x, balance: Number(e.target.value) || 0 } : x))} />
            </label>
            <label className="field">
              <span className="fieldLabel">APR (%)</span>
              <input
                type="number"
                step={0.01}
                className="input"
                value={Math.round(i.apr * 100 * 100) / 100}
                onChange={(e) => {
                  const raw = Number(e.target.value) || 0;
                  const decimal = raw > 1 ? raw / 100 : raw;
                  setInvestments((arr) => arr.map((x, ii) => ii === idx ? { ...x, apr: decimal } : x));
                }}
              />
            </label>
          </div>
        ))}
        <div className="sectionControls">
          <button className="btn primary small" onClick={() => setInvestments((arr) => [...arr, { name: "New investment", balance: 0, apr: 0.05 }])}>Add Investment</button>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button className="btn" onClick={() => navigate('/gallery')}>Back</button>
          <button className="btn primary" onClick={handleCreate}>Create & Launch</button>
        </div>
      </section>
    </main>
  );
}
