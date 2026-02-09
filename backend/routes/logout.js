import express from "express";

const router = express.Router();

router.post("/logout", (req, res) => {
    res.clearCookie("access_token", {
      httpOnly: true,
      secure: false,      
      sameSite: "strict",
      path: "/"
    });
  
    res.json({
      success: true,
      message: "Logged out successfully"
    });
  });

  export default router;
