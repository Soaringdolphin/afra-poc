// src/pages/Home.tsx

type HomeProps = {
  onStart: () => void;
};

export default function Home({ onStart }: HomeProps) {
  return (
    <main className="container homeCenter">
      <div className="brand brandCentered" style={{ alignItems: "center", gap: 16 }}>
        <img
          src="/afralogo1.png"
          alt="Afra"
          className="brandLogo brandLogoLarge"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <span className="brandName brandNameLarge">Afra</span>
      </div>

      <section className="card heroCard">
        <h1 className="title" style={{ marginBottom: 8, textAlign: "center", fontWeight: 300 }}>
          Grow toward a better financial future.
        </h1>
        <p className="subtitle" style={{ marginBottom: 20, textAlign: "center" }}>
          Afra makes financial literacy feel easy, not overwhelming.
        </p>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <button className="btn primary" onClick={onStart}>
            Launch Afra Simulator
          </button>
        </div>
      </section>
    </main>
  );
}
