import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import { env } from '@/config/env';
import authRoutes from '@/routes/auth.routes';
import employeeRoutes from '@/routes/employee.routes';
import organizationRoutes from '@/routes/organization.routes';
import dashboardRoutes from '@/routes/dashboard.routes';
import { errorHandler, notFoundHandler } from '@/middleware/errorHandler';

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  })
);

app.use(
  cors({
    origin: env.clientOrigin,
    credentials: true,
  }),
);

app.options('*', cors({ origin: env.clientOrigin, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(env.isProduction ? 'combined' : 'dev'));

// Serves uploaded profile photos (see services/photo.service.ts). Public/
// unauthenticated by design — the same way any static asset host would be.
app.use('/uploads', express.static(env.uploadsDir));

// General API rate limiting
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.get('/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'EMS API is healthy', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/organization', organizationRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
