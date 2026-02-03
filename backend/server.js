import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import pool from "./db.js";
import crypto from "crypto";


const app = express();

/* ================================
   CONFIG
================================ */
const PORT = 4000;
const JWT_SECRET = "SUPER_SECRET_KEY"; // ⛔ move to env in prod

/* ================================
   MIDDLEWARE
================================ */
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: "http://localhost:5173", // 👈 frontend URL
    credentials: true               // 🔴 REQUIRED for cookies
  })
);

/* ================================
   AUTH MIDDLEWARE
================================ */
const authenticate = (req, res, next) => {
  const token = req.cookies.access_token;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const hashOtp = (otp) =>
  crypto.createHash("sha256").update(otp).digest("hex");



/* ================================
   LOGIN
================================ */
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "Username and password required",
    });
  }

  try {
    const result = await pool.query(
      "SELECT id, username, password, scno FROM users WHERE username = $1",
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      { userId: user.id, scno: user.scno },
      JWT_SECRET,
      { expiresIn: "15m" } // ⏱ short-lived access token
    );

    // 🔐 SET SECURE COOKIE
    res.cookie("access_token", token, {
      httpOnly: true,          // ❌ JS access blocked
      secure: false,           // ⚠️ true in HTTPS (prod)
      sameSite: "strict",      // 🛡 CSRF protection
      path: "/",
      maxAge: 15 * 60 * 1000   // 15 minutes
    });

    return res.json({
      success: true,
      scno: user.scno
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/* ================================
   PROTECTED ROUTE (EXAMPLE)
================================ */
app.get("/me", authenticate, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

/* ================================
   LOGOUT
================================ */
app.post("/logout", (req, res) => {
  res.clearCookie("access_token", {
    httpOnly: true,
    secure: false,      // match login
    sameSite: "strict",
    path: "/"
  });

  res.json({
    success: true,
    message: "Logged out successfully"
  });
});

app.post("/reset-password", authenticate, async (req, res) => {
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
      [hashedPassword, req.user.userId]
    );

    // 🔐 Invalidate session after password change
    res.clearCookie("access_token", {
      httpOnly: true,
      secure: false, // true in prod
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

app.post("/send-otp", authenticate, async (req, res) => {
  const { type } = req.body; // "email" | "phone"

  if (!["email", "phone"].includes(type)) {
    return res.status(400).json({ message: "Invalid OTP type" });
  }

  const otp = generateOtp();
  const otpHash = hashOtp(otp);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

  try {
    await pool.query(
      `
      UPDATE users
      SET ${type}_otp_hash = $1,
          otp_expires_at = $2
      WHERE id = $3
      `,
      [otpHash, expiresAt, req.user.userId]
    );

    // 🔥 TEMP: log OTP (replace with SMS/email service)
    console.log(`🔐 ${type.toUpperCase()} OTP:`, otp);

    res.json({ success: true });
  } catch (err) {
    console.error("Send OTP error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/verify-otp", authenticate, async (req, res) => {
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
      [req.user.userId]
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

    // Clear OTP after success
    await pool.query(
      `
      UPDATE users
      SET ${type}_otp_hash = NULL,
          otp_expires_at = NULL
      WHERE id = $1
      `,
      [req.user.userId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ message: "Server error" });
  }
});








/* ================================
   SERVER
================================ */
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
