const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Middleware to record API requests in the ApiLog table.
 * Records endpoint, method, status, and response time.
 */
const apiLogger = async (req, res, next) => {
  const start = Date.now();

  // Patch the end/json methods to capture status and response time
  const oldEnd = res.end;
  const oldJson = res.json;

  res.json = function (body) {
    res.body = body;
    return oldJson.apply(res, arguments);
  };

  res.end = function () {
    const duration = Date.now() - start;

    // Log all authenticated API traffic (Public or Admin Dashboard)
    prisma.apiLog
      .create({
        data: {
          apiKeyId: req.apiKey?.id || null, // Optional for admin dashboard hits
          endpoint: req.originalUrl || req.url,
          method: req.method,
          status: res.statusCode,
          responseTime: duration,
          ipAddress: req.ip || req.connection.remoteAddress,
        },
      })
      .catch((err) => console.error("Error creating API log:", err));

    return oldEnd.apply(res, arguments);
  };

  next();
};

module.exports = { apiLogger };
