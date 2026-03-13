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
import { FaTrophy } from "react-icons/fa";

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

function MedalBadge({ position }) {
  const variants = {
    1: {
      ribbonLeft: "#A81516",
      ribbonRight: "#4B1112",
      medalOuter: "#C97F18",
      medalInner: "#F4C542",
      accent: "#8F4D05",
    },
    2: {
      ribbonLeft: "#6AA6E8",
      ribbonRight: "#415A73",
      medalOuter: "#7B8794",
      medalInner: "#D9E0E8",
      accent: "#4D5762",
    },
    3: {
      ribbonLeft: "#2D9E44",
      ribbonRight: "#196B2D",
      medalOuter: "#8D4F25",
      medalInner: "#D8843C",
      accent: "#5F3114",
    },
  };

  const palette = variants[position];
  if (!palette) return null;

  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" aria-hidden="true">
      <path d="M6 2h4l2 6H9L6 2Z" fill={palette.ribbonLeft} />
      <path d="M14 2h4l-3 6h-3l2-6Z" fill={palette.ribbonRight} />
      <circle cx="12" cy="15" r="6.2" fill={palette.medalOuter} />
      <circle cx="12" cy="15" r="4.4" fill={palette.medalInner} />
      <circle cx="12" cy="15" r="2.1" fill={palette.accent} opacity="0.16" />
      <text
        x="12"
        y="16.3"
        textAnchor="middle"
        fontSize="6"
        fontWeight="700"
        fill="#fff7d6"
        style={{ paintOrder: "stroke", stroke: palette.accent, strokeWidth: "0.8px" }}
      >
        {position}
      </text>
    </svg>
  );
}

function RankBadge({ position }) {
  if (position <= 3) return <MedalBadge position={position} />;

  return (
    <div className="w-6 h-6 shrink-0 rounded-full bg-[#f1ecff] text-[#6A42B2] flex items-center justify-center text-[11px] font-semibold">
      {position}
    </div>
  );
}

function LeaderboardTable({ title, rows, onRowClick, onViewMore, className }) {
  const rowTone = (position) => {
    if (position <= 3) return "bg-[#f5f1df]";
    return "bg-white";
  };

  return (
    <div className={`bg-white rounded-lg shadow p-2.5 flex flex-col min-h-0 ${className || ""}`}>
      <div className="flex items-center justify-between mb-1.5 shrink-0">
        <div className="text-sm font-semibold">{title}</div>
        <button
          type="button"
          onClick={onViewMore}
          aria-label="View more"
          className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm hover:bg-indigo-700 transition"
        >
          <FaTrophy className="text-[18px]" />
        </button>
      </div>
      <div className="flex-1 min-h-0 bg-gray-50 rounded-lg p-1.5 space-y-1.5 overflow-hidden">
        {rows.map((r) => (
          <button
            key={r.serviceNo}
            type="button"
            onClick={() => onRowClick(r)}
            className={`w-full text-left rounded-xl px-2.5 py-2 flex items-center gap-2.5 transition hover:-translate-y-0.5 hover:shadow-md ${rowTone(
              r.position
            )}`}
          >
            <RankBadge position={r.position} />
            <div className="min-w-0 flex-1 flex items-center gap-2">
              <div className="font-semibold text-[15px] text-gray-900 tabular-nums whitespace-nowrap">{r.serviceNo}</div>
              <div className="min-w-0 text-[12px] text-gray-600 truncate" title={r.consumerName}>
                {r.consumerName}
              </div>
            </div>
            <div className="text-[18px] leading-none font-semibold text-[#7A17CC] tabular-nums whitespace-nowrap">
              {r.score}
            </div>
          </button>
        ))}
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
  const allConsumers = useMemo(() => getAllConsumers(), []);

  const stats = useMemo(() => {
    const tabBoost = tab === "All" ? 1 : 0.65;
    return {
      activeParticipants: seededInt(`${seed}|ap`, 2400, Math.round(9800 * tabBoost)),
      totalPeakUnits: Math.round(seededNumber(`${seed}|tpu`, 28_000, 96_000) * tabBoost),
      shiftedPeakUnits: Math.round(seededNumber(`${seed}|spu`, 320, 1760) * tabBoost),
      participationRate: Math.round(seededNumber(`${seed}|pr`, 22, 88)),
    };
  }, [seed, tab]);

  const consumerSplitPie = useMemo(() => {
    const industrialCount = allConsumers.filter((c) => String(c.category).toUpperCase().includes("INDUSTRY")).length;
    const commercialCount = allConsumers.filter((c) => String(c.category).toUpperCase().includes("COMMERCIAL")).length;
    return {
      series: [industrialCount, commercialCount],
      options: {
        chart: { type: "pie", toolbar: { show: false } },
        labels: ["Industrial", "Commercial"],
        dataLabels: { enabled: false },
        legend: { position: "bottom" },
        colors: [PURPLE, TEAL],
      },
    };
  }, [allConsumers]);

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

  const todColors = useMemo(
    () => ({
      peak1: PURPLE,
      peak2: tint(PURPLE, 0.28),
      normal: TEAL,
      offPeak: tint(TEAL, 0.34),
    }),
    []
  );

  const todPie = useMemo(() => {
    if (tab === "All") {
      const labels = ["Peak-1", "Peak-2", "Normal", "Off-Peak"];
      return {
        series: labels.map((label) => seededInt(`${seed}|tod|${label}`, 12, 46)),
        options: {
          chart: { type: "pie", toolbar: { show: false } },
          labels,
          dataLabels: { enabled: false },
          legend: { position: "bottom" },
          colors: [todColors.peak1, todColors.peak2, todColors.normal, todColors.offPeak],
        },
      };
    }

    if (tab === "Industrial") {
      const labels = ["Peak-1", "Peak-2", "Normal", "Off-Peak"];
      return {
        series: labels.map((label) => seededInt(`${seed}|tod|${label}`, 12, 46)),
        options: {
          chart: { type: "pie", toolbar: { show: false } },
          labels,
          dataLabels: { enabled: false },
          legend: { position: "bottom" },
          colors: [todColors.peak1, todColors.peak2, todColors.normal, todColors.offPeak],
        },
      };
    }

    const labels = ["Peak", "Normal"];
    return {
      series: labels.map((label) => seededInt(`${seed}|tod|${label}`, 22, 64)),
      options: {
        chart: { type: "pie", toolbar: { show: false } },
        labels,
        dataLabels: { enabled: false },
        legend: { position: "bottom" },
        colors: [todColors.peak1, todColors.normal],
      },
    };
  }, [seed, tab, todColors]);

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
    const industrial = allConsumers.filter((c) => String(c.category).toUpperCase().includes("INDUSTRY"));
    const commercial = allConsumers.filter((c) => String(c.category).toUpperCase().includes("COMMERCIAL"));

    const scoreRow = (c) => {
      const score = seededNumber(`${leaderboardSeed}|lb|${c.serviceNo}|score`, 2.1, 29.8);
      return {
        ...c,
        score: `${score.toFixed(1)}%`,
      };
    };

    const industrialRows = seededShuffle(`${leaderboardSeed}|lb|ind`, industrial.map(scoreRow))
      .sort((a, b) => Number.parseFloat(b.score) - Number.parseFloat(a.score))
      .slice(0, 5)
      .map((r, idx) => ({ ...r, position: idx + 1 }));

    const commercialRows = seededShuffle(`${leaderboardSeed}|lb|com`, commercial.map(scoreRow))
      .sort((a, b) => Number.parseFloat(b.score) - Number.parseFloat(a.score))
      .slice(0, 5)
      .map((r, idx) => ({ ...r, position: idx + 1 }));

    return { industrialRows, commercialRows };
  }, [allConsumers, leaderboardSeed]);

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
            {tab === "All" ? (
              <>
                <div className="text-sm font-semibold mb-2">Total Consumers: Industrial vs Commercial</div>
                <Chart options={consumerSplitPie.options} series={consumerSplitPie.series} type="pie" height={240} />
              </>
            ) : (
              <>
                <div className="text-sm font-semibold mb-2">Types of Consumers</div>
                <Chart options={pie.options} series={pie.series} type="pie" height={240} />
              </>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-3 lg:min-h-[330px]">
            {tab === "All" ? (
              <>
                <div className="text-sm font-semibold mb-2">Total Consumption - TOD</div>
                <Chart options={todPie.options} series={todPie.series} type="pie" height={240} />
              </>
            ) : (
              <>
                <div className="text-sm font-semibold mb-2">Consumption - TOD</div>
                <Chart options={todPie.options} series={todPie.series} type="pie" height={240} />
              </>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-3 lg:min-h-[330px]">
            <div className="text-sm font-semibold mb-2">Daily Performance</div>
            <Chart options={bar.options} series={bar.series} type="bar" height={240} />
          </div>

          <div className="bg-white rounded-lg shadow p-3 lg:min-h-[330px]">
            <div className="text-sm font-semibold mb-2">Peak Analytics: Total vs Shift</div>
            <Chart options={line.options} series={line.series} type="line" height={240} />
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
