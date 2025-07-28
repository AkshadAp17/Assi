import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

export interface AuthRequest extends Request {
  user: {
    claims: {
      sub: string;
      email?: string;
      first_name?: string;
      last_name?: string;
      profile_image_url?: string;
    };
    access_token: string;
    refresh_token?: string;
    expires_at: number;
  };
  dbUser?: any;
}

export const requireRole = (roles: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.claims.sub;
      const dbUser = await storage.getUser(userId);
      
      if (!dbUser) {
        return res.status(401).json({ message: 'User not found' });
      }

      if (!roles.includes(dbUser.role)) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      req.dbUser = dbUser;
      next();
    } catch (error) {
      res.status(500).json({ message: 'Error checking permissions' });
    }
  };
};

export const requireAdmin = requireRole(['admin']);
export const requireProjectLead = requireRole(['admin', 'project_lead']);
export const requireDeveloper = requireRole(['admin', 'project_lead', 'developer']);
