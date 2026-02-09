import React, { useEffect, useState, useRef } from "react";
import { FiUser, FiSettings, FiLogOut, FiBarChart2 } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import Chart from "react-apexcharts";
import { useDate } from "../context/DateContext";

const inRange = (hour, start, end) => {
  if (start <= end) return hour >= start && hour < end;
  return hour >= start || hour < end;
};

function tariffForIndustrial(hour) {
  if (inRange(hour, 6, 10) || inRange(hour, 18, 22)) {
    return { label: "Peak", rate: "7.8", colorClass: "text-red-800 bg-red-100" };
  }
  if (inRange(hour, 10, 15) || inRange(hour, 0, 6)) {
    return { label: "Off-Peak", rate: "5.55", colorClass: "text-green-800 bg-green-100" };
  }
  return { label: "Normal", rate: "6.3", colorClass: "text-yellow-800 bg-yellow-100" };
}

function Banner() {
  const profile = "Industrial"; 
  const now = new Date();
  const hour = now.getHours();
  const tariff = tariffForIndustrial(hour);

  const windowText = (() => {
    if (tariff.label === "Peak") return "06:00-10:00 & 18:00-22:00";
    if (tariff.label === "Off-Peak") return "00:00-06:00 & 10:00-15:00";
    return "15:00-18:00 & 22:00-24:00";
  })();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
          <div
            className={`flex-1 px-3 py-1.5 rounded-md font-semibold text-sm text-center
              ${tariff.colorClass}`}
            role="status"
            aria-live="polite"
          >
            ⚠ {tariff.label} Tariff Active ({windowText}) ₹{tariff.rate}/unit
          </div>
    </div>
  );
}

function AnalyticsButton() {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate("/analytics")}
      className="hidden sm:inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white border shadow-sm hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 hover:cursor-pointer text-sm"
      aria-label="Open analytics"
    >
      <FiBarChart2 className="text-lg" />
      <span className="text-xs font-medium">Analytics</span>
    </button>
  );
}

function ProfileButton() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handlePointerDown = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:4000/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen((p) => !p)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center active:scale-95 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 hover:cursor-pointer hover:outline-1"
        type="button"
      >
        <FiUser className="text-gray-700 text-xl" />
      </button>

      {open && (
        <div ref={menuRef} role="menu" className="absolute right-0 mt-2 w-56 sm:w-60 bg-white rounded-xl shadow-lg border p-2 z-50">
          <p className="px-3 py-2 text-sm font-medium text-gray-700">Hi, User</p>

          <div className="space-y-1">
            <button
              role="menuitem"
              onClick={() => {
                setOpen(false);
                navigate("/settings");
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:bg-gray-100"
              type="button"
            >
              <FiSettings className="text-lg" />
              Settings
            </button>

            <button
              role="menuitem"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 active:bg-red-50"
              type="button"
            >
              <FiLogOut className="text-lg" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SelectPeriodCard({ startDate, endDate, setStartDate, setEndDate }) {
  return (
    <div className="bg-white rounded-lg shadow p-3 space-y-3">
      <h3 className="font-semibold text-sm">Select Period</h3>

      <div className="flex gap-2">
        <div className="w-1/2">
          <label className="block text-xs text-gray-500 mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="w-1/2">
          <label className="block text-xs text-gray-500 mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
}

function LoadShiftCard({
  cardView,
  setCardView,
  shiftPercent,
  setShiftPercent,
  peakWindow,
  setPeakWindow,
  priceInput,
  setPriceInput,
  onShift,
  loading,
  setBookingOpen
}) {
  return (
    <div className="bg-white rounded-lg shadow p-3 space-y-3">
      <div className="flex justify-between items-center mb-1">
        <h3 className="font-semibold text-sm">Load Shift - Reduction</h3>
        <div className="flex bg-gray-100 rounded-lg border overflow-hidden text-xs">
          <button
            onClick={() => setCardView("percent")}
            className={`px-2 py-1 text-xs font-medium ${cardView === "percent" ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-blue-50"}`}
            type="button"
          >
            Percent
          </button>
          <button
            onClick={() => setCardView("price")}
            className={`px-2 py-1 text-xs font-medium ${cardView === "price" ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-blue-50"}`}
            type="button"
          >
            Price
          </button>
        </div>
      </div>

      {cardView === "percent" ? (
        <>
          <div>
            <div className="text-xs text-gray-500 mb-1">Shift Percentage:</div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>0%</span>
                <span className="font-medium text-sm">{shiftPercent}%</span>
                <span>100%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={shiftPercent}
                onChange={(e) => setShiftPercent(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>Min</span>
                <span>Max</span>
              </div>
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-500 mb-1">Peak Window :</div>
            <div className="flex bg-gray-100 rounded-lg border overflow-hidden text-xs">
              {["Morning", "Evening", "Both"].map((val) => (
                <button
                  key={val}
                  onClick={() => setPeakWindow(val)}
                  className={`flex-1 py-1 text-xs font-medium ${peakWindow === val ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-blue-50"}`}
                  type="button"
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <div className="text-xs text-gray-500">Potential Savings :</div>
              <div className="text-sm font-semibold">₹ 2,800 - 7,500</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Shifted (kWh):</div>
              <div className="text-sm font-semibold">0 kWh</div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div>
            <div className="text-xs text-gray-500 mb-1">Target Price (₹):</div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <span className="text-gray-500">₹</span>
              </div>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d*"
                value={priceInput}
                onChange={(e) => {
                  const digitsOnly = e.target.value.replace(/\D/g, "");
                  setPriceInput(digitsOnly);
                }}
                placeholder="0"
                className="w-full border rounded-lg pl-7 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <div className="text-xs text-gray-500">Shift By (%):</div>
              <div className="text-sm font-semibold text-blue-600">
                5% <span className="text-black">-</span> 10%
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Shift By (kWh):</div>
              <div className="text-sm font-semibold">0 kWh</div>
            </div>
          </div>
        </>
      )}

      <button
        onClick={onShift}
        className="w-full bg-purple-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition"
        type="button"
        aria-disabled={loading}
      >
        {loading ? "Shifting..." : "Shift"}
      </button>
      <button
  onClick={() => setBookingOpen(true)}
  className="w-full bg-white border border-purple-600 text-purple-600 py-2 rounded-lg text-sm font-semibold hover:bg-purple-50 transition"
  type="button"
>
  Book Your Savings
</button>

    </div>
  );
}

function GraphChart({ baselineData, actualData }) {
  const series = [
    { name: "Baseline Consumption", data: baselineData, color: "#13C4A9" },
    { name: "Actual Consumption", data: actualData, color: "#6A42B2" },
  ];

  const options = {
    chart: { type: "area", toolbar: { show: false }, zoom: { enabled: false }, animations: { enabled: true } },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 1.5 },
    fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.8, opacityTo: 0, stops: [0, 100] } },
    xaxis: {
      categories: Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0")),
      title: { text: "Hours", style: { fontWeight: 400 } },
      labels: { style: { fontWeight: 400 } },
    },
    yaxis: { title: { text: "Consumption (kWh)", style: { fontWeight: 400 } }, labels: { style: { fontWeight: 400 } } },

    annotations: {
      xaxis: [
        {
          x: "06",
          x2: "09",
          fillColor: "rgba(255, 99, 71, 0.12)",
          label: {
            text: "Morning Peak",
            style: { background: "#6A42B2", fontSize: "11px", color: "white", fontWeight: 500 },
            orientation: "horizontal",
            position: "bottom",
            offsetY: -3,
            textAnchor: "start",
          },
        },
        {
          x: "18",
          x2: "21",
          fillColor: "rgba(255, 99, 71, 0.12)",
          label: {
            text: "Evening Peak",
            style: { background: "#6A42B2", fontSize: "11px", color: "white", fontWeight: 500 },
            orientation: "horizontal",
            position: "bottom",
            offsetY: -3,
            textAnchor: "start",
          },
        },
      ],
    },

    tooltip: {
      x: {
        formatter: function (val) {
          const hour = parseInt(String(val), 10);
          if (Number.isNaN(hour)) return `${val}`;
          const t = tariffForIndustrial(hour);
          return `${val}:00 — ${t.label} ₹${t.rate}/unit`;
        },
      },
      y: {
        formatter: function (y) {
          if (y === undefined || y === null) return "";
          return `${y} kWh`;
        },
      },
    },

    legend: { show: true, position: "bottom", horizontalAlign: "center", fontSize: "12px", itemMargin: { horizontal: 10, vertical: 5 } },
    colors: ["#13C4A9", "#6A42B2"],
  };

  return (
    <div className="w-full bg-white rounded-lg shadow p-2 relative flex-1 min-h-0">
      <div className="absolute top-3 right-4 text-xs font-medium text-purple-700">⏳ 2 hours left to reduce</div>
      <div className="h-full min-h-0" style={{ height: "100%", minHeight: 0 }}>
        <Chart options={options} series={series} type="area" height="100%" />
      </div>
    </div>
  );
}

function GraphArea({startDate,
  endDate,
  setStartDate,
  setEndDate,
  mcData,
  mcLoading,
  baselineData,
  actualData,
  setActualData}) {
  const [cardView, setCardView] = useState("percent");
  const [shiftPercent, setShiftPercent] = useState(0);
  const [peakWindow, setPeakWindow] = useState(null);
  const [priceInput, setPriceInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingSubmitted, setBookingSubmitted] = useState(false);
  const [bookingDateTime, setBookingDateTime] = useState("");
  const [bookingShiftPercent, setBookingShiftPercent] = useState(shiftPercent);
  const [bookingWindow, setBookingWindow] = useState(peakWindow);



  
  

  async function handleShift() {
    if (!startDate || !endDate) return;
  
    try {
      setLoading(true);
  
      const windowMap = {
        Morning: "M",
        Evening: "E",
        Both: "B",
      };
  
      const windowParam = peakWindow ? windowMap[peakWindow] : "";
  
      const params = new URLSearchParams({
        startdate: startDate,
        enddate: endDate,
      });
  
      // 👇 View-specific params
      if (cardView === "percent") {
        params.append("per", shiftPercent.toString());
      }
  
      if (cardView === "price") {
        params.append("savings", priceInput || "0");
      }
  
      if (windowParam) {
        params.append("window", windowParam);
      }
  
      // 👇 Correct API selection
      const apiUrl =
        cardView === "percent"
          ? `http://localhost:4000/api/fetchActualConsPercent?${params.toString()}`
          : `http://localhost:4000/api/fetchActualConsPrice?${params.toString()}`;
  
      const res = await fetch(apiUrl, {
        credentials: "include",
      });
  
      if (!res.ok) {
        throw new Error(`API failed: ${res.status}`);
      }
  
      const json = await res.json();
  
      const hourly = Array(24).fill(0);
      (json.data || []).forEach((d) => {
        const hour = parseInt(d.hour.split(":")[0], 10);
        if (!Number.isNaN(hour)) {
          hourly[hour] = Number(d.consumption || 0);
        }
      });
  
      setActualData(hourly);
  
    } catch (err) {
      console.error("Simulation failed", err);
    } finally {
      setLoading(false);
    }
  }
  

  return (
    <div
      className="lg:flex w-full gap-4"
      style={{ height: "calc(100vh - 6.5rem)" }}
    >
      <div className="flex-1 space-y-2 flex flex-col min-h-0">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
  {mcLoading || !mcData ? (
    [...Array(4)].map((_, i) => (
      <div
        key={i}
        className="bg-white rounded-lg shadow p-3 h-16 animate-pulse"
      />
    ))
  ) : (
    [
      { label: "Energy Used", value: `${mcData.total_consumption_kwh} kWh` },
      { label: "Peak Hour Consumption", value: `${mcData.peak_consumption_kwh} kWh` },
      { label: "Peak Hour Cost", value: `₹ ${mcData.peak_cost}` },
      { label: "CO₂ Savings", value: `${mcData.co2_savings} kg` },
    ].map((item) => (
      <div
        key={item.label}
        className="bg-white rounded-lg shadow p-3 text-center h-16 flex flex-col justify-center"
      >
        <div className="text-xs text-gray-500">{item.label}</div>
        <div className="text-sm font-semibold">{item.value}</div>
      </div>
    ))
  )}
</div>


        <GraphChart baselineData={baselineData} actualData={actualData} />
      </div>

      <aside
        className="w-full lg:w-[28%] flex flex-col gap-2"
        style={{ maxHeight: "calc(100vh - 6.5rem)", overflow: "auto", paddingBottom: 8 }}
      >
        <SelectPeriodCard startDate={startDate} endDate={endDate} setStartDate={setStartDate} setEndDate={setEndDate} />

        <LoadShiftCard
          cardView={cardView}
          setCardView={setCardView}
          shiftPercent={shiftPercent}
          setShiftPercent={setShiftPercent}
          peakWindow={peakWindow}
          setPeakWindow={setPeakWindow}
          priceInput={priceInput}
          setPriceInput={setPriceInput}
          onShift={handleShift}
          loading={loading}
          setBookingOpen={setBookingOpen}

        />
      </aside>
      {bookingOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    {/* Backdrop */}
    <div
      className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      onClick={() => {
        setBookingOpen(false);
        setBookingSubmitted(false);
      }}
    />

    {/* Modal */}
    <div className="relative bg-white rounded-xl shadow-xl w-[90%] max-w-md p-5 z-10">
      <h3 className="text-lg font-semibold mb-4 text-center">
        Book Your Savings
      </h3>

      {!bookingSubmitted ? (
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1">
              Select Date & Time
            </label>
            <input
              type="datetime-local"
              value={bookingDateTime}
              onChange={(e) => setBookingDateTime(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">
              Shift Percentage
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={bookingShiftPercent}
              onChange={(e) => setBookingShiftPercent(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">
              Peak Window
            </label>
            <select
              value={bookingWindow || ""}
              onChange={(e) => setBookingWindow(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Select</option>
              <option value="Morning">Morning</option>
              <option value="Evening">Evening</option>
              <option value="Both">Both</option>
            </select>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-500">Estimated Savings</div>
            <div className="text-lg font-semibold text-purple-700">
              ₹ 6,500 / month
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setBookingOpen(false)}
              className="flex-1 border rounded-lg py-2 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => setBookingSubmitted(true)}
              className="flex-1 bg-purple-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-purple-700"
            >
              Submit
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-6 space-y-3">
          <div className="text-2xl">✅</div>
          <div className="text-sm font-semibold">
            Booking sent successfully!
          </div>
          <div className="text-xs text-gray-500">
            Our team will contact you shortly.
          </div>
          <button
            onClick={() => {
              setBookingOpen(false);
              setBookingSubmitted(false);
            }}
            className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm"
          >
            Done
          </button>
        </div>
      )}
    </div>
  </div>
)}

    </div>
  );
}

export default function Component() {
  const { startdate, enddate, setStartdate, setEnddate } = useDate();

  const [mcData, setMcData] = useState(null);
  const [mcLoading, setMcLoading] = useState(false);

  const [baselineData, setBaselineData] = useState(Array(24).fill(0));
  const [actualData, setActualData] = useState(Array(24).fill(0));

  useEffect(() => {
    async function fetchMiniCards() {
      try {
        setMcLoading(true);
  
        const res = await fetch(
          `http://localhost:4000/api/fetchMC?startdate=${startdate}&enddate=${enddate}`,
          { credentials: "include" }
        );
  
        if (!res.ok) throw new Error("Failed to fetch minicards");
  
        const json = await res.json();
        setMcData(json);
      } catch (err) {
        console.error("MiniCards fetch failed", err);
      } finally {
        setMcLoading(false);
      }
    }
  
    if (startdate && enddate) {
      fetchMiniCards();
    }
  }, [startdate, enddate]);

  useEffect(() => {
    async function fetchBaseline() {
      try {
    
        const res = await fetch(
          "http://localhost:4000/api/fetchLast30HourlyAvgCons",
          { credentials: "include" }
        );
    
        if (!res.ok) {
          throw new Error(`API failed: ${res.status}`);
        }
    
        const data = await res.json();
    
        if (!Array.isArray(data)) {
          throw new Error("Invalid API response format");
        }
    
        const hourly = Array(24).fill(0);
    
        data.forEach((d) => {
          const hour = parseInt(d.hour.split(":")[0], 10);
          hourly[hour] = Number(d.avg_consumption);
        });
    
        setBaselineData(hourly);
      } catch (err) {
        console.error("Baseline fetch failed:", err);
      }
    }
  
    fetchBaseline();
  }, []);

  useEffect(() => {
    async function fetchActual() {
      if (!startdate || !enddate) return;
  
      try {
        const res = await fetch(
          `http://localhost:4000/api/fetchhcons?startdate=${startdate}&enddate=${enddate}`,
          { credentials: "include" }
        );
  
        if (!res.ok) {
          throw new Error(`API failed: ${res.status}`);
        }
  
        const json = await res.json();
  
        const hourly = Array(24).fill(0);
  
        (json.data || []).forEach((d) => {
          const hour = parseInt(d.hour.split(":")[0], 10);
          if (!Number.isNaN(hour)) {
            hourly[hour] = Number(d.consumption);
          }
        });
  
        setActualData(hourly);
      } catch (err) {
        console.error("Actual fetch failed:", err);
      }
    }
  
    fetchActual();
  }, [startdate, enddate]);
  
  
  return (
    <div className="w-full p-4 space-y-4 h-screen box-border">
      <div className="flex items-center gap-4">
      <div className="flex items-center gap-3 shrink-0">
  <img
    src="/images/eelogo.webp"
    alt="Company Logo"
    className="h-9 w-auto object-contain"
  />

  <div className="leading-tight">
    <div className="text-sm font-semibold text-gray-900 whitespace-nowrap">
      M/s Larsen and Turbo Limited
    </div>
  </div>
</div>


        <div className="flex-1">
          <Banner />
        </div>
        <div className="flex items-center gap-2">
          <AnalyticsButton />
          <ProfileButton />
        </div>
      </div>
      <GraphArea startDate={startdate}
  endDate={enddate}
  setStartDate={setStartdate}
  setEndDate={setEnddate}
  mcData={mcData}
  mcLoading={mcLoading}
  baselineData={baselineData}
  actualData={actualData}
  setActualData={setActualData} />
    </div>
  );
}