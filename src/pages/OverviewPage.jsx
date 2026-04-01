import { useEffect, useMemo, useRef, useState } from "react";
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
  MNY: { name: "Parvathipuram Manyam", lat: 18.7731, lng: 83.4264 },
  VZM: { name: "Vizianagaram", lat: 18.1166, lng: 83.4115 },
  VSP: { name: "Visakhapatnam", lat: 17.6868, lng: 83.2185 },
  AKP: { name: "Anakapalle", lat: 17.6903, lng: 83.0086 },
  ASR: { name: "Alluri Sitharama Raju", lat: 17.9172, lng: 82.7146 },
  KKD: { name: "Kakinada", lat: 16.9891, lng: 82.2475 },
  KSM: { name: "Dr. B.R. Ambedkar Konaseema", lat: 16.582, lng: 82.0167 },
  EDG: { name: "East Godavari", lat: 17.0005, lng: 81.804 },
  RJY: { name: "Rajamahendravaram", lat: 17.0052, lng: 81.7778 },
  ELU: { name: "Eluru", lat: 16.7107, lng: 81.0952 },
  ELR: { name: "West Godavari", lat: 16.7107, lng: 81.0952 },
};
const AP_MAX_BOUNDS = [
  [12.5, 76.5],
  [19.5, 84.5],
];
const AP_STATE_GEOJSON_URL = "/geo/andhra-pradesh-state.geojson";
const AP_DISTRICTS_GEOJSON_URL = "/geo/andhra-pradesh-districts.geojson";
const AP_NEW_DISTRICTS_GEOJSON_URL = "/geo/andhra-pradesh-new-districts.geojson";
const REAL_CONSUMER_COORDS_URL = "/data/consumer-lat-long.json";
const AP_HEADQUARTERS_COORDS = [17.738639, 83.308664];
const WORLD_MASK_RING = [
  [-90, -180],
  [-90, 180],
  [90, 180],
  [90, -180],
];
const SERVICE_AREA_NEW_DISTRICTS = new Set([
  "Srikakulam",
  "Manyam District",
  "Vizianagaram",
  "Visakhapatnam",
  "Anakapalli",
  "AlluriSitharama Raju District",
  "Kakinada",
  "KonaSeema",
  "East Godavari",
  "Eluru",
  "West Godavari",
]);
const MAP_DISTRICT_OPTIONS = [
  { value: "All", label: "All Districts" },
  { value: "SKM", label: "Srikakulam" },
  { value: "MNY", label: "Parvathipuram Manyam" },
  { value: "VZM", label: "Vizianagaram" },
  { value: "VSP", label: "Visakhapatnam" },
  { value: "AKP", label: "Anakapalli" },
  { value: "ASR", label: "Alluri Sitharama Raju" },
  { value: "KKD", label: "Kakinada" },
  { value: "KSM", label: "Dr. B.R. Ambedkar Konaseema" },
  { value: "EDG", label: "East Godavari" },
  { value: "RJY", label: "Rajamahendravaram" },
  { value: "ELU", label: "Eluru" },
  { value: "ELR", label: "West Godavari" },
];
const DISTRICT_GEOMETRY_LOOKUP = {
  SKM: { property: "NAME", value: "Srikakulam", source: "new" },
  MNY: { property: "NAME", value: "Manyam District", source: "new" },
  VZM: { property: "NAME", value: "Vizianagaram", source: "new" },
  VSP: { property: "NAME", value: "Visakhapatnam", source: "new" },
  AKP: { property: "NAME", value: "Anakapalli", source: "new" },
  ASR: { property: "NAME", value: "AlluriSitharama Raju District", source: "new" },
  KKD: { property: "NAME", value: "Kakinada", source: "new" },
  KSM: { property: "NAME", value: "KonaSeema", source: "new" },
  EDG: { property: "NAME", value: "East Godavari", source: "new" },
  RJY: { property: "NAME", value: "East Godavari", source: "new" },
  ELU: { property: "NAME", value: "Eluru", source: "new" },
  ELR: { property: "NAME", value: "West Godavari", source: "new" },
};
const SPECIAL_CONSUMER_POINTS = {
  KKD001: { lat: 16.9891, lng: 82.2475 },
  KKD002: { lat: 17.0778, lng: 82.1384 },
  ELU001: { lat: 17.2475, lng: 81.6437 },
};
const DISTRICT_PREFIX_ALIASES = {
  SKL: "SKM",
  SKM: "SKM",
  VZM: "VZM",
  VSP: "VSP",
  ELR: "ELR",
  RJY: "RJY",
  ELU: "ELU",
  EDG: "EDG",
  KKD: "KKD",
  AKP: "AKP",
  ASR: "ASR",
  MNY: "MNY",
  KSM: "KSM",
};

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

function buildFocusGeoJson(selectedDistrict, stateGeoJson, legacyDistrictGeoJson, newDistrictGeoJson) {
  if (!selectedDistrict || selectedDistrict === "All") return stateGeoJson;

  const lookup = DISTRICT_GEOMETRY_LOOKUP[selectedDistrict];
  if (!lookup) return stateGeoJson;

  const sourceGeoJson = lookup.source === "legacy" ? legacyDistrictGeoJson : newDistrictGeoJson;
  const feature = findFeatureByProperty(sourceGeoJson, lookup.property, lookup.value);

  return feature ? { type: "FeatureCollection", features: [feature] } : stateGeoJson;
}

function findFeatureByProperty(geoJson, property, value) {
  return geoJson?.features?.find((feature) => feature?.properties?.[property] === value) ?? null;
}

function getGeometryBounds(geometry) {
  if (!geometry) return null;

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  const visit = (coordinates) => {
    if (!Array.isArray(coordinates)) return;
    if (typeof coordinates[0] === "number" && typeof coordinates[1] === "number") {
      const [lng, lat] = coordinates;
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
      return;
    }
    coordinates.forEach(visit);
  };

  visit(geometry.coordinates);
  if (!Number.isFinite(minLat) || !Number.isFinite(minLng)) return null;

  return { minLat, maxLat, minLng, maxLng };
}

function ringContainsPoint(point, ring) {
  const [lng, lat] = point;
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [lngI, latI] = ring[i];
    const [lngJ, latJ] = ring[j];
    const intersects =
      latI > lat !== latJ > lat && lng < ((lngJ - lngI) * (lat - latI)) / ((latJ - latI) || Number.EPSILON) + lngI;
    if (intersects) inside = !inside;
  }

  return inside;
}

function polygonContainsPoint(point, polygonCoordinates) {
  if (!ringContainsPoint(point, polygonCoordinates[0])) return false;

  for (let i = 1; i < polygonCoordinates.length; i += 1) {
    if (ringContainsPoint(point, polygonCoordinates[i])) return false;
  }

  return true;
}

function geometryContainsPoint(point, geometry) {
  if (!geometry) return false;
  if (geometry.type === "Polygon") return polygonContainsPoint(point, geometry.coordinates);
  if (geometry.type === "MultiPolygon") return geometry.coordinates.some((polygon) => polygonContainsPoint(point, polygon));
  return false;
}

function buildDistrictGeometryMap(legacyDistrictGeoJson, newDistrictGeoJson) {
  const result = {};

  Object.entries(DISTRICT_GEOMETRY_LOOKUP).forEach(([districtCode, lookup]) => {
    const sourceGeoJson = lookup.source === "legacy" ? legacyDistrictGeoJson : newDistrictGeoJson;
    const feature = findFeatureByProperty(sourceGeoJson, lookup.property, lookup.value);
    if (feature?.geometry) {
      result[districtCode] = {
        geometry: feature.geometry,
        bounds: getGeometryBounds(feature.geometry),
      };
    }
  });

  return result;
}

function normalizeDistrictCode(code) {
  const districtCode = String(code || "").trim().toUpperCase();
  return DISTRICT_PREFIX_ALIASES[districtCode] ?? districtCode;
}

function getConsumerDistrictCode(consumer) {
  if (consumer?.districtCode) {
    return normalizeDistrictCode(consumer.districtCode);
  }

  return normalizeDistrictCode(String(consumer?.serviceNo || "").slice(0, 3));
}

function buildRealMapConsumer(row) {
  const serviceNo = String(row?.scno || "").trim().toUpperCase();
  const districtCode = getConsumerDistrictCode({ serviceNo });
  const industrialSeed = seededInt(`${serviceNo}|segment`, 0, 1) === 1;

  return {
    serviceNo,
    consumerName: `SCN ${serviceNo}`,
    category: industrialSeed ? "INDUSTRY (GENERAL)-HT" : "COMMERCIAL-HT",
    contractedDemand: seededInt(`${serviceNo}|cd`, industrialSeed ? 120 : 60, industrialSeed ? 520 : 260),
    htIncomerKv: 11,
    districtCode,
    mapLat: Number(row?.latitude),
    mapLng: Number(row?.longitude),
    coordinateSource: "real",
  };
}

function isPointInsideDistrict(lat, lng, districtGeometry) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    districtGeometry?.geometry &&
    geometryContainsPoint([lng, lat], districtGeometry.geometry)
  );
}

function resolveConsumerLatLng(consumer, districtGeometryMap, options = {}) {
  const consumerDistrictCode = getConsumerDistrictCode(consumer);
  const focusDistrictCode = normalizeDistrictCode(options.focusDistrictCode || consumerDistrictCode);
  const districtGeometry = districtGeometryMap[focusDistrictCode] ?? districtGeometryMap[consumerDistrictCode];
  const districtCenter = DISTRICT_MAP[focusDistrictCode] ?? DISTRICT_MAP[consumerDistrictCode];
  const explicitLat = Number(consumer.mapLat);
  const explicitLng = Number(consumer.mapLng);
  if (
    Number.isFinite(explicitLat) &&
    Number.isFinite(explicitLng) &&
    (!districtGeometry?.geometry || isPointInsideDistrict(explicitLat, explicitLng, districtGeometry))
  ) {
    return { lat: explicitLat, lng: explicitLng };
  }

  const specialPoint = SPECIAL_CONSUMER_POINTS[consumer.serviceNo];
  if (specialPoint && (!districtGeometry?.geometry || isPointInsideDistrict(specialPoint.lat, specialPoint.lng, districtGeometry))) {
    return specialPoint;
  }

  if (!districtGeometry?.geometry || !districtGeometry.bounds) {
    return {
      lat: districtCenter?.lat ?? consumer.mapLat ?? 16.8,
      lng: districtCenter?.lng ?? consumer.mapLng ?? 81.6,
    };
  }

  const { minLat, maxLat, minLng, maxLng } = districtGeometry.bounds;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const lat = seededNumber(`${consumer.serviceNo}|poly|lat|${attempt}`, minLat, maxLat);
    const lng = seededNumber(`${consumer.serviceNo}|poly|lng|${attempt}`, minLng, maxLng);
    if (geometryContainsPoint([lng, lat], districtGeometry.geometry)) {
      return { lat, lng };
    }
  }

  return {
    lat: districtCenter?.lat ?? consumer.mapLat ?? 16.8,
    lng: districtCenter?.lng ?? consumer.mapLng ?? 81.6,
  };
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

function AndhraConsumerMap({ consumers, onConsumerClick, tab }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerLayerRef = useRef(null);
  const boundaryLayersRef = useRef([]);
  const hqMarkerRef = useRef(null);
  const canvasRendererRef = useRef(null);
  const resizeFrameRef = useRef(0);
  const focusBoundsRef = useRef(null);
  const defaultMinZoomRef = useRef(null);
  const geoJsonDataRef = useRef({
    stateGeoJson: null,
    districtGeoJson: null,
    newDistrictGeoJson: null,
  });
  const districtGeometryRef = useRef({});
  const [districtGeometryVersion, setDistrictGeometryVersion] = useState(0);
  const [isBoundaryDataReady, setIsBoundaryDataReady] = useState(false);
  const [realMapConsumers, setRealMapConsumers] = useState([]);
  const [selectedMapDistrict, setSelectedMapDistrict] = useState("All");
  const baseMapConsumers = useMemo(() => {
    const sourceConsumers = realMapConsumers.length ? realMapConsumers : consumers;
    return sourceConsumers.filter((consumer) => matchesTab(consumer.category, tab));
  }, [consumers, realMapConsumers, tab]);
  const visibleConsumers = useMemo(
    () =>
      selectedMapDistrict === "All"
        ? baseMapConsumers
        : baseMapConsumers.filter((consumer) => getConsumerDistrictCode(consumer) === selectedMapDistrict),
    [baseMapConsumers, selectedMapDistrict]
  );

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return undefined;

    const apBounds = L.latLngBounds(AP_MAX_BOUNDS);
    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      scrollWheelZoom: false,
      maxBounds: apBounds,
      maxBoundsViscosity: 1.0,
      preferCanvas: true,
      zoomAnimation: true,
      fadeAnimation: false,
      markerZoomAnimation: false,
      zoomSnap: 0.25,
      zoomDelta: 0.25,
      wheelPxPerZoomLevel: 100,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 18,
      keepBuffer: 8,
      updateWhenIdle: false,
      updateWhenZooming: true,
    }).addTo(map);

    map.fitBounds(apBounds);
    map.setMaxBounds(apBounds);
    defaultMinZoomRef.current = map.getZoom();
    map.setMinZoom(defaultMinZoomRef.current);
    focusBoundsRef.current = apBounds;
    canvasRendererRef.current = L.canvas({ padding: 0.4 });

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

    const hqMarkerPane = map.createPane("ap-hq-marker");
    hqMarkerPane.style.zIndex = "650";

    markerLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    const invalidate = () => {
      if (resizeFrameRef.current) {
        window.cancelAnimationFrame(resizeFrameRef.current);
      }
      resizeFrameRef.current = window.requestAnimationFrame(() => {
        map.invalidateSize({ pan: false, debounceMoveend: true });
        const focusBounds = focusBoundsRef.current;
        if (focusBounds?.isValid?.()) {
          map.fitBounds(focusBounds, { padding: [12, 12], animate: false });
        }
      });
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
      window.removeEventListener("resize", invalidate);
      window.removeEventListener("keyup", disableWheelZoom);
      map.getContainer().removeEventListener("wheel", onWheel);
      if (resizeFrameRef.current) {
        window.cancelAnimationFrame(resizeFrameRef.current);
      }
      boundaryLayersRef.current.forEach((layer) => layer?.remove());
      boundaryLayersRef.current = [];
      hqMarkerRef.current?.remove();
      hqMarkerRef.current = null;
      markerLayerRef.current = null;
      canvasRendererRef.current = null;
      mapRef.current = null;
      map.remove();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadBoundaries = async () => {
      try {
        const [stateGeoJson, districtGeoJson, newDistrictGeoJson] = await Promise.all([
          fetch(AP_STATE_GEOJSON_URL).then((response) => response.json()),
          fetch(AP_DISTRICTS_GEOJSON_URL).then((response) => response.json()),
          fetch(AP_NEW_DISTRICTS_GEOJSON_URL).then((response) => response.json()),
        ]);

        if (cancelled) return;

        geoJsonDataRef.current = {
          stateGeoJson,
          districtGeoJson,
          newDistrictGeoJson,
        };
        districtGeometryRef.current = buildDistrictGeometryMap(districtGeoJson, newDistrictGeoJson);
        setDistrictGeometryVersion((version) => version + 1);
        setIsBoundaryDataReady(true);
      } catch (error) {
        console.error("Failed to load Andhra Pradesh boundaries", error);
      }
    };

    void loadBoundaries();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadRealConsumers = async () => {
      try {
        const response = await fetch(REAL_CONSUMER_COORDS_URL);
        const rows = await response.json();
        if (cancelled) return;

        setRealMapConsumers(
          Array.isArray(rows)
            ? rows
                .map(buildRealMapConsumer)
                .filter(
                  (consumer) =>
                    consumer.serviceNo &&
                    Number.isFinite(consumer.mapLat) &&
                    Number.isFinite(consumer.mapLng) &&
                    DISTRICT_MAP[consumer.districtCode]
                )
            : []
        );
      } catch (error) {
        console.error("Failed to load real consumer coordinate data", error);
      }
    };

    void loadRealConsumers();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isBoundaryDataReady) return;

    const { stateGeoJson, districtGeoJson, newDistrictGeoJson } = geoJsonDataRef.current;
    if (!stateGeoJson || !districtGeoJson || !newDistrictGeoJson) return;

    boundaryLayersRef.current.forEach((layer) => layer?.remove());
    boundaryLayersRef.current = [];
    hqMarkerRef.current?.remove();
    hqMarkerRef.current = null;

    const renderer = canvasRendererRef.current;
    const isAllDistricts = selectedMapDistrict === "All";
    const focusGeoJson = buildFocusGeoJson(selectedMapDistrict, stateGeoJson, districtGeoJson, newDistrictGeoJson);
    const maskRings = buildMaskRings(focusGeoJson);
    const nextLayers = [];

    if (defaultMinZoomRef.current !== null) {
      map.setMinZoom(defaultMinZoomRef.current);
    }

    if (maskRings.length) {
      nextLayers.push(
        L.polygon([WORLD_MASK_RING, ...maskRings], {
          pane: "ap-mask",
          renderer,
          stroke: false,
          fillColor: "#f8fafc",
          fillOpacity: 1,
          interactive: false,
        }).addTo(map)
      );
    }

    if (isAllDistricts) {
      nextLayers.push(
        L.geoJSON(newDistrictGeoJson, {
          pane: "ap-district-boundaries",
          renderer,
          interactive: false,
          style: {
            color: "#cbd5e1",
            weight: 1,
            opacity: 0.9,
            fillColor: "#ffffff",
            fillOpacity: 0,
          },
        }).addTo(map)
      );
    }

    const focusLayer = L.geoJSON(focusGeoJson, {
      pane: "ap-state-boundary",
      renderer,
      interactive: false,
      style: {
        color: isAllDistricts ? "#334155" : PURPLE,
        weight: isAllDistricts ? 1.5 : 2.75,
        opacity: 1,
        fillColor: "#ffffff",
        fillOpacity: 0,
      },
    }).addTo(map);
    nextLayers.push(focusLayer);

    if (isAllDistricts) {
      nextLayers.push(
        L.geoJSON(newDistrictGeoJson, {
          pane: "ap-service-area",
          renderer,
          interactive: false,
          filter: (feature) => SERVICE_AREA_NEW_DISTRICTS.has(feature?.properties?.NAME),
          style: {
            color: PURPLE,
            weight: 2.5,
            opacity: 1,
            fillOpacity: 0,
          },
        }).addTo(map)
      );
    }

    const focusBounds = focusLayer.getBounds();
    if (focusBounds.isValid()) {
      const paddedBounds = isAllDistricts ? focusBounds.pad(0.015) : focusBounds.pad(0.08);
      focusBoundsRef.current = paddedBounds;
      map.setMaxBounds(isAllDistricts ? L.latLngBounds(AP_MAX_BOUNDS) : paddedBounds.pad(0.04));
      map.fitBounds(paddedBounds, { padding: [12, 12], animate: false });
      if (!isAllDistricts) {
        map.setMinZoom(map.getZoom());
      }
    }

    if (isAllDistricts || selectedMapDistrict === "VSP") {
      hqMarkerRef.current = L.marker(AP_HEADQUARTERS_COORDS, {
        pane: "ap-hq-marker",
        zIndexOffset: 2000,
        icon: L.divIcon({
          className: "",
          iconSize: [30, 42],
          iconAnchor: [15, 42],
          tooltipAnchor: [0, -36],
          html: `
            <div style="position:relative;width:30px;height:42px;">
              <div style="position:absolute;left:50%;top:0;transform:translateX(-50%);width:28px;height:28px;border-radius:9999px;background:#D4A017;border:3px solid #ffffff;box-shadow:0 6px 16px rgba(15,23,42,0.26);display:flex;align-items:center;justify-content:center;color:#ffffff;font-size:14px;line-height:1;">&#9819;</div>
              <div style="position:absolute;left:50%;bottom:2px;transform:translateX(-50%);width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-top:15px solid #D4A017;filter:drop-shadow(0 3px 6px rgba(15,23,42,0.16));"></div>
            </div>
          `,
        }),
      })
        .bindTooltip("APEPDCL HQ", {
          direction: "top",
          offset: [0, -12],
          opacity: 1,
        })
        .addTo(map);
    }

    boundaryLayersRef.current = nextLayers;
  }, [isBoundaryDataReady, selectedMapDistrict]);

  useEffect(() => {
    const markerLayer = markerLayerRef.current;
    if (!markerLayer) return;
    if (!Object.keys(districtGeometryRef.current).length) return;

    markerLayer.clearLayers();

    visibleConsumers.forEach((consumer) => {
      const { lat, lng } = resolveConsumerLatLng(consumer, districtGeometryRef.current, {
        focusDistrictCode: selectedMapDistrict === "All" ? undefined : selectedMapDistrict,
      });
      const districtCode = getConsumerDistrictCode(consumer);
      const isIndustrial = String(consumer.category).toUpperCase().includes("INDUSTRY");
      const tooltipDirection = districtCode === "SKM" || lng > 83.55 ? "left" : lat > 18.15 ? "bottom" : "top";
      const tooltipOffset =
        tooltipDirection === "left" ? [-12, 0] : tooltipDirection === "bottom" ? [0, 10] : [0, -10];
      const marker = L.circleMarker([lat, lng], {
        renderer: canvasRendererRef.current,
        radius: isIndustrial ? 7 : 6,
        color: "#ffffff",
        weight: 2,
        fillColor: isIndustrial ? PURPLE : TEAL,
        fillOpacity: 0.95,
      });

      marker.bindTooltip(
        `
          <div style="min-width: 150px;">
            <div style="font-weight: 700; color: #0f172a;">SCN No: ${consumer.serviceNo}</div>
            <div style="font-size: 12px; color: #475569;">${DISTRICT_MAP[districtCode]?.name ?? districtCode}</div>
          </div>
        `,
        {
          direction: tooltipDirection,
          offset: tooltipOffset,
          opacity: 1,
        }
      );
      marker.on("click", () => onConsumerClick(consumer));
      marker.addTo(markerLayer);
    });
  }, [districtGeometryVersion, onConsumerClick, selectedMapDistrict, visibleConsumers]);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 mb-3">
        <div>
          <div className="text-base font-semibold text-gray-900">APEPDCL Consumer Map</div>
          
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-600 flex-wrap">
          <label className="flex items-center gap-2 bg-gray-50 rounded-lg border border-slate-200 px-3 h-9 text-sm">
            <span className="text-gray-500 whitespace-nowrap">District</span>
            <select
              value={selectedMapDistrict}
              onChange={(event) => setSelectedMapDistrict(event.target.value)}
              className="bg-transparent text-sm font-medium text-gray-900 outline-none"
            >
              {MAP_DISTRICT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#6A42B2]" />
            Industrial
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#13C4A9]" />
            Commercial
          </div>
          <div className="text-gray-400">{visibleConsumers.length} consumers shown</div>
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
      allConsumers
        .filter((consumer) => matchesTab(consumer.category, tab))
        .map((consumer) => {
          return {
            ...consumer,
          };
        }),
    [allConsumers, tab]
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

        <AndhraConsumerMap consumers={mapConsumers} onConsumerClick={onRowClick} tab={tab} />
      </div>
    </div>
  );
}
