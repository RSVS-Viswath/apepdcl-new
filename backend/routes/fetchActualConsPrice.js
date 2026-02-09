import express from "express"
import pool from "../db.js"
import authenticate from "../middleware/authenticate.js";
const router = express.Router();

const pad = (n) => n.toString().padStart(2, '0');

const MORNING_PEAK = new Set([6, 7, 8, 9]);
const EVENING_PEAK = new Set([18, 19, 20, 21]);
const ALL_PEAK = new Set([...MORNING_PEAK, ...EVENING_PEAK]);

router.get('/fetchActualConsPrice',authenticate, async (req, res) => {
  try {
    const { startdate, enddate, savings } = req.query;
    const scno = req.scno;

    if (!scno || !startdate || !enddate || !savings) {
      return res.status(400).json({ message: 'Missing parameters' });
    }

    const targetSavings = Number(savings);
    if (targetSavings <= 0) {
      return res.status(400).json({ message: 'Invalid savings value' });
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

    const peakHours = baseHourly.filter(h => ALL_PEAK.has(h.hour));
    const normalHours = baseHourly.filter(
      h => !ALL_PEAK.has(h.hour) &&
      !((h.hour >= 0 && h.hour < 6) || (h.hour >= 10 && h.hour < 15))
    );
    const offPeakHours = baseHourly.filter(
      h => (h.hour >= 0 && h.hour < 6) || (h.hour >= 10 && h.hour < 15)
    );

    const totalPeakKwh = peakHours.reduce((s, h) => s + h.consumption, 0);

    const avgDiff = (receivers) => {
      const diffs = [];
      peakHours.forEach(p => {
        receivers.forEach(r => {
          diffs.push(tariff(p.hour) - tariff(r.hour));
        });
      });
      return diffs.reduce((a, b) => a + b, 0) / diffs.length;
    };

    const minDiff = avgDiff(normalHours);
    const maxDiff = avgDiff(offPeakHours);

    const minRequiredKwh = targetSavings / minDiff;
    const maxRequiredKwh = targetSavings / maxDiff;

    const minPercent = minRequiredKwh / totalPeakKwh;
    const maxPercent = maxRequiredKwh / totalPeakKwh;

    const needsMoreThan100 =
      minPercent > 1 && maxPercent > 1;

    const hourlyData = baseHourly.map(h => ({ ...h }));
    let removed = 0;

    hourlyData.forEach(h => {
      if (ALL_PEAK.has(h.hour)) {
        const r = h.consumption * Math.min(1, maxPercent);
        h.consumption -= r;
        removed += r;
      }
    });

    if (offPeakHours.length) {
      const add = removed / offPeakHours.length;
      hourlyData.forEach(h => {
        if ((h.hour >= 0 && h.hour < 6) || (h.hour >= 10 && h.hour < 15)) {
          h.consumption += add;
        }
      });
    }

    res.json({
      category_desc: category,
      savings_target: targetSavings.toFixed(2),
      percent_range: {
        min: (minPercent * 100).toFixed(2),
        max: (maxPercent * 100).toFixed(2)
      },
      kwh_range: {
        min: minRequiredKwh.toFixed(2),
        max: maxRequiredKwh.toFixed(2)
      },
      needs_more_than_100_percent: needsMoreThan100,
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