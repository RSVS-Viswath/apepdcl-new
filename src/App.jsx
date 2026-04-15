import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import AnalyticsPage from "./pages/AnalyticsPage";
import MonitorPage from "./pages/MonitorPage";
import OverviewPage from "./pages/OverviewPage";
import ProcessPage from "./pages/process";
import Process1Page from "./pages/Process1Page";
import StatsPage from "./pages/StatsPage";

const HeatmapPage = lazy(() => import("./pages/heatmap"));
const InfraMapPage = lazy(() => import("./pages/inframap"));
const appLoadingFallback = <div className="p-6 text-sm text-slate-500">Loading page...</div>;
const industrialRedirect = <Navigate to="/monitor?tab=industrial" replace />;

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={appLoadingFallback}>
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/monitor" element={<MonitorPage />} />
            <Route path="/industrial" element={industrialRedirect} />
            <Route path="/process" element={<ProcessPage />} />
            <Route path="/process1" element={<Process1Page />} />
            <Route path="/heatmap" element={<HeatmapPage />} />
            <Route path="/inframap" element={<InfraMapPage />} />
            <Route path="/stats/:serviceNo" element={<StatsPage />} />
            <Route path="/analytics/:serviceNo" element={<AnalyticsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
