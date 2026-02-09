import express from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import pool from "../db.js";
import authenticate from "../middleware/authenticate.js";

const router = express.Router();

const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const hashOtp = (otp) =>
  crypto.createHash("sha256").update(otp).digest("hex");

router.post("/reset-password", authenticate, async (req, res) => {
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 8 characters long",
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      "UPDATE users SET password = $1 WHERE id = $2",
      [hashedPassword, req.userId]
    );

    res.clearCookie("access_token", {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      path: "/",
    });

    return res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (err) {
    console.error("Password reset error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});


router.post("/send-otp", authenticate, async (req, res) => {
  const { type } = req.body; 

  if (!["email", "phone"].includes(type)) {
    return res.status(400).json({ message: "Invalid OTP type" });
  }

  const otp = generateOtp();
  const otpHash = hashOtp(otp);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  try {
    await pool.query(
      `
      UPDATE users
      SET ${type}_otp_hash = $1,
          otp_expires_at = $2
      WHERE id = $3
      `,
      [otpHash, expiresAt, req.userId]
    );

    console.log(`🔐 ${type.toUpperCase()} OTP:`, otp);

    res.json({ success: true });
  } catch (err) {
    console.error("Send OTP error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/verify-otp", authenticate, async (req, res) => {
  const { type, otp } = req.body;

  if (!otp || !["email", "phone"].includes(type)) {
    return res.status(400).json({ message: "Invalid request" });
  }

  try {
    const result = await pool.query(
      `
      SELECT ${type}_otp_hash, otp_expires_at
      FROM users
      WHERE id = $1
      `,
      [req.userId]
    );

    const user = result.rows[0];

    if (!user || !user.otp_expires_at) {
      return res.status(400).json({ message: "OTP not requested" });
    }

    if (new Date() > user.otp_expires_at) {
      return res.status(400).json({ message: "OTP expired" });
    }

    if (hashOtp(otp) !== user[`${type}_otp_hash`]) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    await pool.query(
      `
      UPDATE users
      SET ${type}_otp_hash = NULL,
          otp_expires_at = NULL
      WHERE id = $1
      `,
      [req.userId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
