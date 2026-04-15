export const distributionNodes = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { id: "ss-vizag", nodeType: "substation", name: "Gajuwaka 220/132/33 kV Hub", district: "Visakhapatnam", voltage: "220/132/33 kV", loadMva: 480 },
      geometry: { type: "Point", coordinates: [83.165, 17.685] },
    },
    {
      type: "Feature",
      properties: { id: "ss-anand", nodeType: "substation", name: "Anandapuram 132/33 kV Substation", district: "Visakhapatnam", voltage: "132/33 kV", loadMva: 260 },
      geometry: { type: "Point", coordinates: [83.344, 17.89] },
    },
    {
      type: "Feature",
      properties: { id: "ss-kakinada", nodeType: "substation", name: "Kakinada North 220/132/33 kV Hub", district: "Kakinada", voltage: "220/132/33 kV", loadMva: 390 },
      geometry: { type: "Point", coordinates: [82.272, 17.012] },
    },
    {
      type: "Feature",
      properties: { id: "ss-rajy", nodeType: "substation", name: "Rajamahendravaram Urban 220/132/33 kV Hub", district: "Rajamahendravaram", voltage: "220/132/33 kV", loadMva: 350 },
      geometry: { type: "Point", coordinates: [81.786, 17.012] },
    },

    {
      type: "Feature",
      properties: { id: "fd-steel", nodeType: "feeder", name: "Gajuwaka Industrial Feeder", feederCode: "FDR-VSP-11A", voltage: "33 kV", peakMw: 84 },
      geometry: { type: "Point", coordinates: [83.205, 17.646] },
    },
    {
      type: "Feature",
      properties: { id: "fd-pharma", nodeType: "feeder", name: "Anandapuram Pharma Feeder", feederCode: "FDR-AND-33A", voltage: "33 kV", peakMw: 46 },
      geometry: { type: "Point", coordinates: [83.291, 17.834] },
    },
    {
      type: "Feature",
      properties: { id: "fd-port", nodeType: "feeder", name: "Kakinada Port Feeder", feederCode: "FDR-KKD-33A", voltage: "33 kV", peakMw: 58 },
      geometry: { type: "Point", coordinates: [82.284, 16.975] },
    },
    {
      type: "Feature",
      properties: { id: "fd-urban", nodeType: "feeder", name: "Rajamahendravaram Urban Feeder", feederCode: "FDR-RJY-33A", voltage: "33 kV", peakMw: 48 },
      geometry: { type: "Point", coordinates: [81.807, 16.998] },
    },
    {
      type: "Feature",
      properties: { id: "fd-lift", nodeType: "feeder", name: "Godavari Lift Feeder", feederCode: "FDR-RJY-33B", voltage: "33 kV", peakMw: 34 },
      geometry: { type: "Point", coordinates: [81.861, 17.065] },
    },

    {
      type: "Feature",
      properties: { id: "tx-vizag", nodeType: "transformer", name: "Gajuwaka T1", transformerRating: "33/11 kV, 40 MVA" },
      geometry: { type: "Point", coordinates: [83.194, 17.632] },
    },
    {
      type: "Feature",
      properties: { id: "tx-anand", nodeType: "transformer", name: "Pharma Park T1", transformerRating: "33/11 kV, 20 MVA" },
      geometry: { type: "Point", coordinates: [83.274, 17.812] },
    },
    {
      type: "Feature",
      properties: { id: "tx-kkd", nodeType: "transformer", name: "Kakinada Port T1", transformerRating: "33/11 kV, 25 MVA" },
      geometry: { type: "Point", coordinates: [82.291, 16.953] },
    },
    {
      type: "Feature",
      properties: { id: "tx-rjy-urban", nodeType: "transformer", name: "Rajamahendravaram T1", transformerRating: "33/11 kV, 20 MVA" },
      geometry: { type: "Point", coordinates: [81.824, 16.986] },
    },
    {
      type: "Feature",
      properties: { id: "tx-rjy-lift", nodeType: "transformer", name: "Godavari Lift T2", transformerRating: "33/11 kV, 16 MVA" },
      geometry: { type: "Point", coordinates: [81.887, 17.091] },
    },

    {
      type: "Feature",
      properties: { id: "ind-steel", nodeType: "industry", name: "Dummy Vizag Steel Rolling Park", sector: "Metals", demandMw: 38 },
      geometry: { type: "Point", coordinates: [83.218, 17.621] },
    },
    {
      type: "Feature",
      properties: { id: "ind-pharma", nodeType: "industry", name: "Dummy Anandapuram Pharma Cluster", sector: "Pharma", demandMw: 22 },
      geometry: { type: "Point", coordinates: [83.258, 17.786] },
    },
    {
      type: "Feature",
      properties: { id: "ind-port", nodeType: "industry", name: "Dummy Kakinada Port Processing Zone", sector: "Port Industry", demandMw: 27 },
      geometry: { type: "Point", coordinates: [82.311, 16.944] },
    },
    {
      type: "Feature",
      properties: { id: "ind-food", nodeType: "industry", name: "Dummy Rajamahendravaram Food Park", sector: "Food Processing", demandMw: 18 },
      geometry: { type: "Point", coordinates: [81.84, 16.975] },
    },

    {
      type: "Feature",
      properties: { id: "cs-gajuwaka", nodeType: "consumer", name: "Gajuwaka Residential Cluster", consumerMix: "Residential + Commercial", serviceCount: 15200 },
      geometry: { type: "Point", coordinates: [83.173, 17.657] },
    },
    {
      type: "Feature",
      properties: { id: "cs-vizag-north", nodeType: "consumer", name: "North Vizag Smart City Cluster", consumerMix: "Residential + IT Parks", serviceCount: 9600 },
      geometry: { type: "Point", coordinates: [83.397, 17.977] },
    },
    {
      type: "Feature",
      properties: { id: "cs-kakinada", nodeType: "consumer", name: "Kakinada Rural Service Cluster", consumerMix: "Residential + Fisheries", serviceCount: 6200 },
      geometry: { type: "Point", coordinates: [82.148, 17.081] },
    },
    {
      type: "Feature",
      properties: { id: "cs-rjy-urban", nodeType: "consumer", name: "Rajamahendravaram Urban Cluster", consumerMix: "Residential + Commercial", serviceCount: 11400 },
      geometry: { type: "Point", coordinates: [81.848, 17.003] },
    },
    {
      type: "Feature",
      properties: { id: "cs-rjy-lift", nodeType: "consumer", name: "Lift Irrigation Service Cluster", consumerMix: "Public Utility", serviceCount: 420 },
      geometry: { type: "Point", coordinates: [81.912, 17.108] },
    },
  ],
};

export const distributionLinks = {
  type: "FeatureCollection",
  features: [
    { type: "Feature", properties: { linkType: "substation_feed", from: "ss-vizag", to: "fd-steel", voltage: "33 kV" }, geometry: { type: "LineString", coordinates: [[83.165, 17.685], [83.205, 17.646]] } },
    { type: "Feature", properties: { linkType: "substation_feed", from: "ss-anand", to: "fd-pharma", voltage: "33 kV" }, geometry: { type: "LineString", coordinates: [[83.344, 17.89], [83.291, 17.834]] } },
    { type: "Feature", properties: { linkType: "substation_feed", from: "ss-kakinada", to: "fd-port", voltage: "33 kV" }, geometry: { type: "LineString", coordinates: [[82.272, 17.012], [82.284, 16.975]] } },
    { type: "Feature", properties: { linkType: "substation_feed", from: "ss-rajy", to: "fd-urban", voltage: "33 kV" }, geometry: { type: "LineString", coordinates: [[81.786, 17.012], [81.807, 16.998]] } },
    { type: "Feature", properties: { linkType: "substation_feed", from: "ss-rajy", to: "fd-lift", voltage: "33 kV" }, geometry: { type: "LineString", coordinates: [[81.786, 17.012], [81.861, 17.065]] } },

    { type: "Feature", properties: { linkType: "feeder_transformer", from: "fd-steel", to: "tx-vizag", voltage: "11 kV" }, geometry: { type: "LineString", coordinates: [[83.205, 17.646], [83.194, 17.632]] } },
    { type: "Feature", properties: { linkType: "feeder_transformer", from: "fd-pharma", to: "tx-anand", voltage: "11 kV" }, geometry: { type: "LineString", coordinates: [[83.291, 17.834], [83.274, 17.812]] } },
    { type: "Feature", properties: { linkType: "feeder_transformer", from: "fd-port", to: "tx-kkd", voltage: "11 kV" }, geometry: { type: "LineString", coordinates: [[82.284, 16.975], [82.291, 16.953]] } },
    { type: "Feature", properties: { linkType: "feeder_transformer", from: "fd-urban", to: "tx-rjy-urban", voltage: "11 kV" }, geometry: { type: "LineString", coordinates: [[81.807, 16.998], [81.824, 16.986]] } },
    { type: "Feature", properties: { linkType: "feeder_transformer", from: "fd-lift", to: "tx-rjy-lift", voltage: "11 kV" }, geometry: { type: "LineString", coordinates: [[81.861, 17.065], [81.887, 17.091]] } },

    { type: "Feature", properties: { linkType: "transformer_service", from: "tx-vizag", to: "ind-steel", voltage: "11 kV" }, geometry: { type: "LineString", coordinates: [[83.194, 17.632], [83.218, 17.621]] } },
    { type: "Feature", properties: { linkType: "transformer_service", from: "tx-vizag", to: "cs-gajuwaka", voltage: "11 kV" }, geometry: { type: "LineString", coordinates: [[83.194, 17.632], [83.173, 17.657]] } },
    { type: "Feature", properties: { linkType: "transformer_service", from: "tx-anand", to: "ind-pharma", voltage: "11 kV" }, geometry: { type: "LineString", coordinates: [[83.274, 17.812], [83.258, 17.786]] } },
    { type: "Feature", properties: { linkType: "transformer_service", from: "tx-anand", to: "cs-vizag-north", voltage: "11 kV" }, geometry: { type: "LineString", coordinates: [[83.274, 17.812], [83.397, 17.977]] } },
    { type: "Feature", properties: { linkType: "transformer_service", from: "tx-kkd", to: "ind-port", voltage: "11 kV" }, geometry: { type: "LineString", coordinates: [[82.291, 16.953], [82.311, 16.944]] } },
    { type: "Feature", properties: { linkType: "transformer_service", from: "tx-kkd", to: "cs-kakinada", voltage: "11 kV" }, geometry: { type: "LineString", coordinates: [[82.291, 16.953], [82.148, 17.081]] } },
    { type: "Feature", properties: { linkType: "transformer_service", from: "tx-rjy-urban", to: "ind-food", voltage: "11 kV" }, geometry: { type: "LineString", coordinates: [[81.824, 16.986], [81.84, 16.975]] } },
    { type: "Feature", properties: { linkType: "transformer_service", from: "tx-rjy-urban", to: "cs-rjy-urban", voltage: "11 kV" }, geometry: { type: "LineString", coordinates: [[81.824, 16.986], [81.848, 17.003]] } },
    { type: "Feature", properties: { linkType: "transformer_service", from: "tx-rjy-lift", to: "cs-rjy-lift", voltage: "11 kV" }, geometry: { type: "LineString", coordinates: [[81.887, 17.091], [81.912, 17.108]] } },
  ],
};
