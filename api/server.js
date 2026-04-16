require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Health Check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date() });
});

// Import Routes
const authRoutes = require("./src/routes/auth");
const geoRoutes = require("./src/routes/geo");
const apiRoutes = require("./src/routes/api");
const adminRoutes = require("./src/routes/admin");
const { apiLogger } = require("./src/middleware/logger");

// Integrated Logging (Monitors all /v1 traffic)
app.use("/v1", apiLogger);

// Mount Routes
app.use("/v1/auth", authRoutes);
app.use("/v1/admin", adminRoutes);
app.use("/v1/geo", geoRoutes); // Hierarchy browse
app.use("/v1", apiRoutes); // Public search/autocomplete

// Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: "INTERNAL_ERROR",
    message: err.message,
  });
});

app.listen(PORT, () => {
  console.log(`Bluestock Village API running on port ${PORT}`);
});
