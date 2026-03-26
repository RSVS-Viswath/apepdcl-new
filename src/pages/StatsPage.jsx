import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import Chart from "react-apexcharts";
import { getAllConsumers } from "../lib/consumers";
import { fromDateKey, lastNDaysKeys, toDateKey } from "../lib/dateKey";
import { seededInt, seededNumber } from "../lib/seeded";
import { getTariffBand, getTariffRate } from "../lib/tariffs";
import { FiActivity, FiClock, FiMaximize2, FiMoon, FiSun, FiX } from "react-icons/fi";

// Match legacy client theme graph palette
const TEAL = "#13C4A9";
const PURPLE = "#6A42B2";
const RED = "#ef4444";

function formatHourLabel(hour) {
  return `${String(hour).padStart(2, "0")}:00`;
}

function formatConsumption(value) {
  return `${Number(value || 0).toFixed(2)} kWh`;
}

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
    setShowActual(false);
    const id = window.setTimeout(() => setShowActual(true), delayMs);
    return () => window.clearTimeout(id);
  }, [delayMs]);

  const series = useMemo(
    () => [
      { name: "Baseline Consumption", data: baseline },
      ...(showActual ? [{ name: "Actual Consumption", data: actual }] : []),
    ],
    [actual, baseline, showActual]
  );

  return <Chart options={options} series={series} type="area" height={height} />;
}

function buildHourlySeries(serviceNo, dayKey, { includeMorning, includeEvening }) {
  const baseSeed = `${serviceNo}|${dayKey}`;
  const baselineTemplate = [0, 1, 13, 11, 12, 19, 26, 0, 20, 8, 38, 14, 24, 10, 12, 0, 0, 37, 44, 42, 15, 10, 13, 9];
  const actualTemplate = [13, 5, 12, 13, 5, 7, 14, 19, 14, 9, 18, 17, 21, 15, 10, 14, 13, 15, 15, 14, 13, 9, 13, 15];

  const baseline = baselineTemplate.map((value, h) => {
    const variance = seededNumber(`${baseSeed}|base|${h}`, -1.6, 1.6);
    const morningScale = includeMorning || h < 6 || h > 9 ? 1 : 0.36;
    const eveningScale = includeEvening || h < 18 || h > 21 ? 1 : 0.48;
    return {
      x: h,
      y: Math.max(0, Math.min(48.5, Number((value * morningScale * eveningScale + variance).toFixed(2)))),
    };
  });

  const actual = actualTemplate.map((value, h) => {
    const variance = seededNumber(`${baseSeed}|act|${h}`, -1.2, 1.2);
    const shiftGain = h >= 18 && h <= 21 ? seededNumber(`${baseSeed}|shift|${h}`, -1.1, 0.4) : 0;
    const morningScale = includeMorning || h < 6 || h > 9 ? 1 : 0.74;
    return {
      x: h,
      y: Math.max(0, Math.min(24, Number((value * morningScale + variance + shiftGain).toFixed(2)))),
    };
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
  const [desktopPanelHeight, setDesktopPanelHeight] = useState(null);
  const chartWrapRef = useRef(null);
  const [chartHeight, setChartHeight] = useState(320);

  useEffect(() => {
    const calcDesktopPanelHeight = () => {
      const isDesktop = window.matchMedia ? window.matchMedia("(min-width: 1024px)").matches : window.innerWidth >= 1024;
      if (!isDesktop) {
        setDesktopPanelHeight(null);
        setChartHeight(320);
        return;
      }

      const headerHeight = document.querySelector("header")?.offsetHeight || 0;
      const mainPadding = 24; // StatsPage slightly offsets DashboardLayout padding usage
      const available = Math.floor(window.innerHeight - headerHeight - mainPadding);
      setDesktopPanelHeight(Math.max(360, available));
    };

    calcDesktopPanelHeight();
    window.addEventListener("resize", calcDesktopPanelHeight);

    return () => {
      window.removeEventListener("resize", calcDesktopPanelHeight);
    };
  }, []);

  useEffect(() => {
    if (desktopPanelHeight == null) return undefined;
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
  }, [desktopPanelHeight]);

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

    const morningHour = 7;
    const eveningHour = 20;

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
  const activePeakHour = 20;
  const hoursLeftToReduce = 9;

  const chartOptions = useMemo(() => {
    const actualPeakIndex = series.actual.findIndex((point) => point.x === activePeakHour);
    return {
      chart: {
        type: "area",
        toolbar: { show: false },
        zoom: { enabled: false },
        parentHeightOffset: 0,
        background: "transparent",
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
      fill: {
        type: "gradient",
        gradient: { shadeIntensity: 1, opacityFrom: 0.48, opacityTo: 0.03, stops: [0, 100] },
      },
      grid: {
        borderColor: "#d8dde6",
        strokeDashArray: 0,
        padding: { left: 4, right: 18, top: 8, bottom: 0 },
      },
      states: {
        hover: { filter: { type: "none" } },
        active: { filter: { type: "none" } },
      },
      markers: {
        size: 0,
        strokeColors: "#ffffff",
        strokeWidth: 3,
        hover: { sizeOffset: 6 },
        discrete:
          actualPeakIndex >= 0
            ? [
                {
                  seriesIndex: 1,
                  dataPointIndex: actualPeakIndex,
                  fillColor: PURPLE,
                  strokeColor: "#ffffff",
                  size: 8,
                },
              ]
            : [],
      },
      xaxis: {
        type: "numeric",
        min: 0,
        max: 23,
        tickAmount: 23,
        axisBorder: { color: "#d8dde6" },
        axisTicks: { color: "#d8dde6" },
        title: { text: "Hours", style: { fontWeight: 400 } },
        labels: {
          formatter: (value) => String(Math.round(value)).padStart(2, "0"),
        },
        tooltip: { enabled: false },
      },
      yaxis: {
        min: 0,
        max: 50,
        tickAmount: 5,
        decimalsInFloat: 2,
        title: { text: "Consumption (kWh)", style: { fontWeight: 400 } },
        labels: {
          formatter: (value) => Number(value).toFixed(2),
        },
      },
      tooltip: {
        shared: true,
        intersect: false,
        custom: ({ series: tooltipSeries, dataPointIndex, w }) => {
          const hour = Math.round(w.globals.seriesX?.[0]?.[dataPointIndex] ?? dataPointIndex);
          const tariffBand = getTariffBand(hour, isCommercial);
          const tariffRate = getTariffRate(hour, isCommercial);
          const baselineValue = Number(tooltipSeries?.[0]?.[dataPointIndex] ?? 0);
          const actualValue = Number(tooltipSeries?.[1]?.[dataPointIndex] ?? 0);

          return `
            <div style="min-width:292px;background:#ffffff;border:1px solid #d6dde7;border-radius:10px;box-shadow:0 10px 28px rgba(15,23,42,0.12);overflow:hidden;">
              <div style="padding:12px 16px;background:#eef2f6;border-bottom:1px solid #d6dde7;font-size:14px;color:#0f172a;">
                ${formatHourLabel(hour)} &mdash; ${tariffBand} Rs.${tariffRate.toFixed(1)}/unit
              </div>
              <div style="padding:14px 16px;display:grid;gap:14px;">
                <div style="display:flex;align-items:center;gap:10px;font-size:14px;color:#111827;">
                  <span style="width:16px;height:16px;border-radius:999px;background:${TEAL};display:inline-block;"></span>
                  <span>Baseline Consumption:</span>
                  <strong>${formatConsumption(baselineValue)}</strong>
                </div>
                <div style="display:flex;align-items:center;gap:10px;font-size:14px;color:#111827;">
                  <span style="width:16px;height:16px;border-radius:999px;background:${PURPLE};display:inline-block;"></span>
                  <span>Actual Consumption:</span>
                  <strong>${formatConsumption(actualValue)}</strong>
                </div>
              </div>
            </div>
          `;
        },
      },
      legend: { show: false },
      colors: [TEAL, PURPLE],
      annotations: {
        xaxis: [
          ...(peakWindow.includeMorning
            ? [
                {
                  x: 6,
                  x2: 9,
                  fillColor: RED,
                  opacity: 0.12,
                  borderColor: "transparent",
                },
              ]
            : []),
          {
            x: 18,
            x2: 21,
            fillColor: RED,
            opacity: 0.12,
            borderColor: "transparent",
          },
          {
            x: activePeakHour,
            strokeDashArray: 4,
            borderColor: "#9aa4b2",
          },
        ],
      },
    };
  }, [activePeakHour, isCommercial, peakWindow.includeMorning, series.actual]);

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
    <div
      className="grid grid-cols-1 lg:grid-cols-[2.25fr_0.75fr] gap-2 items-stretch -mt-1"
      style={desktopPanelHeight ? { height: desktopPanelHeight } : undefined}
    >
      <div className="flex flex-col gap-2 min-h-0 min-w-0">
        <div ref={topRef} className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <StatCard
            label="Total Cost Saved"
            value={`Rs. ${stats.totalCostSaved.toLocaleString()}`}
            icon={<span className="text-sm font-semibold leading-none">Rs</span>}
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

        <div className="bg-white rounded-lg shadow p-2 relative flex flex-col min-h-0 min-w-0 flex-1">
          <div className="flex items-center justify-between mb-1 shrink-0">
            <div className="text-sm font-semibold">Hourly Consumption Pattern</div>
            <div className="text-right">
              <div className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#7c22d3]">
                <FiClock className="text-[12px]" />
                <span>{hoursLeftToReduce} hours left to reduce</span>
              </div>
              <div className="text-[11px] text-gray-500 tabular-nums mt-0.5">{selectedDayKey}</div>
            </div>
          </div>
          <div ref={chartWrapRef} className="relative flex-1 min-h-0 overflow-hidden">
            <SequentialAreaChart
              key={`${serviceNo}|${selectedDayKey}|${peakWindow.includeMorning ? "M+E" : "E"}`}
              options={chartOptions}
              baseline={series.baseline}
              actual={series.actual}
              height={chartHeight}
              delayMs={950}
            />
            {peakWindow.includeMorning ? (
              <div
                className="pointer-events-none absolute bottom-11 rounded-[4px] bg-[#6b46c1] px-2 py-0.5 text-[11px] font-medium text-white shadow-sm"
                style={{ left: `${(7.5 / 23) * 100}%`, transform: "translateX(-50%)" }}
              >
                Morning Peak
              </div>
            ) : null}
            <div
              className="pointer-events-none absolute bottom-11 rounded-[4px] bg-[#6b46c1] px-2 py-0.5 text-[11px] font-medium text-white shadow-sm"
              style={{ left: `${(19.5 / 23) * 100}%`, transform: "translateX(-50%)" }}
            >
              Evening Peak
            </div>
          </div>
          <div className="flex items-center justify-center gap-7 mt-1 text-xs text-gray-500 shrink-0 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ background: TEAL }} />
              <span>Baseline Consumption</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ background: PURPLE }} />
              <span>Actual Consumption</span>
            </div>
          </div>

          {dayUpdating ? (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <div className="text-sm font-medium text-gray-700">Updating...</div>
            </div>
          ) : null}
        </div>
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
        <div className="flex-1 min-h-0 bg-gray-50 rounded-lg overflow-auto">
          <table className="w-full text-[13px] border border-gray-200 border-collapse bg-white">
            <thead className="text-gray-600 bg-[#f6f3ff] sticky top-0 z-10">
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

      {historyOpen ? (
        <FullHistoryModal rows={historyRows} selectedDayKey={selectedDayKey} onDayClick={onDayClick} onClose={() => setHistoryOpen(false)} />
      ) : null}
    </div>
  );
}
