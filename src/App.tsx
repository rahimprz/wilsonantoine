import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import Site from "./site/Site";

// The dashboard is its own chunk, so visitors never download it.
const Admin = lazy(() => import("./admin/Admin"));

export default function App() {
  return (
    <Routes>
      <Route
        path="/admin/*"
        element={
          <Suspense fallback={<div className="grid min-h-screen place-items-center bg-void text-mist">Loading dashboard…</div>}>
            <Admin />
          </Suspense>
        }
      />
      <Route path="*" element={<Site />} />
    </Routes>
  );
}
