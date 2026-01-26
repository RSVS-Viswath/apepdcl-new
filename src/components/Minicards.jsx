export default function Minicards() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {[
        { label: "Energy Used", value: "420 kWh" },
        { label: "Peak Hour Consumption", value: "110 kWh" },
        { label: "Peak Hour Cost", value: "₹ 8,580" },
        { label: "Savings", value: "₹ 3,200" },
        { label: "CO₂ Savings", value: "200 Kg" },
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
  );
}