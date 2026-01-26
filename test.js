const express = require('express');
const pool = require('./dbpg.js');
const router = express.Router();

const pad = (n) => n.toString().padStart(2, '0');

const MORNING_PEAK = new Set([6, 7, 8, 9]);
const EVENING_PEAK = new Set([18, 19, 20, 21]);
const ALL_PEAK = new Set([...MORNING_PEAK, ...EVENING_PEAK]);

router.get('/', async (req, res) => {
  try {
    const { scno, startdate, enddate, per, window = 'B' } = req.query;

    if (!scno || !startdate || !enddate) {
      return res.status(400).json({
        message: 'Missing scno, startdate or enddate',
      });
    }

    const percent = Number(per ?? 0);

    if (percent < 0 || percent > 100) {
      return res.status(400).json({
        message: 'per must be a number between 0 and 100',
      });
    }

    if (!['M', 'E', 'B'].includes(window)) {
      return res.status(400).json({
        message: 'window must be one of M, E, or B',
      });
    }

    if (startdate > enddate) {
      return res.status(400).json({
        message: 'startdate cannot be after enddate',
      });
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
        return res.status(404).json({
          message: 'No readings found for the given date',
        });
      }

      hourlyData = rows.map((row) => {
        const d = new Date(row.ts);
        return {
          hour: d.getHours(),
          consumption: row.wh_imp / 1000,
        };
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
        return res.status(404).json({
          message: 'No readings found for the given date range',
        });
      }

      hourlyData = rows.map((row) => ({
        hour: Number(row.hour),
        consumption: (row.total_wh / row.sample_count) / 1000,
      }));
    }


    let totalReducedKwh = 0;

    if (percent > 0) {
      let removedEnergy = 0;

      const shouldReduce = (hour) => {
        if (window === 'M') return MORNING_PEAK.has(hour);
        if (window === 'E') return EVENING_PEAK.has(hour);
        return ALL_PEAK.has(hour); // B
      };

      const shouldReceive = (hour) => {
        if (window === 'M')
          return !MORNING_PEAK.has(hour) && !EVENING_PEAK.has(hour);
        if (window === 'E')
          return !EVENING_PEAK.has(hour) && !MORNING_PEAK.has(hour);
        return !ALL_PEAK.has(hour); // B
      };

      hourlyData.forEach((h) => {
        if (shouldReduce(h.hour)) {
          const reduction = h.consumption * (percent / 100);
          h.consumption -= reduction;
          removedEnergy += reduction;
        }
      });

      totalReducedKwh = removedEnergy;

      const receivers = hourlyData.filter((h) => shouldReceive(h.hour));

      if (receivers.length > 0) {
        const redistribution = removedEnergy / receivers.length;
        receivers.forEach((h) => {
          h.consumption += redistribution;
        });
      }
    }

    const data = hourlyData
      .sort((a, b) => a.hour - b.hour)
      .map((h) => ({
        hour: `${pad(h.hour)}:00`,
        consumption: h.consumption.toFixed(2),
      }));

    return res.json({
      total_reduced_kwh: totalReducedKwh.toFixed(2),
      data,
    });

  } catch (error) {
    console.error('Error fetching hourly consumption:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;