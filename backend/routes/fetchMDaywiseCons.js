import express from "express";
import pool from "../db.js";
import authenticate from "../middleware/authenticate.js";

const router = express.Router();

const WEEK_MAP = {
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
  0: "Sun", 
};

router.get("/fetchMDaywiseCons", authenticate, async (req, res) => {
  try {
    const { month, year } = req.query;
    const scno = req.scno;

    if (!scno || !month || !year) {
      return res.status(400).json({ message: "Missing parameters" });
    }

    const { rows } = await pool.query(
      `
      SELECT
        DATE(ts) AS day,
        EXTRACT(DOW FROM ts) AS dow,
        SUM(wh_imp) / 1000 AS kwh
      FROM ht_blp_combined
      WHERE scno = $1
        AND EXTRACT(MONTH FROM ts) = $2
        AND EXTRACT(YEAR FROM ts) = $3
      GROUP BY day, dow
      ORDER BY day
      `,
      [scno, month, year]
    );

    const dayBuckets = {
      Mon: [],
      Tue: [],
      Wed: [],
      Thu: [],
      Fri: [],
      Sat: [],
      Sun: [],
    };

    rows.forEach((r) => {
      const dayName = WEEK_MAP[r.dow];
      if (dayName) {
        dayBuckets[dayName].push(Number(r.kwh));
      }
    });

    const result = Object.keys(dayBuckets).map((day) => {
      const values = dayBuckets[day];
      const avg =
        values.length > 0
          ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)
          : "0.00";

      return {
        day,
        avg_consumption: avg,
      };
    });

    return res.json({
      month: Number(month),
      year: Number(year),
      data: result,
    });

  } catch (err) {
    console.error("fetchMDaywiseCons error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
