import { useState } from "react";
import Chart from "react-apexcharts";

export default function Component() {
  const [shiftPercent, setShiftPercent] = useState(10);
  const [peakWindow, setPeakWindow] = useState("Morning");

  const series = [
    {
      name: "Consumption",
      data: [
        18, 16, 15, 14, 13, 14,
        22, 28, 30, 27, 24,
        20, 19, 18, 17, 19,
        22, 26, 32, 34, 31,
        27, 22, 20,
      ],
    },
  ];

  const options = {
    chart: {
      type: "area",
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "smooth",
      width: 1.5,
      colors: ["#6A42B2"],
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.8,
        opacityTo: 0,
        stops: [0, 100],
      },
      colors: ["#6A42B2"],
    },
    xaxis: {
      categories: Array.from({ length: 24 }, (_, i) =>
        i.toString().padStart(2, "0")
      ),
      title: { 
        text: "Hours",
        style: {
          fontWeight: 400
        }
      },
      labels: {
        style: {
          fontWeight: 400
        }
      }
    },
    yaxis: {
      title: { 
        text: "Consumption (kWh)",
        style: {
          fontWeight: 400
        }
      },
      labels: {
        style: {
          fontWeight: 400
        }
      }
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
              fontWeight: 500
            },
            orientation: "horizontal",
            position: "bottom",
            offsetY: -3,
            textAnchor: "start",
          },
        },
      ],
    },
    legend: { show: false },
  };

  return (
    <div className="w-full p-4 space-y-4">
      {/* Banner */}
      <div className="bg-red-100 text-red-800 px-4 py-2 rounded-md font-semibold text-sm text-center">
        ⚠ Peak Tariff Active (06:00-10:00) : Reduce load by 10% to save ₹3,200 today
      </div>

      {/* Mini cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Energy Used", value: "420 kWh" },
          { label: "Peak Hour Consumption", value: "110 kWh" },
          { label: "Peak Hour Cost", value: "₹ 8,580" },
          { label: "Savings", value: "₹ 3,200" },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-white rounded-lg shadow p-3 text-center"
          >
            <div className="text-xs text-gray-500">{item.label}</div>
            <div className="text-lg font-semibold">{item.value}</div>
          </div>
        ))}
      </div>

      {/* Graph + Right section */}
      <div className="lg:flex w-full gap-4">
        {/* Graph */}
        <div className="w-full bg-white rounded-lg shadow p-3 relative lg:h-[75vh]">
          <div className="absolute top-3 right-4 text-xs font-medium text-purple-700">
            ⏳ 2 hours left to reduce
          </div>
          <Chart
            options={options}
            series={series}
            type="area"
            height="100%"
          />
        </div>

        {/* Right cards */}
        <div className="flex flex-col gap-4 w-full lg:w-[30%]">
          {/* Advisory Card */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-sm mb-2">
              What Should I Do Now?
            </h3>
            <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
              <li>Shift HVAC precooling to 5 - 6 PM</li>
              <li>Delay EV charging to post 10 PM</li>
              <li>Reduce lighting load by 10%</li>
            </ul>
          </div>

          {/* Load Shift Card */}
          <div className="bg-white rounded-lg shadow p-4 space-y-4">
            <h3 className="font-semibold text-sm">Load Shift - Reduction</h3>

            {/* Shift Scenario */}
            <div>
              <div className="text-xs text-gray-500 mb-1">Shift Scenario :</div>
              <div className="flex bg-gray-100 rounded-lg border overflow-hidden">
                {[10, 20, 30].map((val) => (
                  <button
                    key={val}
                    onClick={() => setShiftPercent(val)}
                    className={`flex-1 py-1 text-sm font-medium transition text-center ${
                      shiftPercent === val
                        ? "bg-blue-600 text-white"
                        : "text-gray-700 hover:bg-blue-50"
                    }`}
                  >
                    {val}%
                  </button>
                ))}
              </div>
            </div>

            {/* Peak Window */}
            <div>
              <div className="text-xs text-gray-500 mb-1">Peak Window :</div>
              <div className="flex bg-gray-100 rounded-lg border overflow-hidden">
                {["Morning", "Evening", "Both"].map((val) => (
                  <button
                    key={val}
                    onClick={() => setPeakWindow(val)}
                    className={`flex-1 py-1 text-sm font-medium transition text-center ${
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

            {/* Savings */}
            <div>
              <div className="text-xs text-gray-500">Potential Savings :</div>
              <div className="text-lg font-semibold">₹ 2,800 - 7,500</div>
            </div>

            <button className="w-full bg-purple-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition">
              Simulate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}