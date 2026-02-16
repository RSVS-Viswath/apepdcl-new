import express from "express"
import pool from "../db.js"
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

router.get('/fetchHMHourlyConsumption', authenticate, async (req,res) => {
   console.log("✅ fetchHMHourlyConsumption route loaded");

   try {
      const { date } = req.query;
      const scno = req.scno;
      if (!scno || !date) {
          return res.status(400).json({ message: 'Missing scno or date' });
      }

      const endDate = new Date(date);
      const startDate = new Date(date);
      startDate.setDate(endDate.getDate() - 29);

      const formattedStart = formatLocalDate(startDate);
      const formattedEnd = formatLocalDate(endDate);

      const query = `SELECT ts, wh_imp FROM ht_blp_combined WHERE scno = $1 AND ts::date BETWEEN $2 AND $3 ORDER BY ts ASC;`;
      
      const result = await pool.query(query, [scno, formattedStart, formattedEnd]);
      const rows = result.rows;

      if (rows.length === 0) {
          return res.status(404).json({ message: 'No readings found for the given date range' });
      }

      const whMap = new Map();
      for (const row of rows) {
         const formattedTs = formatLocalTS(row.ts);
         whMap.set(formattedTs, row.wh_imp);
      }

      const hourlyConsumption = {};

      for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const currentDate = formatLocalDate(d);

      for (let hour = 0; hour < 24; hour++) {
        const halfHourKey = `${currentDate} ${pad(hour)}:30:00`;
        let nextHourKey;

        if (hour === 23) {
          const nextDay = new Date(d);
          nextDay.setDate(nextDay.getDate() + 1);
          nextHourKey = `${formatLocalDate(nextDay)} 00:00:00`;
        } else {
          nextHourKey = `${currentDate} ${pad(hour + 1)}:00:00`;
        }

        const val1 = whMap.get(halfHourKey);
        const val2 = whMap.get(nextHourKey);

        if (val1 !== undefined || val2 !== undefined) {
          const v1 = val1 ?? 0;
          const v2 = val2 ?? 0;
          const totalkWh = parseFloat((v1 + v2) / 1000).toFixed(2);
          hourlyConsumption[`${currentDate} ${pad(hour)}:00:00`] = parseFloat(totalkWh);
        }
      }
    }
  return res.json(hourlyConsumption);
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
  }
 });

export default router;
