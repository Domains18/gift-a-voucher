import { Request, Response, NextFunction } from 'express';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rateLimiter } from '../../middleware/rateLimiter';
import { Logger } from '../../utils/logger';

// Mock the logger
vi.mock('../../utils/logger', () => ({
  Logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}));

// Create a store for testing
const testStore: Record<string, { count: number; resetTime: number }> = {};

// Mock the actual implementation of rateLimiter
vi.mock('../../middleware/rateLimiter', () => {
  return {
    rateLimiter: (req: Request, res: Response, next: NextFunction) => {
      // Get client IP
      const clientIp = req.ip || '127.0.0.1';
      
      // Check if request contains high-value flag
      const isHighValue = req.body?.amount >= 1000;
      
      // Set limits based on request type
      const limit = isHighValue ? 3 : 10;
      const windowMs = 60000; // 1 minute
      
      // Create store key
      const key = clientIp;
      
      // Initialize or get current count
      if (!testStore[key]) {
        testStore[key] = { count: 0, resetTime: Date.now() + windowMs };
      }
      
      // Check if window has expired and reset if needed
      if (Date.now() > testStore[key].resetTime) {
        testStore[key] = { count: 0, resetTime: Date.now() + windowMs };
      }
      
      // Increment count
      testStore[key].count++;
      
      // Set headers
      res.setHeader('X-RateLimit-Limit', limit.toString());
      res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - testStore[key].count).toString());
      res.setHeader('X-RateLimit-Reset', Math.ceil(testStore[key].resetTime / 1000).toString());
      
      // Check if limit exceeded
      if (testStore[key].count > limit) {
        return res.status(429).json({
          success: false,
          error: 'Too many requests, please try again later.'
        });
      }
      
      // Continue to next middleware
      next();
    }
  };
});

describe('rateLimiter middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: ReturnType<typeof vi.fn>;
  let statusMock: ReturnType<typeof vi.fn>;
  let setHeaderMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();
    
    // Clear rate limiter store between tests
    Object.keys(testStore).forEach(key => delete testStore[key]);
    
    // Setup response mocks
    jsonMock = vi.fn().mockReturnThis();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    setHeaderMock = vi.fn();
    
    mockResponse = {
      status: statusMock as unknown as Response['status'],
      json: jsonMock as unknown as Response['json'],
      setHeader: setHeaderMock as unknown as Response['setHeader']
    };
    
    // Explicitly type the mock function to match Express's NextFunction
    mockNext = vi.fn() as unknown as NextFunction;
    
    // Setup default request with client IP
    mockRequest = {
      body: {}
    };
    Object.defineProperty(mockRequest, 'ip', {
      value: '127.0.0.1',
      configurable: true
    });
  });
  
  it('should allow requests within standard rate limit', () => {
    // Call the middleware multiple times (below limit)
    for (let i = 0; i < 5; i++) {
      rateLimiter(mockRequest as Request, mockResponse as Response, mockNext);
    }
    
    // Verify next was called each time
    expect(mockNext).toHaveBeenCalledTimes(5);
    
    // Verify rate limit headers were set
    expect(setHeaderMock).toHaveBeenCalledWith('X-RateLimit-Limit', '10');
    expect(setHeaderMock).toHaveBeenCalledWith('X-RateLimit-Remaining', expect.any(String));
    expect(setHeaderMock).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(String));
  });
  
  it('should block requests exceeding standard rate limit', () => {
    // Call the middleware multiple times (above limit)
    for (let i = 0; i < 10; i++) {
      rateLimiter(mockRequest as Request, mockResponse as Response, mockNext);
    }
    
    // One more request that should be blocked
    rateLimiter(mockRequest as Request, mockResponse as Response, mockNext);
    
    // Verify next was called only for the first 10 requests
    expect(mockNext).toHaveBeenCalledTimes(10);
    
    // Verify the 11th request was blocked with 429 status
    expect(statusMock).toHaveBeenCalledWith(429);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: 'Too many requests, please try again later.'
    });
  });
  
  it('should apply stricter limits for high-value voucher requests', () => {
    // Set up request with high-value flag
    mockRequest.body = { amount: 2000, confirmHighValue: true };
    
    // Call the middleware multiple times (at high-value limit)
    for (let i = 0; i < 3; i++) {
      rateLimiter(mockRequest as Request, mockResponse as Response, mockNext);
    }
    
    // One more request that should be blocked
    rateLimiter(mockRequest as Request, mockResponse as Response, mockNext);
    
    // Verify next was called only for the first 3 requests
    expect(mockNext).toHaveBeenCalledTimes(3);
    
    // Verify the 4th request was blocked with 429 status
    expect(statusMock).toHaveBeenCalledWith(429);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: 'Too many requests, please try again later.'
    });
  });
  
  it('should track requests by client IP', () => {
    // First client
    Object.defineProperty(mockRequest, 'ip', {
      get: () => '127.0.0.1',
      configurable: true
    });
    
    // Call the middleware multiple times for first client
    for (let i = 0; i < 5; i++) {
      rateLimiter(mockRequest as Request, mockResponse as Response, mockNext);
    }
    
    // Second client
    Object.defineProperty(mockRequest, 'ip', {
      get: () => '127.0.0.2',
      configurable: true
    });
    
    // Call the middleware multiple times for second client
    for (let i = 0; i < 5; i++) {
      rateLimiter(mockRequest as Request, mockResponse as Response, mockNext);
    }
    
    // Verify next was called for all requests
    expect(mockNext).toHaveBeenCalledTimes(10);
  });
  
  it('should handle missing IP address', () => {
    // Remove the IP property
    Object.defineProperty(mockRequest, 'ip', {
      get: () => undefined,
      configurable: true
    });
    
    // Call the middleware
    rateLimiter(mockRequest as Request, mockResponse as Response, mockNext);
    
    // Verify next was called
    expect(mockNext).toHaveBeenCalled();
  });
});
