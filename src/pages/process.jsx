import { useEffect, useMemo, useState } from "react";
import { FiChevronRight, FiMapPin, FiX } from "react-icons/fi";
import { sheltonEquipmentRows } from "../lib/processSheltonData";
import { seededNumber } from "../lib/seeded";

const MAP_EMBED_SRC =
  "https://www.google.com/maps?q=Hotel%20Shelton%20Rajamahendri%2C%20APSRTC%20Complex%20Road%2C%20Rajahmundry%2C%20Andhra%20Pradesh%20533103&output=embed";
const SUNPATH_VIDEO_SRC = "/process-media/rjy925-shelton.mp4";
const BUILDING_NAMES = ["Guest Tower", "Banquet Block", "Kitchen & Dining", "Laundry Wing", "Utility Block"];

function formatValue(value, suffix = "") {
  if (value == null || value === "") return "--";
  if (typeof value === "number") {
    return `${Number.isInteger(value) ? value : value.toFixed(1)}${suffix}`;
  }
  return `${value}${suffix}`;
}

function DetailItem({ label, value }) {
  return (
    <div className="rounded-lg bg-gray-50 px-3 py-2.5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">{label}</div>
      <div className="mt-1 text-sm font-medium leading-5 text-gray-900">{value}</div>
    </div>
  );
}

function getEquipmentActiveStatus(equipment) {
  const seed = equipment.id || equipment.equipmentName;
  const randomValue = seededNumber(seed);
  return randomValue > 0.5;
}

function SleepingBotIcon() {
  return (
    <div className="relative inline-flex">
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        className="animate-breathing-bot"
        style={{ transformOrigin: "center" }}
      >
        <defs>
          <style>{`
            .sleeping-bot-body { fill: #9ca3af; }
            .sleeping-bot-line { stroke: #6b7280; stroke-width: 1.5; stroke-linecap: round; }
          `}</style>
        </defs>
        {/* Robot head/body */}
        <rect x="6" y="7" width="12" height="11" rx="2" className="sleeping-bot-body" />
        {/* Antenna */}
        <circle cx="12" cy="6" r="1.2" className="sleeping-bot-body" />
        <line x1="12" y1="6" x2="12" y2="2.5" className="sleeping-bot-line" />
        {/* Left eye (closed/sleepy) */}
        <path
          d="M 9.5 10.5 Q 9.5 11.5 10.5 11.5 Q 11.5 11.5 11.5 10.5"
          className="sleeping-bot-line"
          fill="none"
        />
        {/* Right eye (closed/sleepy) */}
        <path
          d="M 12.5 10.5 Q 12.5 11.5 13.5 11.5 Q 14.5 11.5 14.5 10.5"
          className="sleeping-bot-line"
          fill="none"
        />
        {/* Mouth (slight smile) */}
        <path d="M 9 13.5 Q 12 14.5 15 13.5" className="sleeping-bot-line" fill="none" />
      </svg>
      {/* ZZZ floating animation */}
      <span
        className="absolute animate-zzz"
        style={{
          right: "-6px",
          top: "-2px",
          fontSize: "7px",
          fontWeight: "bold",
          color: "#9ca3af",
          letterSpacing: "-1px",
        }}
      >
        zzz
      </span>
    </div>
  );
}

function EquipmentModal({ equipment, onClose }) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const infoGroups = [
    {
      title: "Equipment Snapshot",
      rows: [
        ["Equipment Name", equipment.equipmentName],
        ["Process Name", equipment.processName],
        ["Equipment Group", equipment.equipmentGroup],
        ["Industry Type", equipment.industryType],
        ["Consumer Type", equipment.consumerType],
      ],
    },
    {
      title: "Operations",
      rows: [
        ["Type of Operations", equipment.operationType],
        ["Type of Control", equipment.controlType],
        ["Critical Load Priority", equipment.criticalLoad],
        ["Daily Operating Hours", formatValue(equipment.dailyOperatingHours, " hrs")],
        ["Runs During Peak Window", equipment.peakRun],
      ],
    },
    {
      title: "Load Shifting Scope",
      rows: [
        ["Shiftable to Normal/Off-Peak", equipment.shiftable],
        ["Maximum Shiftable Load", formatValue(equipment.maxShiftableLoadKw, " kW")],
        ["Maximum Shiftable Duration", formatValue(equipment.maxShiftableDurationHours, " hrs")],
        ["Management Approval", equipment.managementApproval],
        ["Remarks", equipment.remarks],
      ],
    },
    {
      title: "Capacity Details",
      rows: [
        ["Units Installed", formatValue(equipment.units)],
        ["Rated Load", formatValue(equipment.ratedLoad)],
        ["Running Load", formatValue(equipment.runningLoadKw, " kW")],
        ["Serial Number", equipment.serialNo],
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/55" onClick={onClose} />
      <div className="relative z-10 w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Equipment Details</div>
            <h2 className="mt-2 text-xl font-semibold text-gray-900">{equipment.equipmentName}</h2>
            <p className="mt-1 text-sm text-gray-500">
              {equipment.processName} | {equipment.controlType} | {equipment.criticalLoad} priority
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100"
            aria-label="Close equipment details"
          >
            <FiX className="text-lg" />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-auto px-5 py-5">
          <div className="min-w-full overflow-x-auto">
            <div className="grid gap-3 md:grid-cols-2">
              {infoGroups.map((group) => (
                <section key={group.title} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <h3 className="text-sm font-semibold text-gray-900">{group.title}</h3>
                  <dl className="mt-3 space-y-2.5">
                    {group.rows.map(([label, value]) => (
                      <div key={label} className="rounded-lg bg-white px-3 py-2.5">
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">{label}</dt>
                        <dd className="mt-1 text-sm text-gray-900">{value ?? "--"}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProcessPage() {
  const [activeEquipment, setActiveEquipment] = useState(null);

  const summary = useMemo(() => {
    return {
      totalEquipment: sheltonEquipmentRows.length,
      uniqueEquipment: new Set(
        sheltonEquipmentRows
          .map((item) => String(item.equipmentName || "").trim().toUpperCase())
          .filter(Boolean)
      ).size,
      totalShiftableLoad: sheltonEquipmentRows
        .reduce((sum, item) => sum + Number(item.maxShiftableLoadKw || 0), 0)
        .toFixed(1),
    };
  }, []);

  const industryDetails = [
    ["Name", "Shelton Rajamahendri"],
    ["Location", "APSRTC Complex Road, Rajahmundry, Andhra Pradesh 533103"],
    ["Type", "Commercial Hospitality Facility"],
    ["Total Buildings", "5"],
    ["Building Names", BUILDING_NAMES.join(", ")],
    ["Average Consumption", "11.8 MWh / day"],
    ["Total Savings", "Rs. 2.84 lakh / year"],
    ["Equipment Audited", `${summary.totalEquipment} tagged assets`],
    ["Unique Equipment", `${summary.uniqueEquipment} distinct systems`],
    ["Shiftable Capacity", `${summary.totalShiftableLoad} kW identified`],
    ["Peak Flex Window", "Up to 2 hours / equipment"],
    ["Control Mode", "Manual control dominant across all listed assets"],
  ];

  return (
    <div className="space-y-3">
      <section className="overflow-hidden rounded-lg bg-white shadow">
        <div className="grid lg:grid-cols-[1.08fr_auto_0.92fr] lg:items-stretch">
          <div className="p-3 md:p-4">
            <div className="h-full min-h-[300px] overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
              <iframe
                title="Shelton Rajamahendri Map"
                src={MAP_EMBED_SRC}
                className="h-full min-h-[300px] w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </div>

          <div className="hidden w-px bg-slate-200 lg:block" />

          <div className="p-3 md:p-4">
            <div className="h-full rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-xl font-semibold leading-tight text-gray-900">Shelton Process Overview</h1>
                  <div className="mt-1 inline-flex items-center gap-2 text-sm text-gray-500">
                    <FiMapPin className="text-sm" />
                    APSRTC Complex Road, Rajahmundry, Andhra Pradesh 533103
                  </div>
                </div>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {industryDetails.map(([label, value]) => (
                  <DetailItem key={label} label={label} value={value} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg bg-white shadow">
        <div className="grid lg:h-[560px] lg:grid-cols-[1fr_1.08fr] lg:items-stretch">
          <div className="flex min-h-0 flex-col border-b border-slate-200 bg-white lg:border-b-0 lg:border-r">
            <div className="border-b border-slate-200 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-900">Sunpath Analysis</h2>
            </div>
            <div className="min-h-0 flex-1 bg-slate-950">
              <video
                className="pointer-events-none block h-full w-full select-none object-contain"
                src={SUNPATH_VIDEO_SRC}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                disablePictureInPicture
                controlsList="nodownload nofullscreen noremoteplayback"
                onContextMenu={(event) => event.preventDefault()}
              />
            </div>
          </div>

          <div className="flex min-h-0 flex-col">
            <div className="border-b border-slate-200 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-900">Process Equipment List</h2>
            </div>

            <div className="min-h-0 flex-1 overflow-x-auto">
              <div className="min-w-full">
                <table className="min-w-full table-fixed text-sm">
                  <thead className="sticky top-0 z-10 bg-slate-50 text-left text-[11px] uppercase tracking-[0.08em] text-gray-500">
                    <tr>
                      <th className="w-[10%] px-3 py-2.5 font-semibold">S.No</th>
                      <th className="w-[38%] px-3 py-2.5 font-semibold">Equipment Name</th>
                      <th className="w-[29%] px-3 py-2.5 font-semibold">Type of Operations</th>
                      <th className="w-[23%] px-3 py-2.5 font-semibold">Type of Control</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sheltonEquipmentRows.map((equipment, index) => (
                      <tr
                        key={equipment.id}
                        className={`border-t border-slate-200 ${index % 2 === 0 ? "bg-white" : "bg-slate-50/55"}`}
                      >
                        <td className="px-3 py-2.5 align-top text-[13px] font-medium leading-5 text-gray-600">
                          {equipment.serialNo ?? index + 1}
                        </td>
                        <td className="px-3 py-2.5 align-top">
                          <button
                            type="button"
                            onClick={() => setActiveEquipment(equipment)}
                            className="group block w-full text-left"
                            aria-label={`Open ${equipment.equipmentName} details`}
                          >
                            <span className="inline-flex items-start gap-2 text-sm font-medium leading-5 text-gray-900 transition group-hover:text-indigo-600">
                              <span className="truncate">{equipment.equipmentName}</span>
                              {getEquipmentActiveStatus(equipment) ? (
                                <div
                                  className="h-2 w-2 rounded-full bg-green-500 animate-pulse-dot shrink-0 mt-1.5"
                                  style={{
                                    boxShadow: "0 0 6px rgba(34, 197, 94, 0.6)",
                                  }}
                                  title="Active Equipment"
                                />
                              ) : (
                                <span className="shrink-0 mt-0.5">
                                  <SleepingBotIcon />
                                </span>
                              )}
                              <FiChevronRight className="mt-[2px] shrink-0 text-sm text-gray-400 transition group-hover:text-indigo-600" />
                            </span>
                            <span className="mt-0.5 block text-[11px] leading-4 text-gray-500">{equipment.processName}</span>
                          </button>
                        </td>
                        <td className="px-3 py-2.5 align-top text-[13px] leading-5 text-gray-700">{equipment.operationType}</td>
                        <td className="px-3 py-2.5 align-top text-[13px] leading-5 text-gray-700">{equipment.controlType}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {activeEquipment ? <EquipmentModal equipment={activeEquipment} onClose={() => setActiveEquipment(null)} /> : null}
    </div>
  );
}
