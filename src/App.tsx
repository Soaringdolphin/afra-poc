// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import ScenarioRunner from "./pages/ScenarioRunner.tsx";
import Home from "./pages/Home.tsx";
import Gallery from "./pages/Gallery.tsx";
import CustomBuilder from "./pages/CustomBuilder.tsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home onStart={() => { /* navigate to gallery */ }} />} />
      <Route path="/gallery" element={<Gallery />} />
      <Route path="/custom" element={<CustomBuilder />} />
      {/* Scenario route; ScenarioRunner handles tab content based on pathname */}
      <Route path="/scenario/:id/*" element={<ScenarioRunner />} />
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
