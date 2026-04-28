// App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Home from "./pages/Home";
import Diagnose from "./pages/Diagnose";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-900 text-slate-100">
        <Header />
        <Routes>
          <Route path="/"         element={<Home />} />
          <Route path="/diagnose" element={<Diagnose />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
