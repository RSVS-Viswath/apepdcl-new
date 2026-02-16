import express from "express";
import pool from "../db.js";
import authenticate from "../middleware/authenticate.js";

const router = express.Router();

router.get("/me", authenticate, async (req, res) => {
  try {
    const { scno } = req;

    const result = await pool.query(
      `
      SELECT short_name,category_desc
      FROM ht_blp_combined
      WHERE scno = $1
      LIMIT 1
      `,
      [scno]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Consumer not found",
      });
    }

    res.json({
      success: true,
      scno,
      short_name: result.rows[0].short_name,
      category_desc: result.rows[0].category_desc
    });
  } catch (err) {
    console.error("ME API error:", err);
    res.status(500).json({ success: false });
  }
});

export default router;
