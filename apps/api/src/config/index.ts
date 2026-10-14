import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load root .env
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
// Also fallback to local .env if present
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/nexora_erp',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET || 'dev_jwt_secret_change_in_production',
  defaultConfidenceThreshold: parseFloat(process.env.DEFAULT_CONFIDENCE_THRESHOLD || '0.85'),
  supportMaxAutoRefundDollars: parseFloat(process.env.SUPPORT_MAX_AUTO_REFUND_DOLLARS || '100'),
} as const;
