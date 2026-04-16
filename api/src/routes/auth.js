const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

/**
 * POST /v1/auth/register
 * Register a new B2B client
 */
router.post("/register", async (req, res, next) => {
  const { email, password, businessName } = req.body;

  if (!email || !password || !businessName) {
    return res
      .status(400)
      .json({
        success: false,
        error: "MISSING_FIELDS",
        message: "email, password, and businessName are required.",
      });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, error: "EMAIL_EXISTS" });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        businessName,
        planType: "FREE",
        status: "PENDING_APPROVAL",
      },
    });

    res.status(201).json({
      success: true,
      message:
        "Registration successful. Your account is pending admin approval.",
      data: {
        id: user.id,
        email: user.email,
        businessName: user.businessName,
        status: user.status,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /v1/auth/login
 * Login for both Admin and B2B clients
 */
router.post("/login", async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: "MISSING_FIELDS" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res
        .status(401)
        .json({ success: false, error: "INVALID_CREDENTIALS" });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res
        .status(401)
        .json({ success: false, error: "INVALID_CREDENTIALS" });
    }

    if (user.status !== "ACTIVE") {
      return res
        .status(403)
        .json({
          success: false,
          error: "ACCOUNT_NOT_ACTIVE",
          status: user.status,
        });
    }

    // Determine role based on admin email
    const isAdmin = email === (process.env.ADMIN_EMAIL || "admin@bluestock.in");

    const token = jwt.sign(
      { id: user.id, email: user.email, role: isAdmin ? "ADMIN" : "CLIENT" },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          businessName: user.businessName,
          planType: user.planType,
          role: isAdmin ? "ADMIN" : "CLIENT",
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /v1/auth/api-keys
 * Generate a new API key for the authenticated user
 */
router.post("/api-keys", async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ success: false, error: "UNAUTHORIZED" });

  try {
    const decoded = jwt.verify(authHeader.split(" ")[1], JWT_SECRET);
    const { name = "Default Key" } = req.body;

    const key = `bsk_${crypto.randomBytes(24).toString("hex")}`;
    const secret = `bss_${crypto.randomBytes(32).toString("hex")}`;
    const secretHash = await bcrypt.hash(secret, 10);

    const apiKey = await prisma.apiKey.create({
      data: {
        name,
        key,
        secretHash,
        userId: decoded.id,
      },
    });

    res.status(201).json({
      success: true,
      message: "Store your secret — it will not be shown again.",
      data: {
        id: apiKey.id,
        name: apiKey.name,
        key: apiKey.key,
        secret,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /v1/auth/api-keys
 * List all API keys for the authenticated user
 */
router.get("/api-keys", async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ success: false, error: "UNAUTHORIZED" });

  try {
    const decoded = jwt.verify(authHeader.split(" ")[1], JWT_SECRET);
    const keys = await prisma.apiKey.findMany({
      where: { userId: decoded.id },
      select: {
        id: true,
        name: true,
        key: true,
        createdAt: true,
        lastUsed: true,
      },
    });

    res.json({ success: true, data: keys });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /v1/auth/me
 * Get current user info from JWT
 */
router.get("/me", async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ success: false, error: "UNAUTHORIZED" });

  try {
    const decoded = jwt.verify(authHeader.split(" ")[1], JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        businessName: true,
        planType: true,
        status: true,
        role: true,
        createdAt: true,
        _count: { select: { apiKeys: true } },
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: "USER_NOT_FOUND" });
    }

    res.json({
      success: true,
      data: {
        ...user,
        apiKeyCount: user._count.apiKeys,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
