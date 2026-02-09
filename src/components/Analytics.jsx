import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiDownload } from "react-icons/fi";
import Chart from "react-apexcharts";
import { useDate } from "../context/DateContext";


const PEAK_COLOR = "#F77B72";
const NORMAL_COLOR = "#FFB74C";
const OFFPEAK_COLOR = "#81C784";

const getTariffByHour = (h) => {
  if ([6, 7, 8, 9, 18, 19, 20, 21].includes(h)) return "Peak";
  if ([10, 11, 12, 13, 14].includes(h)) return "Off-Peak";
  if ([15, 16, 17, 22, 23].includes(h)) return "Normal";
  return "Off-Peak";
};

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function Analytics() {
  const navigate = useNavigate();
  const [quickRange, setQuickRange] = useState(null); 
  const { startdate, enddate, setStartdate, setEnddate } = useDate();
  const [weeklyMonth, setWeeklyMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [hourlyData, setHourlyData] = useState([]);
  const [hourlyLoading, setHourlyLoading] = useState(false);
  const [weeklyData, setWeeklyData] = useState([]);
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [tariffSplit, setTariffSplit] = useState(null);
  const [tariffLoading, setTariffLoading] = useState(false);





  const handleDownload = () => {
    console.log("Download clicked", { startDate, endDate });
  };

  const applyQuickRange = (days) => {
    const end = new Date();
    const start = new Date();
  
    start.setDate(end.getDate() - (days - 1));
  
    const format = (d) => d.toISOString().split("T")[0];
  
    setStartdate(format(start));
    setEnddate(format(end));
  
    setQuickRange(days === 7 ? "7d" : "30d");
  };
  
  const hourlyBar = useMemo(() => ({
    series: [
      {
        name: "Consumption (kWh)",
        data: hourlyData.map((d) => d.kwh),
      },
    ],
    options: {
      chart: {
        type: "bar",
        height: 260,
        toolbar: { show: false },
      },
      grid: { show: false },
      dataLabels: { enabled: false },
      plotOptions: {
        bar: {
          distributed: true,
          columnWidth: "65%",
        },
      },
      xaxis: {
        categories: hourlyData.map((d) => d.hour),
        title: {
          text: "Hour",
          style: { fontWeight: 400 },
        },
      },
      yaxis: {
        title: {
          text: "kWh",
          style: { fontWeight: 400 },
        },
      },
      colors: hourlyData.map((d) =>
        d.tariff === "Peak"
          ? PEAK_COLOR
          : d.tariff === "Normal"
          ? NORMAL_COLOR
          : OFFPEAK_COLOR
      ),
      legend: { show: false },
    },
  }), [hourlyData]);

  useEffect(() => {
    if (!weeklyMonth) return;
  
    const [year, month] = weeklyMonth.split("-");
  
    const fetchWeeklyConsumption = async () => {
      try {
        setWeeklyLoading(true);
  
        const res = await fetch(
          `http://localhost:4000/api/fetchMDaywiseCons?month=${month}&year=${year}`,
          { credentials: "include" }
        );
  
        const json = await res.json();
  
        
        const formatted = json.data.map((d) => ({
          day: d.day,
          value: Number(d.avg_consumption),
        }));
  
        setWeeklyData(formatted);
      } catch (err) {
        console.error("Failed to fetch weekly consumption", err);
      } finally {
        setWeeklyLoading(false);
      }
    };
  
    fetchWeeklyConsumption();
  }, [weeklyMonth]);
  
  
  const doughnut = useMemo(() => {
    if (!tariffSplit) {
      return {
        series: [0, 0, 0],
        options: {
          chart: { type: "donut", height: 220 },
          labels: ["Peak", "Normal", "Off-Peak"],
          colors: [PEAK_COLOR, NORMAL_COLOR, OFFPEAK_COLOR],
          legend: { position: "bottom" },
          dataLabels: { enabled: false },
        },
      };
    }
  
    return {
      series: [
        tariffSplit.peak,
        tariffSplit.normal,
        tariffSplit.offpeak,
      ],
      options: {
        chart: { type: "donut", height: 220 },
        labels: ["Peak", "Normal", "Off-Peak"],
        colors: [PEAK_COLOR, NORMAL_COLOR, OFFPEAK_COLOR],
        legend: { position: "bottom" },
        dataLabels: { enabled: false },
      },
    };
  }, [tariffSplit]);
  

  const weeklySideBar = useMemo(() => ({
    series: [
      {
        name: "Consumption (kWh)",
        data: WEEK_DAYS.map((day) => {
          const match = weeklyData.find((d) => d.day === day);
          return {
            x: day,
            y: match ? match.value : 0,
          };
        }),
      },
    ],
    options: {
      chart: {
        type: "bar",
        height: 240,
        toolbar: { show: false },
      },
      grid: { show: false },
      dataLabels: { enabled: false },
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: "75%",
        },
      },
      xaxis: {
        title: {
          text: "kWh",
          style: { fontWeight: 400 },
        },
      },
      colors: ["#4F46E5"],
    },
  }), [weeklyData]);
  

  useEffect(() => {
    if (!startdate || !enddate) return;
  
    const fetchHourlyConsumption = async () => {
      try {
        setHourlyLoading(true);
  
        const res = await fetch(
          `http://localhost:4000/api/fetchhcons?startdate=${startdate}&enddate=${enddate}`,
          { credentials: "include" }
        );
  
        const json = await res.json();
  
        const formatted = json.data.map((d) => {
          const hourNum = Number(d.hour.split(":")[0]);
  
          return {
            hour: hourNum,
            kwh: Number(d.consumption),
            tariff: getTariffByHour(hourNum),
          };
        });
  
        setHourlyData(formatted);
      } catch (err) {
        console.error("Failed to fetch hourly consumption", err);
      } finally {
        setHourlyLoading(false);
      }
    };
  
    fetchHourlyConsumption();
  }, [startdate, enddate]);

  useEffect(() => {
    if (!startdate || !enddate) return;
  
    const fetchTariffSplit = async () => {
      try {
        setTariffLoading(true);
  
        const res = await fetch(
          `http://localhost:4000/api/fetchTariffBasedConsumption?startdate=${startdate}&enddate=${enddate}`,
          { credentials: "include" }
        );
  
        if (!res.ok) {
          throw new Error(`Tariff API failed: ${res.status}`);
        }
  
        const json = await res.json();
  
        setTariffSplit({
          peak: json.peak_kwh,
          normal: json.normal_kwh,
          offpeak: json.offpeak_kwh,
        });
      } catch (err) {
        console.error("Failed to fetch tariff split", err);
      } finally {
        setTariffLoading(false);
      }
    };
  
    fetchTariffSplit();
  }, [startdate, enddate]);
  
  
  

  return (
    <div className="h-screen w-full bg-gray-50 flex flex-col overflow-hidden">
      <div className="flex justify-between items-center p-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-md bg-white shadow"
        >
          <FiArrowLeft />
        </button>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600 whitespace-nowrap">
              Start Date
            </label>
            <input
  type="date"
  value={startdate}
  onChange={(e) => {
    setStartdate(e.target.value);
    setQuickRange(null);
  }}
  className="border rounded px-2 py-1 text-sm"
/>

          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600 whitespace-nowrap">
              End Date
            </label>
            <input
  type="date"
  value={enddate}
  onChange={(e) => {
    setEnddate(e.target.value);
    setQuickRange(null);
  }}
  className="border rounded px-2 py-1 text-sm"
/>

          </div>

          <button
            onClick={handleDownload}
            className="p-2 rounded-md bg-green-500 shadow hover:bg-green-600 hover:cursor-pointer"
            title="Download data"
          >
            <FiDownload className="text-white" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-3 pb-3">
        <div className="bg-white p-3 rounded-lg shadow mb-4">
        <div className="flex justify-between items-center mb-2">
  <h2 className="text-sm font-semibold">
    Hourly Consumption (Tariff Based)
  </h2>

  <div className="flex gap-2">
    <button
      onClick={() => applyQuickRange(7)}
      className={`px-3 py-1 text-xs rounded border transition
        ${quickRange === "7d"
          ? "bg-indigo-600 text-white border-indigo-600"
          : "bg-white text-gray-600 hover:bg-gray-100"
        }`}
    >
      Last 7 Days
    </button>

    <button
      onClick={() => applyQuickRange(30)}
      className={`px-3 py-1 text-xs rounded border transition
        ${quickRange === "30d"
          ? "bg-indigo-600 text-white border-indigo-600"
          : "bg-white text-gray-600 hover:bg-gray-100"
        }`}
    >
      Last 30 Days
    </button>
  </div>
</div>


          <Chart
            options={hourlyBar.options}
            series={hourlyBar.series}
            type="bar"
            height={260}
          />

          <div className="flex justify-center gap-6 text-xs mt-2">
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full" style={{ background: PEAK_COLOR }} />
              Peak
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full" style={{ background: NORMAL_COLOR }} />
              Normal
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full" style={{ background: OFFPEAK_COLOR }} />
              Off-Peak
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-3 flex flex-col gap-4">
            <div className="bg-white p-3 rounded-lg shadow text-center">
              <p className="text-xs text-gray-500">Power Factor (Min)</p>
              <p className="text-2xl font-semibold text-red-500">0.82</p>
            </div>

            <div className="bg-white p-3 rounded-lg shadow text-center">
              <p className="text-xs text-gray-500">Power Factor (Avg)</p>
              <p className="text-2xl font-semibold text-green-600">0.94</p>
            </div>

            <div className="bg-white p-3 rounded-lg shadow text-center">
              <p className="text-xs text-gray-500">Contracted Demand</p>
              <p className="text-2xl font-semibold text-blue-600">
                250 <span className="text-sm font-medium text-gray-400">kVA</span>
              </p>
            </div>

            <div className="bg-white p-3 rounded-lg shadow text-center">
              <p className="text-xs text-gray-500">Peak Demand</p>
              <p className="text-2xl font-semibold text-orange-500">
                312 <span className="text-sm font-medium text-gray-400">kVA</span>
              </p>
            </div>
          </div>

          <div className="col-span-12 md:col-span-4 bg-white p-3 rounded-lg shadow">
            <h2 className="text-sm font-semibold mb-2 text-center">
              Tariff Split (kWh)
            </h2>
            <Chart
              options={doughnut.options}
              series={doughnut.series}
              type="donut"
              height={220}
            />
          </div>

          <div className="col-span-12 md:col-span-5 bg-white p-3 rounded-lg shadow">
          <div className="flex justify-between items-center mb-2">
  <h2 className="text-sm font-semibold">
    Weekly Consumption (Mon – Sun)
  </h2>

  <input
    type="month"
    value={weeklyMonth}
    onChange={(e) => setWeeklyMonth(e.target.value)}
    className="border rounded px-2 py-1 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
  />
</div>

            <Chart
              options={weeklySideBar.options}
              series={weeklySideBar.series}
              type="bar"
              height={270}
            />
          </div>
        </div>
      </div>
    </div>
  );
}