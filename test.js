const express = require('express');
const pool = require('./dbpg.js');
const router = express.Router();

function formatLocalTS(ts) {
  const d = new Date(ts);
  const pad = (n) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function formatLocalDate(d) {
  const pad = (n) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function pad(n) {
  return n.toString().padStart(2, '0');
}

router.get('/', async (req, res) => {
  try {
    const { scno, percent, window } = req.query;

    if (!scno) {
      return res.status(400).json({ message: "Missing scno" });
    }

    const pct = Number(percent);
    if (![10, 20, 30].includes(pct)) {
      return res.status(400).json({ message: "percent must be 10, 20, or 30" });
    }

    if (!['mor', 'eve', 'both'].includes(window)) {
      return res.status(400).json({ message: "window must be mor, eve, or both" });
    }

    const dateQuery = `
      SELECT dt FROM (
        SELECT DISTINCT ts::date AS dt
        FROM ht_blp
        WHERE scno = $1
        ORDER BY dt DESC
        LIMIT 30
      ) d
      ORDER BY dt ASC;
    `;
    const dateResult = await pool.query(dateQuery, [scno]);

    if (dateResult.rows.length === 0) {
      return res.status(404).json({ message: "No data found for this SCNO" });
    }

    const dataQuery = `
      SELECT ts, wh_imp
      FROM ht_blp
      WHERE scno = $1
        AND ts::date = ANY($2::date[])
      ORDER BY ts ASC;
    `;
    const dateArray = dateResult.rows.map(r => r.dt);
    const result = await pool.query(dataQuery, [scno, dateArray]);

    const whMap = new Map();
    for (const row of result.rows) {
      whMap.set(formatLocalTS(row.ts), row.wh_imp);
    }

    const hourlySum = Array(24).fill(0);
    const hourlyCount = Array(24).fill(0);

    for (const r of dateResult.rows) {
      const currentDate = new Date(r.dt);
      const formattedDate = formatLocalDate(currentDate);

      for (let hour = 0; hour < 24; hour++) {
        const halfHourKey = `${formattedDate} ${pad(hour)}:30:00`;
        let nextHourKey;

        if (hour === 23) {
          const nextDay = new Date(currentDate);
          nextDay.setDate(nextDay.getDate() + 1);
          nextHourKey = `${formatLocalDate(nextDay)} 00:00:00`;
        } else {
          nextHourKey = `${formattedDate} ${pad(hour + 1)}:00:00`;
        }

        const v1 = whMap.get(halfHourKey) ?? 0;
        const v2 = whMap.get(nextHourKey) ?? 0;

        if (v1 !== 0 || v2 !== 0) {
          hourlySum[hour] += (v1 + v2) / 1000;
          hourlyCount[hour] += 1;
        }
      }
    }

    const hourly = Array(24).fill(null).map((_, h) => {
      if (hourlyCount[h] === 0) return null;
      return hourlySum[h] / hourlyCount[h];
    });

    const applyShift = (sources, targets) => {
      let removed = 0;

      for (const h of sources) {
        if (hourly[h] == null) continue;
        const cut = hourly[h] * (pct / 100);
        hourly[h] -= cut;
        removed += cut;
      }

      const addPerHour = removed / targets.length;
      for (const h of targets) {
        if (hourly[h] == null) continue;
        hourly[h] += addPerHour;
      }
    };

    if (window === 'mor' || window === 'both') {
      applyShift([6, 7], [4, 5]);
      applyShift([8, 9], [10, 11]);
    }

    if (window === 'eve' || window === 'both') {
      applyShift([18, 19], [16, 17]);
      applyShift([20, 21], [22, 23]);
    }

    const response = [];
    for (let h = 0; h < 24; h++) {
      if (hourly[h] != null) {
        response.push({
          hour: `${pad(h)}:00`,
          avg_consumption: hourly[h].toFixed(2)
        });
      }
    }

    return res.json(response);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;