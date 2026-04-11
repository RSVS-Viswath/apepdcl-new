import React, { useEffect, useMemo, useRef, useState } from "react";
import Chart from "react-apexcharts";
import {
  FiActivity,
  FiArrowDown,
  FiArrowLeft,
  FiArrowRight,
  FiBarChart2,
  FiBox,
  FiClock,
  FiCpu,
  FiDroplet,
  FiFilter,
  FiGrid,
  FiLayers,
  FiMapPin,
  FiMaximize2,
  FiMinus,
  FiPackage,
  FiRefreshCw,
  FiSettings,
  FiShield,
  FiSun,
  FiTool,
  FiTrendingUp,
  FiX,
  FiZap,
} from "react-icons/fi";
import { FaCut, FaFire, FaSeedling } from "react-icons/fa";
import { BiInfinite } from "react-icons/bi";
import { seededNumber } from "../lib/seeded";
import pajsonAgroProcessData from "../data/pajsonAgroProcessData.json";

const TEAL = "#13C4A9";
const PURPLE = "#6A42B2";

const SUNPATH_VIDEO_SRC = "/process-media/pajson-agro-sunpath.mp4";
const SUNPATH_POSTER_SRC = "/process-media/pajson-agro-sunpath-poster.png";
const MODEL_IMAGE_SRC = "/process-media/pajson-agro-3d-model.png";

const FACILITY_META = {
  name: "Pajson Agro",
  serviceNo: "VSP1111",
  location: "Visakhapatnam, Andhra Pradesh",
  industry: "Cashew Processing Facility",
};

const PROCESS_META = {
  RCN: { label: "RCN", color: "#fceccf", text: "#a16207", icon: FaSeedling },
  "DESTONER TO SIZING": { label: "Destoner / Sizing", color: "#fde9d2", text: "#b45309", icon: FiPackage },
  COOKING: { label: "Cooking", color: "#fde8e8", text: "#b45309", icon: FaFire },
  "SHELLING-LINE-D": { label: "Shelling Line D", color: "#d8f5ee", text: "#0f766e", icon: FaCut },
  "SHELLING-LINE-C": { label: "Shelling Line C", color: "#d8f5ee", text: "#0f766e", icon: FaCut },
  "SHELLING-LINE-B": { label: "Shelling Line B", color: "#d8f5ee", text: "#0f766e", icon: FaCut },
  "SHELLING-LINE-A": { label: "Shelling Line A", color: "#d8f5ee", text: "#0f766e", icon: FaCut },
  "SHELLING NEW LINE": { label: "Shelling New Line", color: "#e3defd", text: "#5b47b3", icon: FiZap },
  "SHELL YARD": { label: "Shell Yard", color: "#ece8db", text: "#786748", icon: FiBox },
  SHELLING: { label: "Shelling Common", color: "#d8f2ea", text: "#0f766e", icon: FiSettings },
  BORMA: { label: "Borma", color: "#f8dce6", text: "#be185d", icon: FiTool },
  PEELING: { label: "Peeling", color: "#e6f4cf", text: "#4d7c0f", icon: FiLayers },
  GRADING: { label: "Grading", color: "#fce7c7", text: "#b45309", icon: FiBarChart2 },
  PACKING: { label: "Packing", color: "#ddd7ff", text: "#5b47b3", icon: FiPackage },
  COMPRESSOR: { label: "Compressor", color: "#ede9fe", text: "#6d28d9", icon: FiCpu },
  "LIGHTS & FANS": { label: "Lights & Fans", color: "#dff7f0", text: "#0f766e", icon: FiSun },
  OFFICE: { label: "Office", color: "#eef2ff", text: "#4f46e5", icon: FiGrid },
  BOILER: { label: "Boiler", color: "#ffe4e6", text: "#be123c", icon: FaFire },
  ETP: { label: "ETP", color: "#dcfce7", text: "#15803d", icon: FiDroplet },
  "R.O PLANT": { label: "R.O Plant", color: "#dbeafe", text: "#1d4ed8", icon: FiDroplet },
  WORKSHOP: { label: "Workshop", color: "#ede9fe", text: "#6d28d9", icon: FiTool },
  "FIRE HYDRANT": { label: "Fire Hydrant", color: "#fee2e2", text: "#b91c1c", icon: FiShield },
};

const UTILITY_FLOW = ["COMPRESSOR", "LIGHTS & FANS", "OFFICE", "BOILER", "ETP", "R.O PLANT", "WORKSHOP", "FIRE HYDRANT"];

function normalizeProcessName(name) {
  const value = String(name || "").trim().toUpperCase();
  if (!value) return "";
  if (value === "SHELL YARD") return "SHELL YARD";
  if (value === "DESTONER TO SIZING") return "DESTONER TO SIZING";
  if (value === "SHELLING-LINE-A") return "SHELLING-LINE-A";
  if (value === "SHELLING-LINE-B") return "SHELLING-LINE-B";
  if (value === "SHELLING-LINE-C") return "SHELLING-LINE-C";
  if (value === "SHELLING-LINE-D") return "SHELLING-LINE-D";
  if (value === "SHELLING NEW LINE") return "SHELLING NEW LINE";
  if (value === "LIGHTS & FANS") return "LIGHTS & FANS";
  if (value === "R.O PLANT") return "R.O PLANT";
  if (value === "FIRE HYDRANT") return "FIRE HYDRANT";
  return value;
}

function formatKw(value) {
  return `${Number(value || 0).toFixed(value >= 100 ? 0 : 1)} kW`;
}

function formatCompactNumber(value) {
  return Number(value || 0).toLocaleString("en-IN");
}

function getProcessActiveStatus(processKey) {
  const seed = processKey;
  const randomValue = seededNumber(seed, 0, 1);
  return randomValue > 0.45;
}

function SleepingBotIcon() {
  return (
    <div className="relative inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-200/90 bg-white/95 shadow-sm">
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        className="animate-breathing-bot"
        style={{ transformOrigin: "center" }}
        aria-hidden="true"
      >
        <defs>
          <style>{`
            .sleeping-bot-shell { fill: #d8e1ea; stroke: #64748b; stroke-width: 1.35; stroke-linejoin: round; }
            .sleeping-bot-accent { fill: #b8c5d3; stroke: #64748b; stroke-width: 1.1; stroke-linejoin: round; }
            .sleeping-bot-line { stroke: #475569; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
          `}</style>
        </defs>
        <path d="M9.5 4.4h5" className="sleeping-bot-line" />
        <path d="M12 4.4V2.7" className="sleeping-bot-line" />
        <circle cx="12" cy="2.3" r="1.15" className="sleeping-bot-accent" />
        <path d="M4.8 10.2h1.8v4.2H4.8a1.1 1.1 0 0 1-1.1-1.1v-2a1.1 1.1 0 0 1 1.1-1.1Z" className="sleeping-bot-accent" />
        <path d="M17.4 10.2h1.8a1.1 1.1 0 0 1 1.1 1.1v2a1.1 1.1 0 0 1-1.1 1.1h-1.8v-4.2Z" className="sleeping-bot-accent" />
        <rect x="6.2" y="6.1" width="11.6" height="11" rx="3.2" className="sleeping-bot-shell" />
        <path d="M9 11c.65.75 1.45 1.1 2.35 1.1S12.95 11.75 13.6 11" className="sleeping-bot-line" />
        <path d="M14.2 11c.62.75 1.35 1.1 2.2 1.1" className="sleeping-bot-line" />
        <path d="M9.3 14.2h5.4" className="sleeping-bot-line" />
        <path d="M9 17.2v2.1" className="sleeping-bot-line" />
        <path d="M15 17.2v2.1" className="sleeping-bot-line" />
      </svg>
      <span
        className="pointer-events-none absolute -right-1 -top-1 animate-zzz text-[7px] font-black uppercase leading-none text-slate-400"
        style={{
          letterSpacing: "-0.14em",
        }}
      >
        zzz
      </span>
    </div>
  );
}

function getUnitCount(value) {
  const next = Number(value);
  return Number.isFinite(next) && next > 0 ? next : 1;
}

function getEquipmentLoad(item) {
  const base = Number(item.runningLoadKw ?? item.ratedLoad ?? 0);
  return Number.isFinite(base) ? Number((base * getUnitCount(item.units)).toFixed(2)) : 0;
}

function getPerUnitLoad(item) {
  const base = Number(item.runningLoadKw ?? item.ratedLoad ?? 0);
  return Number.isFinite(base) ? Number(base.toFixed(2)) : 0;
}

function getProcessTone(processKey) {
  return PROCESS_META[processKey] ?? { label: processKey, color: "#f8fafc", text: "#0f172a", icon: FiActivity };
}

function getEquipmentTone(item, index) {
  const load = item.totalLoadKw;
  const criticality = String(item.criticalLoad || "").toUpperCase();
  if (item.processRank === 0 || index === 0 || criticality === "HIGH" || load >= 20) {
    return { border: "#fca5a5", background: "#fff5f5", text: "#b91c1c", tag: "Critical Load" };
  }
  if (criticality === "MEDIUM" || load >= 5) {
    return { border: "#fde68a", background: "#fffdf0", text: "#a16207", tag: "Moderate Load" };
  }
  return { border: "#86efac", background: "#f0fdf4", text: "#15803d", tag: "Non-Critical Load" };
}

function getFilterProcessType(controlType) {
  const value = String(controlType || "").trim().toUpperCase();
  if (value.includes("SEMI")) return "Semi Automatic";
  if (value.includes("MANUAL")) return "Manual";
  return "Automatic";
}

function getFilterOperationType(operationType) {
  const value = String(operationType || "").trim();
  return value || "-";
}

function getEquipmentLoadType(item) {
  return getEquipmentTone(item, item.processRank).tag;
}

function getControlPresentation(controlType) {
  const value = String(controlType || "").trim().toUpperCase();
  if (value.includes("AUTO")) {
    return { icon: FiSettings, label: "AUTOMATIC" };
  }
  if (value.includes("MANUAL")) {
    return { icon: FiTool, label: "MANUAL" };
  }
  return { icon: FiMinus, label: "-" };
}

function getOperationPresentation(operationType) {
  const value = String(operationType || "").trim().toUpperCase();
  if (value.includes("CONTINUOUS")) {
    return { icon: BiInfinite, label: "CONTINUOUS" };
  }
  if (value.includes("INTERMITTENT")) {
    return { icon: FiClock, label: "INTERMITTENT" };
  }
  return { icon: FiMinus, label: "-" };
}

function buildUniqueLabels(items) {
  const counts = {};
  return items.map((item) => {
    const base = item.equipmentName.length > 28 ? `${item.equipmentName.slice(0, 26)}..` : item.equipmentName;
    counts[base] = (counts[base] || 0) + 1;
    return counts[base] > 1 ? `${base} ${counts[base]}` : base;
  });
}

function OverviewStat({ label, value, icon, hint }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-gray-50 px-3 py-2.5">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">{icon}</span>
        {label}
      </div>
      <div className="mt-2 text-lg font-semibold tabular-nums text-gray-900">{value}</div>
      <div className="mt-0.5 text-[11px] text-gray-400">{hint}</div>
    </div>
  );
}

function ProcessNameText({ text, className = "" }) {
  return (
    <span className="group/process-name relative block w-full min-w-0" title={text} aria-label={text}>
      <span className={`block w-full min-w-0 truncate ${className}`}>{text}</span>
      <span className="pointer-events-none absolute left-0 top-full z-30 mt-1 hidden w-max max-w-[240px] rounded-md bg-slate-900 px-2 py-1 text-[11px] font-medium leading-tight text-white shadow-lg group-hover/process-name:block">
        {text}
      </span>
    </span>
  );
}

class ChartErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function SafeChart({ resetKey, fallbackHeight = 160, fallbackText = "Chart unavailable", ...props }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fallback = (
    <div
      className="flex w-full items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400"
      style={{ height: fallbackHeight }}
    >
      {fallbackText}
    </div>
  );

  if (!mounted) return fallback;

  return (
    <ChartErrorBoundary resetKey={resetKey} fallback={fallback}>
      <Chart {...props} />
    </ChartErrorBoundary>
  );
}

function ProcessNode({ processKey, group, active, onClick, isProcessActive }) {
  const tone = getProcessTone(processKey);
  const Icon = tone.icon;
  const missing = !group;

  return (
    <button
      type="button"
      onClick={() => !missing && onClick(processKey)}
      disabled={missing}
      className={`group relative flex min-h-[56px] min-w-0 items-center gap-3 rounded-2xl border px-3 py-2.5 pr-10 text-left transition ${
        missing
          ? "cursor-not-allowed border-slate-200 bg-slate-100/60 opacity-50"
          : active
            ? "card-breathing card-neon-active border-[1.5px]"
            : "border-slate-200 shadow-sm hover:-translate-y-0.5 hover:shadow-md"
      }`}
      style={{ backgroundColor: "#f3f4f6" }}
    >
      <span
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm"
        style={missing ? { color: "#6b7280", backgroundColor: "#e2e8f0" } : { color: tone.text, backgroundColor: tone.color }}
      >
        <Icon className="text-[15px]" />
      </span>
      <span className="min-w-0 flex-1">
        <ProcessNameText text={tone.label} className="block truncate text-[13px] font-semibold leading-tight text-[#374151]" />
      </span>

      <span
        className="shrink-0 rounded-full bg-slate-200 px-2.5 py-1 text-[10px] font-semibold tabular-nums shadow-sm"
        style={{ color: "#4b5563" }}
      >
        {group ? formatKw(group.totalLoadKw) : "--"}
      </span>

      {!missing && isProcessActive !== undefined && (
        <div className="absolute right-2.5 top-2.5 shrink-0">
          {isProcessActive ? (
            <div
              className="h-3 w-3 rounded-full bg-green-500 animate-pulse-dot shadow-lg"
              style={{
                boxShadow: "0 0 8px rgba(34, 197, 94, 0.6)",
              }}
              title="Active Process"
            />
          ) : (
            <SleepingBotIcon />
          )}
        </div>
      )}
    </button>
  );
}

function FlowArrow({ direction = "right", className = "" }) {
  const iconClass = "text-base text-slate-500";
  if (direction === "left") return <FiArrowLeft className={`${iconClass} ${className}`} />;
  if (direction === "down") return <FiArrowDown className={`${iconClass} ${className}`} />;
  return <FiArrowRight className={`${iconClass} ${className}`} />;
}

export default function Process1Page() {
  const [viewMode, setViewMode] = useState("process");
  const [isLoadChartModalOpen, setIsLoadChartModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [activeFilterSection, setActiveFilterSection] = useState("processTypes");
  const [equipmentFilters, setEquipmentFilters] = useState({
    processTypes: [],
    operationTypes: [],
    loadTypes: [],
  });
  const [draftEquipmentFilters, setDraftEquipmentFilters] = useState({
    processTypes: [],
    operationTypes: [],
    loadTypes: [],
  });
  const [clickedEquipment, setClickedEquipment] = useState(new Set());
  const processFlowRef = useRef(null);
  const [processColumnHeight, setProcessColumnHeight] = useState(null);
  const [processBaselineHeight, setProcessBaselineHeight] = useState(null);

  const equipmentRows = useMemo(
    () =>
      pajsonAgroProcessData.map((item) => ({
        ...item,
        processKey: normalizeProcessName(item.processName),
        totalLoadKw: getEquipmentLoad(item),
        perUnitLoadKw: getPerUnitLoad(item),
      })),
    []
  );

  const processGroups = useMemo(() => {
    const grouped = {};
    equipmentRows.forEach((item) => {
      if (!item.processKey) return;
      if (!grouped[item.processKey]) {
        grouped[item.processKey] = {
          processKey: item.processKey,
          totalLoadKw: 0,
          equipmentCount: 0,
          equipmentTypes: new Set(),
          units: 0,
        };
      }

      grouped[item.processKey].totalLoadKw += item.totalLoadKw;
      grouped[item.processKey].equipmentCount += 1;
      grouped[item.processKey].equipmentTypes.add(String(item.equipmentName || "").trim().toUpperCase());
      grouped[item.processKey].units += getUnitCount(item.units);
    });

    return Object.fromEntries(
      Object.entries(grouped).map(([key, value]) => [
        key,
        {
          ...value,
          totalLoadKw: Number(value.totalLoadKw.toFixed(2)),
          equipmentTypesCount: value.equipmentTypes.size,
        },
      ])
    );
  }, [equipmentRows]);

  const productionKeys = useMemo(
    () => [
      "RCN",
      "DESTONER TO SIZING",
      "COOKING",
      "SHELLING-LINE-D",
      "SHELLING-LINE-C",
      "SHELLING-LINE-B",
      "SHELLING-LINE-A",
      "SHELLING NEW LINE",
      "SHELL YARD",
      "SHELLING",
      "BORMA",
      "PEELING",
      "GRADING",
      "PACKING",
    ],
    []
  );
  const availableProductionKeys = useMemo(() => productionKeys.filter((key) => processGroups[key]), [processGroups, productionKeys]);
  const availableUtilityKeys = useMemo(() => UTILITY_FLOW.filter((key) => processGroups[key]), [processGroups]);
  const selectableKeys = viewMode === "utilities" ? availableUtilityKeys : availableProductionKeys;

  const [selectedProcess, setSelectedProcess] = useState(availableProductionKeys[1] ?? availableProductionKeys[0] ?? null);

  useEffect(() => {
    if (!selectableKeys.length) {
      setSelectedProcess(null);
      return;
    }
    if (!selectedProcess || !selectableKeys.includes(selectedProcess)) {
      setSelectedProcess(selectableKeys[0]);
    }
  }, [selectedProcess, selectableKeys]);

  const baseSelectedEquipment = useMemo(() => {
    if (!selectedProcess) return [];
    return equipmentRows
      .filter((item) => item.processKey === selectedProcess)
      .sort((a, b) => b.totalLoadKw - a.totalLoadKw || a.equipmentName.localeCompare(b.equipmentName))
      .map((item, index) => ({
        ...item,
        processRank: index,
      }));
  }, [equipmentRows, selectedProcess]);

  const filterOptions = useMemo(
    () => ({
      processTypes: Array.from(new Set(baseSelectedEquipment.map((item) => getFilterProcessType(item.controlType)))),
      operationTypes: Array.from(new Set(baseSelectedEquipment.map((item) => getFilterOperationType(item.operationType)))),
      loadTypes: Array.from(new Set(baseSelectedEquipment.map((item) => getEquipmentLoadType(item)))),
    }),
    [baseSelectedEquipment]
  );

  const selectedEquipment = useMemo(
    () =>
      baseSelectedEquipment.filter((item) => {
        const processType = getFilterProcessType(item.controlType);
        const operationType = getFilterOperationType(item.operationType);
        const loadType = getEquipmentLoadType(item);

        return (
          (!equipmentFilters.processTypes.length || equipmentFilters.processTypes.includes(processType)) &&
          (!equipmentFilters.operationTypes.length || equipmentFilters.operationTypes.includes(operationType)) &&
          (!equipmentFilters.loadTypes.length || equipmentFilters.loadTypes.includes(loadType))
        );
      }),
    [baseSelectedEquipment, equipmentFilters]
  );

  const hasActiveEquipmentFilters =
    equipmentFilters.processTypes.length > 0 || equipmentFilters.operationTypes.length > 0 || equipmentFilters.loadTypes.length > 0;
  const filterSections = useMemo(
    () => [
      { key: "processTypes", label: "Process Type", options: filterOptions.processTypes },
      { key: "operationTypes", label: "Type Of Operations", options: filterOptions.operationTypes },
      { key: "loadTypes", label: "Type Of Load", options: filterOptions.loadTypes },
    ],
    [filterOptions]
  );
  const activeFilterConfig = filterSections.find((section) => section.key === activeFilterSection) ?? filterSections[0] ?? null;

  useEffect(() => {
    if (typeof window === "undefined" || !processFlowRef.current) return undefined;

    const updateProcessColumnHeight = () => {
      if (window.innerWidth < 1024) {
        setProcessColumnHeight(null);
        setProcessBaselineHeight(null);
        return;
      }

      const nextHeight = Math.ceil(processFlowRef.current?.getBoundingClientRect().height || 0);
      const resolvedHeight = nextHeight > 0 ? nextHeight : null;
      setProcessColumnHeight(resolvedHeight);
      if (viewMode === "process" && resolvedHeight) {
        setProcessBaselineHeight((current) => (current ? Math.max(current, resolvedHeight) : resolvedHeight));
      }
    };

    updateProcessColumnHeight();

    let observer = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => {
        updateProcessColumnHeight();
      });
      observer.observe(processFlowRef.current);
    }

    window.addEventListener("resize", updateProcessColumnHeight);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", updateProcessColumnHeight);
    };
  }, [viewMode, selectedProcess, selectedEquipment.length]);

  useEffect(() => {
    setEquipmentFilters({
      processTypes: [],
      operationTypes: [],
      loadTypes: [],
    });
    setDraftEquipmentFilters({
      processTypes: [],
      operationTypes: [],
      loadTypes: [],
    });
    setActiveFilterSection("processTypes");
    setIsFilterModalOpen(false);
    setClickedEquipment(new Set());
  }, [selectedProcess]);

  useEffect(() => {
    setEquipmentFilters((current) => ({
      processTypes: current.processTypes.filter((item) => filterOptions.processTypes.includes(item)),
      operationTypes: current.operationTypes.filter((item) => filterOptions.operationTypes.includes(item)),
      loadTypes: current.loadTypes.filter((item) => filterOptions.loadTypes.includes(item)),
    }));
    setDraftEquipmentFilters((current) => ({
      processTypes: current.processTypes.filter((item) => filterOptions.processTypes.includes(item)),
      operationTypes: current.operationTypes.filter((item) => filterOptions.operationTypes.includes(item)),
      loadTypes: current.loadTypes.filter((item) => filterOptions.loadTypes.includes(item)),
    }));
  }, [filterOptions]);

  useEffect(() => {
    if (!activeFilterConfig && filterSections[0]) {
      setActiveFilterSection(filterSections[0].key);
      return;
    }
    if (activeFilterConfig && !filterSections.some((section) => section.key === activeFilterConfig.key)) {
      setActiveFilterSection(filterSections[0]?.key || "processTypes");
    }
  }, [activeFilterConfig, filterSections]);

  const updateEquipmentFilterGroup = (groupKey, option) => {
    setDraftEquipmentFilters((current) => {
      const nextValues = current[groupKey].includes(option)
        ? current[groupKey].filter((item) => item !== option)
        : [...current[groupKey], option];
      return { ...current, [groupKey]: nextValues };
    });
  };

  const clearEquipmentFilters = () => {
    setDraftEquipmentFilters({
      processTypes: [],
      operationTypes: [],
      loadTypes: [],
    });
  };

  const syncedProcessColumnHeight =
    viewMode === "utilities"
      ? Math.max(processColumnHeight || 0, processBaselineHeight || 0) || null
      : processColumnHeight;

  const overviewStats = useMemo(() => {
    const totalInstalledLoad = equipmentRows.reduce((sum, item) => sum + item.totalLoadKw, 0);
    const highestSingleLoad = equipmentRows.reduce((max, item) => Math.max(max, item.totalLoadKw), 0);
    const processLines = new Set(
      equipmentRows
        .map((item) => item.processKey)
        .filter((key) => key.startsWith("SHELLING-LINE") || key === "SHELLING NEW LINE")
    ).size;

    return {
      totalEquipments: equipmentRows.length,
      activeProcesses: Object.keys(processGroups).length,
      installedLoadKw: totalInstalledLoad,
      processLines,
      highestSingleLoadKw: highestSingleLoad,
    };
  }, [equipmentRows, processGroups]);

  const selectedProcessGroup = selectedProcess ? processGroups[selectedProcess] : null;
  const selectedProcessTone = getProcessTone(selectedProcess);
  const selectedProcessLabel = selectedProcessTone.label;
  const equipmentTypesCount = selectedEquipment.length
    ? new Set(selectedEquipment.map((item) => String(item.equipmentName || "").trim().toUpperCase())).size
    : 0;
  const filteredEquipmentLoad = selectedEquipment.reduce((sum, item) => sum + item.totalLoadKw, 0);
  const activeFilterCount =
    equipmentFilters.processTypes.length + equipmentFilters.operationTypes.length + equipmentFilters.loadTypes.length;
  const loadChartCategories = useMemo(() => buildUniqueLabels(selectedEquipment), [selectedEquipment]);
  const modalLoadChartWidth = Math.max(920, selectedEquipment.length * 110);

  const loadChartYMax = useMemo(() => {
    const values = selectedEquipment.map((item) => item.totalLoadKw);
    const max = Math.max(...values, 0);
    return max <= 0 ? 4 : Math.ceil(max * 1.2);
  }, [selectedEquipment]);

  const loadChartModalOptions = useMemo(
    () => ({
      chart: {
        toolbar: { show: false },
        fontFamily: "sans-serif",
      },
      colors: [PURPLE],
      plotOptions: {
        bar: {
          borderRadius: 5,
          columnWidth: "54%",
          distributed: true,
        },
      },
      dataLabels: { enabled: false },
      legend: { show: false },
      xaxis: {
        categories: loadChartCategories,
        labels: {
          rotate: -32,
          hideOverlappingLabels: false,
          trim: false,
          style: { colors: "#64748b", fontSize: "12px" },
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        min: 0,
        max: loadChartYMax,
        tickAmount: 5,
        forceNiceScale: true,
        title: {
          text: "kW",
          style: { color: "#64748b", fontSize: "12px", fontWeight: 600 },
        },
        labels: {
          style: { colors: "#64748b", fontSize: "12px" },
          formatter: (value) => Number(value).toFixed(0),
        },
      },
      grid: {
        borderColor: "#e2e8f0",
        strokeDashArray: 4,
      },
      tooltip: {
        y: {
          formatter: (value) => formatKw(value),
        },
      },
      states: {
        hover: { filter: { type: "darken", value: 0.12 } },
      },
    }),
    [loadChartCategories, loadChartYMax]
  );

  const loadChartSeries = useMemo(
    () => [
      {
        name: "Connected Load",
        data: selectedEquipment.map((item) => item.totalLoadKw),
      },
    ],
    [selectedEquipment]
  );

  const energyAnalysis = useMemo(() => {
    const categories = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const productionBase = availableProductionKeys.reduce((sum, key) => sum + (processGroups[key]?.totalLoadKw || 0), 0);
    const utilityBase = availableUtilityKeys.reduce((sum, key) => sum + (processGroups[key]?.totalLoadKw || 0), 0);

    return {
      categories,
      series: [
        {
          name: "Production blocks",
          data: categories.map((day, index) =>
            Number((productionBase * seededNumber(`prod|${day}|${index}`, 0.36, 0.62)).toFixed(1))
          ),
        },
        {
          name: "Utilities",
          data: categories.map((day, index) =>
            Number((utilityBase * seededNumber(`util|${day}|${index}`, 0.18, 0.34)).toFixed(1))
          ),
        },
      ],
    };
  }, [availableProductionKeys, availableUtilityKeys, processGroups]);

  const energyOptions = useMemo(
    () => ({
      chart: {
        stacked: false,
        toolbar: { show: false },
        fontFamily: "sans-serif",
      },
      colors: [PURPLE, TEAL],
      plotOptions: {
        bar: {
          borderRadius: 5,
          columnWidth: "48%",
        },
      },
      dataLabels: { enabled: false },
      stroke: { show: false },
      xaxis: {
        categories: energyAnalysis.categories,
        labels: { style: { colors: "#64748b", fontSize: "11px" } },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        title: {
          text: "kWh",
          style: { color: "#64748b", fontSize: "11px", fontWeight: 600 },
        },
        labels: { style: { colors: "#64748b", fontSize: "11px" } },
      },
      grid: {
        borderColor: "#e2e8f0",
        strokeDashArray: 4,
      },
      tooltip: {
        y: {
          formatter: (value) => `${Number(value).toFixed(1)} kWh`,
        },
      },
      legend: {
        position: "top",
        horizontalAlign: "right",
        labels: { colors: "#475569" },
      },
    }),
    [energyAnalysis.categories]
  );

  useEffect(() => {
    if ((!isLoadChartModalOpen && !isFilterModalOpen) || typeof document === "undefined") return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsLoadChartModalOpen(false);
        setIsFilterModalOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFilterModalOpen, isLoadChartModalOpen]);

  return (
    <div className="space-y-2">
      <style>{`
        @keyframes breathing {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes neon-glow {
          0%, 100% { box-shadow: 0 0 10px rgba(34, 211, 238, 0.5), inset 0 0 10px rgba(34, 211, 238, 0.2); }
          50% { box-shadow: 0 0 20px rgba(34, 211, 238, 0.8), inset 0 0 10px rgba(34, 211, 238, 0.3); }
        }
        .card-breathing {
          animation: breathing 1.5s ease-in-out infinite;
        }
        .card-neon-active {
          animation: neon-glow 2s ease-in-out infinite;
          border-color: #06b6d4 !important;
        }
      `}</style>
      <section className="flex flex-col gap-2">
        <div className="rounded-[22px] border border-slate-200 bg-white p-3 shadow-sm">
          <div className="rounded-[18px] border border-slate-200 bg-[linear-gradient(135deg,#f8f5ff_0%,#ffffff_55%,#eefbf8_100%)] px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Facility Overview</div>
            <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{FACILITY_META.name}</h1>
                <div className="mt-1 inline-flex items-center gap-2 text-sm text-gray-500">
                  <FiMapPin className="text-sm" />
                  {FACILITY_META.location}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-slate-600 shadow-sm">
                  {FACILITY_META.serviceNo}
                </span>
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-700">
                  {FACILITY_META.industry}
                </span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                  {overviewStats.activeProcesses} active processes
                </span>
              </div>
            </div>
          </div>

          <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <OverviewStat
              label="Total Equipments"
              value={formatCompactNumber(overviewStats.totalEquipments)}
              hint="Tagged equipment entries"
              icon={<FiLayers className="text-sm" />}
            />
            <OverviewStat
              label="Installed Load"
              value={formatKw(overviewStats.installedLoadKw)}
              hint="Aggregate connected running load"
              icon={<FiTrendingUp className="text-sm" />}
            />
            <OverviewStat
              label="Process Lines"
              value={formatCompactNumber(overviewStats.processLines)}
              hint="Shelling lines and new line clusters"
              icon={<FiGrid className="text-sm" />}
            />
            <OverviewStat
              label="Highest Single Load"
              value={formatKw(overviewStats.highestSingleLoadKw)}
              hint="Largest mapped equipment demand"
              icon={<FiZap className="text-sm" />}
            />
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[3fr_1fr] lg:items-start lg:min-h-0">
          <section ref={processFlowRef} className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm lg:flex lg:flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
                  Process Mind Map <span className="text-slate-400">- Click any node to explore</span>
                </div>
                <div className="inline-flex rounded-md bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setViewMode("process")}
                    className={`rounded px-4 py-1 text-sm font-medium transition ${
                      viewMode === "process" ? "bg-[#dff3ef] text-[#0f766e]" : "text-slate-400"
                    }`}
                  >
                    Process
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("utilities")}
                    className={`rounded px-4 py-1 text-sm font-medium transition ${
                      viewMode === "utilities" ? "bg-[#ebe7fb] text-[#5b47b3]" : "text-slate-400"
                    }`}
                  >
                    Utilities
                  </button>
                </div>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 px-4 py-4 overflow-auto">
              {viewMode === "process" ? (
                <div className="overflow-auto w-full">
                  <div className="w-full space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="min-w-[150px] flex-1">
                          <ProcessNode processKey="RCN" group={processGroups.RCN} active={selectedProcess === "RCN"} onClick={setSelectedProcess} isProcessActive={getProcessActiveStatus("RCN")} />
                        </div>
                        <FlowArrow className="text-xl" />
                        <div className="min-w-[190px] flex-1">
                          <ProcessNode
                            processKey="DESTONER TO SIZING"
                            group={processGroups["DESTONER TO SIZING"]}
                            active={selectedProcess === "DESTONER TO SIZING"}
                            onClick={setSelectedProcess}
                            isProcessActive={getProcessActiveStatus("DESTONER TO SIZING")}
                          />
                        </div>
                        <FlowArrow className="text-xl" />
                        <div className="min-w-[150px] flex-1">
                          <ProcessNode processKey="COOKING" group={processGroups.COOKING} active={selectedProcess === "COOKING"} onClick={setSelectedProcess} isProcessActive={getProcessActiveStatus("COOKING")} />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pr-[19%]">
                      <FlowArrow direction="down" className="text-2xl" />
                    </div>

                    <div className="grid gap-3 md:grid-cols-4">
                      {["SHELLING-LINE-D", "SHELLING-LINE-C", "SHELLING-LINE-B", "SHELLING-LINE-A"].map((key) => (
                        <ProcessNode key={key} processKey={key} group={processGroups[key]} active={selectedProcess === key} onClick={setSelectedProcess} isProcessActive={getProcessActiveStatus(key)} />
                      ))}
                    </div>

                    <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
                      <div className="flex justify-center md:justify-start">
                        <FlowArrow direction="down" className="text-2xl" />
                      </div>
                      <div className="hidden md:block" />
                      <div className="hidden md:block" />
                      <div className="hidden md:block" />
                      <div className="flex justify-center md:justify-end">
                        <FlowArrow direction="down" className="text-2xl" />
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
                      <ProcessNode
                        processKey="SHELLING NEW LINE"
                        group={processGroups["SHELLING NEW LINE"]}
                        active={selectedProcess === "SHELLING NEW LINE"}
                        onClick={setSelectedProcess}
                        isProcessActive={getProcessActiveStatus("SHELLING NEW LINE")}
                      />
                      <div className="flex justify-center">
                        <FlowArrow className="text-xl" />
                      </div>
                      <ProcessNode
                        processKey="SHELL YARD"
                        group={processGroups["SHELL YARD"]}
                        active={selectedProcess === "SHELL YARD"}
                        onClick={setSelectedProcess}
                        isProcessActive={getProcessActiveStatus("SHELL YARD")}
                      />
                      <div className="flex justify-center">
                        <FlowArrow className="text-xl" />
                      </div>
                      <ProcessNode processKey="SHELLING" group={processGroups.SHELLING} active={selectedProcess === "SHELLING"} onClick={setSelectedProcess} isProcessActive={getProcessActiveStatus("SHELLING")} />
                    </div>

                    <div className="flex justify-end pr-[4.5%]">
                      <FlowArrow direction="down" className="text-2xl" />
                    </div>

                    <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
                      <ProcessNode processKey="GRADING" group={processGroups.GRADING} active={selectedProcess === "GRADING"} onClick={setSelectedProcess} isProcessActive={getProcessActiveStatus("GRADING")} />
                      <div className="flex justify-center">
                        <FlowArrow direction="left" className="text-xl" />
                      </div>
                      <ProcessNode processKey="PEELING" group={processGroups.PEELING} active={selectedProcess === "PEELING"} onClick={setSelectedProcess} isProcessActive={getProcessActiveStatus("PEELING")} />
                      <div className="flex justify-center">
                        <FlowArrow direction="left" className="text-xl" />
                      </div>
                      <ProcessNode processKey="BORMA" group={processGroups.BORMA} active={selectedProcess === "BORMA"} onClick={setSelectedProcess} isProcessActive={getProcessActiveStatus("BORMA")} />
                    </div>

                    <div className="flex justify-start pl-[13%]">
                      <FlowArrow direction="down" className="text-2xl" />
                    </div>

                    <div className="max-w-[280px]">
                      <ProcessNode processKey="PACKING" group={processGroups.PACKING} active={selectedProcess === "PACKING"} onClick={setSelectedProcess} isProcessActive={getProcessActiveStatus("PACKING")} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mx-auto w-full h-full max-w-[930px] flex flex-col">
                  <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-4 auto-rows-max w-full h-full">
                    {UTILITY_FLOW.map((key) => (
                      <ProcessNode key={key} processKey={key} group={processGroups[key]} active={selectedProcess === key} onClick={setSelectedProcess} isProcessActive={getProcessActiveStatus(key)} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          <div
            className="grid gap-3 lg:min-h-0"
            style={
              syncedProcessColumnHeight
                ? { height: `${syncedProcessColumnHeight}px`, maxHeight: `${syncedProcessColumnHeight}px` }
                : undefined
            }
          >
            <section className="flex min-h-0 flex-col overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-[#fff7ed]"
                      style={{ color: selectedProcessTone.text }}
                    >
                      <selectedProcessTone.icon className="text-[16px]" />
                    </span>
                    <div className="min-w-0">
                      <ProcessNameText text={selectedProcessLabel} className="truncate text-[13px] font-semibold text-slate-900" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsLoadChartModalOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold text-white whitespace-nowrap"
                      style={{ backgroundColor: "var(--color-indigo-600)" }}
                    >
                      <FiBarChart2 className="text-[12px]" />
                      View Load Chart
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDraftEquipmentFilters(equipmentFilters);
                        setIsFilterModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-md bg-[#f6ead1] px-2.5 py-1 text-[11px] font-semibold text-[#8a6c39]"
                    >
                      <FiFilter className="text-[12px]" />
                      Filter{activeFilterCount ? ` (${activeFilterCount})` : ""}
                    </button>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-2xl bg-[#f4f1eb] px-3 py-3 text-center">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">Equipment Types</div>
                    <div className="mt-1 text-3xl font-semibold leading-none text-slate-900 tabular-nums">{equipmentTypesCount}</div>
                  </div>
                  <div className="rounded-2xl bg-[#f4f1eb] px-3 py-3 text-center">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">Shiftable Load</div>
                    <div className="mt-1 text-3xl font-semibold leading-none text-slate-400">--</div>
                  </div>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
                {selectedEquipment.length ? (
                  <div className="space-y-2">
                    {selectedEquipment.map((item, index) => {
                      const tone = getEquipmentTone(item, index);
                      const ProcessIcon = selectedProcessTone.icon;
                      const controlPresentation = getControlPresentation(item.controlType);
                      const operationPresentation = getOperationPresentation(item.operationType);
                      const ControlIcon = controlPresentation.icon;
                      const OperationIcon = operationPresentation.icon;
                      const isClicked = clickedEquipment.has(item.id);

                      const handleCardClick = () => {
                        setClickedEquipment((prev) => {
                          const next = new Set(prev);
                          if (next.has(item.id)) {
                            next.delete(item.id);
                          } else {
                            next.add(item.id);
                          }
                          return next;
                        });
                      };

                      return (
                        <div
                          key={item.id}
                          onClick={handleCardClick}
                          className={`rounded-2xl border-[1.5px] px-3 py-2.5 cursor-pointer transition-all ${
                            isClicked ? "card-breathing card-neon-active" : ""
                          }`}
                          style={{ borderColor: tone.border, backgroundColor: tone.background }}
                        >
                          <div className="flex items-start gap-3">
                            <div className="relative shrink-0">
                              <span className="absolute -left-1.5 -top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-[12px] font-semibold text-slate-700 shadow">
                                {getUnitCount(item.units)}
                              </span>
                              <span
                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl shadow-sm"
                                style={{ backgroundColor: tone.border, color: tone.text }}
                              >
                                <ProcessIcon className="text-[16px]" />
                              </span>
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="truncate text-[13px] font-semibold text-slate-900">{item.equipmentName}</div>
                                </div>
                                <div className="shrink-0 text-[9px] font-semibold uppercase tracking-[0.04em]" style={{ color: tone.text }}>
                                  {tone.tag}
                                </div>
                              </div>

                              <div className="mt-2 overflow-hidden rounded-xl border border-slate-400 bg-white">
                                <div className="grid grid-cols-[92px_1fr_1fr] text-center">
                                  <div className="flex items-center justify-center px-2 py-2 text-[12px] font-semibold text-slate-800 tabular-nums">
                                    {formatKw(item.totalLoadKw)}
                                  </div>
                                  <div
                                    className="flex flex-col items-center justify-center gap-0.5 border-l border-slate-300 px-2 py-1.5"
                                    title={controlPresentation.label}
                                    aria-label={controlPresentation.label}
                                  >
                                    <ControlIcon className="text-[20px] text-slate-800" />
                                    <div className="text-[8px] font-semibold uppercase tracking-[0.07em] text-slate-500">
                                      {controlPresentation.label}
                                    </div>
                                  </div>
                                  <div
                                    className="flex flex-col items-center justify-center gap-0.5 border-l border-slate-300 px-2 py-1.5"
                                    title={operationPresentation.label}
                                    aria-label={operationPresentation.label}
                                  >
                                    <OperationIcon className="text-[22px] text-slate-800" />
                                    <div className="text-[8px] font-semibold uppercase tracking-[0.07em] text-slate-500">
                                      {operationPresentation.label}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex h-full min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 text-center">
                    <div>
                      <div className="text-sm font-semibold text-slate-700">No equipment matches the selected filters</div>
                      <div className="mt-1 text-xs text-slate-500">Change or clear the filters to see the equipment list again.</div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="border-b border-slate-200 px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Sunpath Visual</div>
          </div>
          <div className="relative h-[220px] md:h-[320px] bg-slate-950">
            <video
              className="pointer-events-none block h-full w-full object-contain"
              src={SUNPATH_VIDEO_SRC}
              poster={SUNPATH_POSTER_SRC}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="border-b border-slate-200 px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Sun Radiation Analysis</div>
          </div>
          <div className="relative h-[220px] md:h-[320px] overflow-hidden bg-[radial-gradient(circle_at_top,#ffffff_0%,#eef2ff_55%,#e2e8f0_100%)]">
            <img src={MODEL_IMAGE_SRC} alt="Pajson Agro 3D model view" className="h-full w-full object-contain" loading="lazy" />
            <div className="absolute bottom-6 left-6 rounded-[32px] border border-slate-200/80 bg-white px-4 py-3 shadow-2xl shadow-slate-300/20">
              <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Solar Radiation Level (kWh/m²)</div>
              <div className="mt-2 h-3 w-[220px] rounded-full bg-[linear-gradient(90deg,#312e81_0%,#2563eb_18%,#38bdf8_36%,#fde047_62%,#fb923c_82%,#dc2626_100%)]" />
              <div className="mt-2 grid grid-cols-5 text-[10px] font-semibold text-slate-600">
                <span className="text-left">0</span>
                <span className="text-center">400</span>
                <span className="text-center">800</span>
                <span className="text-center">1200</span>
                <span className="text-right">1600</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg bg-white shadow">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Energy Analysis</div>
            <div className="mt-1 text-sm font-semibold text-gray-900">Estimated weekly energy split across production and utility blocks</div>
          </div>
          <div className="text-[12px] text-gray-500">Illustrative view seeded from facility process loads</div>
        </div>
        <div className="px-3 pb-2 pt-1">
          <SafeChart
            resetKey="energy-analysis"
            options={energyOptions}
            series={energyAnalysis.series}
            type="bar"
            height={260}
            fallbackHeight={260}
            fallbackText="Energy analysis unavailable"
          />
        </div>
      </section>

      {isFilterModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onClick={() => {
            setDraftEquipmentFilters(equipmentFilters);
            setIsFilterModalOpen(false);
          }}
        >
          <div
            className="flex h-[360px] md:h-[460px] w-full max-w-[860px] flex-col overflow-hidden rounded-[24px] bg-white shadow-2xl max-h-[84vh]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-3.5">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Equipment Filters</div>
                <div className="mt-1">
                  <ProcessNameText text={selectedProcessLabel} className="text-base font-semibold text-slate-900" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={clearEquipmentFilters}
                  className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
                >
                  Clear all
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDraftEquipmentFilters(equipmentFilters);
                    setIsFilterModalOpen(false);
                  }}
                  className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                  aria-label="Close filters"
                >
                  <FiX className="text-[16px]" />
                </button>
              </div>
            </div>

            <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[190px_minmax(0,1fr)]">
              <div className="border-r border-slate-200 bg-slate-50 p-2.5">
                <div className="space-y-2">
                  {filterSections.map((section) => {
                    const selectedCount = draftEquipmentFilters[section.key]?.length || 0;
                    const isActive = activeFilterSection === section.key;
                    return (
                      <button
                        key={section.key}
                        type="button"
                        onClick={() => setActiveFilterSection(section.key)}
                        className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left transition ${
                          isActive
                            ? "border-indigo-200 bg-white text-indigo-700 shadow-sm"
                            : "border-transparent bg-transparent text-slate-600 hover:border-slate-200 hover:bg-white"
                        }`}
                      >
                        <span className="text-sm font-semibold">{section.label}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${isActive ? "bg-indigo-50 text-indigo-700" : "bg-slate-200 text-slate-600"}`}>
                          {selectedCount}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="min-h-0 overflow-y-auto px-4 py-3.5">
                {activeFilterConfig ? (
                  <div className="flex min-h-full flex-col">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{activeFilterConfig.label}</div>
                      <div className="mt-1.5 text-sm text-slate-500">Select one or more options to filter the equipment list.</div>
                    </div>

                    <div className="mt-3 flex-1 space-y-2 overflow-y-auto pr-1">
                      {activeFilterConfig.options.length ? (
                        activeFilterConfig.options.map((option) => (
                          <label key={option} className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 transition hover:border-slate-300">
                            <input
                              type="checkbox"
                              checked={draftEquipmentFilters[activeFilterConfig.key].includes(option)}
                              onChange={() => updateEquipmentFilterGroup(activeFilterConfig.key, option)}
                              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span>{option}</span>
                          </label>
                        ))
                      ) : (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                          No options available for this filter in the selected process.
                        </div>
                      )}
                    </div>

                    <div className="mt-3 border-t border-slate-200 pt-3">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setDraftEquipmentFilters(equipmentFilters);
                            setIsFilterModalOpen(false);
                          }}
                          className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEquipmentFilters(draftEquipmentFilters);
                            setIsFilterModalOpen(false);
                          }}
                          className="rounded-md bg-[#1f5eff] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#194ed8]"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isLoadChartModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onClick={() => setIsLoadChartModalOpen(false)}>
          <div
            className="flex max-h-[90vh] w-full max-w-6xl flex-col min-h-0 overflow-hidden rounded-[24px] bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Load Chart - Expanded View</div>
                <div className="mt-1">
                  <ProcessNameText text={selectedProcessLabel} className="text-base font-semibold text-slate-900" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm text-slate-500">{selectedEquipment.length} items</div>
                <button
                  type="button"
                  onClick={() => setIsLoadChartModalOpen(false)}
                  className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                  aria-label="Close load chart"
                >
                  <FiX className="text-[16px]" />
                </button>
              </div>
            </div>
            <div className="overflow-auto px-5 pb-5 pt-4">
              <div style={{ minWidth: `${modalLoadChartWidth}px` }}>
                <SafeChart
                  resetKey={`load-modal-${selectedProcess}-${selectedEquipment.length}`}
                  options={loadChartModalOptions}
                  series={loadChartSeries}
                  type="bar"
                  height={420}
                  width={modalLoadChartWidth}
                  fallbackHeight={420}
                  fallbackText="Expanded load chart unavailable"
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
