const jwt = require("jsonwebtoken");

/**
 * Middleware to verify JWT and optionally restrict access by role(s)
 * @param {Array} allowedRoles - optional roles allowed to access this route
 */
const verifyToken = (allowedRoles = []) => {
  return (req, res, next) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(401).json({ message: "Access denied: token missing" });
    }

    // Extract token
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Access denied: invalid header" });
    }

    try {
      // 🔐 Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");

      // ✅ Always attach clean user object
      req.user = {
        id: decoded.id?.toString() || decoded._id?.toString(),
        role: decoded.role,
        email: decoded.email || null,
      };

      // 🔎 Optional: enforce role-based access
      if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
        return res
          .status(403)
          .json({ message: "Forbidden: insufficient role permissions" });
      }

      // Debug logs (optional – keep during testing)
      console.log("✅ JWT verified:", {
        userId: req.user.id,
        role: req.user.role,
      });

      next(); // ✅ proceed to route handler
    } catch (err) {
      console.error("❌ JWT verification error:", err.message);
      return res.status(403).json({ message: "Invalid or expired token" });
    }
  };
};

module.exports = verifyToken;
