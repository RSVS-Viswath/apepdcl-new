import { seededInt, seededPick } from "./seeded";

const DISTRICTS = ["SKM", "VZM", "AKP", "VSP", "ELR", "EDG"];
const EXTRA_DISTRICT_OPTIONS = ["RJY"];

const INDUSTRIAL_CATEGORIES = [
  "INDUSTRY (GENERAL)-HT",
  "INDUSTRY (MANUFACTURING)-HT",
  "INDUSTRY (AGRO)-HT",
  "INDUSTRY (FOOD)-HT",
];

const COMMERCIAL_CATEGORIES = [
  "COMMERCIAL-HT",
  "COMMERCIAL (RETAIL)-HT",
  "COMMERCIAL (OFFICES)-HT",
  "COMMERCIAL (HOSPITALITY)-HT",
];

const NAME_PREFIX = [
  "Sri",
  "Sai",
  "Lakshmi",
  "Andhra",
  "Coastal",
  "Vijaya",
  "Green",
  "Royal",
  "Prime",
];

const NAME_SUFFIX_INDUSTRIAL = [
  "Steels",
  "Cements",
  "Foods",
  "Textiles",
  "Industries",
  "Engineering",
  "Agro Mills",
  "Chemicals",
];

const NAME_SUFFIX_COMMERCIAL = [
  "Mart",
  "Traders",
  "Enterprises",
  "Plaza",
  "Stores",
  "Hospitality",
  "Offices",
  "Retail Hub",
];

function buildConsumer(serviceNo, category) {
  const isIndustrial = String(category).toUpperCase().includes("INDUSTRY");
  const name = [
    seededPick(`${serviceNo}|p`, NAME_PREFIX),
    seededPick(`${serviceNo}|s`, isIndustrial ? NAME_SUFFIX_INDUSTRIAL : NAME_SUFFIX_COMMERCIAL),
  ]
    .filter(Boolean)
    .join(" ");

  const contractedDemand = seededInt(`${serviceNo}|cd`, isIndustrial ? 120 : 60, isIndustrial ? 520 : 260);
  const htIncomerKv = 11;

  return {
    serviceNo,
    consumerName: name,
    category,
    contractedDemand,
    htIncomerKv,
  };
}

export function getAllConsumers() {
  const rows = [];

  for (const d of DISTRICTS) {
    for (let i = 1; i <= 15; i += 1) {
      const serviceNo = `${d}${String(i).padStart(3, "0")}`;
      const category = seededPick(`${serviceNo}|cat`, COMMERCIAL_CATEGORIES);
      rows.push(buildConsumer(serviceNo, category));
    }

    for (let i = 1; i <= 15; i += 1) {
      const serviceNo = `${d}${500 + i}`; // e.g. AKP501
      const category = seededPick(`${serviceNo}|cat`, INDUSTRIAL_CATEGORIES);
      rows.push(buildConsumer(serviceNo, category));
    }
  }

  rows.push({
    ...buildConsumer("KKD001", seededPick("KKD001|cat", COMMERCIAL_CATEGORIES)),
    consumerName: "Kakinada Demo Site",
  });
  rows.push({
    ...buildConsumer("KKD002", seededPick("KKD002|cat", COMMERCIAL_CATEGORIES)),
    consumerName: "Peddapuram Demo Site",
  });
  rows.push({
    ...buildConsumer("ELU001", seededPick("ELU001|cat", INDUSTRIAL_CATEGORIES)),
    consumerName: "Polavaram Demo Site",
  });

  rows.push({
    ...buildConsumer("RJY001", seededPick("RJY001|cat", COMMERCIAL_CATEGORIES)),
    consumerName: "Rajamahendravaram Retail Hub",
  });
  rows.push({
    ...buildConsumer("RJY002", seededPick("RJY002|cat", COMMERCIAL_CATEGORIES)),
    consumerName: "Rajamahendravaram Traders",
  });
  rows.push({
    ...buildConsumer("RJY003", seededPick("RJY003|cat", COMMERCIAL_CATEGORIES)),
    consumerName: "Godavari Offices RJY",
  });
  rows.push({
    ...buildConsumer("RJY501", seededPick("RJY501|cat", INDUSTRIAL_CATEGORIES)),
    consumerName: "Rajamahendravaram Foods",
  });
  rows.push({
    ...buildConsumer("RJY502", seededPick("RJY502|cat", INDUSTRIAL_CATEGORIES)),
    consumerName: "Godavari Engineering RJY",
  });
  rows.push({
    ...buildConsumer("RJY503", seededPick("RJY503|cat", INDUSTRIAL_CATEGORIES)),
    consumerName: "Rajamahendravaram Agro Mills",
  });

  return rows;
}

export const DISTRICT_OPTIONS = ["All Districts", ...DISTRICTS, ...EXTRA_DISTRICT_OPTIONS];
