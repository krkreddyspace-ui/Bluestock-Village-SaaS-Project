const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { authenticateJWT } = require("../middleware/auth");

// Apply admin protection middleware (In production, check for user.role === 'ADMIN')
router.use(authenticateJWT);

/**
 * GET /v1/admin/stats
 * Platform-wide statistics for top cards
 */
router.get("/stats", async (req, res, next) => {
  try {
    const [villages, users, pendingUsers, todayLogs] = await Promise.all([
      prisma.village.count(),
      prisma.user.count({ where: { role: { not: "ADMIN" } } }),
      prisma.user.count({ where: { status: "PENDING_APPROVAL" } }),
      prisma.apiLog.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    // Calculate avg latency for today
    const latencyData = await prisma.apiLog.aggregate({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
      _avg: { responseTime: true },
    });

    res.json({
      success: true,
      data: {
        totalVillages: villages,
        totalUsers: users,
        pendingApprovals: pendingUsers,
        todayRequests: todayLogs,
        avgLatency: Math.round(latencyData._avg.responseTime || 0),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /v1/admin/traffic
 * Last 7 days of traffic for Area Chart
 */
router.get("/traffic", async (req, res, next) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Sum logs group by date
    const logs = await prisma.$queryRaw`
      SELECT 
        TO_CHAR("createdAt", 'Mon DD') as name,
        COUNT(*)::int as requests,
        AVG("responseTime")::int as latency
      FROM "ApiLog"
      WHERE "createdAt" >= ${sevenDaysAgo}
      GROUP BY TO_CHAR("createdAt", 'Mon DD'), "createdAt"::date
      ORDER BY "createdAt"::date ASC
    `;

    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /v1/admin/users
 * List users for management
 */
router.get("/users", async (req, res, next) => {
  const { status } = req.query;
  try {
    const users = await prisma.user.findMany({
      where: status ? { status } : { role: { not: "ADMIN" } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        businessName: true,
        planType: true,
        status: true,
        createdAt: true,
      },
    });
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /v1/admin/users/:id/status
 * Update user status (Approve/Reject/Suspend)
 */
router.patch("/users/:id/status", async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { status },
    });
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /v1/admin/logs
 * Recent global API traffic
 */
router.get("/logs", async (req, res, next) => {
  try {
    const logs = await prisma.apiLog.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        apiKey: {
          select: {
            id: true,
            user: { select: { businessName: true } },
          },
        },
      },
    });
    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
