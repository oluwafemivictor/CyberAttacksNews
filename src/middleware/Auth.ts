/**
 * Authentication middleware and utilities
 * Handles JWT token generation and validation
 */

import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this-in-production';
const JWT_EXPIRY = '24h';

export interface AuthUser {
  id: string;
  username: string;
  role: 'admin' | 'analyst' | 'viewer';
}

export interface DecodedToken extends AuthUser {
  iat: number;
  exp: number;
}

/**
 * Generate JWT token for authenticated user
 */
export function generateToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): DecodedToken | null {
  try {
    return jwt.verify(token, JWT_SECRET) as DecodedToken;
  } catch (error) {
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractToken(authHeader?: string): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    return parts[1];
  }
  return null;
}

/**
 * Middleware to verify JWT authentication
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    const token = extractToken(req.headers.authorization);
    
    if (!token) {
      res.status(401).json({ error: 'No authentication token provided' });
      return;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    (req as any).user = decoded;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Authentication error' });
  }
}

/**
 * Middleware to check user role
 */
export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user as DecodedToken | undefined;
    
    if (!user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
}

/**
 * Sample users (replace with database lookup in production)
 */
const DEMO_USERS = [
  {
    id: 'user-1',
    username: 'admin',
    password: 'admin123', // In production, use bcrypt
    role: 'admin' as const
  },
  {
    id: 'user-2',
    username: 'analyst',
    password: 'analyst123',
    role: 'analyst' as const
  },
  {
    id: 'user-3',
    username: 'viewer',
    password: 'viewer123',
    role: 'viewer' as const
  }
];

/**
 * Authenticate user with username and password
 */
export function authenticateUser(username: string, password: string): AuthUser | null {
  const user = DEMO_USERS.find(u => u.username === username && u.password === password);
  
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    role: user.role
  };
}

/**
 * Get all demo users (for documentation purposes)
 */
export function getDemoUsers() {
  return DEMO_USERS.map(u => ({
    username: u.username,
    password: u.password,
    role: u.role
  }));
}
