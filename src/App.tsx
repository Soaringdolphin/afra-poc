// src/App.tsx
import { useState } from "react";
import ScenarioRunner from "./pages/ScenarioRunner";
import Home from "./pages/Home";

function App() {
  const [page, setPage] = useState<"home" | "runner">("home");

  if (page === "home") {
    return <Home onStart={() => setPage("runner")} />;
  }
  return <ScenarioRunner />;
}

export default App;
