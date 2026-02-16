import express from "express";
import pool from "../db.js";
import authenticate from "../middleware/authenticate.js";

const router = express.Router();

router.get("/fetchMCA", authenticate, async (req, res) => {
  try {
    const { startdate, enddate } = req.query;
    const scno = req.scno;

    if (!scno || !startdate || !enddate) {
      return res.status(400).json({ message: "Missing parameters" });
    }

    const minPfRes = await pool.query(
      `
      SELECT MIN(pf) AS min_pf
      FROM smartmeters.ht_ip_billing_new
      WHERE scno = $1
        AND ts::date BETWEEN $2 AND $3
      `,
      [scno, startdate, enddate]
    );

    const min_pf = Number(minPfRes.rows[0]?.min_pf ?? 0);

    const avgPfRes = await pool.query(
      `
      SELECT pf
      FROM smartmeters.ht_ip_billing_new
      WHERE scno = $1
        AND ts::date BETWEEN $2 AND $3
        AND pf IS NOT NULL
      `,
      [scno, startdate, enddate]
    );

    let pfSum = 0;
    let pfCount = 0;

    avgPfRes.rows.forEach(r => {
      pfSum += Number(r.pf);
      pfCount++;
    });

    const avg_pf = pfCount > 0 ? pfSum / pfCount : 0;


    const loadRes = await pool.query(
      `
      SELECT load
      FROM ht_blp_combined
      WHERE scno = $1
      LIMIT 1
      `,
      [scno]
    );

    const contracted_demand = Number(loadRes.rows[0]?.load ?? 0);

    const peakDemandRes = await pool.query(
      `
      SELECT MAX(va_imp) AS peak_demand
      FROM smartmeters.ht_ip_billing_new
      WHERE scno = $1
        AND ts::date BETWEEN $2 AND $3
      `,
      [scno, startdate, enddate]
    );

    const peak_demand = Number(peakDemandRes.rows[0]?.peak_demand ?? 0);

    res.json({
      min_pf: Number(min_pf.toFixed(2)),
      avg_pf: Number(avg_pf.toFixed(2)),
      contracted_demand,
      peak_demand: Number(peak_demand.toFixed(2))/1000,
    });

  } catch (err) {
    console.error("fetchMCA error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
