# Bluestock Village SaaS Platform

Welcome to the Bluestock Village SaaS platform! This repository contains a production-grade full-stack application for managing and serving Indian village-level geographical data (MDDS).

## 🚀 Getting Started

The platform is built as a monorepo using **npm workspaces**. You can run both the API and the Dashboard with a single command.

### 1. Prerequisites
- **Node.js**: v18+ recommended
- **Python**: 3.8+ (for data ingestion)
- **PostgreSQL**: Hosted on NeonDB (or local)

### 2. Environment Setup
Create a `.env` file in the root directory (one has already been created for you) with the following variables:
```env
DATABASE_URL="postgresql://user:pass@host/neondb?sslmode=require"
JWT_SECRET="your_secret_key"
ADMIN_EMAIL="admin@bluestock.in"
```

### 3. Installation
Install all dependencies for both the API and the Dashboard:
```bash
npm install
```

### 4. Running the Platform
Start both the Backend API and the React Dashboard concurrently:
```bash
npm run dev
```
- **API**: [http://localhost:3000](http://localhost:3000)
- **Dashboard**: [http://localhost:5173](http://localhost:5173)

---

## 📊 Data Ingestion

If you need to refresh or re-import the MDDS dataset (600,000+ records), use the resilient import script:

```bash
# Sync all 30 states from Excel/ODS files
npm run import-data
```

---

## 🛠️ Project Structure

- `/api`: Express.js backend with Prisma ORM.
- `/dashboard`: React + Tailwind CSS admin/client dashboard.
- `/scripts`: Python and Node.js scripts for seeding and data processing.
- `/demo`: Simple HTML/JS integration example.
- `/prisma`: Database schema and migrations.

## 🔑 Authentication
- **Default Admin**: `admin@bluestock.in` / `admin123`
- **B2B Clients**: Register via the dashboard or use a pre-generated API key.

## 📖 API Documentation (Standard Endpoints)
- `GET /v1/geo/states`: List all states
- `GET /v1/geo/stats`: Platform-wide statistics
- `GET /v1/autocomplete?q=...`: Search for villages (Requires API Key)

---
*Created by Kota Radha Krishna Reddy.*
