const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { authenticateJWT } = require("../middleware/auth");

// Apply JWT auth to all geo browse routes
router.use(authenticateJWT);

/**
 * GET /v1/geo/states
 * List all states
 */
router.get("/states", async (req, res, next) => {
  try {
    const states = await prisma.state.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        _count: { select: { districts: true } },
      },
    });

    res.json({
      success: true,
      count: states.length,
      data: states.map((s) => ({
        id: s.id,
        code: s.code,
        name: s.name,
        districtCount: s._count.districts,
      })),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /v1/geo/states/:stateCode/districts
 * List districts for a state
 */
router.get("/states/:stateCode/districts", async (req, res, next) => {
  try {
    const state = await prisma.state.findUnique({
      where: { code: req.params.stateCode },
      include: {
        districts: {
          orderBy: { name: "asc" },
          select: {
            id: true,
            code: true,
            name: true,
            _count: { select: { subDistricts: true } },
          },
        },
      },
    });

    if (!state) {
      return res.status(404).json({ success: false, error: "STATE_NOT_FOUND" });
    }

    res.json({
      success: true,
      state: state.name,
      count: state.districts.length,
      data: state.districts.map((d) => ({
        id: d.id,
        code: d.code,
        name: d.name,
        subDistrictCount: d._count.subDistricts,
      })),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /v1/geo/districts/:districtCode/sub-districts
 * List sub-districts for a district
 */
router.get("/districts/:districtCode/sub-districts", async (req, res, next) => {
  try {
    const district = await prisma.district.findUnique({
      where: { code: req.params.districtCode },
      include: {
        state: { select: { name: true } },
        subDistricts: {
          orderBy: { name: "asc" },
          select: {
            id: true,
            code: true,
            name: true,
            _count: { select: { villages: true } },
          },
        },
      },
    });

    if (!district) {
      return res
        .status(404)
        .json({ success: false, error: "DISTRICT_NOT_FOUND" });
    }

    res.json({
      success: true,
      state: district.state.name,
      district: district.name,
      count: district.subDistricts.length,
      data: district.subDistricts.map((sd) => ({
        id: sd.id,
        code: sd.code,
        name: sd.name,
        villageCount: sd._count.villages,
      })),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /v1/geo/villages
 * List all villages (Paginated)
 */
router.get("/villages", async (req, res, next) => {
  const { page = 1, limit = 50 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  try {
    const [villages, total] = await Promise.all([
      prisma.village.findMany({
        skip,
        take: parseInt(limit),
        orderBy: { name: "asc" },
        include: {
          subDistrict: {
            include: {
              district: {
                include: { state: true },
              },
            },
          },
        },
      }),
      prisma.village.count(),
    ]);

    const formattedData = villages.map((v) => ({
      id: v.id,
      code: v.code,
      name: v.name,
      subDistrict: v.subDistrict.name,
      district: v.subDistrict.district.name,
      state: v.subDistrict.district.state.name,
    }));

    res.json({
      success: true,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: formattedData,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /v1/geo/sub-districts/:subDistrictCode/villages
 * List villages for a sub-district
 */
router.get(
  "/sub-districts/:subDistrictCode/villages",
  async (req, res, next) => {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    try {
      const subDistrict = await prisma.subDistrict.findUnique({
        where: { code: req.params.subDistrictCode },
        include: {
          district: {
            include: { state: { select: { name: true } } },
          },
        },
      });

      if (!subDistrict) {
        return res
          .status(404)
          .json({ success: false, error: "SUB_DISTRICT_NOT_FOUND" });
      }

      const [villages, total] = await Promise.all([
        prisma.village.findMany({
          where: { subDistrictId: subDistrict.id },
          orderBy: { name: "asc" },
          skip,
          take: parseInt(limit),
          select: { id: true, code: true, name: true },
        }),
        prisma.village.count({ where: { subDistrictId: subDistrict.id } }),
      ]);

      res.json({
        success: true,
        state: subDistrict.district.state.name,
        district: subDistrict.district.name,
        subDistrict: subDistrict.name,
        count: villages.length,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        data: villages,
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /v1/geo/stats
 * Platform-wide statistics
 */
router.get("/stats", async (req, res, next) => {
  try {
    const [states, districts, subDistricts, villages, users] =
      await Promise.all([
        prisma.state.count(),
        prisma.district.count(),
        prisma.subDistrict.count(),
        prisma.village.count(),
        prisma.user.count(),
      ]);

    res.json({
      success: true,
      data: { states, districts, subDistricts, villages, users },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
