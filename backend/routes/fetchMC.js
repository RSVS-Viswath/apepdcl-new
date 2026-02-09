import express from "express"
import pool from "../db.js"
import authenticate from "../middleware/authenticate.js"

const router = express.Router();

const MORNING_PEAK = new Set([6, 7, 8, 9]);
const EVENING_PEAK = new Set([18, 19, 20, 21]);
const ALL_PEAK = new Set([...MORNING_PEAK, ...EVENING_PEAK]);

const tariff = (category, hour) => {
  if (category === "COMMERCIAL-HT") {
    return hour >= 18 && hour < 20 ? 8.65 : 7.65;
  }
  if (category === "INDUSTRY (GENERAL)-HT") {
    if ((hour >= 6 && hour < 10) || (hour >= 18 && hour < 22)) return 7.8;
    if ((hour >= 0 && hour < 6) || (hour >= 10 && hour < 15)) return 5.55;
    return 6.3;
  }
  return 0;
};

router.get('/fetchMC', authenticate, async (req,res) => {
    try {
        const { startdate, enddate} = req.query;
        const scno = req.scno;

        if (!scno || !startdate || !enddate) {
            return res.status(400).json({ message: "Missing parameters"});
        }

        const catRes = await pool.query(
            `SELECT category_desc
             FROM ht_blp_combined
             WHERE scno = $1
             LIMIT 1`,
             [scno]
        );

        if (!catRes.rows.length) {
            return res.status(404).json({ message: "No data for scno"});
        }

        const category = catRes.rows[0].category_desc;

        const { rows } = await pool.query(
            `SELECT ts, wh_imp
             FROM ht_blp_combined
             WHERE scno = $1
             AND ts::date BETWEEN $2 AND $3`,
             [scno, startdate, enddate]
        );

        let totalConsumption = 0;
        let peakConsumption = 0;
        let peakCost = 0;

        rows.forEach(r => {
            const hour = new Date(r.ts).getHours();
            const kwh = r.wh_imp / 1000;

            totalConsumption += kwh;

            if (ALL_PEAK.has(hour)) {
                peakConsumption += kwh;
                peakCost += kwh * tariff(category, hour);
            }
        });

        const baselineQuery = `
        SELECT ts, wh_imp
        FROM ht_blp_combined
        WHERE scno = $1
          AND ts >= (
            SELECT MAX(ts) FROM ht_blp_combined WHERE scno = $1
          ) - INTERVAL '7 days'`;

        const baselineRes = await pool.query(baselineQuery, [scno]);

        let baselinePeakSum = 0;
        let baselinePeakCount = 0;

        baselineRes.rows.forEach(r => {
        const hour = new Date(r.ts).getHours();
        if (ALL_PEAK.has(hour)) {
            baselinePeakSum += r.wh_imp / 1000;
            baselinePeakCount++;
        }
        });

        const baselinePeakAvg =
        baselinePeakCount > 0 ? baselinePeakSum / baselinePeakCount : 0;

        const days = (new Date(enddate) - new Date(startdate)) / (1000 * 60 * 60 * 24) + 1;

        const selectedPeakAvg = peakConsumption / days;  

        const CO2_FACTOR = 0.4;

        const co2Savings = (baselinePeakAvg - selectedPeakAvg) * CO2_FACTOR

        res.json({
            total_consumption_kwh: Number(totalConsumption.toFixed(2)),
            peak_consumption_kwh: Number(peakConsumption.toFixed(2)),
            peak_cost: Number(peakCost.toFixed(2)),
            co2_savings: Number(co2Savings.toFixed(2))
        });
     } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error"});
     }
});

export default router;