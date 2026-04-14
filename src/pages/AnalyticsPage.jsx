import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Chart from "react-apexcharts";
import { FiArrowLeft, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import SingleDatePicker from "../components/SingleDatePicker";
import { addDays, fromDateKey, lastNDaysKeys, toDateKey, todayDateKey } from "../lib/dateKey";
import { getAllConsumers } from "../lib/consumers";
import { seededNumber } from "../lib/seeded";

const PAGE_BG = "#f3f4f6";
const PEAK_COLOR = "#f4827a";
const NORMAL_COLOR = "#f8b44e";
const OFFPEAK_COLOR = "#80c583";
const WEEKLY_BAR = "#6b5fe4";
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDayLabel(dayKey) {
  const date = fromDateKey(dayKey);
  if (Number.isNaN(date.getTime())) return dayKey;
  return date.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
}

function formatMonthKey(key) {
  const date = new Date(`${key}-01T00:00:00`);
  if (Number.isNaN(date.getTime())) return key;
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function toMonthKey(date) {
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) return "";
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;
}

function fromMonthKey(key) {
  if (!/^\d{4}-\d{2}$/.test(String(key || ""))) return new Date(NaN);
  return new Date(`${key}-01T00:00:00`);
}

function topMetricCard(label, value, suffix) {
  return (
    <div className="h-11 px-3 rounded-lg border border-gray-300 bg-gray-50 flex items-center gap-2 shadow-sm">
      <div className="text-xs text-gray-600 whitespace-nowrap">{label}</div>
      <div className="text-[15px] font-semibold text-gray-900 tabular-nums">{value}</div>
      {suffix ? <div className="text-xs text-gray-500">{suffix}</div> : null}
    </div>
  );
}

function AnalyticsDatePicker({ value, max, onApply }) {
  return (
    <SingleDatePicker
      label="Date"
      value={value}
      maxKey={max}
      onApply={onApply}
      wrapperClassName="w-full sm:w-auto"
      triggerClassName="border border-gray-300 rounded-lg px-3 h-11 bg-gray-50 shadow-sm flex items-center justify-center"
      labelClassName="text-[10px] font-semibold tracking-wide text-gray-600 uppercase whitespace-nowrap"
      valueClassName="text-[13px] font-semibold tabular-nums text-gray-900 whitespace-nowrap"
      dialogTitle="Select Date"
      calendarColor="#2563eb"
    />
  );
}

function AnalyticsMonthPicker({ value, maxKey, onApply }) {
  const [open, setOpen] = useState(false);
  const selectedDate = useMemo(() => fromMonthKey(value), [value]);
  const maxDate = useMemo(() => fromDateKey(maxKey), [maxKey]);
  const [draftYear, setDraftYear] = useState(selectedDate.getFullYear());

  useEffect(() => {
    if (!Number.isNaN(selectedDate.getTime())) {
      setDraftYear(selectedDate.getFullYear());
    }
  }, [selectedDate]);

  const modal =
    open && typeof document !== "undefined"
      ? createPortal(
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-auto min-w-[360px] max-w-[calc(100vw-2rem)] p-4 sm:p-5">
              <div className="text-lg font-semibold mb-3 text-center">Select Month</div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setDraftYear((year) => year - 1)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition hover:bg-slate-200"
                  aria-label="Previous year"
                >
                  <FiChevronLeft className="text-lg" />
                </button>
                <div className="text-base font-semibold text-slate-900">{draftYear}</div>
                <button
                  type="button"
                  onClick={() => {
                    const maxYear = Number.isNaN(maxDate.getTime()) ? draftYear + 1 : maxDate.getFullYear();
                    setDraftYear((year) => Math.min(year + 1, maxYear));
                  }}
                  disabled={!Number.isNaN(maxDate.getTime()) && draftYear >= maxDate.getFullYear()}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Next year"
                >
                  <FiChevronRight className="text-lg" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {MONTH_LABELS.map((monthLabel, monthIndex) => {
                  const monthDate = new Date(draftYear, monthIndex, 1);
                  const monthKey = toMonthKey(monthDate);
                  const isSelected = value === monthKey;
                  const isDisabled =
                    !Number.isNaN(maxDate.getTime()) &&
                    (draftYear > maxDate.getFullYear() ||
                      (draftYear === maxDate.getFullYear() && monthIndex > maxDate.getMonth()));

                  return (
                    <button
                      key={monthLabel}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => {
                        onApply(monthKey);
                        setOpen(false);
                      }}
                      className={`rounded-xl border px-3 py-3 text-sm font-medium transition ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-600 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      } disabled:cursor-not-allowed disabled:border-slate-100 disabled:bg-slate-50 disabled:text-slate-300`}
                    >
                      {monthLabel}
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-end mt-4">
                <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg border text-sm" type="button">
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <div
        className="h-9 px-3 rounded-lg border border-gray-300 bg-white flex items-center cursor-pointer"
        onClick={() => setOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <div className="w-full bg-transparent outline-none text-sm text-gray-600">{formatMonthKey(value)}</div>
      </div>
      {modal}
    </>
  );
}

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const { serviceNo: rawServiceNo } = useParams();
  const serviceNo = decodeURIComponent(rawServiceNo || "");
  const [searchParams, setSearchParams] = useSearchParams();
  const consumers = useMemo(() => getAllConsumers(), []);
  const fallback = consumers.find((consumer) => consumer.serviceNo === serviceNo);
  const category = searchParams.get("category") || fallback?.category || "--";
  const todayKey = useMemo(() => todayDateKey(), []);
  const selectedDayParam = searchParams.get("day");
  const selectedDayKey =
    selectedDayParam && !Number.isNaN(fromDateKey(selectedDayParam).getTime())
      ? selectedDayParam > todayKey
        ? todayKey
        : selectedDayParam
      : todayKey;
  const rangeParam = searchParams.get("range");
  const selectedRange = rangeParam === "30" ? 30 : 7;
  const monthParam = searchParams.get("month");
  const weeklyMonth = /^\d{4}-\d{2}$/.test(String(monthParam || "")) ? monthParam : todayKey.slice(0, 7);
  const isCommercial = String(category).toUpperCase().includes("COMMERCIAL");

  const chartDayKeys = useMemo(() => lastNDaysKeys(selectedRange, fromDateKey(selectedDayKey)), [selectedDayKey, selectedRange]);
  const heatmapDayKeys = useMemo(() => lastNDaysKeys(30, fromDateKey(selectedDayKey)), [selectedDayKey]);
  const analyticsSeed = `${serviceNo}|${category}|${selectedDayKey}`;

  const dailyRows = useMemo(
    () =>
      chartDayKeys.map((dayKey, index) => {
        const nonPeakBase = isCommercial ? [1520, 1240, 1260, 1365, 1490, 1760, 1540] : [1490, 1235, 1255, 1350, 1475, 1735, 1515];
        const peakBase = isCommercial ? [720, 580, 360, 735, 710, 790, 645] : [735, 610, 395, 740, 720, 820, 655];
        const slot = index % nonPeakBase.length;
        return {
          label: formatDayLabel(dayKey),
          nonPeak: Math.max(920, Math.round(nonPeakBase[slot] + seededNumber(`${analyticsSeed}|np|${dayKey}`, -85, 110))),
          peak: Math.max(260, Math.round(peakBase[slot] + seededNumber(`${analyticsSeed}|pk|${dayKey}`, -70, 90))),
        };
      }),
    [analyticsSeed, chartDayKeys, isCommercial]
  );

  const totalConsumption = useMemo(
    () => dailyRows.reduce((sum, row) => sum + row.nonPeak + row.peak, 0) / dailyRows.length,
    [dailyRows]
  );
  const co2Emission = useMemo(() => totalConsumption * 0.401, [totalConsumption]);
  const contractedDemand = fallback?.contractedDemand ?? (isCommercial ? 180 : 320);
  const peakDemand = useMemo(
    () => seededNumber(`${analyticsSeed}|peak-demand`, contractedDemand * 0.12, contractedDemand * 0.19),
    [analyticsSeed, contractedDemand]
  );
  const pfMin = useMemo(() => seededNumber(`${analyticsSeed}|pf-min`, 0.72, 0.8), [analyticsSeed]);
  const pfAvg = useMemo(() => seededNumber(`${analyticsSeed}|pf-avg`, 0.9, 0.97), [analyticsSeed]);

  const tariffSplit = useMemo(() => {
    const peak = seededNumber(`${analyticsSeed}|tariff|peak`, totalConsumption * 0.22, totalConsumption * 0.3);
    const normal = seededNumber(`${analyticsSeed}|tariff|normal`, totalConsumption * 0.08, totalConsumption * 0.18);
    const offPeak = Math.max(totalConsumption - peak - normal, totalConsumption * 0.45);
    return {
      Peak: Number(peak.toFixed(2)),
      Normal: Number(normal.toFixed(2)),
      "Off-Peak": Number(offPeak.toFixed(2)),
    };
  }, [analyticsSeed, totalConsumption]);

  const weeklyData = useMemo(() => {
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const monthlySeed = `${serviceNo}|${category}|month|${weeklyMonth}`;
    return labels.map((label) => ({
      label,
      value: Math.round(seededNumber(`${monthlySeed}|weekly|${label}`, 1750, 2400)),
    }));
  }, [category, serviceNo, weeklyMonth]);

  const heatmapSeries = useMemo(
    () =>
      Array.from({ length: 24 }, (_, hour) => ({
        name: `${hour}:00`,
        data: heatmapDayKeys.map((dayKey) => ({
          x: formatDayLabel(dayKey),
          y: Math.round(seededNumber(`${serviceNo}|${category}|heat|${selectedDayKey}|${dayKey}|${hour}`, 0, 100)),
        })),
      })),
    [category, heatmapDayKeys, selectedDayKey, serviceNo]
  );

  const dailyConsumptionChart = useMemo(
    () => ({
      series: [
        { name: "Non-peak", data: dailyRows.map((row) => row.nonPeak) },
        { name: "Peak", data: dailyRows.map((row) => row.peak) },
      ],
      options: {
        chart: {
          type: "bar",
          stacked: true,
          toolbar: { show: false },
        },
        grid: { show: false },
        plotOptions: {
          bar: {
            columnWidth: "66%",
            borderRadius: 0,
          },
        },
        dataLabels: { enabled: false },
        xaxis: {
          categories: dailyRows.map((row) => row.label),
          title: { text: "Date", style: { fontWeight: 600 } },
          axisBorder: { color: "#d8dee8" },
          axisTicks: { color: "#d8dee8" },
        },
        yaxis: {
          title: { text: "Consumption (kWh)", style: { fontWeight: 600 } },
          labels: {
            formatter: (value) => Number(value).toFixed(2),
          },
        },
        tooltip: {
          y: {
            formatter: (value) => `${Number(value).toFixed(2)} kWh`,
          },
        },
        colors: [OFFPEAK_COLOR, PEAK_COLOR],
        legend: { position: "bottom" },
      },
    }),
    [dailyRows]
  );

  const tariffSplitChart = useMemo(() => {
    const labels = Object.keys(tariffSplit);
    return {
      series: labels.map((label) => tariffSplit[label]),
      options: {
        chart: { type: "donut", toolbar: { show: false } },
        labels,
        dataLabels: { enabled: false },
        legend: { position: "bottom" },
        stroke: { colors: ["#ffffff"], width: 2 },
        colors: labels.map((label) => {
          if (label === "Peak") return PEAK_COLOR;
          if (label === "Normal") return NORMAL_COLOR;
          return OFFPEAK_COLOR;
        }),
        tooltip: {
          y: {
            formatter: (value) => `${Number(value).toFixed(2)} kWh`,
          },
        },
      },
    };
  }, [tariffSplit]);

  const weeklyChart = useMemo(
    () => ({
      series: [
        {
          name: "Consumption (kWh)",
          data: weeklyData.map((item) => item.value),
        },
      ],
      options: {
        chart: { type: "bar", toolbar: { show: false }, parentHeightOffset: 0 },
        plotOptions: {
          bar: {
            horizontal: true,
            barHeight: "74%",
            borderRadius: 0,
          },
        },
        dataLabels: { enabled: false },
        grid: {
          show: false,
          padding: {
            left: 8,
            right: 0,
          },
        },
        colors: [WEEKLY_BAR],
        xaxis: {
          min: 0,
          categories: weeklyData.map((item) => item.label),
          max: Math.ceil(Math.max(...weeklyData.map((item) => item.value)) / 100) * 100,
          title: { text: "kWh", style: { fontWeight: 400 } },
          labels: {
            style: {
              colors: ["#475569"],
              fontSize: "12px",
            },
          },
        },
        yaxis: {
          labels: {
            minWidth: 36,
            style: {
              colors: ["#475569"],
              fontSize: "12px",
            },
          },
        },
      },
    }),
    [weeklyData]
  );

  const heatmapChart = useMemo(
    () => ({
      series: heatmapSeries,
      options: {
        chart: {
          type: "heatmap",
          toolbar: { show: false },
        },
        dataLabels: { enabled: false },
        stroke: { width: 0 },
        plotOptions: {
          heatmap: {
            shadeIntensity: 0,
            radius: 0,
            colorScale: {
              ranges: [
                { from: 0, to: 15, color: "#0a7403" },
                { from: 16, to: 35, color: "#56b456" },
                { from: 36, to: 55, color: "#b4e78a" },
                { from: 56, to: 72, color: "#fff100" },
                { from: 73, to: 86, color: "#ffb300" },
                { from: 87, to: 100, color: "#ff1c12" },
              ],
            },
          },
        },
        xaxis: {
          type: "category",
          labels: {
            rotate: 0,
            hideOverlappingLabels: false,
          },
        },
        yaxis: {
          reversed: false,
          labels: {
            formatter: (value) => value,
          },
        },
        legend: { show: false },
        tooltip: {
          custom: ({ series, seriesIndex, dataPointIndex, w }) => {
            const dateLabel = w?.globals?.labels?.[dataPointIndex] ?? "";
            const hourLabel = heatmapSeries?.[seriesIndex]?.name ?? "";
            const value = Number(series?.[seriesIndex]?.[dataPointIndex] ?? 0);
            return `
              <div style="background:#000; color:#fff; padding:10px 12px; border-radius:6px; min-width:170px;">
                <div style="font-size:13px; font-weight:700; margin-bottom:2px;">${dateLabel}</div>
                <div style="font-size:12px; margin-bottom:2px;">Hour: ${hourLabel}</div>
                <div style="font-size:12px;">Consumption: ${value.toFixed(2)} kWh</div>
              </div>
            `;
          },
        },
      },
    }),
    [heatmapSeries]
  );

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

  const applyMonth = (monthKey) => {
    const next = new URLSearchParams(searchParams);
    if (monthKey === todayKey.slice(0, 7)) next.delete("month");
    else next.set("month", monthKey);
    setSearchParams(next);
  };

  const applyRange = (range) => {
    const next = new URLSearchParams(searchParams);
    if (range === 7) next.delete("range");
    else next.set("range", String(range));
    setSearchParams(next);
  };

  const statsQuery = searchParams.toString();
  const statsHref = `/stats/${encodeURIComponent(serviceNo)}${statsQuery ? `?${statsQuery}` : ""}`;

  return (
    <div className="min-h-full" style={{ background: PAGE_BG }}>
      <div className="space-y-2">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-11 h-11 rounded-lg border border-gray-300 bg-gray-50 flex items-center justify-center shadow-sm hover:bg-white"
              aria-label="Back to stats"
            >
              <FiArrowLeft className="text-lg" />
            </button>
            {topMetricCard("Consumption:", totalConsumption.toFixed(2))}
            {topMetricCard("CO2:", co2Emission.toFixed(2), "kg")}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <AnalyticsDatePicker value={selectedDayKey} max={todayKey} onApply={applySelectedDay} />
            <button
              type="button"
              className="h-11 px-4 rounded-lg bg-indigo-600 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
            >
              Performance Report
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-3 pb-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-1">
            <div className="text-sm font-semibold text-gray-900">Daily Consumption (Peak vs Non-Peak)</div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => applyRange(7)}
                className={`px-3 py-1 text-xs rounded border transition ${
                  selectedRange === 7
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-gray-300 bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                Last 7 Days
              </button>
              <button
                type="button"
                onClick={() => applyRange(30)}
                className={`px-3 py-1 text-xs rounded border transition ${
                  selectedRange === 30
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-gray-300 bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                Last 30 Days
              </button>
            </div>
          </div>

          <Chart options={dailyConsumptionChart.options} series={dailyConsumptionChart.series} type="bar" height={300} />
        </div>

        <div className="grid w-full grid-cols-1 items-stretch gap-2.5 xl:grid-cols-[230px_minmax(0,1.08fr)_minmax(0,1.32fr)]">
          <div className="space-y-2.5">
            <div className="bg-white rounded-lg shadow p-2.5 text-center">
              <div className="text-xs text-gray-500">Power Factor (Min)</div>
              <div className="text-[17px] font-semibold text-[#ff2c2c] mt-1">{pfMin.toFixed(2)}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-2.5 text-center">
              <div className="text-xs text-gray-500">Power Factor (Avg)</div>
              <div className="text-[17px] font-semibold text-[#0a9b2d] mt-1">{pfAvg.toFixed(2)}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-2.5 text-center">
              <div className="text-xs text-gray-500">Contracted Demand</div>
              <div className="text-[17px] font-semibold text-[#1e5bff] mt-1">
                {contractedDemand}
                <span className="text-gray-400 text-[13px] ml-1">kVA</span>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-2.5 text-center">
              <div className="text-xs text-gray-500">Peak Demand</div>
              <div className="text-[17px] font-semibold text-[#ff6a00] mt-1">
                {peakDemand.toFixed(2)}
                <span className="text-gray-400 text-[13px] ml-1">kVA</span>
              </div>
            </div>
          </div>

          <div className="min-w-0 bg-white rounded-lg shadow p-2.5">
            <div className="text-center text-sm font-semibold text-gray-900 mb-1">Tariff Split (kWh)</div>
            <Chart options={tariffSplitChart.options} series={tariffSplitChart.series} type="donut" height={220} />
          </div>

          <div className="min-w-0 bg-white rounded-lg shadow p-2.5">
            <div className="flex items-center justify-between mb-1.5 gap-3">
              <div className="text-sm font-semibold text-gray-900">Monthly Usage by Day</div>
              <AnalyticsMonthPicker value={weeklyMonth} maxKey={todayKey} onApply={applyMonth} />
            </div>
            <Chart options={weeklyChart.options} series={weeklyChart.series} type="bar" height={250} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-3">
          <div className="text-sm font-semibold text-gray-900 mb-2">Hourly Consumption Heat Map (Last 30 Days)</div>
          <Chart options={heatmapChart.options} series={heatmapChart.series} type="heatmap" height={660} />
        </div>
      </div>
    </div>
  );
}
