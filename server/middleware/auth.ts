import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import type { User } from '@shared/schema';

export interface AuthRequest extends Request {
  user?: User; // This will be set by our auth middleware
  dbUser?: User;
}

export const requireRole = (roles: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // req.user is now the full user object from our auth system
      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      req.dbUser = req.user;
      next();
    } catch (error) {
      res.status(500).json({ message: 'Error checking permissions' });
    }
  };
};

export const requireAdmin = requireRole(['admin']);
export const requireProjectLead = requireRole(['admin', 'project_lead']);
export const requireDeveloper = requireRole(['admin', 'project_lead', 'developer']);
