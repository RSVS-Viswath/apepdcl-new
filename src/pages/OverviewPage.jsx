import { useEffect, useMemo, useState } from "react";
import Chart from "react-apexcharts";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { seededInt, seededNumber, seededShuffle } from "../lib/seeded";
import { defaultOverviewRange, fromDateKey, toDateKey } from "../lib/dateKey";
import { getAllConsumers } from "../lib/consumers";
import { useNavigate } from "react-router-dom";
import { FiActivity, FiPercent, FiTrendingUp, FiUsers } from "react-icons/fi";

// Match legacy client theme graph palette
const TEAL = "#13C4A9";
const PURPLE = "#6A42B2";

function tint(hex, amount01) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const mix = (c) => Math.round(c + (255 - c) * amount01);
  const toHex = (n) => String(n.toString(16)).padStart(2, "0");
  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
}

function daysBetween(startKey, endKey) {
  const s = fromDateKey(startKey);
  const e = fromDateKey(endKey);
  const ms = e.getTime() - s.getTime();
  if (Number.isNaN(ms)) return 0;
  return Math.max(0, Math.floor(ms / 86400000));
}

function buildDateCategories(startKey, endKey, maxPoints = 14) {
  const totalDays = daysBetween(startKey, endKey) + 1;
  const s = fromDateKey(startKey);
  if (!Number.isFinite(totalDays) || totalDays <= 0 || Number.isNaN(s.getTime())) {
    return Array.from({ length: maxPoints }, (_, i) => `D${i + 1}`);
  }
  const points = Math.min(maxPoints, totalDays);
  const step = totalDays <= points ? 1 : (totalDays - 1) / (points - 1);
  const cats = [];
  for (let i = 0; i < points; i += 1) {
    const d = new Date(s);
    d.setDate(d.getDate() + Math.round(i * step));
    const k = toDateKey(d);
    cats.push(k.slice(5)); // MM-DD
  }
  return cats;
}

function StatCard({ label, value, suffix, icon }) {
  return (
    <div className="bg-white rounded-lg shadow px-4 py-3 h-[76px] flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] text-gray-500 leading-tight truncate">{label}</div>
        <div className="text-base font-semibold mt-1 tabular-nums leading-tight truncate">
          {value}
          {suffix ? <span className="text-xs text-gray-400 ml-1">{suffix}</span> : null}
        </div>
      </div>
    </div>
  );
}

function DateRangePicker({ startKey, endKey, onApply }) {
  const [open, setOpen] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);
  const selectionRange = useMemo(
    () => ({
      startDate: fromDateKey(startKey),
      endDate: fromDateKey(endKey),
      key: "selection",
    }),
    [startKey, endKey]
  );

  const [draft, setDraft] = useState(selectionRange);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const mq = window.matchMedia("(max-width: 640px)");
    const set = (v) => setIsNarrow(Boolean(v));
    set(mq.matches);

    const onChange = (e) => set(e.matches);
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else mq.addListener(onChange);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else mq.removeListener(onChange);
    };
  }, []);

  return (
    <>
      <div
        onClick={() => {
          setDraft(selectionRange);
          setOpen(true);
        }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 cursor-pointer select-none w-full sm:w-auto"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setDraft(selectionRange);
            setOpen(true);
          }
        }}
      >
        <div className="border border-gray-300 rounded-xl px-4 h-12 bg-gray-50 shadow-sm hover:bg-gray-100 transition flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="text-xs font-semibold tracking-wide text-gray-600 uppercase whitespace-nowrap">
              Start Date :
            </div>
            <div className="text-sm font-semibold tabular-nums text-gray-900 whitespace-nowrap leading-none">{startKey}</div>
          </div>
        </div>
        <div className="border border-gray-300 rounded-xl px-4 h-12 bg-gray-50 shadow-sm hover:bg-gray-100 transition flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="text-xs font-semibold tracking-wide text-gray-600 uppercase whitespace-nowrap">
              End Date :
            </div>
            <div className="text-sm font-semibold tabular-nums text-gray-900 whitespace-nowrap leading-none">{endKey}</div>
          </div>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-[95%] max-w-4xl p-5 max-h-[90vh] overflow-auto">
            <div className="text-lg font-semibold mb-4 text-center">Select Date Range</div>
            <div className="flex justify-center w-full overflow-x-auto">
              <DateRange
                ranges={[draft]}
                onChange={(ranges) => setDraft(ranges.selection)}
                months={isNarrow ? 1 : 2}
                direction={isNarrow ? "vertical" : "horizontal"}
                showSelectionPreview
                moveRangeOnFirstSelection={false}
                rangeColors={["#4F46E5"]}
                weekdayDisplayFormat="EE"
                dayDisplayFormat="d"
              />
            </div>
            <div className="flex justify-end mt-6 gap-2">
              <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg border text-sm" type="button">
                Cancel
              </button>
              <button
                onClick={() => {
                  const s = toDateKey(draft.startDate);
                  const e = toDateKey(draft.endDate);
                  onApply({ startKey: s, endKey: e });
                  setOpen(false);
                }}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
                type="button"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function LeaderboardTable({ title, rows, onRowClick, onViewMore, className }) {
  return (
    <div className={`bg-white rounded-lg shadow p-3 flex flex-col min-h-0 ${className || ""}`}>
      <div className="flex items-center justify-between mb-2 shrink-0">
        <div className="text-sm font-semibold">{title}</div>
      </div>
      <div className="overflow-y-auto overflow-x-auto flex-1 min-h-0 bg-gray-50 rounded-lg p-1">
        <table className="min-w-[640px] w-full text-xs border border-gray-200 border-collapse bg-white table-fixed">
          <thead className="text-gray-600 bg-[#f6f3ff]">
            <tr className="text-left">
              <th className="py-2 px-2 whitespace-nowrap font-medium border border-gray-200 w-[84px]">Position</th>
              <th className="py-2 px-2 whitespace-nowrap font-medium border border-gray-200 w-[110px]">Service No.</th>
              <th className="py-2 px-2 whitespace-nowrap font-medium border border-gray-200 w-[200px]">Consumer name</th>
              <th className="py-2 px-2 text-right whitespace-nowrap font-medium border border-gray-200 w-[120px]">
                Total shifted
              </th>
              <th className="py-2 px-2 text-right whitespace-nowrap font-medium border border-gray-200 w-[90px]">Score</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.serviceNo}
                className="bg-white hover:bg-gray-50 cursor-pointer"
                onClick={() => onRowClick(r)}
              >
                <td className="py-2 px-2 whitespace-nowrap border border-gray-200">
                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-[#f6f3ff] text-[#6A42B2] border border-[#e7dcff] text-[11px] font-semibold tabular-nums">
                    #{r.position}
                  </span>
                </td>
                <td className="py-2 px-2 whitespace-nowrap font-medium border border-gray-200">{r.serviceNo}</td>
                <td className="py-2 px-2 border border-gray-200">
                  <div className="truncate whitespace-nowrap" title={r.consumerName}>
                    {r.consumerName}
                  </div>
                </td>
                <td className="py-2 px-2 text-right tabular-nums whitespace-nowrap border border-gray-200">{r.totalShifted}</td>
                <td className="py-2 px-2 text-right tabular-nums whitespace-nowrap font-semibold text-[#6A42B2] border border-gray-200">
                  {r.score}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="pt-2 shrink-0 flex items-center justify-center">
        <button
          type="button"
          onClick={onViewMore}
          className="px-3 py-1 text-xs font-medium rounded-md border border-indigo-200 text-indigo-700 bg-white hover:bg-indigo-50"
        >
          View More
        </button>
      </div>
    </div>
  );
}

export default function OverviewPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("All");
  const { startKey: defaultStart, endKey: defaultEnd } = useMemo(() => defaultOverviewRange(), []);
  const [startKey, setStartKey] = useState(defaultStart);
  const [endKey, setEndKey] = useState(defaultEnd);

  const seed = `${startKey}|${endKey}|${tab}`;
  const leaderboardSeed = `${startKey}|${endKey}|leaderboard`;
  const categories = useMemo(() => buildDateCategories(startKey, endKey), [startKey, endKey]);

  const stats = useMemo(() => {
    const tabBoost = tab === "All" ? 1 : 0.65;
    return {
      activeParticipants: seededInt(`${seed}|ap`, 2400, Math.round(9800 * tabBoost)),
      totalPeakUnits: Math.round(seededNumber(`${seed}|tpu`, 28_000, 96_000) * tabBoost),
      shiftedPeakUnits: Math.round(seededNumber(`${seed}|spu`, 320, 1760) * tabBoost),
      participationRate: Math.round(seededNumber(`${seed}|pr`, 22, 88)),
    };
  }, [seed, tab]);

  const pie = useMemo(() => {
    const cfg =
      tab === "Industrial"
        ? ["Manufacturing", "Agro", "Food", "Others"]
        : tab === "Commercial"
          ? ["Retail", "Offices", "Hospitality", "Others"]
          : ["Industrial", "Commercial", "Public", "Others"];

    const series = cfg.map((label) => seededInt(`${seed}|pie|${label}`, 10, 65));
    return {
      series,
      options: {
        chart: { type: "pie", toolbar: { show: false } },
        labels: cfg,
        dataLabels: { enabled: false },
        legend: { position: "bottom" },
        colors: [TEAL, PURPLE, tint(TEAL, 0.45), tint(PURPLE, 0.45)],
      },
    };
  }, [seed, tab]);

  const line = useMemo(() => {
    const withResponse = categories.map((k, i) => seededInt(`${seed}|line|wr|${k}|${i}`, 62, 118));
    const withoutResponse = categories.map((k, i) => seededInt(`${seed}|line|wor|${k}|${i}`, 72, 132));
    return {
      series: [
        { name: "withResponse", data: withResponse },
        { name: "withoutResponse", data: withoutResponse },
      ],
      options: {
        chart: { type: "line", toolbar: { show: false }, zoom: { enabled: false } },
        stroke: { curve: "smooth", width: 2 },
        dataLabels: { enabled: false },
        xaxis: { categories },
        colors: [TEAL, PURPLE],
        legend: { position: "bottom" },
      },
    };
  }, [categories, seed]);

  const bar = useMemo(() => {
    const dailyConsumption = categories.map((k, i) => seededInt(`${seed}|bar|dc|${k}|${i}`, 780, 1550));
    const peakShifted = categories.map((k, i) => seededInt(`${seed}|bar|ps|${k}|${i}`, 120, 640));
    return {
      series: [
        { name: "dailyConsumption", data: dailyConsumption },
        { name: "peakShifted", data: peakShifted },
      ],
      options: {
        chart: { type: "bar", stacked: true, toolbar: { show: false } },
        plotOptions: { bar: { columnWidth: "55%", borderRadius: 4 } },
        dataLabels: { enabled: false },
        xaxis: { categories },
        legend: { position: "bottom" },
        colors: [TEAL, PURPLE],
      },
    };
  }, [categories, seed]);

  const leaderboards = useMemo(() => {
    const all = getAllConsumers();
    const industrial = all.filter((c) => String(c.category).toUpperCase().includes("INDUSTRY"));
    const commercial = all.filter((c) => String(c.category).toUpperCase().includes("COMMERCIAL"));

    const scoreRow = (c) => {
      const totalShifted = seededNumber(`${leaderboardSeed}|lb|${c.serviceNo}|shifted`, 8, 74);
      const score = seededNumber(`${leaderboardSeed}|lb|${c.serviceNo}|score`, 540, 690);
      return {
        ...c,
        totalShifted: `${totalShifted.toFixed(1)} MWh`,
        score: score.toFixed(1),
      };
    };

    const industrialRows = seededShuffle(`${leaderboardSeed}|lb|ind`, industrial.map(scoreRow))
      .sort((a, b) => Number(b.score) - Number(a.score))
      .slice(0, 5)
      .map((r, idx) => ({ ...r, position: idx + 1 }));

    const commercialRows = seededShuffle(`${leaderboardSeed}|lb|com`, commercial.map(scoreRow))
      .sort((a, b) => Number(b.score) - Number(a.score))
      .slice(0, 5)
      .map((r, idx) => ({ ...r, position: idx + 1 }));

    return { industrialRows, commercialRows };
  }, [leaderboardSeed]);

  const onRowClick = (r) => {
    const qs = new URLSearchParams({
      consumerName: r.consumerName,
      category: r.category,
    });
    navigate(`/stats/${encodeURIComponent(r.serviceNo)}?${qs.toString()}`);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Active Participants" value={stats.activeParticipants.toLocaleString()} icon={<FiUsers />} />
        <StatCard
          label="Total Peak Units"
          value={stats.totalPeakUnits.toLocaleString()}
          suffix="kWh"
          icon={<FiTrendingUp />}
        />
        <StatCard label="Shifted Peak Units" value={stats.shiftedPeakUnits.toLocaleString()} suffix="h" icon={<FiActivity />} />
        <StatCard label="Participation Rate" value={stats.participationRate} suffix="%" icon={<FiPercent />} />
      </div>

      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:items-center sm:justify-between">
        <div className="flex bg-white rounded-lg shadow p-1 w-fit">
          {["All", "Industrial", "Commercial"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-md text-[13px] font-medium ${
                tab === t ? "bg-indigo-600 text-white" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <DateRangePicker
          startKey={startKey}
          endKey={endKey}
          onApply={({ startKey: s, endKey: e }) => {
            setStartKey(s);
            setEndKey(e);
          }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <div className="bg-white rounded-lg shadow p-3 lg:min-h-[330px]">
            <div className="text-sm font-semibold mb-2">Peak Analytics: Total vs Shift</div>
            <Chart options={line.options} series={line.series} type="line" height={240} />
          </div>

          <div className="bg-white rounded-lg shadow p-3 lg:min-h-[330px]">
            <div className="text-sm font-semibold mb-2">Types of Consumers</div>
            <Chart options={pie.options} series={pie.series} type="pie" height={240} />
          </div>

          <div className="bg-white rounded-lg shadow p-3 lg:min-h-[330px]">
            <div className="text-sm font-semibold mb-2">Daily Performance</div>
            <Chart options={bar.options} series={bar.series} type="bar" height={240} />
          </div>

          <div className="bg-white rounded-lg shadow p-3 flex items-center justify-center min-h-[300px] lg:min-h-[330px]">
            <div className="text-center">
              <div className="text-sm font-semibold text-gray-900">Allocated for future graphs</div>
              <div className="text-xs text-gray-500 mt-1">Yet to decide what to place here</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 min-h-0">
          <LeaderboardTable
            className="lg:h-[330px]"
            title="Industrial Consumer Leaderboard"
            rows={leaderboards.industrialRows}
            onRowClick={onRowClick}
            onViewMore={() => navigate("/monitor?tab=industrial")}
          />
          <LeaderboardTable
            className="lg:h-[330px]"
            title="Commercial Consumer Leaderboard"
            rows={leaderboards.commercialRows}
            onRowClick={onRowClick}
            onViewMore={() => navigate("/monitor?tab=commercial")}
          />
        </div>
      </div>
    </div>
  );
}
