import { Response, NextFunction } from 'express';
import { AuthRequest } from '../auth';
import { storage } from '../storage';

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // req.user should be set by isAuthenticated middleware
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({ message: 'Error checking permissions' });
    }
  };
};

export const requireAdmin = requireRole(['admin']);
export const requireProjectLead = requireRole(['admin', 'project_lead']);
export const requireDeveloper = requireRole(['admin', 'project_lead', 'developer']);
