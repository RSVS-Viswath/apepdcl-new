import jwt from "jsonwebtoken";

const JWT_SECRET = "SUPER_SECRET_KEY"; 

function authenticate(req, res, next) {
  try {
    const token = req.cookies?.access_token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    req.userId = decoded.userId;
    req.scno = decoded.scno;

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired session",
    });
  }
}

export default authenticate;
