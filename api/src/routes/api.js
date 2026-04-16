const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { validateApiKeyOrJWT } = require("../middleware/auth");

// Apply Hybrid validation (API Key or Admin JWT)
router.use(validateApiKeyOrJWT);

/**
 * GET /v1/search
 * Search villages with filters
 */
router.get("/search", async (req, res, next) => {
  const { q, state, district, subDistrict, limit = 20 } = req.query;

  try {
    const villages = await prisma.village.findMany({
      where: {
        name: { contains: q, mode: "insensitive" },
        subDistrict: {
          name: subDistrict
            ? { contains: subDistrict, mode: "insensitive" }
            : undefined,
          district: {
            name: district
              ? { contains: district, mode: "insensitive" }
              : undefined,
            state: {
              name: state
                ? { contains: state, mode: "insensitive" }
                : undefined,
            },
          },
        },
      },
      take: parseInt(limit),
      include: {
        subDistrict: {
          include: {
            district: {
              include: {
                state: {
                  include: { country: true },
                },
              },
            },
          },
        },
      },
    });

    const formattedData = villages.map((v) => ({
      id: v.code,
      name: v.name,
      subDistrict: v.subDistrict.name,
      district: v.subDistrict.district.name,
      state: v.subDistrict.district.state.name,
      country: v.subDistrict.district.state.country.name,
      fullAddress: `${v.name}, ${v.subDistrict.name}, ${v.subDistrict.district.name}, ${v.subDistrict.district.state.name}, ${v.subDistrict.district.state.country.name}`,
    }));

    res.json({
      success: true,
      count: formattedData.length,
      data: formattedData,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /v1/autocomplete
 * Fast suggestions for dropdowns
 */
router.get("/autocomplete", async (req, res, next) => {
  const { q, limit = 10 } = req.query;

  if (!q || q.length < 2) {
    return res.status(400).json({ success: false, error: "QUERY_TOO_SHORT" });
  }

  try {
    const villages = await prisma.village.findMany({
      where: {
        name: { startsWith: q, mode: "insensitive" },
      },
      take: parseInt(limit),
      include: {
        subDistrict: {
          include: {
            district: {
              include: {
                state: true,
              },
            },
          },
        },
      },
    });

    const suggestions = villages.map((v) => ({
      value: v.code,
      label: v.name,
      subtext: `${v.subDistrict.name}, ${v.subDistrict.district.name}, ${v.subDistrict.district.state.name}`,
      hierarchy: {
        village: v.name,
        subDistrict: v.subDistrict.name,
        district: v.subDistrict.district.name,
        state: v.subDistrict.district.state.name,
      },
    }));

    res.json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
