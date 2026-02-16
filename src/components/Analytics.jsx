import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiDownload } from "react-icons/fi";
import Chart from "react-apexcharts";
import { useDate } from "../context/DateContext";
import ConsumerHeatMap from "./ConsumerHeatMap";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { DateRange } from "react-date-range";
import { format } from "date-fns";


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
  const [weeklyMonth, setWeeklyMonth] = useState("2025-12");

  const [hourlyData, setHourlyData] = useState([]);
  const [hourlyLoading, setHourlyLoading] = useState(false);
  const [weeklyData, setWeeklyData] = useState([]);
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [tariffSplit, setTariffSplit] = useState(null);
  const [tariffLoading, setTariffLoading] = useState(false);
  const [hourlyRange, setHourlyRange] = useState(null);
  const [mcaData, setMcaData] = useState(null);
  const [mcaLoading, setMcaLoading] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);

  const selectionRange = {
  startDate: startdate ? new Date(startdate) : new Date(),
  endDate: enddate ? new Date(enddate) : new Date(),
  key: "selection",
};

const handleDateSelect = (ranges) => {
  const { startDate, endDate } = ranges.selection;
  setStartdate(format(startDate, "yyyy-MM-dd"));
  setEnddate(format(endDate, "yyyy-MM-dd"));
  setQuickRange(null);
};




  const handleDownload = () => {
    console.log("Download clicked", { startDate, endDate });
  };

  const applyQuickRange = (days) => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (days - 1));

  const format = (d) => d.toISOString().split("T")[0];

  const newRange = {
    start: format(start),
    end: format(end),
  };

  setHourlyRange(newRange);
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
          `/api/fetchMDaywiseCons?month=${month}&year=${year}`,
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

  const activeHourlyStart = hourlyRange?.start || startdate;
  const activeHourlyEnd = hourlyRange?.end || enddate;

  

  useEffect(() => {
  if (!activeHourlyStart || !activeHourlyEnd) return;

  const fetchHourlyConsumption = async () => {
    try {
      setHourlyLoading(true);

      const res = await fetch(
        `/api/fetchhcons?startdate=${activeHourlyStart}&enddate=${activeHourlyEnd}`,
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
}, [activeHourlyStart, activeHourlyEnd]);



  useEffect(() => {
    if (!startdate || !enddate) return;
  
    const fetchTariffSplit = async () => {
      try {
        setTariffLoading(true);
  
        const res = await fetch(
          `/api/fetchTariffBasedConsumption?startdate=${startdate}&enddate=${enddate}`,
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
  
 
useEffect(() => {
  if (!startdate || !enddate) return;

  const fetchMCA = async () => {
    try {
      setMcaLoading(true);

      const res = await fetch(
        `/api/fetchMCA?startdate=${startdate}&enddate=${enddate}`,
        { credentials: "include" }
      );

      if (!res.ok) {
        throw new Error(`MCA API failed: ${res.status}`);
      }

      const json = await res.json();

      setMcaData(json);
    } catch (err) {
      console.error("Failed to fetch MCA data", err);
    } finally {
      setMcaLoading(false);
    }
  };

  fetchMCA();
}, [startdate, enddate]);

 
  

  return (
    <div className="h-screen w-full bg-gray-50 flex flex-col overflow-y-auto">
      <div className="flex justify-between items-center p-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-md bg-white shadow"
        >
          <FiArrowLeft />
        </button>

        <div className="flex items-center gap-4">

  {/* Date Picker Trigger */}
  <div
    onClick={() => setDateOpen(true)}
    className="grid grid-cols-2 gap-2 cursor-pointer"
  >
    <div className="border rounded-lg px-3 py-2 text-sm bg-white shadow-sm hover:bg-gray-50 transition">
      <div className="text-xs text-gray-500">Start Date</div>
      <div className="font-medium">
        {startdate}
      </div>
    </div>

    <div className="border rounded-lg px-3 py-2 text-sm bg-white shadow-sm hover:bg-gray-50 transition">
      <div className="text-xs text-gray-500">End Date</div>
      <div className="font-medium">
        {enddate}
      </div>
    </div>
  </div>

  <button
    onClick={handleDownload}
    className="p-2 rounded-md bg-green-500 shadow hover:bg-green-600"
    title="Download data"
  >
    <FiDownload className="text-white" />
  </button>
</div>

      </div>
     
      {dateOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center">

    {/* Backdrop */}
    <div
      className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      onClick={() => setDateOpen(false)}
    />

    {/* Modal */}
    <div className="relative bg-white rounded-2xl shadow-2xl w-[95%] max-w-4xl p-5 z-10">

      <h3 className="text-lg font-semibold mb-4 text-center">
        Select Date Range
      </h3>

      <div className="flex justify-center">
        <DateRange
          ranges={[selectionRange]}
          onChange={handleDateSelect}
          months={2}
          direction="horizontal"
          showSelectionPreview
          moveRangeOnFirstSelection={false}
          rangeColors={["#4F46E5"]}
        />
      </div>

      <div className="flex justify-end mt-6">
        <button
  onClick={() => {
    setDateOpen(false);
    setHourlyRange(null); // reset quick range when global date used
  }}
  className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700"
>
  Apply
</button>

      </div>

    </div>
  </div>
)}


      <div className="flex-1 overflow-y-auto px-3 pb-3">
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
              <p className="text-2xl font-semibold text-red-500">
  0.76
</p>

            </div>

            <div className="bg-white p-3 rounded-lg shadow text-center">
              <p className="text-xs text-gray-500">Power Factor (Avg)</p>
              <p className="text-2xl font-semibold text-green-600">0.82</p>

            </div>

            <div className="bg-white p-3 rounded-lg shadow text-center">
              <p className="text-xs text-gray-500">Contracted Demand</p>
              <p className="text-2xl font-semibold text-blue-600">
  260
  <span className="text-sm font-medium text-gray-400"> kVA</span>
</p>

            </div>

            <div className="bg-white p-3 rounded-lg shadow text-center">
              <p className="text-xs text-gray-500">Peak Demand</p>
              <p className="text-2xl font-semibold text-orange-500">
  43.72
  <span className="text-sm font-medium text-gray-400"> kVA</span>
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
    Day-wise Monthly Consumption (Mon – Sun)
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
 
        <div className="mt-6">
  <ConsumerHeatMap/>
</div>

      </div>
    </div>
  );
}
