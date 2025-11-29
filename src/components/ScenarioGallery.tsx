// src/components/ScenarioGallery.tsx
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { creditCardScenario } from "../core/scenarios";

export type ScenarioCard = {
  id: string;
  title: string;
  description: string;
  metrics?: { cash?: number; debts?: number; investments?: number };
};

export default function ScenarioGallery() {
  const navigate = useNavigate();
  const presets: ScenarioCard[] = useMemo(() => {
    const s = creditCardScenario;
    const debts = s.initialState.debts.reduce((a, d) => a + d.balance, 0);
    const investments = s.initialState.investments.reduce((a, i) => a + i.balance, 0);
    return [
      {
        id: "default",
        title: s.title,
        description: s.description,
        metrics: { cash: s.initialState.cash, debts, investments },
      },
      // Additional presets could be added here.
    ];
  }, []);

  // Custom scenarios now created via the CustomBuilder page

  return (
    <section className="card">
      <h2 className="sectionTitle">Choose a Scenario</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
        {presets.map((p) => (
          <div key={p.id} className="card" style={{ textAlign: "left", display: "flex", flexDirection: "column" }}>
            <h3 className="sectionTitle" style={{ margin: 0 }}>{p.title}</h3>
            <p className="muted" style={{ marginTop: 4 }}>{p.description}</p>
            <div className="metrics" style={{ marginTop: 8 }}>
              {p.metrics?.cash !== undefined && (<div className="metric"><span className="label">Cash</span><span className="value">${p.metrics.cash!.toFixed(2)}</span></div>)}
              {p.metrics?.debts !== undefined && (<div className="metric"><span className="label">Debts</span><span className="value">${p.metrics.debts!.toFixed(2)}</span></div>)}
              {p.metrics?.investments !== undefined && (<div className="metric"><span className="label">Investments</span><span className="value">${p.metrics.investments!.toFixed(2)}</span></div>)}
            </div>
            <button className="btn primary cardStart" onClick={() => navigate(`/scenario/${p.id}/overview`)}>Start</button>
          </div>
        ))}
        <div className="card" style={{ textAlign: "left", display: "flex", flexDirection: "column" }}>
          <h3 className="sectionTitle" style={{ margin: 0 }}>New Custom Scenario</h3>
          <p className="muted" style={{ marginTop: 4 }}>Start from a template and adjust details.</p>
          <button className="btn primary cardStart" onClick={() => navigate('/custom')}>Start</button>
        </div>
      </div>
    </section>
  );
}
