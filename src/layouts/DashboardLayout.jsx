import { Outlet, useLocation } from "react-router-dom";
import DashboardHeader from "../components/DashboardHeader";

export default function DashboardLayout() {
  const location = useLocation();
  const hideHeader = location.pathname.startsWith("/analytics/");
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {hideHeader ? null : <DashboardHeader />}
      <main className="w-full px-4 py-3 2xl:px-8 flex-1">
        <Outlet />
      </main>
      <footer className="px-4 pb-2 2xl:px-8">
        <div className="border-t border-slate-200/70 pt-2">
          <p className="text-center text-[11px] font-normal tracking-[0.08em] text-slate-400/90">
            © {currentYear}. All rights reserved ELEMENTS ENERGY TECHNOLOGIES PRIVATE LIMITED
          </p>
        </div>
      </footer>
    </div>
  );
}
