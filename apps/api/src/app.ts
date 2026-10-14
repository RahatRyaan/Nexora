import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { config } from './config/index.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Bulletproof resolution for Web SPA dist folder across monorepo and container layouts
const distCandidates = [
  path.resolve(__dirname, '../../web/dist'),
  path.resolve(__dirname, '../../../web/dist'),
  path.resolve(process.cwd(), 'apps/web/dist'),
  path.resolve(process.cwd(), 'web/dist'),
  path.resolve(process.cwd(), 'dist'),
];
const webDistPath = distCandidates.find((p) => fs.existsSync(p) && fs.existsSync(path.join(p, 'index.html')));

export const createApp = (): express.Application => {
  const app = express();

  // Security Middleware
  app.use(
    helmet({
      contentSecurityPolicy: false,
    })
  );
  app.use(
    cors({
      origin: config.clientOrigin,
      credentials: true,
    })
  );

  // Rate Limiting (Protection against DDoS & API abuse)
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'test' ? 5000 : 600,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP, please try again after 15 minutes.',
        statusCode: 429,
      },
    },
  });
  app.use(config.apiPrefix, limiter);

  app.use(morgan(config.env === 'development' ? 'dev' : 'combined'));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // API Routes
  app.use(config.apiPrefix, routes);

  // Static serving for Unified Production Deployment
  if (webDistPath) {
    app.use(express.static(webDistPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith(config.apiPrefix)) {
        return next();
      }
      res.sendFile(path.join(webDistPath, 'index.html'));
    });
  }

  // 404 Handler for unhandled API routes
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: {
        message: 'Endpoint not found',
        statusCode: 404,
      },
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
};
