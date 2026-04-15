import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { distributionLinks, distributionNodes } from "../lib/inframapData";

const AP_FOCUS_BOUNDS = [
  [76.5, 12.5],
  [84.9, 19.5],
];
const AP_STATE_GEOJSON_URL = "/geo/andhra-pradesh-state.geojson";

const LIVE_STACK_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "&copy; OpenStreetMap contributors",
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
    { id: "background", type: "background", paint: { "background-color": "#dfe7ef" } },
    {
      id: "osm",
      type: "raster",
      source: "osm",
      paint: { "raster-opacity": 0.9, "raster-saturation": -0.2, "raster-brightness-max": 0.94 },
    },
    {
      id: "power-line-underground",
      type: "line",
      source: "openinframap",
      "source-layer": "power_line",
      filter: ["==", ["coalesce", ["get", "location"], ""], "underground"],
      minzoom: 5,
      paint: {
        "line-color": "#0f766e",
        "line-width": ["interpolate", ["linear"], ["zoom"], 5, 0.6, 8, 1.2, 12, 2.4],
        "line-opacity": 0.8,
        "line-dasharray": [2, 1.2],
      },
    },
    {
      id: "power-line-overhead",
      type: "line",
      source: "openinframap",
      "source-layer": "power_line",
      filter: ["!=", ["coalesce", ["get", "location"], ""], "underground"],
      minzoom: 5,
      paint: {
        "line-color": "#2563eb",
        "line-width": ["interpolate", ["linear"], ["zoom"], 5, 0.8, 8, 1.5, 12, 3.2],
        "line-opacity": 0.72,
      },
    },
    {
      id: "power-substation-area",
      type: "fill",
      source: "openinframap",
      "source-layer": "power_substation",
      minzoom: 7,
      paint: { "fill-color": "#f97316", "fill-opacity": 0.18, "fill-outline-color": "#9a3412" },
    },
    {
      id: "power-solar-area",
      type: "fill",
      source: "openinframap",
      "source-layer": "power_generator_area",
      filter: ["==", ["coalesce", ["get", "source"], ""], "solar"],
      minzoom: 7,
      paint: { "fill-color": "#facc15", "fill-opacity": 0.24, "fill-outline-color": "#a16207" },
    },
    {
      id: "power-substation-point",
      type: "circle",
      source: "openinframap",
      "source-layer": "power_substation_point",
      minzoom: 6,
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 6, 2.4, 9, 5, 12, 8.5],
        "circle-color": "#f97316",
        "circle-stroke-color": "#7c2d12",
        "circle-stroke-width": 1.2,
        "circle-opacity": 0.82,
      },
    },
    {
      id: "power-transformer-point",
      type: "circle",
      source: "openinframap",
      "source-layer": "power_transformer",
      minzoom: 9,
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 1.5, 12, 3.8, 15, 6],
        "circle-color": "#8b5cf6",
        "circle-stroke-color": "#4c1d95",
        "circle-stroke-width": 1,
        "circle-opacity": 0.9,
      },
    },
    {
      id: "power-plant-point",
      type: "circle",
      source: "openinframap",
      "source-layer": "power_plant_point",
      minzoom: 6,
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 6, 3, 9, 5.5, 12, 8],
        "circle-color": [
          "match",
          ["coalesce", ["get", "source"], "other"],
          "solar",
          "#facc15",
          "wind",
          "#38bdf8",
          "hydro",
          "#06b6d4",
          "tidal",
          "#14b8a6",
          "nuclear",
          "#a855f7",
          "gas",
          "#fb923c",
          "oil",
          "#b45309",
          "diesel",
          "#92400e",
          "coal",
          "#52525b",
          "waste",
          "#65a30d",
          "biomass",
          "#84cc16",
          "#94a3b8",
        ],
        "circle-stroke-color": "#0f172a",
        "circle-stroke-width": 1.1,
        "circle-opacity": 0.88,
      },
    },
    {
      id: "power-generator-point",
      type: "circle",
      source: "openinframap",
      "source-layer": "power_generator",
      minzoom: 8,
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 1.8, 11, 4, 14, 6],
        "circle-color": [
          "match",
          ["coalesce", ["get", "source"], "other"],
          "solar",
          "#fde047",
          "wind",
          "#7dd3fc",
          "hydro",
          "#22d3ee",
          "tidal",
          "#2dd4bf",
          "#cbd5e1",
        ],
        "circle-stroke-color": "#0f172a",
        "circle-stroke-width": 0.8,
        "circle-opacity": 0.78,
      },
    },
  ],
};

const NODE_STYLE = {
  substation: { color: "#ea580c", radius: 8, stroke: "#7c2d12" },
  feeder: { color: "#f59e0b", radius: 6.5, stroke: "#92400e" },
  transformer: { color: "#7c3aed", radius: 5.8, stroke: "#4c1d95" },
  industry: { color: "#0f766e", radius: 7, stroke: "#134e4a" },
  consumer: { color: "#334155", radius: 5.6, stroke: "#0f172a" },
};

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

function popupRows(properties, keys) {
  return keys
    .filter((key) => properties?.[key] !== undefined && properties?.[key] !== null && properties?.[key] !== "")
    .map(
      (key) =>
        `<div style="display:flex;gap:8px;justify-content:space-between;"><span style="color:#64748b;">${key}</span><strong style="color:#0f172a;">${properties[key]}</strong></div>`
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

function addAndhraBoundary(map, geoJson) {
  map.addSource("ap-boundary", { type: "geojson", data: geoJson });
  map.addLayer({
    id: "ap-focus-fill",
    type: "fill",
    source: "ap-boundary",
    paint: { "fill-color": "#f8fafc", "fill-opacity": 0.04 },
  });
  map.addLayer({
    id: "ap-focus-outline",
    type: "line",
    source: "ap-boundary",
    paint: {
      "line-color": "#0f172a",
      "line-width": ["interpolate", ["linear"], ["zoom"], 5, 1.2, 8, 2, 11, 3.2],
      "line-opacity": 0.7,
    },
  });
}

function addDistributionLayers(map) {
  map.addSource("distribution-nodes", { type: "geojson", data: distributionNodes });
  map.addSource("distribution-links", { type: "geojson", data: distributionLinks });

  map.addLayer({
    id: "distribution-link-glow",
    type: "line",
    source: "distribution-links",
    paint: {
      "line-color": ["match", ["get", "linkType"], "substation_feed", "#f97316", "feeder_transformer", "#f59e0b", "transformer_service", "#0f766e", "#94a3b8"],
      "line-width": ["interpolate", ["linear"], ["zoom"], 6, 3, 10, 5, 14, 7],
      "line-opacity": 0.16,
    },
  });

  map.addLayer({
    id: "distribution-link-core",
    type: "line",
    source: "distribution-links",
    paint: {
      "line-color": ["match", ["get", "linkType"], "substation_feed", "#ea580c", "feeder_transformer", "#ca8a04", "transformer_service", "#0f766e", "#64748b"],
      "line-width": ["match", ["get", "linkType"], "substation_feed", 3.4, "feeder_transformer", 2.5, 2],
      "line-opacity": 0.96,
      "line-dasharray": ["match", ["get", "linkType"], "transformer_service", ["literal", [2, 1.2]], ["literal", [1, 0]]],
    },
  });

  Object.entries(NODE_STYLE).forEach(([nodeType, style]) => {
    map.addLayer({
      id: `distribution-${nodeType}`,
      type: "circle",
      source: "distribution-nodes",
      filter: ["==", ["get", "nodeType"], nodeType],
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 6, style.radius - 1, 10, style.radius, 14, style.radius + 2],
        "circle-color": style.color,
        "circle-stroke-color": style.stroke,
        "circle-stroke-width": 1.4,
        "circle-opacity": 0.96,
      },
    });
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

function registerDistributionPopups(map) {
  const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: true, offset: 14, maxWidth: "280px" });
  Object.keys(NODE_STYLE).forEach((nodeType) => {
    const layerId = `distribution-${nodeType}`;
    addPointer(map, layerId);
    map.on("click", layerId, (event) => {
      const properties = event.features?.[0]?.properties ?? {};
      const subtitle = [properties.nodeType, properties.district || properties.sector || properties.consumerMix].filter(Boolean).join(" | ");
      popup
        .setLngLat(event.lngLat)
        .setHTML(
          popupHtml(
            properties.name || "Distribution node",
            subtitle,
            popupRows(properties, ["voltage", "loadMva", "feederCode", "peakMw", "transformerRating", "demandMw", "serviceCount"]),
            "Synthetic downstream overlay for feeders, transformers, industries, and consumer clusters."
          )
        )
        .addTo(map);
    });
  });

  addPointer(map, "distribution-link-core");
  map.on("click", "distribution-link-core", (event) => {
    const properties = event.features?.[0]?.properties ?? {};
    popup
      .setLngLat(event.lngLat)
      .setHTML(
        popupHtml(
          "Distribution link",
          `${String(properties.linkType || "").replaceAll("_", " ")} | ${properties.voltage || "voltage n/a"}`,
          popupRows(properties, ["from", "to", "voltage"]),
          "Orange: substation to feeder, amber: feeder to transformer, teal: transformer to end use."
        )
      )
      .addTo(map);
  });
}

function registerInfraPopups(map) {
  const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: true, offset: 12, maxWidth: "280px" });
  const layers = [
    ["power-substation-point", "OpenInfraMap substation", "Live infrastructure feature from OpenInfraMap."],
    ["power-plant-point", "Power plant", "Live generation asset from OpenInfraMap."],
    ["power-generator-point", "Generator", "Live generation feature from OpenInfraMap."],
    ["power-transformer-point", "Transformer", "Live transformer feature from OpenInfraMap."],
  ];

  layers.forEach(([layerId, defaultTitle, footer]) => {
    addPointer(map, layerId);
    map.on("click", layerId, (event) => {
      const properties = event.features?.[0]?.properties ?? {};
      popup
        .setLngLat(event.lngLat)
        .setHTML(
          popupHtml(
            properties.name || properties.ref || defaultTitle,
            [properties.source, properties.substation, properties.voltage, properties.output].filter(Boolean).join(" | "),
            popupRows(properties, ["operator", "source", "output", "voltage", "ref"]),
            footer
          )
        )
        .addTo(map);
    });
  });
}

export default function InfraMapPage() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [loadError, setLoadError] = useState("");
  const [mapReady, setMapReady] = useState(false);

  const overlayCounts = useMemo(() => {
    const counts = distributionNodes.features.reduce((accumulator, feature) => {
      const type = feature.properties.nodeType;
      accumulator[type] = (accumulator[type] || 0) + 1;
      return accumulator;
    }, {});

    return [
      { label: "Dummy substations", value: counts.substation || 0, tone: "bg-orange-100 text-orange-900" },
      { label: "Dummy feeders", value: counts.feeder || 0, tone: "bg-amber-100 text-amber-900" },
      { label: "Dummy transformers", value: counts.transformer || 0, tone: "bg-violet-100 text-violet-900" },
      { label: "Dummy industries", value: counts.industry || 0, tone: "bg-teal-100 text-teal-900" },
      { label: "Consumer clusters", value: counts.consumer || 0, tone: "bg-slate-200 text-slate-900" },
    ];
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return undefined;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: LIVE_STACK_STYLE,
      center: [82.4, 17.2],
      zoom: 7.2,
      minZoom: 6,
      maxZoom: 15.5,
      maxBounds: AP_FOCUS_BOUNDS,
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
        addAndhraBoundary(map, stateGeoJson);
        addDistributionLayers(map);
        registerDistributionPopups(map);
        registerInfraPopups(map);
        map.fitBounds(computeBounds(stateGeoJson), { padding: 36, duration: 0 });
        setMapReady(true);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Unable to initialize the infrastructure map.");
      }
    });

    map.on("error", (event) => {
      const message = event?.error?.message;
      if (message) setLoadError(message);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className="space-y-4">
      <section className="rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,#fffdf8_0%,#eef5ff_48%,#f8fafc_100%)] p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-800">Infra Flow Map</div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">
              Andhra Pradesh power map with live OpenInfraMap infrastructure and dummy downstream distribution overlays
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600 md:text-[15px]">
              OpenInfraMap supplies the live generation, transmission, substation, and transformer base. This page then fills the last-mile gap with synthetic feeders, industries, and end-consumer clusters across Andhra Pradesh.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3 xl:w-[420px] xl:grid-cols-1">
            <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em]">Live base</div>
              <div className="mt-1 font-semibold">OpenInfraMap vector tiles</div>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em]">Overlay</div>
              <div className="mt-1 font-semibold">Dummy AP distribution chain</div>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em]">Coverage</div>
              <div className="mt-1 font-semibold">Generation to end-consumer flow</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/90 px-4 py-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">Supply chain map</div>
              <div className="text-xs text-slate-500">Live infra plus synthetic downstream distribution overlay.</div>
            </div>
            <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
              {mapReady ? "Map ready" : "Loading map layers"}
            </div>
          </div>
          <div ref={mapContainerRef} className="h-[72vh] min-h-[560px] w-full" />
        </div>

        <aside className="space-y-4">
          <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
            <div className="text-sm font-semibold text-slate-900">Overlay inventory</div>
            <div className="mt-3 grid gap-2">
              {overlayCounts.map((item) => (
                <div key={item.label} className={`flex items-center justify-between rounded-2xl px-3 py-2 text-sm ${item.tone}`}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
            <div className="text-sm font-semibold text-slate-900">Legend</div>
            <div className="mt-3 grid gap-2 text-sm text-slate-600">
              <div className="flex items-center gap-3"><span className="h-3 w-8 rounded-full bg-[#2563eb]" />Live OpenInfraMap transmission lines</div>
              <div className="flex items-center gap-3"><span className="h-3 w-3 rounded-full bg-[#facc15]" />Live solar and generation assets</div>
              <div className="flex items-center gap-3"><span className="h-3 w-3 rounded-full bg-[#f97316]" />Live substations</div>
              <div className="flex items-center gap-3"><span className="h-3 w-10 rounded-full bg-[#ea580c]" />Dummy substation to feeder links</div>
              <div className="flex items-center gap-3"><span className="h-3 w-10 rounded-full bg-[#ca8a04]" />Dummy feeder to transformer links</div>
              <div className="flex items-center gap-3"><span className="h-3 w-10 rounded-full border border-dashed border-[#0f766e] bg-transparent" />Dummy transformer to end-use links</div>
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
            <div className="text-sm font-semibold text-slate-900">How to read it</div>
            <div className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
              <p>Start with live generation and transmission on the OpenInfraMap base.</p>
              <p>Follow the orange distribution hubs to the amber feeder paths and violet transformers.</p>
              <p>Finish on teal industry points and slate consumer clusters to see the last-mile story.</p>
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
