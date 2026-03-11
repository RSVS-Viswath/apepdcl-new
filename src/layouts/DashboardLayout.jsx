import { Outlet } from "react-router-dom";
import DashboardHeader from "../components/DashboardHeader";

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <main className="w-full px-4 py-4 2xl:px-8">
        <Outlet />
      </main>
    </div>
  );
}
