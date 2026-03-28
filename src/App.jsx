import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import AnalyticsPage from "./pages/AnalyticsPage";
import MonitorPage from "./pages/MonitorPage";
import OverviewPage from "./pages/OverviewPage";
import ProcessPage from "./pages/process";
import StatsPage from "./pages/StatsPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/monitor" element={<MonitorPage />} />
          <Route path="/industrial" element={<Navigate to="/monitor?tab=industrial" replace />} />
          <Route path="/process" element={<ProcessPage />} />
          <Route path="/stats/:serviceNo" element={<StatsPage />} />
          <Route path="/analytics/:serviceNo" element={<AnalyticsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
