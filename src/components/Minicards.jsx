export default function Minicards() {
  return (
    <div className="space-y-4">
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
    </div>
  );
}