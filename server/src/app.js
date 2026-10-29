import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import medicalRoutes from './routes/medicalRoutes.js';
import incidentRoutes from './routes/incidentRoutes.js';
import hospitalRoutes from './routes/hospitalRoutes.js';
import responderRoutes from './routes/responderRoutes.js';
import dispatchRoutes from './routes/dispatchRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration: support exact Vercel production origin, preview deployments, and local dev
const explicitOrigins = [
  process.env.CLIENT_URL,
  'https://clinical-sanctuary-one.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile native apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      const isAllowed =
        explicitOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1');

      if (isAllowed) {
        callback(null, origin);
      } else {
        console.warn(`[CORS Blocked] Origin not allowed: ${origin}`);
        callback(new Error(`CORS policy does not allow access from origin: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-seed-secret'],
    exposedHeaders: ['Set-Cookie'],
  })
);

// Request body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Static audio files serving
const uploadsDir = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));

const DB_STATES = {
  0: 'DISCONNECTED',
  1: 'CONNECTED',
  2: 'CONNECTING',
  3: 'DISCONNECTING',
};

// System Health & Database Diagnostics Endpoint
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const isDbConnected = dbState === 1;

  res.status(200).json({
    status: 'ONLINE',
    database: DB_STATES[dbState] || 'UNKNOWN',
    databaseConnected: isDbConnected,
    project: 'Clinical Sanctuary — Emergency Alert System',
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV || 'development',
  });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/medical', medicalRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/responder', responderRoutes);
app.use('/api/dispatch', dispatchRoutes);

// 404 Route Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' not found.`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

export default app;
