import { seededInt, seededNumber, seededPick } from "./seeded";

const DISTRICTS = ["VZM", "AKP", "VSP", "ELR", "EDG"];

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
  const htIncome = Math.round(seededNumber(`${serviceNo}|inc`, isIndustrial ? 12_00_000 : 4_00_000, isIndustrial ? 58_00_000 : 22_00_000));

  return {
    serviceNo,
    consumerName: name,
    category,
    contractedDemand,
    htIncome,
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

  return rows;
}

export const DISTRICT_OPTIONS = ["All Districts", ...DISTRICTS];

