const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Validates JWT for dashboard access (Admin/B2B Client)
 */
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ success: false, error: "FORBIDDEN" });
      }

      req.user = user;
      next();
    });
  } else {
    res.status(401).json({ success: false, error: "UNAUTHORIZED" });
  }
};

/**
 * Validates API Key + Optional Secret for programmatic access
 */
const validateApiKey = async (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  const apiSecret = req.headers["x-api-secret"];

  if (!apiKey) {
    return res.status(401).json({ success: false, error: "INVALID_API_KEY" });
  }

  try {
    const keyData = await prisma.apiKey.findUnique({
      where: { key: apiKey },
      include: { user: true },
    });

    if (!keyData || keyData.user.status !== "ACTIVE") {
      return res.status(401).json({ success: false, error: "INVALID_API_KEY" });
    }

    // For write operations, we might require the secret
    if (["POST", "PUT", "DELETE"].includes(req.method) && !apiSecret) {
      return res.status(401).json({ success: false, error: "SECRET_REQUIRED" });
    }

    // Attach user and plan info for rate limiting
    req.apiKey = keyData;
    req.user = keyData.user;

    // Update last used asynchronously
    prisma.apiKey
      .update({
        where: { id: keyData.id },
        data: { lastUsed: new Date() },
      })
      .catch(console.error);

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validates either an API Key OR a valid JWT (for Admin Dashboard use)
 */
const validateApiKeyOrJWT = async (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  const authHeader = req.headers.authorization;

  // 1. Try API Key first
  if (apiKey) {
    return validateApiKey(req, res, next);
  }

  // 2. Try JWT fallback
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err)
        return res.status(403).json({ success: false, error: "FORBIDDEN" });

      // For public API routes, only allow Admins to bypass API keys
      if (user.role !== "ADMIN") {
        return res
          .status(403)
          .json({ success: false, error: "API_KEY_REQUIRED" });
      }

      req.user = user;
      next();
    });
  } else {
    res.status(401).json({ success: false, error: "CREDENTIALS_REQUIRED" });
  }
};

module.exports = { authenticateJWT, validateApiKey, validateApiKeyOrJWT };
