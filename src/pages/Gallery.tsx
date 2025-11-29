// src/pages/Gallery.tsx
import ScenarioGallery from "../components/ScenarioGallery";

export default function Gallery() {
  return (
    <main className="container homeCenter">
      <section className="card heroCard">
        <h1 className="title" style={{ marginBottom: 8, textAlign: "center", fontWeight: 300 }}>
          Choose a scenario
        </h1>
        <p className="subtitle" style={{ marginBottom: 20, textAlign: "center" }}>
          Pick a preset or start a custom one.
        </p>
      </section>
      <ScenarioGallery />
    </main>
  );
}
