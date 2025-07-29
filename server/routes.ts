import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, type AuthRequest } from "./auth";
import { requireAdmin, requireProjectLead, requireDeveloper } from "./middleware/auth";
import { upload } from "./middleware/upload";
import { insertUserSchema, insertProjectSchema, insertProjectAssignmentSchema } from "@shared/schema";
import { z } from "zod";
import path from "path";
import fs from "fs";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Serve uploaded files with authentication check
  app.use('/uploads', isAuthenticated, (req: AuthRequest, res, next) => {
    next();
  });
  
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Auth routes are now handled in auth.ts

  // User management routes (Admin only)
  app.get('/api/users', isAuthenticated, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post('/api/users', isAuthenticated, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.patch('/api/users/:id/role', isAuthenticated, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      
      if (!['admin', 'project_lead', 'developer'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const user = await storage.updateUserRole(id, role);
      res.json(user);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  app.delete('/api/users/:id', isAuthenticated, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      await storage.deleteUser(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Project routes
  app.get('/api/projects', isAuthenticated, requireDeveloper, async (req: AuthRequest, res) => {
    try {
      const userId = req.user.id;
      
      let projects;
      if (req.user.role === 'developer') {
        projects = await storage.getProjectsByUser(userId);
      } else {
        projects = await storage.getAllProjects();
      }
      
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get('/api/projects/:id', isAuthenticated, requireDeveloper, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check if developer has access to this project
      if (req.user.role === 'developer') {
        const hasAccess = project.assignments.some(assignment => assignment.userId === userId);
        if (!hasAccess) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post('/api/projects', isAuthenticated, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const projectData = insertProjectSchema.parse(req.body);
      const userId = req.user.id;
      
      const project = await storage.createProject({
        ...projectData,
        createdBy: userId,
      });
      
      res.status(201).json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.patch('/api/projects/:id', isAuthenticated, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const projectData = insertProjectSchema.partial().parse(req.body);
      
      const project = await storage.updateProject(id, projectData);
      res.json(project);
    } catch (error) {
      console.error("Error updating project:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete('/api/projects/:id', isAuthenticated, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      await storage.deleteProject(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Project assignment routes
  app.post('/api/projects/:id/assign', isAuthenticated, requireProjectLead, async (req: AuthRequest, res) => {
    try {
      const { id: projectId } = req.params;
      const { userId } = req.body;
      const assignedBy = req.user.id;
      
      const assignment = await storage.assignUserToProject(projectId, userId, assignedBy);
      res.status(201).json(assignment);
    } catch (error) {
      console.error("Error assigning user to project:", error);
      res.status(500).json({ message: "Failed to assign user to project" });
    }
  });

  app.delete('/api/projects/:projectId/assign/:userId', isAuthenticated, requireProjectLead, async (req: AuthRequest, res) => {
    try {
      const { projectId, userId } = req.params;
      await storage.removeUserFromProject(projectId, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing user from project:", error);
      res.status(500).json({ message: "Failed to remove user from project" });
    }
  });

  // Document routes
  app.get('/api/projects/:id/documents', isAuthenticated, requireDeveloper, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      // Check if developer has access to this project
      if (req.user.role === 'developer') {
        const project = await storage.getProject(id);
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }
        
        const hasAccess = project.assignments.some(assignment => assignment.userId === userId);
        if (!hasAccess) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      const documents = await storage.getProjectDocuments(id);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.post('/api/projects/:id/documents', 
    isAuthenticated, 
    requireProjectLead, 
    upload.array('files', 10), 
    async (req: AuthRequest, res) => {
      try {
        const { id: projectId } = req.params;
        const userId = req.user.id;
        const files = req.files as Express.Multer.File[];

        if (!files || files.length === 0) {
          return res.status(400).json({ message: "No files uploaded" });
        }

        const uploadedDocuments = [];
        for (const file of files) {
          const document = await storage.createDocument({
            projectId,
            fileName: file.filename,
            originalName: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
            uploadedBy: userId,
          });
          uploadedDocuments.push(document);
        }

        res.status(201).json(uploadedDocuments);
      } catch (error) {
        console.error("Error uploading documents:", error);
        res.status(500).json({ message: "Failed to upload documents" });
      }
    }
  );

  // File download route
  app.get('/api/documents/:id/download', isAuthenticated, requireDeveloper, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const document = await storage.getDocument(id);
      
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      // Check if user has access to this project
      const project = await storage.getProject(document.projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      if (req.user!.role === 'developer') {
        const hasAccess = project.assignments.some(assignment => assignment.userId === req.user!.id);
        if (!hasAccess) {
          return res.status(403).json({ message: 'Access denied' });
        }
      }

      const filePath = path.join(process.cwd(), 'uploads', document.fileName);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'File not found on disk' });
      }

      res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
      res.setHeader('Content-Type', document.mimeType);
      res.sendFile(path.resolve(filePath));
    } catch (error) {
      console.error('Error downloading document:', error);
      res.status(500).json({ message: 'Failed to download document' });
    }
  });

  app.delete('/api/documents/:id', isAuthenticated, requireProjectLead, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      
      const document = await storage.getDocument(id);
      
      if (document) {
        const filePath = path.join(process.cwd(), 'uploads', document.fileName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } else {
        return res.status(404).json({ message: "Document not found" });
      }
      
      await storage.deleteDocument(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // Dashboard stats route
  app.get('/api/dashboard/stats', isAuthenticated, requireDeveloper, async (req: AuthRequest, res) => {
    try {
      const userId = req.user.id;
      const stats = await storage.getDashboardStats(userId, req.user.role);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
