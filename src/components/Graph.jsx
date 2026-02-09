import { useEffect, useState } from "react";
import { useDate } from "../context/DateContext";
import Chart from "react-apexcharts";

export default function Graph() {
  const [shiftPercent, setShiftPercent] = useState(10);
  const [peakWindow, setPeakWindow] = useState(null);
  const [cardView, setCardView] = useState("percent"); 
  const [priceInput, setPriceInput] = useState("");
  const { startdate, enddate, setStartdate, setEnddate } = useDate();


  

  const [baselineData, setBaselineData] = useState([]);


  const [actualData, setActualData] = useState([]);
  const [loading, setLoading] = useState(false);



  const series = [
    {
      name: "Baseline Consumption",
      data: baselineData,
      color: "#13C4A9",
    },
    {
      name: "Actual Consumption",
      data: actualData,
      color: "#6A42B2",
    },
  ];

  const options = {
    chart: {
      type: "area",
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 1.5 },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.8,
        opacityTo: 0,
        stops: [0, 100],
      },
    },
    xaxis: {
      categories: Array.from({ length: 24 }, (_, i) =>
        i.toString().padStart(2, "0")
      ),
      title: { text: "Hours", style: { fontWeight: 400 } },
      labels: { style: { fontWeight: 400 } },
    },
    yaxis: {
      title: { text: "Consumption (kWh)", style: { fontWeight: 400 } },
      labels: { style: { fontWeight: 400 } },
    },
    annotations: {
      xaxis: [
        {
          x: "06",
          x2: "10",
          fillColor: "rgba(255, 99, 71, 0.15)",
          label: {
            text: "Morning Peak - ₹7.8/kWh",
            style: {
              background: "#6A42B2",
              fontSize: "11px",
              color: "white",
              fontWeight: 500,
            },
            orientation: "horizontal",
            position: "bottom",
            offsetY: -3,
            textAnchor: "start",
          },
        },
        {
          x: "18",
          x2: "22",
          fillColor: "rgba(255, 99, 71, 0.15)",
          label: {
            text: "Evening Peak - ₹7.8/kWh",
            style: {
              background: "#6A42B2",
              fontSize: "11px",
              color: "white",
              fontWeight: 500,
            },
            orientation: "horizontal",
            position: "bottom",
            offsetY: -3,
            textAnchor: "start",
          },
        },
      ],
    },
    legend: {
      show: true,
      position: "bottom",
      horizontalAlign: "center",
      fontSize: "12px",
      fontFamily: "inherit",
      itemMargin: { horizontal: 10, vertical: 5 },
    },
    colors: ["#13C4A9", "#6A42B2"],
  };


  useEffect(() => {
    async function fetchBaseline() {
      try {
        setLoading(true);
    
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
      } finally {
        setLoading(false);
      }
    }
    
  
    fetchBaseline();
  }, []);
  
  async function handleSimulate() {
    try {
      setLoading(true);
  
      const windowMap = {
        Morning: "M",
        Evening: "E",
        Both: "B",
      };
  
      const windowParam = peakWindow ? windowMap[peakWindow] : "";
  
      const params = new URLSearchParams({
        startdate,
        enddate
      });
  
      if (cardView === "percent") {
        params.append("per", shiftPercent.toString());
      }
  
      if (cardView === "price") {
        params.append("savings", priceInput || "0");
      }
  
      if (windowParam) {
        params.append("window", windowParam);
      }
  
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
      json.data.forEach((d) => {
        const hour = parseInt(d.hour.split(":")[0], 10);
        hourly[hour] = Number(d.consumption);
      });
  
      setActualData(hourly);
    } catch (err) {
      console.error("Simulation failed", err);
    } finally {
      setLoading(false);
    }
  }
  
  
  

  useEffect(() => {
    handleSimulate();
  }, [startdate, enddate, cardView, shiftPercent, peakWindow, priceInput]); 
  

  return (
    <div className="lg:flex w-full gap-4">
      <div className="w-full bg-white rounded-lg shadow p-3 relative lg:h-[75vh]">
        <div className="absolute top-3 right-4 text-xs font-medium text-purple-700">
          ⏳ 2 hours left to reduce
        </div>
        <Chart options={options} series={series} type="area" height="100%" />
      </div>

      <div className="flex flex-col gap-4 w-full lg:w-[30%]">
        <div className="bg-white rounded-lg shadow p-4 space-y-4">
          <h3 className="font-semibold text-sm">Select Period</h3>
          
          <div className="space-y-3 space-x-2 flex">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startdate}
                onChange={(e) => setStartdate(e.target.value)}
                className="w-full border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={enddate}
                onChange={(e) => setEnddate(e.target.value)}
                className="w-full border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

        </div>

        <div className="bg-white rounded-lg shadow p-4 space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-sm">Load Shift - Reduction</h3>
            <div className="flex bg-gray-100 rounded-lg border overflow-hidden">
              <button
                onClick={() => setCardView("percent")}
                className={`px-3 py-1 text-xs font-medium ${
                  cardView === "percent"
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-blue-50"
                }`}
              >
                Percent
              </button>
              <button
                onClick={() => setCardView("price")}
                className={`px-3 py-1 text-xs font-medium ${
                  cardView === "price"
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-blue-50"
                }`}
              >
                Price
              </button>
            </div>
          </div>

          {cardView === "percent" ? (
            /* Percent View */
            <>
              <div>
                <div className="text-xs text-gray-500 mb-1">Shift Percentage:</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>0%</span>
                    <span className="font-medium">{shiftPercent}%</span>
                    <span>100%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={shiftPercent}
                    onChange={(e) => setShiftPercent(parseInt(e.target.value))}
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
                <div className="flex bg-gray-100 rounded-lg border overflow-hidden">
                  {["Morning", "Evening", "Both"].map((val) => (
                    <button
                      key={val}
                      onClick={() => setPeakWindow(val)}
                      className={`flex-1 py-2 text-sm font-medium ${
                        peakWindow === val
                          ? "bg-blue-600 text-white"
                          : "text-gray-700 hover:bg-blue-50"
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xs text-gray-500">Potential Savings :</div>
                  <div className="text-lg font-semibold">₹ 2,800 - 7,500</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Shifted (kWh):</div>
                  <div className="text-lg font-semibold">0 kWh</div>
                </div>
              </div>
            </>
          ) : (
            /* Price View */
            <>
              <div>
                <div className="text-xs text-gray-500 mb-1">Target Price (₹):</div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">₹</span>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="\d*"
                    value={priceInput}
                    onChange={(e) => {
                      // allow only whole numbers (digits)
                      const digitsOnly = e.target.value.replace(/\D/g, "");
                      setPriceInput(digitsOnly);
                    }}
                    placeholder="0"
                    className="w-full border rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xs text-gray-500">Shift By (%):</div>
                  <div className="text-lg font-semibold text-blue-600">5% <span className="text-black">-</span> 10%</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Shift By (kWh):</div>
                  <div className="text-lg font-semibold">0 kWh</div>
                </div>
              </div>
            </>
          )}

          <button onClick={handleSimulate} className="w-full bg-purple-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition">
            Simulate
          </button>
        </div>
      </div>
    </div>
  );
}