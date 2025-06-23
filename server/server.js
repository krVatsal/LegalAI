// index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import passport from "passport";
import legalQueryRoutes from "./routes/legalQuery.js";
import legalGuideRoutes from "./routes/legalGuide.js";
import documentGeneratorRoutes from "./routes/documentGenerator.js";
import authRoutes from "./routes/auth.js";
import webSearchRoutes from "./routes/webSearch.js";
import ocrRoutes from './routes/ocr.js';
import legalAnalysisRoutes from './routes/legal.analysis.js';
import { verifyToken } from './middleware/auth.middleware.js';
import cookieParser from 'cookie-parser';

dotenv.config(); // Ensure env vars are loaded before anything else

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/legal_ai")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Middleware
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000", "https://victorious-rock-0a4ad4800.2.azurestaticapps.net"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

// Serve static files
app.use("/public", express.static(path.join(__dirname, "public")));
app.use(
  "/api/document/documents",
  express.static(path.join(__dirname, "public", "documents"))
);

// Public routes
app.use("/api/auth", authRoutes);
app.use("/api/search", webSearchRoutes); // Mount web search routes

// Protected routes
app.use('/api/legal', legalQueryRoutes);
app.use('/api/guide', verifyToken, legalGuideRoutes);
app.use('/api/document', verifyToken, documentGeneratorRoutes);
app.use('/api/ocr', verifyToken, ocrRoutes);
app.use('/api/analysis', verifyToken, legalAnalysisRoutes);

app.get("/", (req, res) => res.send("Virtual Legal Assistant API running..."));

// Health check endpoint for Docker
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV || 'development'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
