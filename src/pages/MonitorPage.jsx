import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DISTRICT_OPTIONS, getAllConsumers } from "../lib/consumers";

function TabButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 rounded-md text-sm font-medium ${
        active ? "bg-indigo-600 text-white" : "text-gray-700 hover:bg-gray-50"
      }`}
    >
      {children}
    </button>
  );
}

function Pagination({ activePage, onChange }) {
  const pages = [1, 2, 3, 4, 5];
  const last = 28;
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          className={`px-2.5 py-1 rounded border text-xs ${
            activePage === p ? "bg-indigo-600 text-white border-indigo-600" : "bg-white hover:bg-gray-50"
          }`}
        >
          {p}
        </button>
      ))}
      <span className="px-1 text-xs text-gray-500">...</span>
      <button
        type="button"
        onClick={() => onChange(last)}
        className={`px-2.5 py-1 rounded border text-xs ${
          activePage === last ? "bg-indigo-600 text-white border-indigo-600" : "bg-white hover:bg-gray-50"
        }`}
      >
        {last}
      </button>
    </div>
  );
}

export default function MonitorPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTab = searchParams.get("tab") === "industrial" ? "industrial" : "commercial";

  const [serviceSearch, setServiceSearch] = useState("");
  const [district, setDistrict] = useState("All Districts");
  const [activePage, setActivePage] = useState(1);

  const all = useMemo(() => getAllConsumers(), []);

  const visible = useMemo(() => {
    const tabFiltered = all.filter((r) => {
      const c = String(r.category).toUpperCase();
      return selectedTab === "industrial" ? c.includes("INDUSTRY") : c.includes("COMMERCIAL");
    });

    const search = serviceSearch.trim().toLowerCase();
    const searched = search
      ? tabFiltered.filter((r) => String(r.serviceNo).toLowerCase().includes(search))
      : tabFiltered;

    const districtFiltered =
      district === "All Districts"
        ? searched
        : searched.filter((r) => String(r.serviceNo).slice(0, 3).toUpperCase() === district);

    return districtFiltered;
  }, [all, district, selectedTab, serviceSearch]);

  const setTab = (tab) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", tab);
      return next;
    });
  };

  const onRowClick = (r) => {
    const qs = new URLSearchParams({
      consumerName: r.consumerName,
      category: r.category,
    });
    navigate(`/stats/${encodeURIComponent(r.serviceNo)}?${qs.toString()}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex bg-white rounded-lg shadow p-1 w-fit">
        <TabButton active={selectedTab === "commercial"} onClick={() => setTab("commercial")}>
          Commercial
        </TabButton>
        <TabButton active={selectedTab === "industrial"} onClick={() => setTab("industrial")}>
          Industrial
        </TabButton>
      </div>

      <div className="bg-white rounded-lg shadow p-3 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <label className="grid gap-1">
            <span className="text-xs text-gray-500">Search by Service No</span>
            <input
              value={serviceSearch}
              onChange={(e) => setServiceSearch(e.target.value)}
              placeholder="e.g. AKP010"
              className="border rounded-lg px-3 py-2 text-sm w-full sm:w-64"
              type="text"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs text-gray-500">District</span>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm w-full sm:w-48 bg-white"
            >
              {DISTRICT_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
        </div>

        <Pagination activePage={activePage} onChange={setActivePage} />
      </div>

      <div className="bg-white rounded-lg shadow overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="text-xs text-gray-500 bg-gray-50">
            <tr className="text-left">
              <th className="py-3 px-3">S.No</th>
              <th className="py-3 px-3">Service No</th>
              <th className="py-3 px-3">Consumer Name</th>
              <th className="py-3 px-3">Category</th>
              <th className="py-3 px-3 text-right">Contracted Demand</th>
              <th className="py-3 px-3 text-right">HT Income</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r, idx) => (
              <tr
                key={r.serviceNo}
                className="border-t hover:bg-gray-50 cursor-pointer"
                onClick={() => onRowClick(r)}
              >
                <td className="py-3 px-3 tabular-nums">{idx + 1}</td>
                <td className="py-3 px-3 font-medium">{r.serviceNo}</td>
                <td className="py-3 px-3">{r.consumerName}</td>
                <td className="py-3 px-3">{r.category}</td>
                <td className="py-3 px-3 text-right tabular-nums">{r.contractedDemand}</td>
                <td className="py-3 px-3 text-right tabular-nums">₹ {r.htIncome.toLocaleString()}</td>
              </tr>
            ))}
            {visible.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-sm text-gray-500">
                  No results
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
