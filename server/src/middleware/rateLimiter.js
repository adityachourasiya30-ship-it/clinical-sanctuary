import rateLimit from 'express-rate-limit';

// Standard rate limiter for general API routes
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP address, please try again after 15 minutes.',
  },
});

// Stricter rate limiter for authentication endpoints to prevent brute-force
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 25, // 25 attempts
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes for security.',
  },
});

// Rate limiter for SOS triggers (allows quick repeat if necessary under crisis, but bounds abuse)
export const sosLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Max 10 per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'SOS trigger limit reached for this minute. Please wait or call 112 directly.',
  },
});
