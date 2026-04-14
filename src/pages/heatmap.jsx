import { useMemo } from "react";
import Chart from "react-apexcharts";
import { useLocation } from "react-router-dom";
import { fromDateKey, lastNDaysKeys, todayDateKey } from "../lib/dateKey";
import { seededNumber } from "../lib/seeded";

const DEFAULT_MAX_VALUE = 236;
const TILE_GAP_COLOR = "#f4efe6";

function toNumber(value) {
  const next = Number(value);
  return Number.isFinite(next) ? next : 0;
}

function normalizeHeatValue(value) {
  if (value === null || value === undefined || value === "") return null;
  const next = Number(value);
  return Number.isFinite(next) ? next : null;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatDayLabel(dayKey) {
  const date = fromDateKey(dayKey);
  if (Number.isNaN(date.getTime())) return dayKey;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTooltipHour(hourLabel) {
  const match = String(hourLabel || "").match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return String(hourLabel || "");

  const hour24 = Number(match[1]);
  const minute = match[2];
  const suffix = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;
  return `${hour12}:${minute} ${suffix}`;
}

function buildFallbackSeries() {
  const dayKeys = lastNDaysKeys(30, fromDateKey(todayDateKey()));

  return Array.from({ length: 24 }, (_, hour) => ({
    name: `${hour}:00`,
    data: dayKeys.map((dayKey, dayIndex) => {
      const nightDip = hour <= 5 ? -28 : 0;
      const morningBump = hour >= 8 && hour <= 11 ? 14 : 0;
      const afternoonBump = hour >= 12 && hour <= 17 ? 8 : 0;
      const eveningBump = hour >= 18 && hour <= 21 ? 10 : 0;
      const endWindowLift = dayIndex >= 18 ? 14 : 0;
      const seededBase = seededNumber(`heatmap|base|${dayKey}|${hour}`, 78, 148);
      let value = seededBase + nightDip + morningBump + afternoonBump + eveningBump + endWindowLift;

      // Match the visual rhythm from the reference: a few deep low-load vertical bands.
      if (dayIndex === 5 && hour <= 13) value = seededNumber(`heatmap|low-a|${hour}`, 0, 18);
      if (dayIndex === 5 && hour >= 14 && hour <= 15) value = seededNumber(`heatmap|low-a2|${hour}`, 15, 55);
      if (dayIndex === 4 && hour === 6) value = seededNumber(`heatmap|low-b1|${hour}`, 0, 15);
      if (dayIndex === 4 && hour >= 20) value = seededNumber(`heatmap|low-b2|${hour}`, 0, 14);
      if (dayIndex === 14 && hour >= 16 && hour <= 18) value = seededNumber(`heatmap|low-c1|${hour}`, 0, 16);
      if (dayIndex === 15 && hour >= 16 && hour <= 19) value = seededNumber(`heatmap|low-c2|${hour}`, 0, 18);
      if (dayIndex === 16 && hour >= 12 && hour <= 14) value = seededNumber(`heatmap|low-c3|${hour}`, 0, 16);
      if (dayIndex === 20 && hour >= 12 && hour <= 19) value = seededNumber(`heatmap|low-d|${hour}`, 0, 14);

      // Bright right-edge activity band like the screenshot.
      if (dayIndex === 29 && hour >= 4 && hour <= 9) value = seededNumber(`heatmap|peak-z|${hour}`, 182, DEFAULT_MAX_VALUE);

      // Extra warm patches to push the overall board toward yellow/orange.
      if ([18, 24, 26, 28].includes(dayIndex)) value += seededNumber(`heatmap|warm-x|${dayKey}|${hour}`, 8, 26);
      if ([2, 7, 10, 17, 22].includes(dayIndex) && hour >= 10 && hour <= 16) {
        value += seededNumber(`heatmap|warm-y|${dayKey}|${hour}`, 10, 22);
      }

      return {
        x: formatDayLabel(dayKey),
        y: Math.round(clamp(value, 0, DEFAULT_MAX_VALUE)),
      };
    }),
  }));
}

function normalizePoint(point) {
  if (point && typeof point === "object" && "x" in point && "y" in point) {
    return {
      x: String(point.x),
      y: normalizeHeatValue(point.y),
    };
  }

  return {
    x: "",
    y: normalizeHeatValue(point),
  };
}

function normalizeSeries(series) {
  if (!Array.isArray(series)) return [];

  return series
    .map((row, rowIndex) => ({
      name: String(row?.name ?? `${rowIndex}:00`),
      data: Array.isArray(row?.data) ? row.data.map(normalizePoint) : [],
    }))
    .filter((row) => row.data.length > 0);
}

export default function HeatmapPage() {
  const location = useLocation();
  const routeState = location.state ?? {};

  const title = routeState.title || "Hourly Consumption Heat Map (Last 30 Days)";
  const normalizedSeries = useMemo(() => {
    const fromRoute = normalizeSeries(routeState.series);
    return fromRoute.length ? fromRoute : buildFallbackSeries();
  }, [routeState.series]);

  const chartStats = useMemo(() => {
    const allValues = normalizedSeries.flatMap((row) => row.data.map((point) => point.y)).filter((value) => value !== null);
    const maxValue = allValues.length ? Math.max(DEFAULT_MAX_VALUE, Math.max(...allValues)) : DEFAULT_MAX_VALUE;
    const labelCount = normalizedSeries[0]?.data?.length ?? 0;

    return {
      maxValue,
      labelCount,
      hasData: normalizedSeries.length > 0 && labelCount > 0,
    };
  }, [normalizedSeries]);

  const options = useMemo(
    () => ({
      chart: {
        type: "heatmap",
        toolbar: { show: false },
        background: "transparent",
        parentHeightOffset: 0,
        redrawOnParentResize: true,
        redrawOnWindowResize: true,
        animations: {
          enabled: true,
          easing: "easeinout",
          speed: 240,
        },
      },
      dataLabels: { enabled: false },
      stroke: {
        width: 3,
        colors: [TILE_GAP_COLOR],
      },
      legend: { show: false },
      grid: {
        show: false,
        padding: {
          left: 10,
          right: 10,
          top: 6,
          bottom: 0,
        },
      },
      plotOptions: {
        heatmap: {
          shadeIntensity: 0,
          radius: 10,
          useFillColorAsStroke: false,
          colorScale: {
            min: 0,
            max: chartStats.maxValue,
            ranges: [
              { from: 0, to: 24, color: "#0a7403" },
              { from: 25, to: 60, color: "#56b456" },
              { from: 61, to: 105, color: "#b4e78a" },
              { from: 106, to: 160, color: "#fff100" },
              { from: 161, to: 205, color: "#ffb300" },
              { from: 206, to: chartStats.maxValue, color: "#ff1c12" },
            ],
          },
        },
      },
      states: {
        hover: {
          filter: {
            type: "lighten",
            value: 0.08,
          },
        },
        active: {
          filter: {
            type: "none",
          },
        },
      },
      xaxis: {
        type: "category",
        tooltip: { enabled: false },
        labels: {
          rotate: 0,
          hideOverlappingLabels: true,
          trim: false,
          style: {
            colors: Array(chartStats.labelCount).fill("#64748b"),
            fontSize: "11px",
            fontWeight: 500,
          },
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        reversed: false,
        labels: {
          style: {
            colors: ["#64748b"],
            fontSize: "12px",
            fontWeight: 500,
          },
        },
      },
      tooltip: {
        enabled: true,
        shared: false,
        intersect: false,
        followCursor: true,
        custom: ({ series, seriesIndex, dataPointIndex, w }) => {
          const dateLabel = w?.globals?.labels?.[dataPointIndex] ?? "";
          const hourLabel = normalizedSeries?.[seriesIndex]?.name ?? "";
          const rawValue = normalizedSeries?.[seriesIndex]?.data?.[dataPointIndex]?.y ?? null;
          const hasData = rawValue !== null && rawValue !== undefined;
          const value = hasData ? Number(rawValue) : null;

          return `
            <div style="pointer-events:none;min-width:210px;border-radius:16px;background:linear-gradient(180deg,#172554 0%,#0f172a 100%);color:#fff;padding:12px 14px;box-shadow:0 18px 40px rgba(15,23,42,0.28);border:1px solid rgba(255,255,255,0.1);">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
                <div style="font-size:13px;font-weight:700;line-height:1.2;">${dateLabel}</div>
                <div style="padding:3px 8px;border-radius:999px;background:rgba(255,255,255,0.12);font-size:11px;font-weight:700;">${formatTooltipHour(hourLabel)}</div>
              </div>
              <div style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.12);display:flex;align-items:end;justify-content:space-between;gap:12px;">
                <div style="font-size:11px;color:rgba(255,255,255,0.72);text-transform:uppercase;letter-spacing:0.08em;">Consumption</div>
                <div style="font-size:18px;font-weight:800;line-height:1;">
                  ${
                    hasData
                      ? `${value.toFixed(2)} <span style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.72);">kWh</span>`
                      : `<span style="font-size:15px;font-weight:700;color:rgba(255,255,255,0.82);">No Data</span>`
                  }
                </div>
              </div>
            </div>
          `;
        },
      },
    }),
    [chartStats.labelCount, chartStats.maxValue, normalizedSeries]
  );

  return (
    <div className="rounded-[28px] border border-slate-200/90 bg-[linear-gradient(180deg,#fffdfa_0%,#f8f4ec_100%)] p-4 shadow-[0_20px_50px_rgba(148,125,92,0.12)] md:p-5">
      <div className="flex flex-col gap-3 border-b border-[#ece3d4] pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9a7b58]">Heatmap View</div>
          <div className="mt-1 text-[18px] font-semibold text-slate-900">{title}</div>
          <div className="mt-1 text-sm text-slate-500">Rounded tiles, cleaner hover details, and a horizontal legend mapped to the live heat scale.</div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#e8dece] bg-white/85 px-3 py-1.5 text-xs font-medium text-slate-600">
            <span className="h-3 w-3 rounded-full bg-[#0a7403]" />
            Low
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#e8dece] bg-white/85 px-3 py-1.5 text-xs font-medium text-slate-600">
            <span className="h-3 w-3 rounded-full bg-[#fff100]" />
            Medium
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#e8dece] bg-white/85 px-3 py-1.5 text-xs font-medium text-slate-600">
            <span className="h-3 w-3 rounded-full bg-[#ff1c12]" />
            Peak
          </span>
        </div>
      </div>

      <div className="mt-4 rounded-[24px] border border-[#eadfce] bg-[linear-gradient(180deg,#f7f1e8_0%,#f3ecdf_100%)] p-3 shadow-inner md:p-4">
        <div className="rounded-[20px] border border-white/80 bg-white/90 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] md:p-4">
          <div className="mb-4 rounded-[18px] border border-[#ebe1d4] bg-[#fcfaf6] p-3">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#9a7b58]">Consumption Legend</div>
                <div className="mt-1 text-sm font-medium text-slate-700">Lower to higher hourly usage intensity</div>
              </div>
            </div>

            <div className="mt-3">
              <div className="h-4 w-full rounded-full bg-[linear-gradient(90deg,#0a7403_0%,#56b456_18%,#b4e78a_38%,#fff100_60%,#ffb300_80%,#ff1c12_100%)] shadow-inner" />
              <div className="mt-2 grid grid-cols-6 text-[11px] font-medium text-slate-500">
                <span className="text-left">Very Low</span>
                <span className="text-center">Low</span>
                <span className="text-center">Moderate</span>
                <span className="text-center">High</span>
                <span className="text-center">Very High</span>
                <span className="text-right">Peak</span>
              </div>
            </div>
          </div>

          <div className="heatmap-apex-card overflow-hidden rounded-[18px] bg-[radial-gradient(circle_at_top,#ffffff_0%,#f8fafc_100%)] px-1 py-2 md:px-2">
            <Chart options={options} series={normalizedSeries} type="heatmap" height={660} />
          </div>
        </div>
      </div>
    </div>
  );
}
