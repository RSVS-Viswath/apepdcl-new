function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i += 1) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rand01(seedString) {
  const seed = xmur3(seedString)();
  return mulberry32(seed)();
}

export function seededNumber(seedString, min, max) {
  const lo = Number(min);
  const hi = Number(max);
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return NaN;
  if (hi === lo) return lo;
  const r = rand01(String(seedString));
  return lo + r * (hi - lo);
}

export function seededInt(seedString, min, max) {
  const lo = Math.ceil(min);
  const hi = Math.floor(max);
  if (hi <= lo) return lo;
  const r = rand01(String(seedString));
  return lo + Math.floor(r * (hi - lo + 1));
}

export function seededPick(seedString, items) {
  const list = Array.isArray(items) ? items : [];
  if (list.length === 0) return undefined;
  const idx = seededInt(`${seedString}|pick`, 0, list.length - 1);
  return list[idx];
}

export function seededShuffle(seedString, items) {
  const list = Array.isArray(items) ? [...items] : [];
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = seededInt(`${seedString}|shuf|${i}`, 0, i);
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

