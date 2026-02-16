import React, { useState, useRef, useEffect } from "react";
import { format, addDays, subDays, differenceInCalendarDays } from "date-fns";

export default function ConsumerHeatMap() {
  /* -------------------- Local Date State -------------------- */
  const [selectedDate, setSelectedDate] = useState("2025-12-30");

  const endDate = new Date(selectedDate);
  const windowStart = subDays(endDate, 29);
  const windowEnd = endDate;

  const numDays = differenceInCalendarDays(windowEnd, windowStart) + 1;
  const numHours = 24;

  /* -------------------- Refs -------------------- */
  const containerRef = useRef(null);
  const heatmapRef = useRef(null);

  /* -------------------- State -------------------- */
  const [data, setData] = useState(
    Array.from({ length: numHours }, () =>
      Array.from({ length: numDays }, () => 0)
    )
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [tooltipData, setTooltipData] = useState(null);

  const [screenSize, setScreenSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  /* -------------------- Resize Handling -------------------- */
  useEffect(() => {
    const updateLayout = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    updateLayout();
    window.addEventListener("resize", updateLayout);
    return () => window.removeEventListener("resize", updateLayout);
  }, []);

  /* -------------------- Colors -------------------- */
  const colorValues = [
    "#066A06", "#298F35", "#4DB458", "#6AC96A", "#8EDC7F", "#B1EF98",
    "#BBF558", "#DAEF2A", "#F9E900", "#FFF400", "#FFE300", "#FFC200",
    "#FFA100", "#FF8100", "#FF5F00", "#FF3F00", "#FF1000"
  ];

  /* -------------------- Cell Sizing -------------------- */
  const minCellWidth = 20;
  const maxCellWidth = 48;

  const cellWidth =
    containerWidth && Math.floor((containerWidth - 40) / numDays) >= minCellWidth
      ? Math.min(
          maxCellWidth,
          Math.floor(Math.max(minCellWidth, (containerWidth - 40) / numDays))
        )
      : minCellWidth;

  const cellHeight = 20;

  /* -------------------- Tooltip Helpers -------------------- */
  const tooltipWidth = 180;
  const tooltipHeight = 72;
  const tooltipMargin = 8;

  const computeTooltipPosition = (x, y) => {
    const top = Math.max(
      tooltipMargin,
      Math.min(y + 12, screenSize.height - tooltipHeight - tooltipMargin)
    );
    const left = Math.max(
      tooltipMargin,
      Math.min(x + 12, screenSize.width - tooltipWidth - tooltipMargin)
    );
    return { top, left };
  };

  useEffect(() => {
  let isActive = true;
  const controller = new AbortController();

  const fetchHeatMapData = async () => {
    setLoading(true);
    setError(null);

    try {
      const resp = await fetch(
        `/api/fetchHMHourlyConsumption?date=${selectedDate}`,
        {
          credentials: "include",
          signal: controller.signal
        }
      );

      if (!resp.ok) {
        throw new Error(`API failed: ${resp.status}`);
      }

      const json = await resp.json();

      /* -------------------- BUILD MAP -------------------- */
      // json format:
      // { "2026-02-01 00:00:00": 1.2, ... }

      const map = {};
      for (const key in json) {
        const [datePart, timePart] = key.split(" ");
        const hour = Number(timePart.split(":")[0]);

        if (!map[datePart]) map[datePart] = {};
        map[datePart][hour] = Number(json[key]);
      }

      /* -------------------- DAY × HOUR MATRIX -------------------- */
      const daysMatrix = Array.from({ length: numDays }, (_, d) => {
        const dateKey = format(addDays(windowStart, d), "yyyy-MM-dd");
        return Array.from({ length: numHours }, (_, h) =>
          map[dateKey]?.[h] ?? 0
        );
      });

      /* -------------------- TRANSPOSE → HOUR × DAY -------------------- */
      const transposed = Array.from({ length: numHours }, (_, h) =>
        Array.from({ length: numDays }, (_, d) => daysMatrix[d][h])
      );

      if (isActive) {
        setData(transposed);
      }
    } catch (err) {
      if (isActive && err.name !== "AbortError") {
        setError(err.message);
      }
    } finally {
      if (isActive) setLoading(false);
    }
  };

  fetchHeatMapData();

  return () => {
    isActive = false;
    controller.abort();
  };
}, [selectedDate]);



  /* -------------------- Scale -------------------- */
  const values = data.flat();
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);

  const getColor = (v) => {
    if (maxVal === minVal) return colorValues[Math.floor(colorValues.length / 2)];
    const ratio = (v - minVal) / (maxVal - minVal);
    const idx = Math.min(
      colorValues.length - 1,
      Math.max(0, Math.round(ratio * (colorValues.length - 1)))
    );
    return colorValues[idx];
  };

  /* -------------------- Tooltip Handlers -------------------- */
  const showTooltip = (e, v, h, d) => {
    setTooltipData({
      value: v,
      hour: `${h}:00`,
      date: format(addDays(windowStart, d), "MMM d, yyyy"),
      x: e.clientX,
      y: e.clientY
    });
  };

  /* -------------------- Render -------------------- */
  return (
    <div ref={containerRef} className="bg-white p-3 rounded-lg shadow">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-sm font-semibold text-gray-800">
          Hourly Consumption Heat Map (Last 30 Days)
        </h2>

        <input
          type="date"
          value={selectedDate}
          max={format(new Date(), "yyyy-MM-dd")}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border rounded px-2 py-1 text-xs text-gray-600
                     focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {loading && <p className="text-xs text-gray-500">Loading…</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex">
        {/* Hour Labels */}
        <div className="flex flex-col text-xs text-gray-600 mr-1">
          {Array.from({ length: numHours }).map((_, h) => (
            <div key={h} style={{ height: cellHeight }}>
              {h}:00
            </div>
          ))}
        </div>

        {/* Heatmap */}
        <div className="overflow-x-auto">
          {data.map((row, h) => (
            <div key={h} className="flex">
              {row.map((v, d) => (
                <div
                  key={`${h}-${d}`}
                  onMouseEnter={(e) => showTooltip(e, v, h, d)}
                  onMouseMove={(e) =>
                    setTooltipData((t) =>
                      t ? { ...t, x: e.clientX, y: e.clientY } : t
                    )
                  }
                  onMouseLeave={() => setTooltipData(null)}
                  style={{
                    width: cellWidth,
                    height: cellHeight,
                    backgroundColor: getColor(v)
                  }}
                />
              ))}
            </div>
          ))}

          {/* Date Labels */}
          <div className="flex mt-2">
            {Array.from({ length: numDays }).map((_, d) => (
              <div
                key={d}
                style={{ width: cellWidth }}
                className="text-[10px] text-gray-600 text-center"
              >
                {format(addDays(windowStart, d), "MMM d")}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltipData && (() => {
        const { top, left } = computeTooltipPosition(
          tooltipData.x,
          tooltipData.y
        );
        return (
          <div
            className="fixed z-50 bg-black text-white text-xs rounded px-2 py-1"
            style={{ top, left, width: 180 }}
          >
            <div className="font-semibold">{tooltipData.date}</div>
            <div>Hour: {tooltipData.hour}</div>
            <div>Consumption: {tooltipData.value} kWh</div>
          </div>
        );
      })()}
    </div>
  );
}
