import express from "express";
import pool from "../db.js";
import authenticate from "../middleware/authenticate.js";

const router = express.Router();

function getTariffBucket(category, hour) {
  if (category === "INDUSTRY (GENERAL)-HT") {
    if ((hour >= 6 && hour < 10) || (hour >= 18 && hour < 22)) {
      return "Peak";
    }
    if ((hour >= 0 && hour < 6) || (hour >= 10 && hour < 15)) {
      return "Off-Peak";
    }
    return "Normal";
  }

  if (category === "COMMERCIAL-HT") {
    if (hour >= 18 && hour < 20) {
      return "Peak";
    }
    return "Normal";
  }

  return "Normal";
}

router.get("/fetchTariffBasedConsumption", authenticate, async (req, res) => {
  try {
    const { startdate, enddate } = req.query;
    const scno = req.scno;

    if (!scno || !startdate || !enddate) {
      return res.status(400).json({ message: "Missing parameters" });
    }

    const catRes = await pool.query(
      `
      SELECT category_desc
      FROM ht_blp_combined
      WHERE scno = $1
      LIMIT 1
      `,
      [scno]
    );

    if (!catRes.rows.length) {
      return res.status(404).json({ message: "Category not found" });
    }

    const category = catRes.rows[0].category_desc;

    const { rows } = await pool.query(
      `
      SELECT ts, wh_imp
      FROM ht_blp_combined
      WHERE scno = $1
        AND ts::date BETWEEN $2 AND $3
      `,
      [scno, startdate, enddate]
    );

    let peakKwh = 0;
    let normalKwh = 0;
    let offPeakKwh = 0;

    rows.forEach((r) => {
      const hour = new Date(r.ts).getHours();
      const kwh = r.wh_imp / 1000;

      const bucket = getTariffBucket(category, hour);

      if (bucket === "Peak") peakKwh += kwh;
      else if (bucket === "Off-Peak") offPeakKwh += kwh;
      else normalKwh += kwh;
    });

    res.json({
      category,
      peak_kwh: Number(peakKwh.toFixed(2)),
      normal_kwh: Number(normalKwh.toFixed(2)),
      offpeak_kwh: Number(offPeakKwh.toFixed(2)),
    });

  } catch (err) {
    console.error("fetchTariffBasedConsumption error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
