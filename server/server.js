// index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import passport from 'passport';
import legalQueryRoutes from './routes/legalQuery.js';
import legalGuideRoutes from './routes/legalGuide.js';
import documentGeneratorRoutes from './routes/documentGenerator.js';
import authRoutes from './routes/auth.js';
import { verifyToken } from './middleware/auth.middleware.js';

dotenv.config();
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/legal_ai')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// Serve static files
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/api/document/documents', express.static(path.join(__dirname, 'public', 'documents')));

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/legal', verifyToken, legalQueryRoutes);
app.use('/api/guide', verifyToken, legalGuideRoutes);
app.use('/api/document', verifyToken, documentGeneratorRoutes);

app.get('/', (req, res) => res.send('Virtual Legal Assistant API running...'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
