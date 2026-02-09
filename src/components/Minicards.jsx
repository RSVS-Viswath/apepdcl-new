import { useState,useEffect } from "react";
import { useDate } from "../context/DateContext";

export default function Minicards() {
  const { startdate, enddate } = useDate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchMC() {
      try {
        setLoading(true);
  
        const res = await fetch(
          `http://localhost:4000/api/fetchMC?startdate=${startdate}&enddate=${enddate}`,
          { credentials: "include" }
        );
  
        if (!res.ok) throw new Error("Failed to fetch mini cards");
  
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("MiniCards fetch failed", err);
      } finally {
        setLoading(false);
      }
    }
  
    if (startdate && enddate) {
      fetchMC();
    }
  }, [startdate, enddate]);

  if (loading || !data) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-lg shadow p-3 h-16 animate-pulse"
          />
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: "Energy Used",
      value: `${data.total_consumption_kwh} kWh`,
    },
    {
      label: "Peak Hour Consumption",
      value: `${data.peak_consumption_kwh} kWh`,
    },
    {
      label: "Peak Hour Cost",
      value: `₹ ${data.peak_cost}`,
    },
    {
      label: "CO₂ Savings",
      value: `${data.co2_savings} kg`, 
    },
  ];
  


  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {cards.map((item) => (
        <div
          key={item.label}
          className="bg-white rounded-lg shadow p-3 text-center"
        >
          <div className="text-xs text-gray-500">{item.label}</div>
          <div className="text-lg font-semibold">{item.value}</div>
        </div>
      ))}
    </div>
  );
}