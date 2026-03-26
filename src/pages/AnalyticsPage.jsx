import { useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Chart from "react-apexcharts";
import { FiArrowLeft } from "react-icons/fi";
import SingleDatePicker from "../components/SingleDatePicker";
import { addDays, fromDateKey, toDateKey } from "../lib/dateKey";
import { getAllConsumers } from "../lib/consumers";
import { seededNumber } from "../lib/seeded";
import { getTariffBand, getTariffRate, TARIFF_BANDS } from "../lib/tariffs";

const PAGE_BG = "#f3f4f6";
const CARD_BG = "#ffffff";
const PEAK_COLOR = "#f4827a";
const NORMAL_COLOR = "#f8b44e";
const OFFPEAK_COLOR = "#80c583";
const WEEKLY_BAR = "#6b5fe4";

function bandColor(label) {
  if (label === TARIFF_BANDS.PEAK) return PEAK_COLOR;
  if (label === TARIFF_BANDS.NORMAL) return NORMAL_COLOR;
  return OFFPEAK_COLOR;
}

function buildDays(startKey, endKey) {
  const startDate = fromDateKey(startKey);
  const endDate = fromDateKey(endKey);
  const days = [];
  for (let date = new Date(startDate); date <= endDate; date = addDays(date, 1)) {
    days.push(new Date(date));
  }
  return days;
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
      label="Start Date"
      value={value}
      maxKey={max}
      onApply={onApply}
      wrapperClassName="w-full sm:w-auto"
      triggerClassName="border border-gray-300 rounded-lg px-3 h-11 bg-gray-50 shadow-sm flex items-center justify-center"
      labelClassName="text-[10px] font-semibold tracking-wide text-gray-600 uppercase whitespace-nowrap"
      valueClassName="text-[13px] font-semibold tabular-nums text-gray-900 whitespace-nowrap"
      dialogTitle="Select Start Date"
      calendarColor="#2563eb"
    />
  );
}

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const { serviceNo: rawServiceNo } = useParams();
  const serviceNo = decodeURIComponent(rawServiceNo || "");
  const [searchParams] = useSearchParams();
  const consumers = useMemo(() => getAllConsumers(), []);
  const fallback = consumers.find((consumer) => consumer.serviceNo === serviceNo);
  const consumerName = searchParams.get("consumerName") || fallback?.consumerName || "Consumer";
  const category = searchParams.get("category") || fallback?.category || "--";
  const isCommercial = String(category).toUpperCase().includes("COMMERCIAL");
  const todayKey = useMemo(() => toDateKey(new Date()), []);
  const [startKey, setStartKey] = useState(() => toDateKey(addDays(new Date(), -6)));
  const [weeklyMonth, setWeeklyMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  });
  const endKey = todayKey;

  const analyticsSeed = `${serviceNo}|${category}|${startKey}|${endKey}`;
  const visibleDays = useMemo(() => buildDays(startKey, endKey), [startKey, endKey]);
  const last30Days = useMemo(() => Array.from({ length: 30 }, (_, index) => addDays(fromDateKey(todayKey), -(29 - index))), [todayKey]);

  const hourlyRows = useMemo(
    () =>
      Array.from({ length: 24 }, (_, hour) => {
        const tariff = getTariffBand(hour, isCommercial);
        const rate = getTariffRate(hour, isCommercial);
        const value =
          tariff === TARIFF_BANDS.PEAK
            ? seededNumber(`${analyticsSeed}|hour|${hour}`, 18, 48)
            : tariff === TARIFF_BANDS.NORMAL
              ? seededNumber(`${analyticsSeed}|hour|${hour}`, 8, 34)
              : seededNumber(`${analyticsSeed}|hour|${hour}`, 1, 32);

        return {
          hour,
          tariff,
          rate,
          kwh: Math.round(value * 100) / 100,
        };
      }),
    [analyticsSeed, isCommercial]
  );

  const totalConsumption = useMemo(
    () =>
      visibleDays.reduce(
        (sum, day) => sum + seededNumber(`${analyticsSeed}|daily-total|${toDateKey(day)}`, 520, 980),
        0
      ),
    [analyticsSeed, visibleDays]
  );

  const co2Emission = useMemo(() => totalConsumption * 0.1385, [totalConsumption]);
  const contractedDemand = fallback?.contractedDemand ?? (isCommercial ? 180 : 320);
  const peakDemand = useMemo(
    () => seededNumber(`${analyticsSeed}|peak-demand`, contractedDemand * 0.9, contractedDemand * 1.15),
    [analyticsSeed, contractedDemand]
  );
  const pfMin = useMemo(() => seededNumber(`${analyticsSeed}|pf-min`, 0.72, 0.84), [analyticsSeed]);
  const pfAvg = useMemo(() => seededNumber(`${analyticsSeed}|pf-avg`, 0.82, 0.97), [analyticsSeed]);

  const tariffSplit = useMemo(() => {
    const totals = {
      [TARIFF_BANDS.PEAK]: 0,
      [TARIFF_BANDS.NORMAL]: 0,
      [TARIFF_BANDS.OFF_PEAK]: 0,
    };

    hourlyRows.forEach((row) => {
      totals[row.tariff] += row.kwh;
    });

    return totals;
  }, [hourlyRows]);

  const weeklyData = useMemo(() => {
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const monthlySeed = `${serviceNo}|${category}|month|${weeklyMonth}`;
    return labels.map((label) => ({
      label,
      value: Math.round(seededNumber(`${monthlySeed}|weekly|${label}`, 140, 590)),
    }));
  }, [category, serviceNo, weeklyMonth]);

  const heatmapSeries = useMemo(
    () =>
      Array.from({ length: 24 }, (_, hour) => ({
        name: `${hour}:00`,
        data: last30Days.map((day) => ({
          x: day.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          y: Math.round(seededNumber(`${serviceNo}|${category}|heat|${toDateKey(day)}|${hour}`, 0, 100)),
        })),
      })),
    [category, last30Days, serviceNo]
  );

  const hourlyChart = useMemo(
    () => ({
      series: [
        {
          name: "Consumption (kWh)",
          data: hourlyRows.map((row) => row.kwh),
        },
      ],
      options: {
        chart: {
          type: "bar",
          toolbar: { show: false },
        },
        grid: { show: false },
        plotOptions: {
          bar: {
            distributed: true,
            columnWidth: "66%",
            borderRadius: 0,
          },
        },
        dataLabels: { enabled: false },
        xaxis: {
          categories: hourlyRows.map((row) => row.hour),
          title: { text: "Hour", style: { fontWeight: 400 } },
          axisBorder: { color: "#d8dee8" },
          axisTicks: { color: "#d8dee8" },
        },
        yaxis: {
          title: { text: "kWh", style: { fontWeight: 400 } },
          labels: {
            formatter: (value) => Number(value).toFixed(2),
          },
        },
        tooltip: {
          y: {
            formatter: (value, { dataPointIndex }) =>
              `${hourlyRows[dataPointIndex]?.tariff || ""} - Rs.${Number(hourlyRows[dataPointIndex]?.rate || 0).toFixed(1)}/unit - ${Number(value).toFixed(2)} kWh`,
          },
        },
        colors: hourlyRows.map((row) => bandColor(row.tariff)),
        legend: { show: false },
      },
    }),
    [hourlyRows]
  );

  const tariffSplitChart = useMemo(() => {
    const labels = Object.keys(tariffSplit);
    return {
      series: labels.map((label) => Math.round(tariffSplit[label] * 100) / 100),
      options: {
        chart: { type: "donut", toolbar: { show: false } },
        labels,
        dataLabels: { enabled: false },
        legend: { position: "bottom" },
        stroke: { colors: ["#ffffff"], width: 2 },
        colors: labels.map((label) => bandColor(label)),
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
        chart: { type: "bar", toolbar: { show: false } },
        plotOptions: {
          bar: {
            horizontal: true,
            barHeight: "74%",
            borderRadius: 0,
          },
        },
        dataLabels: { enabled: false },
        grid: { show: false },
        colors: [WEEKLY_BAR],
        xaxis: {
          title: { text: "kWh", style: { fontWeight: 400 } },
        },
        yaxis: {
          categories: weeklyData.map((item) => item.label),
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

  const statsQuery = searchParams.toString();
  const statsHref = `/stats/${encodeURIComponent(serviceNo)}${statsQuery ? `?${statsQuery}` : ""}`;

  return (
    <div className="min-h-full" style={{ background: PAGE_BG }}>
      <div className="space-y-2.5">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(statsHref)}
              className="w-11 h-11 rounded-lg border border-gray-300 bg-gray-50 flex items-center justify-center shadow-sm hover:bg-white"
              aria-label="Back to stats"
            >
              <FiArrowLeft className="text-lg" />
            </button>
            {topMetricCard("Total Consumption (kWh)", totalConsumption.toFixed(2))}
            {topMetricCard("CO2 Emission", co2Emission.toFixed(2), "kg")}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <AnalyticsDatePicker value={startKey} max={todayKey} onApply={setStartKey} />
            <button
              type="button"
              className="h-11 px-4 rounded-lg bg-[#2563eb] text-sm font-semibold text-white shadow-sm hover:bg-[#1d4ed8]"
            >
              Performance Report
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
            <div className="text-sm font-semibold text-gray-900">Hourly Consumption (Tariff Based)</div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setStartKey(toDateKey(addDays(new Date(), -6)));
                }}
                className="px-3 py-1 text-xs rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-100"
              >
                Last 7 Days
              </button>
              <button
                type="button"
                onClick={() => {
                  setStartKey(toDateKey(addDays(new Date(), -29)));
                }}
                className="px-3 py-1 text-xs rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-100"
              >
                Last 30 Days
              </button>
            </div>
          </div>

          <Chart options={hourlyChart.options} series={hourlyChart.series} type="bar" height={340} />

          <div className="flex justify-center gap-6 text-xs mt-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ background: PEAK_COLOR }} />
              Peak
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ background: NORMAL_COLOR }} />
              Normal
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ background: OFFPEAK_COLOR }} />
              Off-Peak
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[0.78fr_1.05fr_1.35fr] gap-3">
          <div className="space-y-3">
            <div className="bg-white rounded-lg shadow p-3 text-center">
              <div className="text-xs text-gray-500">Power Factor (Min)</div>
              <div className="text-[17px] font-semibold text-[#ff2c2c] mt-1">{pfMin.toFixed(2)}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-3 text-center">
              <div className="text-xs text-gray-500">Power Factor (Avg)</div>
              <div className="text-[17px] font-semibold text-[#0a9b2d] mt-1">{pfAvg.toFixed(2)}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-3 text-center">
              <div className="text-xs text-gray-500">Contracted Demand</div>
              <div className="text-[17px] font-semibold text-[#1e5bff] mt-1">
                {contractedDemand}
                <span className="text-gray-400 text-[13px] ml-1">kVA</span>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-3 text-center">
              <div className="text-xs text-gray-500">Peak Demand</div>
              <div className="text-[17px] font-semibold text-[#ff6a00] mt-1">
                {peakDemand.toFixed(2)}
                <span className="text-gray-400 text-[13px] ml-1">kVA</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-3">
            <div className="text-center text-sm font-semibold text-gray-900 mb-1">Tariff Split (kWh)</div>
            <Chart options={tariffSplitChart.options} series={tariffSplitChart.series} type="donut" height={290} />
          </div>

          <div className="bg-white rounded-lg shadow p-3">
            <div className="flex items-center justify-between mb-2 gap-3">
              <div className="text-sm font-semibold text-gray-900">Day-wise Monthly Consumption</div>
              <label className="h-9 px-3 rounded-lg border border-gray-300 bg-white flex items-center">
                <input
                  type="month"
                  value={weeklyMonth}
                  onChange={(e) => setWeeklyMonth(e.target.value)}
                  className="w-full bg-transparent outline-none text-sm text-gray-600"
                />
              </label>
            </div>
            <Chart options={weeklyChart.options} series={weeklyChart.series} type="bar" height={320} />
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
