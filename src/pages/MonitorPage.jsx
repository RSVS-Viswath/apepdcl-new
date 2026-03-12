import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DISTRICT_OPTIONS, getAllConsumers } from "../lib/consumers";

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
  const [searchParams] = useSearchParams();
  const selectedTab = searchParams.get("tab") === "industrial" ? "industrial" : "commercial";
  const recordsRef = useRef(null);

  const [serviceSearch, setServiceSearch] = useState("");
  const [district, setDistrict] = useState("All Districts");
  const [activePage, setActivePage] = useState(1);
  const [isRecordsScrolled, setIsRecordsScrolled] = useState(false);

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

  const onRowClick = (r) => {
    const qs = new URLSearchParams({
      consumerName: r.consumerName,
      category: r.category,
    });
    navigate(`/stats/${encodeURIComponent(r.serviceNo)}?${qs.toString()}`);
  };

  useEffect(() => {
    const node = recordsRef.current;
    if (!node) return undefined;

    const onScroll = () => {
      setIsRecordsScrolled(node.scrollTop > 4);
    };

    onScroll();
    node.addEventListener("scroll", onScroll, { passive: true });
    return () => node.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="space-y-0">
      <div
        className={`sticky top-[66px] z-20 w-full rounded-t-2xl px-4 py-2.5 transition-all duration-200 ${
          isRecordsScrolled
            ? "bg-white/72 backdrop-blur-xl shadow-lg shadow-slate-200/70 supports-[backdrop-filter]:bg-white/58"
            : "bg-white shadow"
        }`}
      >
        <div className="flex flex-col lg:flex-row gap-2 lg:items-end lg:justify-between">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
            <label className="grid gap-0">
              <span className="text-[11px] text-gray-500">Search by Service No</span>
              <input
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                placeholder="e.g. AKP010"
                className="border rounded-lg px-3 py-1.5 text-sm w-full sm:w-64"
                type="text"
              />
            </label>

            <label className="grid gap-0">
              <span className="text-[11px] text-gray-500">District</span>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="border rounded-lg px-3 py-1.5 text-sm w-full sm:w-48 bg-white"
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
      </div>

      <div ref={recordsRef} className="rounded-b-2xl bg-white shadow overflow-auto max-h-[calc(100vh-170px)]">
        <table className="min-w-full text-sm">
          <thead className="text-xs text-gray-500 bg-gray-50">
            <tr className="text-left">
              <th className="py-3 px-3">S.No</th>
              <th className="py-3 px-3">Service No</th>
              <th className="py-3 px-3">Consumer Name</th>
              <th className="py-3 px-3">Category</th>
              <th className="py-3 px-3 text-right">Contracted Demand</th>
              <th className="py-3 px-3 text-right">HT Incomer</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r, idx) => (
              <tr
                key={r.serviceNo}
                className="group border-t cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:bg-indigo-50 hover:text-indigo-700 hover:shadow-[0_8px_18px_rgba(79,70,229,0.10)]"
                onClick={() => onRowClick(r)}
              >
                <td className="py-3 px-3 tabular-nums">{idx + 1}</td>
                <td className="py-3 px-3 font-medium text-indigo-700 group-hover:text-indigo-700">{r.serviceNo}</td>
                <td className="py-3 px-3">{r.consumerName}</td>
                <td className="py-3 px-3">{r.category}</td>
                <td className="py-3 px-3 text-right tabular-nums">{r.contractedDemand}</td>
                <td className="py-3 px-3 text-right tabular-nums">{r.htIncomerKv} kV</td>
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
