import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import {
  FiActivity,
  FiCloud,
  FiCloudDrizzle,
  FiCloudLightning,
  FiCloudRain,
  FiMap,
  FiMapPin,
  FiSliders,
  FiSun,
  FiWind,
  FiZap,
} from "react-icons/fi";
import "maplibre-gl/dist/maplibre-gl.css";

const AP_FOCUS_BOUNDS = [
  [76.1, 12.2],
  [85.3, 19.8],
];
const AP_STATE_GEOJSON_URL = "/geo/andhra-pradesh-state.geojson";
const WEATHER_COORDS = { latitude: 17.6868, longitude: 83.2185, label: "Visakhapatnam coast" };
const MAP_CENTER = [82.4, 17.2];

const CATEGORY_CONFIG = [
  { key: "substation", label: "Substation", helper: "Live substations and yards", accent: "#f97316" },
  { key: "transformer", label: "Transformer", helper: "Live transformer points", accent: "#7c3aed" },
  { key: "feeder", label: "Feeders", helper: "Voltage line network", accent: "#0f766e" },
  { key: "consumer", label: "Consumer", helper: "Hidden until validated", accent: "#64748b", disabled: true },
  { key: "all", label: "All", helper: "Grouped live network view", accent: "#0f172a" },
];

const ANALYTIC_OPTIONS = [
  { value: "none", label: "No analytics overlay" },
  { value: "transformer_loading", label: "Transformer loading" },
  { value: "line_loading", label: "Line loading" },
];

const LIGHT_INFRA_STYLE = {
  version: 8,
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sources: {
    cartoBase: {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png",
        "https://b.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png",
        "https://c.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
    },
    cartoLabels: {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png",
        "https://b.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png",
        "https://c.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
    },
    openinframap: {
      type: "vector",
      tiles: ["https://openinframap.org/tiles/{z}/{x}/{y}.pbf"],
      minzoom: 0,
      maxzoom: 17,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>, <a href="https://openinframap.org">OpenInfraMap</a>',
    },
  },
  layers: [
    { id: "background", type: "background", paint: { "background-color": "#eef2f7" } },
    {
      id: "carto-base",
      type: "raster",
      source: "cartoBase",
      paint: {
        "raster-opacity": 0.96,
        "raster-saturation": -0.85,
        "raster-brightness-min": 0.78,
        "raster-brightness-max": 0.98,
        "raster-contrast": -0.08,
      },
    },
    {
      id: "carto-labels",
      type: "raster",
      source: "cartoLabels",
      paint: { "raster-opacity": 0.46 },
    },
  ],
};

const VOLTAGE_BANDS = [
  { key: "765", label: "765 kV", color: "#7f1d1d" },
  { key: "400", label: "400 kV", color: "#b45309" },
  { key: "220", label: "220 kV", color: "#0f766e" },
  { key: "132", label: "132 kV", color: "#0369a1" },
  { key: "66", label: "66 kV", color: "#4f46e5" },
  { key: "33", label: "33 kV", color: "#7c3aed" },
  { key: "11", label: "11 kV", color: "#be185d" },
];

const SUBSTATION_LAYER_IDS = ["power-substation-area", "power-substation-point"];
const TRANSFORMER_LAYER_IDS = ["power-transformer-point"];
const FEEDER_LAYER_IDS = ["power-line-underground", "power-line-overhead"];
const ALL_LAYER_IDS = [...SUBSTATION_LAYER_IDS, ...TRANSFORMER_LAYER_IDS, ...FEEDER_LAYER_IDS, "power-plant-point", "power-generator-point", "power-solar-area"];

function computeBounds(geoJson) {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  const visit = (coords) => {
    if (!Array.isArray(coords)) return;
    if (typeof coords[0] === "number" && typeof coords[1] === "number") {
      const [lng, lat] = coords;
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      return;
    }
    coords.forEach(visit);
  };

  geoJson?.features?.forEach((feature) => visit(feature?.geometry?.coordinates));
  if (!Number.isFinite(minLng) || !Number.isFinite(minLat)) return AP_FOCUS_BOUNDS;
  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}

function expandBounds(bounds, lngPadding = 0.35, latPadding = 0.3) {
  const [[minLng, minLat], [maxLng, maxLat]] = bounds;
  return [
    [minLng - lngPadding, minLat - latPadding],
    [maxLng + lngPadding, maxLat + latPadding],
  ];
}

function getPolygonOuterRings(geoJson) {
  return (geoJson?.features ?? []).flatMap((feature) => {
    const geometry = feature?.geometry;
    if (!geometry?.coordinates) return [];
    if (geometry.type === "Polygon") return [geometry.coordinates[0]];
    if (geometry.type === "MultiPolygon") return geometry.coordinates.map((polygon) => polygon[0]).filter(Boolean);
    return [];
  });
}

function buildOutsideMaskGeoJson(geoJson) {
  const outerWorldRing = [
    [-180, -90],
    [180, -90],
    [180, 90],
    [-180, 90],
    [-180, -90],
  ];

  const holes = getPolygonOuterRings(geoJson)
    .filter((ring) => Array.isArray(ring) && ring.length >= 4)
    .map((ring) => {
      const first = ring[0];
      const last = ring[ring.length - 1];
      const isClosed = first?.[0] === last?.[0] && first?.[1] === last?.[1];
      return isClosed ? ring : [...ring, first];
    });

  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: {
          type: "Polygon",
          coordinates: [outerWorldRing, ...holes],
        },
      },
    ],
  };
}

function popupRows(properties, rows) {
  return rows
    .filter((row) => row.value !== undefined && row.value !== null && row.value !== "")
    .map(
      (row) =>
        `<div style="display:flex;gap:10px;justify-content:space-between;align-items:flex-start;"><span style="color:#64748b;white-space:nowrap;">${row.label}</span><strong style="color:#0f172a;text-align:right;">${row.value}</strong></div>`
    )
    .join("");
}

function popupHtml(title, subtitle, rows, footer) {
  return `
    <div style="min-width:220px;padding:2px 2px 0;">
      <div style="font-size:13px;font-weight:800;color:#0f172a;">${title}</div>
      ${subtitle ? `<div style="margin-top:2px;font-size:12px;color:#475569;">${subtitle}</div>` : ""}
      ${rows ? `<div style="margin-top:10px;display:grid;gap:6px;font-size:12px;">${rows}</div>` : ""}
      ${footer ? `<div style="margin-top:10px;padding-top:8px;border-top:1px solid rgba(148,163,184,0.28);font-size:11px;color:#64748b;">${footer}</div>` : ""}
    </div>
  `;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeVoltageTokens(value) {
  return String(value ?? "")
    .split(/[;,/]/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function formatVoltageLabel(value) {
  const tokens = normalizeVoltageTokens(value)
    .map((token) => {
      const numeric = Number(token);
      if (!Number.isFinite(numeric) || numeric <= 0) return token;
      const kv = numeric >= 1000 ? numeric / 1000 : numeric;
      return `${Number(kv.toFixed(kv >= 100 ? 0 : 1))} kV`;
    })
    .filter(Boolean);

  return tokens.join(" / ") || "Not provided";
}

function voltageContainsExpression(token) {
  return ["!=", ["index-of", token, ["to-string", ["coalesce", ["get", "voltage"], ""]]], -1];
}

function buildVoltageColorExpression() {
  const expression = ["case"];
  VOLTAGE_BANDS.forEach((band) => {
    expression.push(voltageContainsExpression(`${band.key}000`), band.color);
    expression.push(voltageContainsExpression(band.key), band.color);
  });
  expression.push("#64748b");
  return expression;
}

function buildVoltageWidthExpression() {
  const voltageColorExpression = buildVoltageColorExpression();
  return [
    "interpolate",
    ["linear"],
    ["zoom"],
    5,
    ["match", voltageColorExpression, "#7f1d1d", 1.8, "#b45309", 1.5, "#0f766e", 1.2, 0.9],
    8,
    ["match", voltageColorExpression, "#7f1d1d", 3.5, "#b45309", 2.9, "#0f766e", 2.4, 1.9],
    12,
    ["match", voltageColorExpression, "#7f1d1d", 6.3, "#b45309", 5.2, "#0f766e", 4.1, 3.1],
  ];
}

function getWeatherIcon(code) {
  if ([0, 1].includes(code)) return FiSun;
  if ([2, 3, 45, 48].includes(code)) return FiCloud;
  if ([51, 53, 55, 56, 57].includes(code)) return FiCloudDrizzle;
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return FiCloudRain;
  if ([95, 96, 99].includes(code)) return FiCloudLightning;
  return FiCloud;
}

function buildTimelineLabels() {
  const now = new Date();
  return Array.from({ length: 24 }, (_, index) => {
    const hour = new Date(now);
    hour.setHours(now.getHours() - (23 - index), 0, 0, 0);
    return hour;
  });
}

function addAndhraBoundary(map, geoJson) {
  map.addSource("ap-boundary", { type: "geojson", data: geoJson });
  map.addLayer({
    id: "ap-focus-fill",
    type: "fill",
    source: "ap-boundary",
    paint: { "fill-color": "#ffffff", "fill-opacity": 0.05 },
  });
  map.addLayer({
    id: "ap-focus-outline",
    type: "line",
    source: "ap-boundary",
    paint: {
      "line-color": "#1e293b",
      "line-width": ["interpolate", ["linear"], ["zoom"], 5, 1.1, 8, 1.8, 11, 2.8],
      "line-opacity": 0.55,
    },
  });
}

function addOutsideMask(map, geoJson) {
  map.addSource("ap-outside-mask", { type: "geojson", data: buildOutsideMaskGeoJson(geoJson) });
  map.addLayer({
    id: "ap-outside-mask-fill",
    type: "fill",
    source: "ap-outside-mask",
    paint: {
      "fill-color": "#f8fafc",
      "fill-opacity": 0.94,
    },
  });
}

function addInfraLayers(map) {
  const voltageColorExpression = buildVoltageColorExpression();
  const voltageWidthExpression = buildVoltageWidthExpression();

  map.addLayer({
    id: "power-line-underground",
    type: "line",
    source: "openinframap",
    "source-layer": "power_line",
    filter: ["==", ["coalesce", ["get", "location"], ""], "underground"],
    minzoom: 5,
    paint: {
      "line-color": voltageColorExpression,
      "line-width": voltageWidthExpression,
      "line-opacity": 0.82,
      "line-dasharray": [2.2, 1.4],
    },
  });

  map.addLayer({
    id: "power-line-overhead",
    type: "line",
    source: "openinframap",
    "source-layer": "power_line",
    filter: ["!=", ["coalesce", ["get", "location"], ""], "underground"],
    minzoom: 5,
    paint: {
      "line-color": voltageColorExpression,
      "line-width": voltageWidthExpression,
      "line-opacity": 0.9,
    },
  });

  map.addLayer({
    id: "power-substation-area",
    type: "fill",
    source: "openinframap",
    "source-layer": "power_substation",
    minzoom: 7,
    paint: { "fill-color": "#fb923c", "fill-opacity": 0.14, "fill-outline-color": "#9a3412" },
  });

  map.addLayer({
    id: "power-substation-point",
    type: "circle",
    source: "openinframap",
    "source-layer": "power_substation_point",
    minzoom: 6,
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 6, 2.5, 9, 5.1, 12, 8.2],
      "circle-color": "#f97316",
      "circle-stroke-color": "#7c2d12",
      "circle-stroke-width": 1.1,
      "circle-opacity": 0.88,
    },
  });

  map.addLayer({
    id: "power-transformer-point",
    type: "circle",
    source: "openinframap",
    "source-layer": "power_transformer",
    minzoom: 9,
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 1.8, 12, 4.3, 15, 6.6],
      "circle-color": "#8b5cf6",
      "circle-stroke-color": "#4c1d95",
      "circle-stroke-width": 1,
      "circle-opacity": 0.9,
    },
  });

  map.addLayer({
    id: "power-plant-point",
    type: "circle",
    source: "openinframap",
    "source-layer": "power_plant_point",
    minzoom: 6,
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 6, 2.8, 9, 5.2, 12, 7.6],
      "circle-color": "#94a3b8",
      "circle-stroke-color": "#334155",
      "circle-stroke-width": 1,
      "circle-opacity": 0.78,
    },
  });

  map.addLayer({
    id: "power-generator-point",
    type: "circle",
    source: "openinframap",
    "source-layer": "power_generator",
    minzoom: 8,
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 1.7, 11, 3.8, 14, 5.6],
      "circle-color": "#cbd5e1",
      "circle-stroke-color": "#475569",
      "circle-stroke-width": 0.8,
      "circle-opacity": 0.72,
    },
  });

  map.addLayer({
    id: "power-solar-area",
    type: "fill",
    source: "openinframap",
    "source-layer": "power_generator_area",
    filter: ["==", ["coalesce", ["get", "source"], ""], "solar"],
    minzoom: 7,
    paint: { "fill-color": "#e2e8f0", "fill-opacity": 0.14, "fill-outline-color": "#94a3b8" },
  });
}

function addPointer(map, layerId) {
  map.on("mouseenter", layerId, () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", layerId, () => {
    map.getCanvas().style.cursor = "";
  });
}

function registerInfraPopups(map) {
  const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: true, offset: 12, maxWidth: "300px" });

  FEEDER_LAYER_IDS.forEach((layerId) => {
    addPointer(map, layerId);
    map.on("click", layerId, (event) => {
      const properties = event.features?.[0]?.properties ?? {};
      popup
        .setLngLat(event.lngLat)
        .setHTML(
          popupHtml(
            escapeHtml(properties.name || properties.ref || "Voltage line"),
            escapeHtml(`${formatVoltageLabel(properties.voltage)}${properties.circuits ? ` | ${properties.circuits} circuits` : ""}`),
            popupRows(properties, [
              { label: "Voltage", value: escapeHtml(formatVoltageLabel(properties.voltage)) },
              { label: "Operator", value: escapeHtml(properties.operator) },
              { label: "Circuits", value: escapeHtml(properties.circuits) },
              { label: "Cable", value: escapeHtml(properties.cables) },
              { label: "Ref", value: escapeHtml(properties.ref) },
            ]),
            escapeHtml(properties.location === "underground" ? "Underground line from OpenInfraMap." : "Overhead line from OpenInfraMap.")
          )
        )
        .addTo(map);
    });
  });

  const pointLayers = [
    ["power-substation-point", "Substation", "Live substation asset from OpenInfraMap."],
    ["power-transformer-point", "Transformer", "Live transformer point from OpenInfraMap."],
    ["power-plant-point", "Power plant", "Live generation asset from OpenInfraMap."],
    ["power-generator-point", "Generator", "Live generation feature from OpenInfraMap."],
  ];

  pointLayers.forEach(([layerId, defaultTitle, footer]) => {
    addPointer(map, layerId);
    map.on("click", layerId, (event) => {
      const properties = event.features?.[0]?.properties ?? {};
      popup
        .setLngLat(event.lngLat)
        .setHTML(
          popupHtml(
            escapeHtml(properties.name || properties.ref || defaultTitle),
            escapeHtml([properties.substation, formatVoltageLabel(properties.voltage), properties.power].filter(Boolean).join(" | ")),
            popupRows(properties, [
              { label: "Voltage", value: escapeHtml(formatVoltageLabel(properties.voltage)) },
              { label: "Operator", value: escapeHtml(properties.operator) },
              { label: "Power", value: escapeHtml(properties.power || properties.output) },
              { label: "Source", value: escapeHtml(properties.source) },
              { label: "Ref", value: escapeHtml(properties.ref) },
            ]),
            escapeHtml(footer)
          )
        )
        .addTo(map);
    });
  });
}

function getVisibleLayerIds(category) {
  if (category === "substation") return SUBSTATION_LAYER_IDS;
  if (category === "transformer") return TRANSFORMER_LAYER_IDS;
  if (category === "feeder") return FEEDER_LAYER_IDS;
  if (category === "consumer") return [];
  return ALL_LAYER_IDS;
}

function setLayerVisibility(map, category) {
  const visibleIds = new Set(getVisibleLayerIds(category));
  ALL_LAYER_IDS.forEach((layerId) => {
    if (!map.getLayer(layerId)) return;
    map.setLayoutProperty(layerId, "visibility", visibleIds.has(layerId) ? "visible" : "none");
  });
}

function countUniqueFeatures(features, keyBuilder) {
  return new Set(features.map((feature) => keyBuilder(feature)).filter(Boolean)).size;
}

function refreshCounts(map, setViewportCounts) {
  if (!map.isStyleLoaded()) return;
  const substationFeatures = map.queryRenderedFeatures({ layers: ["power-substation-point"] });
  const transformerFeatures = map.queryRenderedFeatures({ layers: ["power-transformer-point"] });
  const feederFeatures = map.queryRenderedFeatures({ layers: FEEDER_LAYER_IDS });

  const counts = {
    substation: countUniqueFeatures(substationFeatures, (feature) => {
      const properties = feature.properties ?? {};
      return properties.ref || properties.name || `${feature.layer.id}:${feature.id ?? JSON.stringify(feature.geometry)}`;
    }),
    transformer: countUniqueFeatures(transformerFeatures, (feature) => {
      const properties = feature.properties ?? {};
      return properties.ref || properties.name || `${feature.layer.id}:${feature.id ?? JSON.stringify(feature.geometry)}`;
    }),
    feeder: countUniqueFeatures(feederFeatures, (feature) => {
      const properties = feature.properties ?? {};
      return properties.ref || properties.name || `${feature.layer.id}:${feature.id ?? JSON.stringify(feature.geometry)}`;
    }),
    consumer: null,
  };

  counts.all = counts.substation + counts.transformer + counts.feeder;
  setViewportCounts(counts);
}

export default function InfraMapPage() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [loadError, setLoadError] = useState("");
  const [mapReady, setMapReady] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedAnalytic, setSelectedAnalytic] = useState("none");
  const [selectedHour, setSelectedHour] = useState(23);
  const [weather, setWeather] = useState({ state: "loading" });
  const [viewportCounts, setViewportCounts] = useState({ substation: 0, transformer: 0, feeder: 0, consumer: null, all: 0 });

  const timeline = useMemo(() => buildTimelineLabels(), []);
  const activeHourDate = timeline[selectedHour] ?? timeline[timeline.length - 1];
  const activeCategoryMeta = useMemo(
    () => CATEGORY_CONFIG.find((item) => item.key === activeCategory) ?? CATEGORY_CONFIG[CATEGORY_CONFIG.length - 1],
    [activeCategory]
  );
  const weatherIcon = useMemo(() => getWeatherIcon(weather.weatherCode), [weather.weatherCode]);

  const analyticTitle = useMemo(() => {
    if (selectedAnalytic === "transformer_loading") return "Transformer loading";
    if (selectedAnalytic === "line_loading") return "Line loading";
    return "Analytics overlay";
  }, [selectedAnalytic]);

  useEffect(() => {
    let cancelled = false;

    const loadWeather = async () => {
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${WEATHER_COORDS.latitude}&longitude=${WEATHER_COORDS.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=Asia%2FKolkata`
        );
        if (!response.ok) throw new Error(`Weather request failed with ${response.status}`);
        const payload = await response.json();
        if (cancelled) return;
        setWeather({
          state: "ready",
          temperature: payload?.current?.temperature_2m,
          apparent: payload?.current?.apparent_temperature,
          humidity: payload?.current?.relative_humidity_2m,
          weatherCode: payload?.current?.weather_code,
          windSpeed: payload?.current?.wind_speed_10m,
          updatedAt: payload?.current?.time,
        });
      } catch (error) {
        if (!cancelled) {
          setWeather({ state: "error", message: error instanceof Error ? error.message : "Weather feed unavailable" });
        }
      }
    };

    void loadWeather();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return undefined;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: LIGHT_INFRA_STYLE,
      center: MAP_CENTER,
      zoom: 6.4,
      minZoom: 5,
      maxZoom: 15.5,
      cooperativeGestures: true,
      attributionControl: true,
    });

    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), "top-right");
    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();

    map.on("load", async () => {
      try {
        const response = await fetch(AP_STATE_GEOJSON_URL);
        if (!response.ok) throw new Error(`AP boundary request failed with ${response.status}`);
        const stateGeoJson = await response.json();
        const stateBounds = computeBounds(stateGeoJson);
        addAndhraBoundary(map, stateGeoJson);
        addInfraLayers(map);
        addOutsideMask(map, stateGeoJson);
        registerInfraPopups(map);
        setLayerVisibility(map, activeCategory);
        map.setMaxBounds(expandBounds(stateBounds));
        map.fitBounds(stateBounds, { padding: 36, duration: 0 });
        refreshCounts(map, setViewportCounts);
        setMapReady(true);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Unable to initialize the infrastructure map.");
      }
    });

    const recount = () => refreshCounts(map, setViewportCounts);
    map.on("idle", recount);
    map.on("moveend", recount);
    map.on("zoomend", recount);
    map.on("error", (event) => {
      const message = event?.error?.message;
      if (message) setLoadError(message);
    });

    return () => {
      map.off("idle", recount);
      map.off("moveend", recount);
      map.off("zoomend", recount);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    setLayerVisibility(map, activeCategory);
    refreshCounts(map, setViewportCounts);
  }, [activeCategory, mapReady]);

  const WeatherIcon = weatherIcon;
  const selectedHourLabel = activeHourDate.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  const selectedHourDateLabel = activeHourDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

  return (
    <div className="space-y-4">
      <section className="rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,#fbfcfe_0%,#edf3f9_48%,#f8fafc_100%)] p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex rounded-full border border-slate-300 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700">
              Infra Flow Map
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">
              Andhra Pradesh live infrastructure map with validated OpenInfraMap layers only
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600 md:text-[15px]">
              This view keeps only the live transmission, substation, transformer, and generation layers coming from OpenInfraMap.
              Unverified downstream consumer connections are intentionally hidden until validated data is available.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:w-[360px]">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Source</div>
              <div className="mt-1 font-semibold">OpenInfraMap live vector layers</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Road styling</div>
              <div className="mt-1 font-semibold">Muted grayscale basemap for cleaner line visibility</div>
            </div>
      
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_290px]">
        <div className="space-y-4">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px]">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {CATEGORY_CONFIG.map((item) => {
                const isActive = activeCategory === item.key;
                const countValue = viewportCounts[item.key];

                return (
                  <button
                    key={item.key}
                    type="button"
                    disabled={item.disabled}
                    onClick={() => !item.disabled && setActiveCategory(item.key)}
                    className={`rounded-[22px] border px-4 py-3 text-left shadow-sm transition ${
                      item.disabled
                        ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                        : isActive
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-800 hover:-translate-y-0.5 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold">{item.label}</div>
                        <div className={`mt-1 text-xs leading-5 ${isActive ? "text-slate-300" : item.disabled ? "text-slate-400" : "text-slate-500"}`}>
                          {item.helper}
                        </div>
                      </div>
                      <span className="mt-0.5 inline-flex h-3 w-3 rounded-full" style={{ backgroundColor: item.disabled ? "#cbd5e1" : item.accent }} />
                    </div>
                    <div className={`mt-4 text-2xl font-semibold tabular-nums ${isActive ? "text-white" : "text-slate-900"}`}>
                      {item.key === "consumer" ? "--" : countValue}
                    </div>
                    <div className="text-[11px] uppercase tracking-[0.12em] text-slate-400">
                      {item.key === "consumer" ? "Awaiting validated topology" : "Visible in current view"}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Weather</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">{WEATHER_COORDS.label}</div>
                </div>
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  <WeatherIcon className="text-[20px]" />
                </div>
              </div>

              {weather.state === "ready" ? (
                <div className="mt-4 space-y-3">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <div className="text-3xl font-semibold leading-none text-slate-950">
                        {Math.round(weather.temperature)}
                        <span className="text-lg text-slate-500">°C</span>
                      </div>
                      <div className="mt-1 text-xs text-slate-500">Feels like {Math.round(weather.apparent)}°C</div>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      Updated
                      <br />
                      {weather.updatedAt ? new Date(weather.updatedAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }) : "--"}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-slate-700">
                    <div className="rounded-2xl bg-slate-50 px-3 py-2">
                      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.1em] text-slate-500">
                        <FiWind /> Wind
                      </div>
                      <div className="mt-1 font-semibold">{Math.round(weather.windSpeed)} km/h</div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-3 py-2">
                      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.1em] text-slate-500">
                        <FiCloud /> Humidity
                      </div>
                      <div className="mt-1 font-semibold">{Math.round(weather.humidity)}%</div>
                    </div>
                  </div>
                </div>
              ) : weather.state === "error" ? (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
                  Weather feed unavailable right now.
                </div>
              ) : (
                <div className="mt-4 rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-500">Loading current weather...</div>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50/90 px-4 py-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-900">Live infra map</div>
                <div className="text-xs text-slate-500">
                  {activeCategory === "consumer"
                    ? "Consumer view is intentionally hidden until validated topology is available."
                    : `Showing ${activeCategoryMeta.label.toLowerCase()} selection with live OpenInfraMap features.`}
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600">
                  <FiSliders className="text-[14px]" />
                  <span>Transformer analytics</span>
                  <select value={selectedAnalytic} onChange={(event) => setSelectedAnalytic(event.target.value)} className="bg-transparent text-xs font-semibold text-slate-800 outline-none">
                    {ANALYTIC_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600">
                  {mapReady ? "Map ready" : "Loading live layers"}
                </div>
              </div>
            </div>

            <div className="relative">
              <div ref={mapContainerRef} className="h-[68vh] min-h-[520px] w-full" />
              {activeCategory === "consumer" ? (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/74 backdrop-blur-[2px]">
                  <div className="max-w-md rounded-[24px] border border-slate-200 bg-white px-6 py-5 text-center shadow-xl">
                    <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                      <FiMapPin className="text-[22px]" />
                    </div>
                    <div className="mt-3 text-base font-semibold text-slate-900">Consumer topology is hidden</div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      This page will only show consumer-side infrastructure after the topology and connectivity are validated. No inferred downstream connections are rendered.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="border-t border-slate-200 px-4 py-4">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-900">24-hour playback</div>
                  <div className="text-xs text-slate-500">
                    Selected hour: {selectedHourLabel} on {selectedHourDateLabel}
                  </div>
                </div>
                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
                  Historical playback UI is ready for backend time-series integration
                </div>
              </div>

              <div className="mt-4 px-1">
                <input
                  type="range"
                  min="0"
                  max="23"
                  step="1"
                  value={selectedHour}
                  onChange={(event) => setSelectedHour(Number(event.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-slate-900"
                />
                <div className="mt-3 grid grid-cols-6 gap-2 text-[11px] text-slate-400 sm:grid-cols-8 xl:grid-cols-12">
                  {timeline.filter((_, index) => index % 2 === 0).map((time) => (
                    <span key={time.toISOString()} className="truncate">
                      {time.toLocaleTimeString("en-IN", { hour: "numeric" })}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <FiZap className="text-[16px] text-slate-700" />
              Voltage legend
            </div>
            <div className="mt-3 grid gap-2 text-sm text-slate-600">
              {VOLTAGE_BANDS.map((band) => (
                <div key={band.key} className="flex items-center gap-3">
                  <span className="h-3 w-10 rounded-full" style={{ backgroundColor: band.color }} />
                  <span>{band.label} lines</span>
                </div>
              ))}
              <div className="flex items-center gap-3">
                <span className="h-3 w-10 rounded-full bg-slate-500" />
                <span>Other or unspecified voltage</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="h-3 w-10 rounded-full border border-dashed border-slate-400 bg-transparent" />
                <span>Underground cable</span>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <FiActivity className="text-[16px] text-slate-700" />
              Analytics view
            </div>
            {selectedAnalytic === "none" ? (
              <div className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm leading-6 text-slate-500">
                Select transformer loading or line loading to prepare the page for backend-driven heat-map analytics. No placeholder loading values are injected here.
              </div>
            ) : (
              <div className="mt-3">
                <div className="rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  {analyticTitle} is selected for {selectedHourLabel}. The control and timeline are ready, but the actual heat-map rendering will activate only after Anandha's backend feed is connected.
                </div>
                <div className="mt-3 rounded-[24px] border border-dashed border-slate-200 bg-[linear-gradient(135deg,#f8fafc_0%,#eef2f7_100%)] p-4">
                  <div className="rounded-[20px] border border-white/80 bg-white/70 p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Heat-map layer pending live load data</div>
                        <div className="mt-1 text-xs leading-5 text-slate-500">
                          No synthetic transformer loading or line loading values are rendered on this page.
                        </div>
                      </div>
                      <div className={`h-10 w-10 rounded-2xl ${selectedAnalytic === "line_loading" ? "bg-teal-100 text-teal-700" : "bg-violet-100 text-violet-700"} flex items-center justify-center`}>
                        <FiActivity className="text-[18px]" />
                      </div>
                    </div>
                    <div className="mt-4 grid gap-2">
                      <div className="h-5 rounded-full bg-slate-200/80" />
                      <div className="h-5 rounded-full bg-slate-200/60" />
                      <div className="h-5 rounded-full bg-slate-200/40" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <FiMap className="text-[16px] text-slate-700" />
              Reading guide
            </div>
            <div className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
              <p>Transmission and feeder lines are split by voltage so different kV corridors are easy to distinguish.</p>
              <p>Click any line, substation, or transformer to inspect the available OpenInfraMap attributes such as voltage, operator, and reference.</p>
              <p>Consumer-side connectivity is intentionally excluded until the connectivity model is confirmed.</p>
            </div>
          </div>

          {loadError ? (
            <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
              <div className="font-semibold">Map warning</div>
              <div className="mt-1">{loadError}</div>
            </div>
          ) : null}
        </aside>
      </section>
    </div>
  );
}
