import { useEffect, useMemo, useRef } from "react";
import Chart from "react-apexcharts";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { seededInt, seededNumber, seededShuffle } from "../lib/seeded";
import { defaultOverviewStartKey, fromDateKey, toDateKey, todayDateKey } from "../lib/dateKey";
import { DISTRICT_OPTIONS, getAllConsumers } from "../lib/consumers";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FiActivity, FiPercent, FiTrendingUp, FiUsers } from "react-icons/fi";
import { FaTrophy } from "react-icons/fa";

// Match legacy client theme graph palette
const TEAL = "#13C4A9";
const PURPLE = "#6A42B2";
const OVERVIEW_TABS = ["All", "Industrial", "Commercial"];
const DISTRICT_MAP = {
  SKM: { name: "Srikakulam", lat: 18.2969, lng: 83.8976 },
  VZM: { name: "Vizianagaram", lat: 18.1166, lng: 83.4115 },
  VSP: { name: "Visakhapatnam", lat: 17.6868, lng: 83.2185 },
  AKP: { name: "Anakapalle", lat: 17.6903, lng: 83.0086 },
  EDG: { name: "East Godavari", lat: 17.0005, lng: 81.804 },
  ELR: { name: "West Godavari", lat: 16.7107, lng: 81.0952 },
};
const AP_MAX_BOUNDS = [
  [12.5, 76.5],
  [19.5, 84.5],
];
const AP_STATE_GEOJSON_URL = "/geo/andhra-pradesh-state.geojson";
const AP_DISTRICTS_GEOJSON_URL = "/geo/andhra-pradesh-districts.geojson";
const AP_NEW_DISTRICTS_GEOJSON_URL = "/geo/andhra-pradesh-new-districts.geojson";
const WORLD_MASK_RING = [
  [-90, -180],
  [-90, 180],
  [90, 180],
  [90, -180],
];
const SERVICE_AREA_DISTRICTS = new Set(["Srikakulam", "Vizianagaram", "Visakhapatnam", "East Godavari", "West Godavari"]);
const SERVICE_AREA_NEW_DISTRICTS = new Set(["Anakapalli"]);

function geometryToMaskRings(geometry) {
  if (!geometry) return [];

  if (geometry.type === "Polygon") {
    return geometry.coordinates.map((ring) => ring.map(([lng, lat]) => [lat, lng]));
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.flatMap((polygon) => polygon.map((ring) => ring.map(([lng, lat]) => [lat, lng])));
  }

  return [];
}

function buildMaskRings(geoJson) {
  const features = geoJson?.features ?? [];
  return features.flatMap((feature) => geometryToMaskRings(feature.geometry));
}

function tint(hex, amount01) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const mix = (c) => Math.round(c + (255 - c) * amount01);
  const toHex = (n) => String(n.toString(16)).padStart(2, "0");
  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
}

function daysBetween(startKey, endKey) {
  const s = fromDateKey(startKey);
  const e = fromDateKey(endKey);
  const ms = e.getTime() - s.getTime();
  if (Number.isNaN(ms)) return 0;
  return Math.max(0, Math.floor(ms / 86400000));
}

function buildDateCategories(startKey, endKey, maxPoints = 14) {
  const totalDays = daysBetween(startKey, endKey) + 1;
  const s = fromDateKey(startKey);
  if (!Number.isFinite(totalDays) || totalDays <= 0 || Number.isNaN(s.getTime())) {
    return Array.from({ length: maxPoints }, (_, i) => `D${i + 1}`);
  }
  const points = Math.min(maxPoints, totalDays);
  const step = totalDays <= points ? 1 : (totalDays - 1) / (points - 1);
  const cats = [];
  for (let i = 0; i < points; i += 1) {
    const d = new Date(s);
    d.setDate(d.getDate() + Math.round(i * step));
    const k = toDateKey(d);
    cats.push(k.slice(5)); // MM-DD
  }
  return cats;
}

function StatCard({ label, value, suffix, icon }) {
  return (
    <div className="bg-white rounded-lg shadow px-4 py-3 h-[76px] flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] text-gray-500 leading-tight truncate">{label}</div>
        <div className="text-base font-semibold mt-1 tabular-nums leading-tight truncate">
          {value}
          {suffix ? <span className="text-xs text-gray-400 ml-1">{suffix}</span> : null}
        </div>
      </div>
    </div>
  );
}

function MedalBadge({ position }) {
  const variants = {
    1: {
      ribbonLeft: "#A81516",
      ribbonRight: "#4B1112",
      medalOuter: "#C97F18",
      medalInner: "#F4C542",
      accent: "#8F4D05",
    },
    2: {
      ribbonLeft: "#6AA6E8",
      ribbonRight: "#415A73",
      medalOuter: "#7B8794",
      medalInner: "#D9E0E8",
      accent: "#4D5762",
    },
    3: {
      ribbonLeft: "#2D9E44",
      ribbonRight: "#196B2D",
      medalOuter: "#8D4F25",
      medalInner: "#D8843C",
      accent: "#5F3114",
    },
  };

  const palette = variants[position];
  if (!palette) return null;

  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" aria-hidden="true">
      <path d="M6 2h4l2 6H9L6 2Z" fill={palette.ribbonLeft} />
      <path d="M14 2h4l-3 6h-3l2-6Z" fill={palette.ribbonRight} />
      <circle cx="12" cy="15" r="6.2" fill={palette.medalOuter} />
      <circle cx="12" cy="15" r="4.4" fill={palette.medalInner} />
      <circle cx="12" cy="15" r="2.1" fill={palette.accent} opacity="0.16" />
      <text
        x="12"
        y="16.3"
        textAnchor="middle"
        fontSize="6"
        fontWeight="700"
        fill="#fff7d6"
        style={{ paintOrder: "stroke", stroke: palette.accent, strokeWidth: "0.8px" }}
      >
        {position}
      </text>
    </svg>
  );
}

function RankBadge({ position }) {
  if (position <= 3) return <MedalBadge position={position} />;

  return (
    <div className="w-6 h-6 shrink-0 rounded-full bg-[#f1ecff] text-[#6A42B2] flex items-center justify-center text-[11px] font-semibold">
      {position}
    </div>
  );
}

function LeaderboardTable({ title, rows, onRowClick, onViewMore, className }) {
  const rowTone = (position) => {
    if (position <= 3) return "bg-[#f5f1df]";
    return "bg-white";
  };

  return (
    <div className={`bg-white rounded-lg shadow p-2.5 flex flex-col min-h-0 ${className || ""}`}>
      <div className="flex items-center justify-between mb-1.5 shrink-0">
        <div className="text-sm font-semibold">{title}</div>
        <button
          type="button"
          onClick={onViewMore}
          aria-label="View more"
          className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm hover:bg-indigo-700 transition"
        >
          <FaTrophy className="text-[18px]" />
        </button>
      </div>
      <div className="flex-1 min-h-0 bg-gray-50 rounded-lg p-1.5 space-y-1.5 overflow-hidden">
        {rows.map((r) => (
          <button
            key={r.serviceNo}
            type="button"
            onClick={() => onRowClick(r)}
            className={`w-full text-left rounded-xl px-2.5 py-2 flex items-center gap-2.5 transition hover:-translate-y-0.5 hover:shadow-md ${rowTone(
              r.position
            )}`}
          >
            <RankBadge position={r.position} />
            <div className="min-w-0 flex-1 flex items-center gap-2">
              <div className="font-semibold text-[15px] text-gray-900 tabular-nums whitespace-nowrap">{r.serviceNo}</div>
              <div className="min-w-0 text-[12px] text-gray-600 truncate" title={r.consumerName}>
                {r.consumerName}
              </div>
            </div>
            <div className="text-[18px] leading-none font-semibold text-[#7A17CC] tabular-nums whitespace-nowrap">
              {r.score}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function matchesTab(category, tab) {
  const categoryText = String(category).toUpperCase();
  if (tab === "Industrial") return categoryText.includes("INDUSTRY");
  if (tab === "Commercial") return categoryText.includes("COMMERCIAL");
  return true;
}

function AndhraConsumerMap({ consumers, onConsumerClick }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerLayerRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return undefined;

    const apBounds = L.latLngBounds(AP_MAX_BOUNDS);

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      scrollWheelZoom: false,
      maxBounds: apBounds,
      maxBoundsViscosity: 1.0,
      zoomSnap: 0.25,
      zoomDelta: 0.25,
      wheelPxPerZoomLevel: 100,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 18,
    }).addTo(map);

    map.fitBounds(apBounds);
    map.setMaxBounds(apBounds);

    const maskPane = map.createPane("ap-mask");
    maskPane.style.zIndex = "350";
    maskPane.style.pointerEvents = "none";

    const districtBoundaryPane = map.createPane("ap-district-boundaries");
    districtBoundaryPane.style.zIndex = "360";
    districtBoundaryPane.style.pointerEvents = "none";

    const stateBoundaryPane = map.createPane("ap-state-boundary");
    stateBoundaryPane.style.zIndex = "370";
    stateBoundaryPane.style.pointerEvents = "none";

    const serviceAreaPane = map.createPane("ap-service-area");
    serviceAreaPane.style.zIndex = "380";
    serviceAreaPane.style.pointerEvents = "none";

    let cancelled = false;
    let fittedBounds = apBounds;
    const fitToState = () => {
      if (fittedBounds?.isValid?.()) {
        map.fitBounds(fittedBounds, { padding: [4, 4], animate: false });
      }
    };

    void Promise.all([
      fetch(AP_STATE_GEOJSON_URL).then((response) => response.json()),
      fetch(AP_DISTRICTS_GEOJSON_URL).then((response) => response.json()),
      fetch(AP_NEW_DISTRICTS_GEOJSON_URL).then((response) => response.json()),
    ])
      .then(([stateGeoJson, districtGeoJson, newDistrictGeoJson]) => {
        if (cancelled) return;

        const maskRings = buildMaskRings(stateGeoJson);
        if (maskRings.length) {
          L.polygon([WORLD_MASK_RING, ...maskRings], {
            pane: "ap-mask",
            stroke: false,
            fillColor: "#f8fafc",
            fillOpacity: 1,
            interactive: false,
          }).addTo(map);
        }

        L.geoJSON(districtGeoJson, {
          pane: "ap-district-boundaries",
          interactive: false,
          style: {
            color: "#cbd5e1",
            weight: 1,
            opacity: 0.9,
            fillColor: "#ffffff",
            fillOpacity: 0,
          },
        }).addTo(map);

        const stateLayer = L.geoJSON(stateGeoJson, {
          pane: "ap-state-boundary",
          interactive: false,
          style: {
            color: "#334155",
            weight: 1.5,
            opacity: 1,
            fillColor: "#ffffff",
            fillOpacity: 0,
          },
        }).addTo(map);

        L.geoJSON(districtGeoJson, {
          pane: "ap-service-area",
          interactive: false,
          filter: (feature) => SERVICE_AREA_DISTRICTS.has(feature?.properties?.dtname),
          style: {
            color: PURPLE,
            weight: 2.5,
            opacity: 1,
            fillOpacity: 0,
          },
        }).addTo(map);

        L.geoJSON(newDistrictGeoJson, {
          pane: "ap-service-area",
          interactive: false,
          filter: (feature) => SERVICE_AREA_NEW_DISTRICTS.has(feature?.properties?.NAME),
          style: {
            color: PURPLE,
            weight: 2.5,
            opacity: 1,
            fillOpacity: 0,
          },
        }).addTo(map);

        const stateBounds = stateLayer.getBounds();
        if (stateBounds.isValid()) {
          fittedBounds = stateBounds;
          fitToState();
          map.setMinZoom(map.getZoom());
        }
      })
      .catch((error) => {
        console.error("Failed to load Andhra Pradesh boundaries", error);
        map.setMinZoom(map.getZoom());
      });

    markerLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    const invalidate = () => {
      map.invalidateSize();
      fitToState();
    };
    const onWheel = (event) => {
      if (event.ctrlKey) {
        map.scrollWheelZoom.enable();
        event.preventDefault();
        return;
      }

      map.scrollWheelZoom.disable();
      event.preventDefault();
    };
    const disableWheelZoom = () => map.scrollWheelZoom.disable();

    window.setTimeout(invalidate, 0);
    window.addEventListener("resize", invalidate);
    map.getContainer().addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keyup", disableWheelZoom);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", invalidate);
      window.removeEventListener("keyup", disableWheelZoom);
      map.getContainer().removeEventListener("wheel", onWheel);
      markerLayerRef.current = null;
      mapRef.current = null;
      map.remove();
    };
  }, []);

  useEffect(() => {
    const markerLayer = markerLayerRef.current;
    if (!markerLayer) return;

    markerLayer.clearLayers();

    consumers.forEach((consumer) => {
      const isIndustrial = String(consumer.category).toUpperCase().includes("INDUSTRY");
      const marker = L.circleMarker([consumer.mapLat, consumer.mapLng], {
        radius: isIndustrial ? 7 : 6,
        color: "#ffffff",
        weight: 2,
        fillColor: isIndustrial ? PURPLE : TEAL,
        fillOpacity: 0.95,
      });

      marker.bindTooltip(
        `
          <div style="min-width: 150px;">
            <div style="font-weight: 700; color: #0f172a;">${consumer.consumerName}</div>
            <div style="font-size: 12px; color: #475569;">${consumer.serviceNo}</div>
          </div>
        `,
        {
          direction: "top",
          offset: [0, -10],
          opacity: 1,
        }
      );
      marker.on("click", () => onConsumerClick(consumer));
      marker.addTo(markerLayer);
    });
  }, [consumers, onConsumerClick]);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 mb-3">
        <div>
          <div className="text-base font-semibold text-gray-900">APEPDCL Consumer Map</div>
          <div className="text-sm text-gray-500">Hover a consumer point to view the name and service number. Click to open stats.</div>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-600 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#6A42B2]" />
            Industrial
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#13C4A9]" />
            Commercial
          </div>
          <div className="text-gray-400">{consumers.length} consumers shown</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <div ref={mapContainerRef} className="h-[560px] w-full" />
      </div>
    </div>
  );
}

export default function OverviewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultStart = useMemo(() => defaultOverviewStartKey(), []);
  const todayKey = useMemo(() => todayDateKey(), []);
  const allConsumers = useMemo(() => getAllConsumers(), []);
  const districtOptions = useMemo(
    () => ["All", ...DISTRICT_OPTIONS.filter((option) => option !== "All Districts")],
    []
  );

  const tabParam = searchParams.get("tab");
  const districtParam = searchParams.get("district") || "All";
  const startParam = searchParams.get("startKey");
  const tab = OVERVIEW_TABS.includes(tabParam) ? tabParam : "All";
  const district = districtOptions.includes(districtParam) ? districtParam : "All";
  const startKey =
    startParam && !Number.isNaN(fromDateKey(startParam).getTime())
      ? startParam > todayKey
        ? todayKey
        : startParam
      : defaultStart;
  const endKey = todayKey;

  const seed = `${startKey}|${endKey}|${tab}|${district}`;
  const leaderboardSeed = `${startKey}|${endKey}|leaderboard|${district}`;
  const categories = useMemo(() => buildDateCategories(startKey, endKey), [endKey, startKey]);
  const filteredConsumers = useMemo(() => {
    if (district === "All") return allConsumers;
    return allConsumers.filter((consumer) => String(consumer.serviceNo).slice(0, 3).toUpperCase() === district);
  }, [allConsumers, district]);
  const mapConsumers = useMemo(
    () =>
      filteredConsumers
        .filter((consumer) => matchesTab(consumer.category, tab))
        .map((consumer) => {
          const districtCode = String(consumer.serviceNo).slice(0, 3).toUpperCase();
          const districtCenter = DISTRICT_MAP[districtCode];
          const latOffset = seededNumber(`${consumer.serviceNo}|map|lat`, -0.18, 0.18);
          const lngOffset = seededNumber(`${consumer.serviceNo}|map|lng`, -0.22, 0.22);
          return {
            ...consumer,
            mapLat: (districtCenter?.lat ?? 16.8) + latOffset,
            mapLng: (districtCenter?.lng ?? 81.6) + lngOffset,
          };
        }),
    [filteredConsumers, tab]
  );

  const stats = useMemo(() => {
    const tabBoost = tab === "All" ? 1 : 0.65;
    return {
      activeParticipants: seededInt(`${seed}|ap`, 2400, Math.round(9800 * tabBoost)),
      totalPeakUnits: Math.round(seededNumber(`${seed}|tpu`, 28_000, 96_000) * tabBoost),
      shiftedPeakUnits: Math.round(seededNumber(`${seed}|spu`, 320, 1760) * tabBoost),
      participationRate: Math.round(seededNumber(`${seed}|pr`, 22, 88)),
    };
  }, [seed, tab]);

  const consumerSplitPie = useMemo(() => {
    const industrialCount = filteredConsumers.filter((c) => String(c.category).toUpperCase().includes("INDUSTRY")).length;
    const commercialCount = filteredConsumers.filter((c) => String(c.category).toUpperCase().includes("COMMERCIAL")).length;
    return {
      series: [industrialCount, commercialCount],
      options: {
        chart: { type: "pie", toolbar: { show: false } },
        labels: ["Industrial", "Commercial"],
        dataLabels: { enabled: false },
        legend: { position: "bottom" },
        colors: [PURPLE, TEAL],
      },
    };
  }, [filteredConsumers]);

  const pie = useMemo(() => {
    const cfg =
      tab === "Industrial"
        ? ["Manufacturing", "Agro", "Food", "Others"]
        : tab === "Commercial"
          ? ["Retail", "Offices", "Hospitality", "Others"]
          : ["Industrial", "Commercial", "Public", "Others"];

    const series = cfg.map((label) => seededInt(`${seed}|pie|${label}`, 10, 65));
    return {
      series,
      options: {
        chart: { type: "pie", toolbar: { show: false } },
        labels: cfg,
        dataLabels: { enabled: false },
        legend: { position: "bottom" },
        colors: [TEAL, PURPLE, tint(TEAL, 0.45), tint(PURPLE, 0.45)],
      },
    };
  }, [seed, tab]);

  const todColors = useMemo(
    () => ({
      peak1: PURPLE,
      peak2: tint(PURPLE, 0.28),
      nonPeak: TEAL,
      offPeak: tint(TEAL, 0.34),
    }),
    []
  );

  const todPie = useMemo(() => {
    const tooltip = {
      enabled: true,
      custom: ({ series, seriesIndex, w }) => {
        const label = w?.globals?.labels?.[seriesIndex] ?? "";
        const value = Number(series?.[seriesIndex] ?? 0);
        const total = Array.isArray(series) ? series.reduce((a, b) => a + Number(b || 0), 0) : 0;
        const pct = total > 0 ? (value / total) * 100 : 0;

        const pctStr = `${pct.toFixed(1)}%`;
        const valueStr = `${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MWh`;

        return `
          <div style="background: rgba(255,255,255,0.96); border: 1px solid rgba(148,163,184,0.45); border-radius: 10px; padding: 10px 12px; box-shadow: 0 10px 24px rgba(15, 23, 42, 0.18); min-width: 160px;">
            <div style="font-size: 12px; color: #0f172a; opacity: 0.88; margin-bottom: 4px;">${label}</div>
            <div style="display: flex; align-items: baseline; gap: 8px;">
              <div style="font-size: 18px; font-weight: 700; color: #0f172a;">${pctStr}</div>
              <div style="font-size: 14px; color: #0f172a; opacity: 0.72;">(${valueStr})</div>
            </div>
          </div>
        `;
      },
    };

    if (tab === "Industrial") {
      const labels = ["Peak 1", "Peak 2", "Non-Peak", "Off-Peak"];
      return {
        series: labels.map((label) => seededNumber(`${seed}|tod|${label}`, 18_000, 110_000)),
        options: {
          chart: { type: "pie", toolbar: { show: false } },
          labels,
          dataLabels: { enabled: false },
          legend: { position: "bottom" },
          tooltip,
          colors: [todColors.peak1, todColors.peak2, todColors.nonPeak, todColors.offPeak],
        },
      };
    }

    if (tab === "Commercial") {
      const labels = ["Peak", "Off-Peak"];
      return {
        series: labels.map((label) => seededNumber(`${seed}|tod|${label}`, 18_000, 110_000)),
        options: {
          chart: { type: "pie", toolbar: { show: false } },
          labels,
          dataLabels: { enabled: false },
          legend: { position: "bottom" },
          tooltip,
          colors: [todColors.peak1, todColors.offPeak],
        },
      };
    }

    const labels = ["Peak", "Non-Peak"];
    return {
      series: labels.map((label) => seededNumber(`${seed}|tod|${label}`, 18_000, 110_000)),
      options: {
        chart: { type: "pie", toolbar: { show: false } },
        labels,
        dataLabels: { enabled: false },
        legend: { position: "bottom" },
        tooltip,
        colors: [todColors.peak1, todColors.offPeak],
      },
    };
  }, [seed, tab, todColors]);

  const peakVsNonPeak = useMemo(() => {
    const peakUnits = categories.map((k, i) => seededInt(`${seed}|bar|peak|${k}|${i}`, 320, 980));
    const normalUnits = categories.map((k, i) => seededInt(`${seed}|bar|normal|${k}|${i}`, 540, 1380));
    const totals = peakUnits.map((value, index) => value + normalUnits[index]);
    return {
      series: [
        { name: "Non-Peak", data: normalUnits },
        { name: "Peak", data: peakUnits },
      ],
      options: {
        chart: { type: "bar", stacked: true, toolbar: { show: false } },
        plotOptions: { bar: { columnWidth: "54%", borderRadius: 4, borderRadiusApplication: "end" } },
        dataLabels: { enabled: false },
        xaxis: { categories },
        legend: { position: "bottom" },
        colors: [TEAL, PURPLE],
        tooltip: {
          custom: ({ dataPointIndex }) => {
            const day = categories[dataPointIndex] ?? "";
            const peak = peakUnits[dataPointIndex] ?? 0;
            const normal = normalUnits[dataPointIndex] ?? 0;
            const total = totals[dataPointIndex] ?? 0;

            return `
              <div style="background: rgba(255,255,255,0.96); border: 1px solid rgba(148,163,184,0.45); border-radius: 10px; padding: 10px 12px; box-shadow: 0 10px 24px rgba(15, 23, 42, 0.18); min-width: 180px;">
                <div style="font-size: 12px; color: #0f172a; opacity: 0.82; margin-bottom: 6px;">${day}</div>
                <div style="font-size: 13px; color: #0f172a; margin-bottom: 3px;"><strong>Total Consumption:</strong> ${total.toLocaleString()} kWh</div>
                <div style="font-size: 12px; color: #475569;">Peak: ${peak.toLocaleString()} kWh | Non-Peak: ${normal.toLocaleString()} kWh</div>
              </div>
            `;
          },
        },
      },
    };
  }, [categories, seed]);

  const leaderboards = useMemo(() => {
    const industrial = filteredConsumers.filter((c) => String(c.category).toUpperCase().includes("INDUSTRY"));
    const commercial = filteredConsumers.filter((c) => String(c.category).toUpperCase().includes("COMMERCIAL"));

    const scoreRow = (c) => {
      const score = seededNumber(`${leaderboardSeed}|lb|${c.serviceNo}|score`, 2.1, 29.8);
      return {
        ...c,
        score: `${score.toFixed(1)}%`,
      };
    };

    const industrialRows = seededShuffle(`${leaderboardSeed}|lb|ind`, industrial.map(scoreRow))
      .sort((a, b) => Number.parseFloat(b.score) - Number.parseFloat(a.score))
      .slice(0, 4)
      .map((r, idx) => ({ ...r, position: idx + 1 }));

    const commercialRows = seededShuffle(`${leaderboardSeed}|lb|com`, commercial.map(scoreRow))
      .sort((a, b) => Number.parseFloat(b.score) - Number.parseFloat(a.score))
      .slice(0, 4)
      .map((r, idx) => ({ ...r, position: idx + 1 }));

    return { industrialRows, commercialRows };
  }, [filteredConsumers, leaderboardSeed]);

  const onRowClick = (r) => {
    const qs = new URLSearchParams({
      consumerName: r.consumerName,
      category: r.category,
    });
    navigate(`/stats/${encodeURIComponent(r.serviceNo)}?${qs.toString()}`);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Active Participants" value={stats.activeParticipants.toLocaleString()} icon={<FiUsers />} />
        <StatCard
          label="Total Peak Units"
          value={stats.totalPeakUnits.toLocaleString()}
          suffix="kWh"
          icon={<FiTrendingUp />}
        />
        <StatCard label="Shifted Peak Units" value={stats.shiftedPeakUnits.toLocaleString()} suffix="kWh" icon={<FiActivity />} />
        <StatCard label="Participation Rate" value={stats.participationRate} suffix="%" icon={<FiPercent />} />
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:items-stretch">
          <div className="bg-white rounded-lg shadow p-3 h-full">
            {tab === "All" ? (
              <>
                <div className="text-sm font-semibold mb-2">Total Consumers: Industrial vs Commercial</div>
                <Chart options={consumerSplitPie.options} series={consumerSplitPie.series} type="pie" height={220} />
              </>
            ) : (
              <>
                <div className="text-sm font-semibold mb-2">Types of Consumers</div>
                <Chart options={pie.options} series={pie.series} type="pie" height={220} />
              </>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-3 h-full">
            {tab === "All" ? (
              <>
                <div className="text-sm font-semibold mb-2">Total Consumption - TOD</div>
                <Chart options={todPie.options} series={todPie.series} type="pie" height={220} />
              </>
            ) : (
              <>
                <div className="text-sm font-semibold mb-2">Consumption - TOD</div>
                <Chart options={todPie.options} series={todPie.series} type="pie" height={220} />
              </>
            )}
          </div>

          <LeaderboardTable
            className="h-full"
            title="Industrial Consumer Leaderboard"
            rows={leaderboards.industrialRows}
            onRowClick={onRowClick}
            onViewMore={() => navigate("/monitor?tab=industrial")}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:items-stretch">
          <div className="bg-white rounded-lg shadow p-3 lg:col-span-2 h-full">
            <div className="text-sm font-semibold mb-2">Peak vs Non-Peak (Last 14 Days)</div>
            <Chart options={peakVsNonPeak.options} series={peakVsNonPeak.series} type="bar" height={235} />
          </div>

          <LeaderboardTable
            className="h-full"
            title="Commercial Consumer Leaderboard"
            rows={leaderboards.commercialRows}
            onRowClick={onRowClick}
            onViewMore={() => navigate("/monitor?tab=commercial")}
          />
        </div>

        <AndhraConsumerMap consumers={mapConsumers} onConsumerClick={onRowClick} />
      </div>
    </div>
  );
}
