import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import Chart from "react-apexcharts";
import { getAllConsumers } from "../lib/consumers";
import { fromDateKey, lastNDaysKeys, toDateKey } from "../lib/dateKey";
import { seededInt, seededNumber } from "../lib/seeded";
import { FiActivity, FiMaximize2, FiMoon, FiSun, FiX } from "react-icons/fi";

// Match legacy client theme graph palette
const TEAL = "#13C4A9";
const PURPLE = "#6A42B2";
const RED = "#ef4444";

function FullHistoryModal({ rows, selectedDayKey, onDayClick, onClose }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-6xl rounded-2xl bg-white shadow-xl border p-4 sm:p-5 max-h-[90vh] overflow-auto">
        <button
          type="button"
          aria-label="Close full history"
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-100"
        >
          <FiX className="text-xl" />
        </button>
        <div className="text-lg font-semibold pr-10 mb-4">Shift History</div>
        <table className="w-full text-[12px] border border-gray-200 border-collapse bg-white table-fixed">
          <thead className="text-gray-600 bg-[#f6f3ff]">
            <tr className="text-left">
              <th rowSpan={2} className="py-2 px-2 font-medium border border-gray-200">
                Date
              </th>
              <th rowSpan={2} className="py-2 px-2 font-medium border border-gray-200">
                Time
              </th>
              <th colSpan={2} className="py-2 px-2 font-medium text-center border border-gray-200">
                Percentage (%)
              </th>
              <th colSpan={2} className="py-2 px-2 font-medium text-center border border-gray-200">
                Value (kWh)
              </th>
              <th rowSpan={2} className="py-2 px-2 font-medium text-right border border-gray-200">
                Points
              </th>
            </tr>
            <tr className="text-left">
              <th className="py-2 px-2 font-medium text-center border border-gray-200">Recorded</th>
              <th className="py-2 px-2 font-medium text-center border border-gray-200">Shifted</th>
              <th className="py-2 px-2 font-medium text-center border border-gray-200">Recorded</th>
              <th className="py-2 px-2 font-medium text-center border border-gray-200">Shifted</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {rows.map((r) => (
              <tr
                key={r.dayKey}
                onClick={() => {
                  onDayClick(r.dayKey);
                  onClose();
                }}
                className={`cursor-pointer hover:bg-gray-50 ${r.dayKey === selectedDayKey ? "bg-indigo-50" : "bg-white"}`}
              >
                <td className="py-2 px-2 font-medium border border-gray-200">{r.dayKey}</td>
                <td className="py-2 px-2 border border-gray-200">{r.timeLabel}</td>
                <td className="py-2 px-2 text-center border border-gray-200">{r.percentRecorded}%</td>
                <td className="py-2 px-2 text-center border border-gray-200">{r.percentShifted}%</td>
                <td className="py-2 px-2 text-center border border-gray-200">{r.valueRecorded}</td>
                <td className="py-2 px-2 text-center border border-gray-200">{r.valueShifted}</td>
                <td className="py-2 px-2 text-right font-semibold text-[#6A42B2] border border-gray-200">{r.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value, hint, icon, muted = false }) {
  return (
    <div className="bg-white rounded-lg shadow px-3 py-2 h-14 flex items-center gap-2.5">
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
          muted ? "bg-gray-100 text-gray-500" : "bg-indigo-50 text-indigo-700"
        }`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[12px] text-gray-500 leading-tight truncate">{label}</div>
        <div className={`text-[14px] font-semibold mt-0.5 tabular-nums leading-tight truncate ${muted ? "text-gray-500" : ""}`}>
          {value}
        </div>
        {hint ? <div className="text-[11px] text-gray-400 leading-tight truncate">{hint}</div> : null}
      </div>
    </div>
  );
}

function SequentialAreaChart({ options, baseline, actual, height, delayMs = 850 }) {
  const [showActual, setShowActual] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setShowActual(true), delayMs);
    return () => window.clearTimeout(id);
  }, [delayMs]);

  const series = useMemo(
    () => [{ name: "baseline", data: baseline }, ...(showActual ? [{ name: "actual", data: actual }] : [])],
    [actual, baseline, showActual]
  );

  return <Chart options={options} series={series} type="area" height={height} />;
}

function buildHourlySeries(serviceNo, dayKey, { includeMorning, includeEvening }) {
  const baseSeed = `${serviceNo}|${dayKey}`;

  const isPeakHour = (h) => {
    const morning = includeMorning && h >= 6 && h <= 9;
    const evening = includeEvening && h >= 18 && h <= 21;
    return morning || evening;
  };

  const baseline = Array.from({ length: 24 }, (_, h) => {
    const v = seededNumber(`${baseSeed}|base|${h}`, 38, 110);
    const peakBoost = isPeakHour(h) ? 1.22 : 1;
    return Math.round(v * peakBoost);
  });

  const actual = baseline.map((b, h) => {
    const factor = seededNumber(`${baseSeed}|act|${h}`, 0.78, 0.97);
    const extraShift = isPeakHour(h) ? seededNumber(`${baseSeed}|sh|${h}`, 0.85, 0.95) : 1;
    return Math.max(0, Math.round(b * factor * extraShift));
  });

  return { baseline, actual };
}

export default function StatsPage() {
  const { serviceNo: rawServiceNo } = useParams();
  const serviceNo = decodeURIComponent(rawServiceNo || "");
  const [searchParams, setSearchParams] = useSearchParams();

  const consumers = useMemo(() => getAllConsumers(), []);
  const fallback = consumers.find((c) => c.serviceNo === serviceNo);

  const category = searchParams.get("category") || fallback?.category || "--";
  const isCommercial = useMemo(() => String(category).toUpperCase().includes("COMMERCIAL"), [category]);
  const peakWindow = useMemo(
    () => ({
      includeMorning: !isCommercial,
      includeEvening: true,
    }),
    [isCommercial]
  );

  const todayKey = useMemo(() => toDateKey(new Date()), []);
  const selectedDayParam = searchParams.get("day");
  const selectedDayKey =
    selectedDayParam && !Number.isNaN(fromDateKey(selectedDayParam).getTime())
      ? selectedDayParam > todayKey
        ? todayKey
        : selectedDayParam
      : todayKey;
  const [dayUpdating, setDayUpdating] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const topRef = useRef(null);
  const topSectionRef = useRef(null);
  const [bottomHeight, setBottomHeight] = useState(null);
  const chartWrapRef = useRef(null);
  const [chartHeight, setChartHeight] = useState(320);

  useEffect(() => {
    const calcBottomHeight = () => {
      const isDesktop = window.matchMedia ? window.matchMedia("(min-width: 1024px)").matches : window.innerWidth >= 1024;
      if (!isDesktop) {
        setBottomHeight(null);
        setChartHeight(320);
        return;
      }

      const headerHeight = document.querySelector("header")?.offsetHeight || 0;
      const topHeight = topSectionRef.current?.offsetHeight || 0;
      const mainPadding = 24; // StatsPage slightly offsets DashboardLayout padding usage
      const gap = 8; // StatsPage: gap-2 between top and bottom sections

      const available = Math.floor(window.innerHeight - headerHeight - mainPadding - topHeight - gap);
      setBottomHeight(Math.max(260, available));
    };

    calcBottomHeight();
    window.addEventListener("resize", calcBottomHeight);

    const ro = new ResizeObserver(() => calcBottomHeight());
    if (topSectionRef.current) ro.observe(topSectionRef.current);

    return () => {
      window.removeEventListener("resize", calcBottomHeight);
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    if (bottomHeight == null) return undefined;
    const el = chartWrapRef.current;
    if (!el) return undefined;

    const ro = new ResizeObserver((entries) => {
      const next = Math.floor(entries?.[0]?.contentRect?.height || 0);
      if (next > 0) {
        setChartHeight((prev) => (Math.abs(prev - next) >= 2 ? next : prev));
      }
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [bottomHeight]);

  const historyRows = useMemo(() => {
    const endDate = fromDateKey(selectedDayKey);
    const keys = lastNDaysKeys(7, Number.isNaN(endDate.getTime()) ? new Date() : endDate).slice().reverse(); // latest first
    return keys
      .map((dayKey) => ({
        dayKey,
        timeLabel: (() => {
          const h24 = seededInt(`${serviceNo}|${dayKey}|time|h`, 8, 20);
          const mins = seededInt(`${serviceNo}|${dayKey}|time|min`, 0, 3) * 15;
          const h12 = ((h24 + 11) % 12) + 1;
          const ampm = h24 >= 12 ? "PM" : "AM";
          return `${String(h12).padStart(2, "0")}:${String(mins).padStart(2, "0")} ${ampm}`;
        })(),
        percentRecorded: seededInt(`${serviceNo}|${dayKey}|pct|rec`, 12, 28),
        percentShifted: (() => {
          const rec = seededInt(`${serviceNo}|${dayKey}|pct|rec`, 12, 28);
          const diff = seededInt(`${serviceNo}|${dayKey}|pct|diff`, 1, 6);
          return Math.max(0, rec - diff);
        })(),
        valueRecorded: seededInt(`${serviceNo}|${dayKey}|val|rec`, 90, 180),
        valueShifted: (() => {
          const rec = seededInt(`${serviceNo}|${dayKey}|val|rec`, 90, 180);
          const diff = seededInt(`${serviceNo}|${dayKey}|val|diff`, 8, 30);
          return Math.max(0, rec - diff);
        })(),
        points: seededInt(`${serviceNo}|${dayKey}|points`, 220, 420),
      }));
  }, [selectedDayKey, serviceNo]);

  const stats = useMemo(() => {
    const seed = `${serviceNo}|${selectedDayKey}`;
    const totalCostSaved = seededInt(`${seed}|tcs`, 12000, 98000);
    const totalUnitsSaved = seededInt(`${seed}|tus`, 180, 2200);

    const morningHour = seededInt(`${seed}|mh`, 6, 9);
    const eveningHour = seededInt(`${seed}|eh`, 18, 21);

    const morningUnits = seededInt(`${seed}|mu`, 12, 180);
    const eveningUnits = seededInt(`${seed}|eu`, 12, 200);

    const morningCost = seededInt(`${seed}|mc`, 800, 9800);
    const eveningCost = seededInt(`${seed}|ec`, 900, 11200);

    return {
      totalCostSaved,
      totalUnitsSaved,
      morningHour,
      eveningHour,
      morningUnits,
      eveningUnits,
      morningCost,
      eveningCost,
    };
  }, [serviceNo, selectedDayKey]);

  const series = useMemo(
    () => buildHourlySeries(serviceNo, selectedDayKey, peakWindow),
    [peakWindow, serviceNo, selectedDayKey]
  );

  const chartOptions = useMemo(() => {
    const categories = Array.from({ length: 24 }, (_, h) => h);
    const peakLines = peakWindow.includeMorning ? [6, 9, 18, 21] : [18, 21];
    return {
      chart: {
        type: "area",
        toolbar: { show: false },
        zoom: { enabled: false },
        animations: {
          enabled: true,
          easing: "easeinout",
          speed: 900,
          animateGradually: { enabled: true, delay: 0 },
          dynamicAnimation: { enabled: true, speed: 420 },
        },
      },
      dataLabels: { enabled: false },
      stroke: { curve: "smooth", width: 2 },
      fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.55, opacityTo: 0.05, stops: [0, 100] } },
      xaxis: { categories, title: { text: "Hours", style: { fontWeight: 400 } } },
      yaxis: { title: { text: "Consumption (kWh)", style: { fontWeight: 400 } } },
      legend: { show: false },
      colors: [TEAL, PURPLE],
      annotations: {
        xaxis: peakLines.reduce((ranges, x, index, arr) => {
          if (index % 2 !== 0) return ranges;
          const end = arr[index + 1];
          if (end == null) return ranges;
          ranges.push({
            x,
            x2: end,
            fillColor: RED,
            opacity: 0.12,
            borderColor: "transparent",
          });
          return ranges;
        }, []),
      },
    };
  }, [peakWindow.includeMorning]);

  const applySelectedDay = (dayKey) => {
    const normalizedDay =
      dayKey && !Number.isNaN(fromDateKey(dayKey).getTime())
        ? dayKey > todayKey
          ? todayKey
          : dayKey
        : todayKey;
    const next = new URLSearchParams(searchParams);
    if (normalizedDay === todayKey) next.delete("day");
    else next.set("day", normalizedDay);
    setSearchParams(next);
  };

  const onDayClick = (dayKey) => {
    if (dayKey === selectedDayKey) return;
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setDayUpdating(true);
    window.setTimeout(() => {
      applySelectedDay(dayKey);
      setDayUpdating(false);
    }, 380);
  };

  return (
    <div className="flex flex-col gap-2 -mt-1">
      <div ref={topSectionRef} className="flex flex-col gap-2">
        <div ref={topRef} className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <StatCard
            label="Total Cost Saved"
            value={`Rs. ${stats.totalCostSaved.toLocaleString()}`}
            icon={<span className="text-lg font-semibold leading-none">₹</span>}
          />
          <StatCard
            label="Total Units Saved"
            value={`${stats.totalUnitsSaved.toLocaleString()} kWh`}
            icon={<FiActivity className="text-lg" />}
          />
          <StatCard
            label="Morning Peak Hour"
            value={isCommercial ? "--" : `${stats.morningHour}:00`}
            hint={isCommercial ? "Commercial: evening-only" : `Rs. ${stats.morningCost.toLocaleString()} | ${stats.morningUnits} kWh`}
            icon={<FiSun className="text-lg" />}
            muted={isCommercial}
          />
          <StatCard
            label="Evening Peak Hour"
            value={`${stats.eveningHour}:00`}
            hint={`Rs. ${stats.eveningCost.toLocaleString()} | ${stats.eveningUnits} kWh`}
            icon={<FiMoon className="text-lg" />}
          />
        </div>
      </div>

      <div
        className="grid grid-cols-1 lg:grid-cols-[2.25fr_0.75fr] gap-2 items-stretch"
        style={bottomHeight ? { height: bottomHeight } : undefined}
      >
        <div className="bg-white rounded-lg shadow p-2 relative flex flex-col min-h-0 min-w-0">
          <div className="flex items-center justify-between mb-1 shrink-0">
            <div className="text-sm font-semibold">Hourly Consumption Pattern</div>
            <div className="text-xs text-gray-500 tabular-nums">{selectedDayKey}</div>
          </div>
          <div ref={chartWrapRef} className="flex-1 min-h-0 overflow-hidden">
            <SequentialAreaChart
              key={`${serviceNo}|${selectedDayKey}|${peakWindow.includeMorning ? "M+E" : "E"}`}
              options={chartOptions}
              baseline={series.baseline}
              actual={series.actual}
              height={chartHeight}
              delayMs={950}
            />
          </div>
          <div className="flex items-center justify-center gap-5 mt-1 text-xs text-gray-500 shrink-0 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ background: TEAL }} />
              <span>baseline</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ background: PURPLE }} />
              <span>actual</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm" style={{ background: RED }} />
              <span>Peak</span>
            </div>
          </div>

          {dayUpdating ? (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <div className="text-sm font-medium text-gray-700">Updating...</div>
            </div>
          ) : null}
        </div>

        <div className="bg-white rounded-lg shadow p-2 flex flex-col min-h-0 min-w-0">
          <div className="flex items-center justify-between mb-1 shrink-0">
            <div className="text-lg font-semibold py-0.5">Shift History</div>
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm hover:bg-indigo-700 transition"
              aria-label="Expand shift history"
            >
              <FiMaximize2 className="text-[16px]" />
            </button>
          </div>
          <div className="flex-1 min-h-0 bg-gray-50 rounded-lg overflow-hidden">
            <table className="w-full text-[13px] border border-gray-200 border-collapse bg-white">
              <thead className="text-gray-600 bg-[#f6f3ff]">
                <tr className="text-left">
                  <th className="py-1.5 px-2 whitespace-nowrap font-medium border border-gray-200">
                    Date
                  </th>
                  <th className="py-1.5 px-2 whitespace-nowrap font-medium text-right border border-gray-200">
                    Shifted Units (kWh)
                  </th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {historyRows.map((r) => (
                  <tr
                    key={r.dayKey}
                    onClick={() => onDayClick(r.dayKey)}
                    className={`cursor-pointer hover:bg-gray-50 ${r.dayKey === selectedDayKey ? "bg-indigo-50" : "bg-white"}`}
                  >
                    <td className="py-1.5 px-2 whitespace-nowrap font-medium border border-gray-200">{r.dayKey}</td>
                    <td className="py-1.5 px-2 whitespace-nowrap text-right font-semibold text-[#6A42B2] border border-gray-200">{r.valueShifted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-xs text-gray-500 mt-1 shrink-0">Click a row to load that day's stats.</div>
        </div>
      </div>

      {historyOpen ? (
        <FullHistoryModal rows={historyRows} selectedDayKey={selectedDayKey} onDayClick={onDayClick} onClose={() => setHistoryOpen(false)} />
      ) : null}
    </div>
  );
}
