import express from "express";
import pool from "../db.js";
import authenticate from "../middleware/authenticate.js";
const router = express.Router();

const pad = (n) => n.toString().padStart(2, '0');

router.get("/fetchhcons", authenticate, async (req, res) => {
    try {
      const { startdate, enddate } = req.query;
      const scno = req.scno;
  
      if (!scno || !startdate || !enddate) {
        return res.status(400).json({ message: "Missing parameters" });
      }
  
      let hourly = [];
  
      if (startdate === enddate) {
        const { rows } = await pool.query(
          `
          SELECT ts, wh_imp
          FROM ht_blp_combined
          WHERE scno = $1
            AND ts::date = $2
          ORDER BY ts
          `,
          [scno, startdate]
        );
  
        hourly = rows.map(r => ({
          hour: `${pad(new Date(r.ts).getHours())}:00`,
          consumption: (r.wh_imp / 1000).toFixed(2)
        }));
      }
  
      else {
        const { rows } = await pool.query(
          `
          SELECT
            EXTRACT(HOUR FROM ts) AS hour,
            SUM(wh_imp) AS wh,
            COUNT(*) AS cnt
          FROM ht_blp_combined
          WHERE scno = $1
            AND ts::date BETWEEN $2 AND $3
          GROUP BY 1
          ORDER BY 1
          `,
          [scno, startdate, enddate]
        );
  
        hourly = rows.map(r => ({
          hour: `${pad(Number(r.hour))}:00`,
          consumption: ((r.wh / r.cnt) / 1000).toFixed(2)
        }));
      }
  
      return res.json({
        data: hourly
      });
  
    } catch (err) {
      console.error("fetchhcons error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  export default router;
  