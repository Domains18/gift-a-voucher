import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';

// In-memory store for rate limiting
// In production, you would use Redis or another distributed cache
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Configuration
const WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS = 10; // Maximum requests per window
const HIGH_VALUE_THRESHOLD = 1000; // Threshold for high-value vouchers ($1000)
const HIGH_VALUE_MAX_REQUESTS = 3; // Stricter limit for high-value vouchers

export function rateLimiter(req: Request, res: Response, next: NextFunction): void | Response<any, Record<string, any>> {
  // Get client IP or a unique identifier
  const clientIp = req.ip || 'unknown';
  const now = Date.now();
  
  // Initialize or reset if window expired
  if (!store[clientIp] || now > store[clientIp].resetTime) {
    store[clientIp] = {
      count: 0,
      resetTime: now + WINDOW_MS
    };
  }
  
  // Check if this is a high-value voucher request
  let maxRequests = MAX_REQUESTS;
  if (req.path.includes('/vouchers/gift') && req.method === 'POST' && req.body?.amount) {
    const amount = Number(req.body.amount);
    if (!isNaN(amount) && amount >= HIGH_VALUE_THRESHOLD) {
      maxRequests = HIGH_VALUE_MAX_REQUESTS;
      Logger.info('RATE_LIMIT', `High-value voucher request detected: $${amount}`, { clientIp });
    }
  }
  
  // Increment request count
  store[clientIp].count++;
  
  // Check if rate limit exceeded
  if (store[clientIp].count > maxRequests) {
    Logger.warn('RATE_LIMIT', 'Rate limit exceeded', { 
      clientIp, 
      count: store[clientIp].count,
      limit: maxRequests,
      windowMs: WINDOW_MS 
    });
    
    return res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later',
      retryAfter: Math.ceil((store[clientIp].resetTime - now) / 1000)
    });
  }
  
  // Add rate limit headers
  res.setHeader('X-RateLimit-Limit', maxRequests.toString());
  res.setHeader('X-RateLimit-Remaining', (maxRequests - store[clientIp].count).toString());
  res.setHeader('X-RateLimit-Reset', Math.ceil(store[clientIp].resetTime / 1000).toString());
  
  next();
}
