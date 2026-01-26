const express = require('express');
const pool = require('./dbpg.js');
const router = express.Router();

const pad = (n) => n.toString().padStart(2, '0');

const MORNING_PEAK = new Set([6, 7, 8, 9]);
const EVENING_PEAK = new Set([18, 19, 20, 21]);

router.get('/', async (req, res) => {
  try {
    const { scno, startdate, enddate, per, window } = req.query;

    if (!scno || !startdate || !enddate) {
      return res.status(400).json({ message: 'Missing scno, startdate or enddate' });
    }

    const percent = Number(per ?? 0);
    if (percent < 0 || percent > 100) {
      return res.status(400).json({ message: 'per must be a number between 0 and 100' });
    }

    if (startdate > enddate) {
      return res.status(400).json({ message: 'startdate cannot be after enddate' });
    }

    const win = window?.toUpperCase() ?? 'B';
    if (!['M', 'E', 'B', 'N'].includes(win)) {
      return res.status(400).json({ message: 'window must be one of M, E, B, N' });
    }

    let hourlyData = [];

    if (startdate === enddate) {
      const query = `
        SELECT ts, wh_imp
        FROM ht_blp_combined
        WHERE scno = $1
          AND ts::date = $2
        ORDER BY ts ASC;
      `;

      const { rows } = await pool.query(query, [scno, startdate]);
      if (rows.length === 0) {
        return res.status(404).json({ message: 'No readings found for the given date' });
      }

      hourlyData = rows.map((row) => {
        const d = new Date(row.ts);
        return { hour: d.getHours(), consumption: row.wh_imp / 1000 }; // kWh
      });
    } else {
      const query = `
        SELECT
          EXTRACT(HOUR FROM ts) AS hour,
          SUM(wh_imp) AS total_wh,
          COUNT(wh_imp) AS sample_count
        FROM ht_blp_combined
        WHERE scno = $1
          AND ts::date BETWEEN $2 AND $3
        GROUP BY EXTRACT(HOUR FROM ts)
        ORDER BY hour;
      `;

      const { rows } = await pool.query(query, [scno, startdate, enddate]);
      if (rows.length === 0) {
        return res.status(404).json({ message: 'No readings found for the given date range' });
      }

      hourlyData = rows.map((row) => ({
        hour: Number(row.hour),
        consumption: (row.total_wh / row.sample_count) / 1000,
      }));
    }

    if (percent > 0 && win !== 'N') {
      let removedEnergy = 0;
      let nonPeakCount = 0;

      const morningHours = win === 'M' || win === 'B' ? MORNING_PEAK : new Set();
      const eveningHours = win === 'E' || win === 'B' ? EVENING_PEAK : new Set();

      hourlyData.forEach((h) => {
        if (morningHours.has(h.hour) || eveningHours.has(h.hour)) {
          const reduction = h.consumption * (percent / 100);
          h.consumption -= reduction;
          removedEnergy += reduction;
        } else {
          nonPeakCount++;
        }
      });

      if (nonPeakCount > 0) {
        const redistribution = removedEnergy / nonPeakCount;
        hourlyData.forEach((h) => {
          if (!morningHours.has(h.hour) && !eveningHours.has(h.hour)) {
            h.consumption += redistribution;
          }
        });
      }
    }

    const response = hourlyData
      .sort((a, b) => a.hour - b.hour)
      .map((h) => ({
        hour: `${pad(h.hour)}:00`,
        consumption: h.consumption.toFixed(2),
      }));

    return res.json(response);

  } catch (error) {
    console.error('Error fetching hourly consumption:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;