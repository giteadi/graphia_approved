import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import analyzeRoutes from './routes/analyzeRoutes.js';
import modelsRoute from './routes/modelsRoute.js';
import adminRoutes from './routes/adminRoutes.js';
import passwordRoutes from './routes/passwordRoutes.js';
import razorpayRoutes from './routes/razorpayRoutes.js';

const app = express();

const customOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3002',
  'http://127.0.0.1:5173',
  'http://graphiacheck.in',
  'https://graphiacheck.in',
  'http://www.graphiacheck.in',
  'https://www.graphiacheck.in',
  ...customOrigins,
  ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
];

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (curl, Postman, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api', analyzeRoutes);
app.use('/api', modelsRoute);
app.use('/api/admin', adminRoutes);
app.use('/api/password', passwordRoutes);
app.use('/api/payments', razorpayRoutes);

export default app;
