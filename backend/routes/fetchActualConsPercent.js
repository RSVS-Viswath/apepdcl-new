import express from "express";
import pool from "../db.js";
import authenticate from "../middleware/authenticate.js";
const router = express.Router();

const pad = (n) => n.toString().padStart(2, '0');

const MORNING_PEAK = new Set([6, 7, 8, 9]);
const EVENING_PEAK = new Set([18, 19, 20, 21]);
const ALL_PEAK = new Set([...MORNING_PEAK, ...EVENING_PEAK]);

router.get('/fetchActualConsPercent',authenticate, async (req, res) => {
  try {
    const { startdate, enddate, per, window } = req.query;
    const scno = req.scno;

    if (!scno || !startdate || !enddate) {
      return res.status(400).json({ message: 'Missing parameters' });
    }

    const percent = Number(per ?? 0);
    if (percent < 0 || percent > 100) {
      return res.status(400).json({ message: 'Invalid per value' });
    }

    const catRes = await pool.query(
      `SELECT category_desc FROM ht_blp_combined WHERE scno = $1 LIMIT 1`,
      [scno]
    );

    if (!catRes.rows.length) {
      return res.status(404).json({ message: 'No data for scno' });
    }

    const category = catRes.rows[0].category_desc;

    let baseHourly = [];

    if (startdate === enddate) {
      const { rows } = await pool.query(
        `SELECT ts, wh_imp FROM ht_blp_combined
         WHERE scno=$1 AND ts::date=$2 ORDER BY ts`,
        [scno, startdate]
      );

      baseHourly = rows.map(r => ({
        hour: new Date(r.ts).getHours(),
        consumption: r.wh_imp / 1000
      }));
    } else {
      const { rows } = await pool.query(
        `SELECT EXTRACT(HOUR FROM ts) AS hour,
                SUM(wh_imp) AS wh,
                COUNT(*) AS cnt
         FROM ht_blp_combined
         WHERE scno=$1 AND ts::date BETWEEN $2 AND $3
         GROUP BY 1 ORDER BY 1`,
        [scno, startdate, enddate]
      );

      baseHourly = rows.map(r => ({
        hour: Number(r.hour),
        consumption: (r.wh / r.cnt) / 1000
      }));
    }

    const tariff = (hour) => {
      if (category === 'COMMERCIAL-HT') {
        return (hour >= 18 && hour < 20) ? 8.65 : 7.65;
      }

      if (category === 'INDUSTRY (GENERAL)-HT') {
        if ((hour >= 6 && hour < 10) || (hour >= 18 && hour < 22)) return 7.8;
        if ((hour >= 0 && hour < 6) || (hour >= 10 && hour < 15)) return 5.55;
        return 6.3;
      }

      return 0;
    };

    const actualCost = baseHourly.reduce(
      (s, h) => s + h.consumption * tariff(h.hour),
      0
    );

    const isPeak = (h) => {
      if (window === 'M') return MORNING_PEAK.has(h);
      if (window === 'E') return EVENING_PEAK.has(h);
      if (window === 'B') return ALL_PEAK.has(h);
      return false;
    };

    let totalReducedKwh = 0;
    baseHourly.forEach(h => {
      if (isPeak(h.hour)) {
        totalReducedKwh += h.consumption * (percent / 100);
      }
    });

    const normalHour = (h) =>
      !ALL_PEAK.has(h) &&
      !((h >= 0 && h < 6) || (h >= 10 && h < 15));

    const offPeakHour = (h) =>
      (h >= 0 && h < 6) || (h >= 10 && h < 15);

    const simulate = (receiverFn) => {
      const receivers = baseHourly.filter(h => receiverFn(h.hour));
      if (!receivers.length) return actualCost;

      const add = totalReducedKwh / receivers.length;

      return baseHourly.reduce((sum, h) => {
        let c = h.consumption;
        if (receiverFn(h.hour)) c += add;
        if (isPeak(h.hour)) c -= h.consumption * (percent / 100);
        return sum + c * tariff(h.hour);
      }, 0);
    };

    const minCost = simulate(normalHour);
    const maxCost = simulate(offPeakHour);

    const hourlyData = baseHourly.map(h => ({ ...h }));

    let removed = 0;
    hourlyData.forEach(h => {
      if (isPeak(h.hour)) {
        const r = h.consumption * (percent / 100);
        h.consumption -= r;
        removed += r;
      }
    });

    const receivers = hourlyData.filter(h => !isPeak(h.hour));
    if (receivers.length) {
      const add = removed / receivers.length;
      receivers.forEach(h => h.consumption += add);
    }

    res.json({
      category_desc: category,
      total_reduced_kwh: totalReducedKwh.toFixed(2),
      min_savings: Math.max(0, actualCost - minCost).toFixed(2),
      max_savings: Math.max(0, actualCost - maxCost).toFixed(2),
      data: hourlyData.map(h => ({
        hour: `${pad(h.hour)}:00`,
        consumption: h.consumption.toFixed(2)
      }))
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

export default router;