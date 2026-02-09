import express from "express";
import pool from "../db.js";
import authenticate from "../middleware/authenticate.js"; 

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

router.get('/fetchLast30HourlyAvgCons',authenticate, async (req, res) => {
    try {
        const scno = req.scno;  
      if (!scno) {
        return res.status(400).json({ message: "Missing scno" });
      }
  
      const dateQuery = `
        SELECT dt FROM (
          SELECT DISTINCT ts::date AS dt
          FROM ht_blp_combined
          WHERE scno = $1
          ORDER BY dt DESC
          LIMIT 1
        ) d
        ORDER BY dt ASC;
      `;
      const dateResult = await pool.query(dateQuery, [scno]);
  
      if (dateResult.rows.length === 0) {
        return res.status(404).json({ message: "No data found for this SCNO" });
      }
  
      const dataQuery = `
        SELECT ts, wh_imp
        FROM ht_blp_combined
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
  
          const val1 = whMap.get(halfHourKey);
          const val2 = whMap.get(nextHourKey);
  
          if (val1 !== undefined || val2 !== undefined) {
            const v1 = val1 ?? 0;
            const v2 = val2 ?? 0;
  
            const kWh = (v1 + v2) / 1000;
            hourlySum[hour] += kWh;
            hourlyCount[hour] += 1;
          }
        }
      }
  
      const hourlyAverages = [];
      for (let hour = 0; hour < 24; hour++) {
        if (hourlyCount[hour] > 0) {
          hourlyAverages.push({
            hour: `${pad(hour)}:00`,
            avg_consumption: (hourlySum[hour] / hourlyCount[hour]).toFixed(2)
          });
        }
      }
  
      return res.json(hourlyAverages);
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });  

export default router;
