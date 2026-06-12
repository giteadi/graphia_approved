import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import analyzeRoutes from './routes/analyzeRoutes.js';
import modelsRoute from './routes/modelsRoute.js';

const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3002',
  'http://graphiacheck.in',
  'https://graphiacheck.in',
  'http://www.graphiacheck.in',
  'https://www.graphiacheck.in',
];

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (curl, Postman, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
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

export default app;
