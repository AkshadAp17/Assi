import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, type AuthRequest } from "./auth";
import { requireAdmin, requireProjectLead, requireDeveloper } from "./middleware/auth";
import { upload } from "./middleware/upload";
import { sendWelcomeEmail } from "./email";
// Import types from shared schema
import type { CreateUser, InsertProject, InsertProjectAssignment } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";
import path from "path";
import fs from "fs";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Serve uploaded files with authentication check
  app.use('/uploads', (req, res, next) => {
    isAuthenticated(req as AuthRequest, res, next);
  });
  
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Auth routes are now handled in auth.ts

  // User management routes (Admin only)
  app.get('/api/users', (req, res, next) => {
    isAuthenticated(req as AuthRequest, res, (err) => {
      if (err) return next(err);
      requireProjectLead(req as AuthRequest, res, next);
    });
  }, async (req: AuthRequest, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post('/api/users', (req, res, next) => {
    isAuthenticated(req as AuthRequest, res, (err) => {
      if (err) return next(err);
      requireAdmin(req as AuthRequest, res, next);
    });
  }, async (req: AuthRequest, res) => {
    try {
      // Parse the data first with password
      const { password, ...userData } = req.body;
      
      if (!password) {
        return res.status(400).json({ message: "Password is required" });
      }
      
      // Hash the password
      const passwordHash = await bcrypt.hash(password, 10);
      
      // Create the final user data with passwordHash
      const finalUserData = {
        ...userData,
        passwordHash,
      };
      
      // Basic validation for MongoDB
      if (!finalUserData.email || !finalUserData.firstName || !finalUserData.lastName || !finalUserData.passwordHash) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      const validatedData = {
        email: finalUserData.email,
        firstName: finalUserData.firstName,
        lastName: finalUserData.lastName,
        passwordHash: finalUserData.passwordHash,
        role: finalUserData.role || 'developer',
        profileImageUrl: finalUserData.profileImageUrl || null,
      };
      
      const user = await storage.createUser(validatedData);
      
      // Send welcome email with temporary password
      try {
        await sendWelcomeEmail(validatedData.email, password, validatedData.firstName);
        console.log(`Welcome email sent to ${validatedData.email}`);
      } catch (emailError) {
        console.error("Failed to send welcome email, but user was created:", emailError);
        // Don't fail the user creation if email fails
      }
      
      res.status(201).json(user);
    } catch (error: any) {
      console.error("Error creating user:", error);
      if (error.message && error.message.includes('duplicate') || error.message.includes('unique')) {
        return res.status(400).json({ message: "A user with this email already exists" });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.patch('/api/users/:id/role', (req, res, next) => {
    isAuthenticated(req as AuthRequest, res, (err) => {
      if (err) return next(err);
      requireAdmin(req as AuthRequest, res, next);
    });
  }, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      
      if (!['project_lead', 'developer'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      await storage.updateUser(id, { role });
      res.json({ message: "User role updated successfully" });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  app.delete('/api/users/:id', (req, res, next) => {
    isAuthenticated(req as AuthRequest, res, (err) => {
      if (err) return next(err);
      requireAdmin(req as AuthRequest, res, next);
    });
  }, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      await storage.deleteUser(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Password update route - users can update their own password
  app.patch('/api/users/password', (req, res, next) => {
    isAuthenticated(req as AuthRequest, res, next);
  }, async (req: AuthRequest, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user!.id;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters long" });
      }

      // Get current user to verify password
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValidPassword) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      // Hash new password and update
      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(userId, { passwordHash: newPasswordHash });

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error updating password:", error);
      res.status(500).json({ message: "Failed to update password" });
    }
  });

  // Project routes - all roles can see project list
  app.get('/api/projects', (req, res, next) => {
    isAuthenticated(req as AuthRequest, res, next);
  }, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      
      let projects;
      if (req.user!.role === 'admin') {
        // Admins see all projects
        projects = await storage.getAllProjects();
      } else if (req.user!.role === 'project_lead') {
        // Project leads see all projects (they can be assigned to any project)
        projects = await storage.getAllProjects();
      } else {
        // Developers see only their assigned projects
        projects = await storage.getUserProjects(userId);
      }
      
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get('/api/projects/:id', (req, res, next) => {
    isAuthenticated(req as AuthRequest, res, next);
  }, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      
      const project = await storage.getProjectById(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check access permissions
      if (req.user!.role === 'developer') {
        const hasAccess = project.assignments.some((assignment: any) => assignment.userId === userId);
        if (!hasAccess) {
          return res.status(403).json({ message: "Access denied" });
        }
      } else if (req.user!.role === 'project_lead') {
        // Project leads can access projects they lead or are assigned to
        const isLead = project.projectLeadId === userId;
        const isAssigned = project.assignments.some((assignment: any) => assignment.userId === userId);
        if (!isLead && !isAssigned) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  // Allow both admins and project leads to create projects
  app.post('/api/projects', (req, res, next) => {
    isAuthenticated(req as AuthRequest, res, (err) => {
      if (err) return next(err);
      requireProjectLead(req as AuthRequest, res, next);
    });
  }, async (req: AuthRequest, res) => {
    try {
      const { name, description, deadline, status, projectLeadId } = req.body;
      const userId = req.user!.id;
      
      if (!name) {
        return res.status(400).json({ message: "Project name is required" });
      }
      
      const projectData = {
        name,
        description: description || null,
        deadline: deadline ? new Date(deadline) : null,
        status: status || 'active',
        projectLeadId: projectLeadId || null,
        createdBy: userId,
      };
      
      const project = await storage.createProject(projectData);
      
      res.status(201).json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  // Allow project leads to update their own projects and admins to update any project
  app.patch('/api/projects/:id', (req, res, next) => {
    isAuthenticated(req as AuthRequest, res, (err) => {
      if (err) return next(err);
      requireProjectLead(req as AuthRequest, res, next);
    });
  }, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const { name, description, deadline, status, projectLeadId } = req.body;
      
      const projectData = {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
        ...(status && { status }),
        ...(projectLeadId !== undefined && { projectLeadId }),
      };
      
      // Check if user can update this project
      if (req.user!.role === 'project_lead') {
        const project = await storage.getProjectById(id);
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }
        
        if (project.projectLeadId !== userId && project.createdBy.id !== userId) {
          return res.status(403).json({ message: "You can only update projects you lead or created" });
        }
      }
      // Admins can update any project (no additional checks needed)
      
      const project = await storage.updateProject(id, projectData);
      res.json(project);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete('/api/projects/:id', (req, res, next) => {
    isAuthenticated(req as AuthRequest, res, (err) => {
      if (err) return next(err);
      requireAdmin(req as AuthRequest, res, next);
    });
  }, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      await storage.deleteProject(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Project assignment routes - Fixed for project leads
  app.post('/api/projects/:id/assign', (req, res, next) => {
    isAuthenticated(req as AuthRequest, res, (err) => {
      if (err) return next(err);
      // Allow both admins and project leads to assign users
      if (!req.user || !['admin', 'project_lead'].includes(req.user.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      next();
    });
  }, async (req: AuthRequest, res) => {
    try {
      const { id: projectId } = req.params;
      const { userId } = req.body;
      const assignedBy = req.user!.id;
      
      console.log(`Assignment attempt: User ${req.user!.role} (${assignedBy}) trying to assign ${userId} to project ${projectId}`);
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      // Get the user being assigned to check their role
      const userToAssign = await storage.getUserById(userId);
      if (!userToAssign) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get the project to check permissions
      const project = await storage.getProjectById(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check role-based assignment permissions
      if (req.user!.role === 'admin') {
        // Admins can only assign project leads to projects
        if (userToAssign.role !== 'project_lead') {
          return res.status(403).json({ message: "Admins can only assign project leads to projects" });
        }
      } else if (req.user!.role === 'project_lead') {
        // Check if the project lead has permission to assign to this project
        const isProjectLead = project.projectLeadId === assignedBy;
        const isProjectCreator = project.createdBy === assignedBy;
        const isAssignedToProject = project.assignments.some((a: any) => a.userId === assignedBy);
        
        if (!isProjectLead && !isProjectCreator && !isAssignedToProject) {
          return res.status(403).json({ message: "You can only assign users to projects you lead, created, or are assigned to" });
        }

        // Project leads can only assign developers
        if (userToAssign.role !== 'developer') {
          return res.status(403).json({ message: "Project leads can only assign developers to projects" });
        }
      }
      
      const assignment = await storage.assignUserToProject({
        projectId,
        userId,
        assignedBy
      });
      res.status(201).json(assignment);
    } catch (error) {
      console.error("Error assigning user to project:", error);
      if ((error as any).message === 'User is already assigned to this project') {
        return res.status(400).json({ message: "User is already assigned to this project" });
      }
      res.status(500).json({ message: "Failed to assign user to project" });
    }
  });

  app.delete('/api/projects/:projectId/assign/:userId', (req, res, next) => {
    isAuthenticated(req as AuthRequest, res, (err) => {
      if (err) return next(err);
      requireProjectLead(req as AuthRequest, res, next);
    });
  }, async (req: AuthRequest, res) => {
    try {
      const { projectId, userId } = req.params;
      await storage.removeUserFromProject(projectId, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing user from project:", error);
      res.status(500).json({ message: "Failed to remove user from project" });
    }
  });

  // Admin route to assign project lead to existing project
  app.patch('/api/projects/:id/assign-lead', (req, res, next) => {
    isAuthenticated(req as AuthRequest, res, (err) => {
      if (err) return next(err);
      requireAdmin(req as AuthRequest, res, next);
    });
  }, async (req: AuthRequest, res) => {
    try {
      const { id: projectId } = req.params;
      const { projectLeadId } = req.body;
      
      if (!projectLeadId) {
        return res.status(400).json({ message: "Project lead ID is required" });
      }

      // Check if project lead exists and has correct role
      const projectLead = await storage.getUserById(projectLeadId);
      if (!projectLead) {
        return res.status(404).json({ message: "Project lead not found" });
      }

      if (projectLead.role !== 'project_lead' && projectLead.role !== 'admin') {
        return res.status(400).json({ message: "User must be a project lead or admin" });
      }

      // Update the project's project lead
      const updatedProject = await storage.updateProject(projectId, { projectLeadId });
      res.json(updatedProject);
    } catch (error: any) {
      console.error("Error assigning project lead:", error);
      res.status(500).json({ message: "Failed to assign project lead" });
    }
  });

  // Document routes
  app.get('/api/projects/:id/documents', (req, res, next) => {
    isAuthenticated(req as AuthRequest, res, next);
  }, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      
      // Check if developer has access to this project
      if (req.user!.role === 'developer') {
        const project = await storage.getProjectById(id);
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }
        
        const hasAccess = project.assignments.some((assignment: any) => assignment.userId === userId);
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

  app.post('/api/projects/:id/documents', (req, res, next) => {
    isAuthenticated(req as AuthRequest, res, (err) => {
      if (err) return next(err);
      requireProjectLead(req as AuthRequest, res, (err2) => {
        if (err2) return next(err2);
        upload.array('files', 10)(req, res, next);
      });
    });
  }, async (req: AuthRequest, res) => {
      try {
        const { id: projectId } = req.params;
        const userId = req.user!.id;
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
  app.get('/api/documents/:id/download', (req, res, next) => {
    isAuthenticated(req as AuthRequest, res, next);
  }, async (req: AuthRequest, res) => {
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

  app.delete('/api/documents/:id', (req, res, next) => {
    isAuthenticated(req as AuthRequest, res, (err) => {
      if (err) return next(err);
      requireProjectLead(req as AuthRequest, res, next);
    });
  }, async (req: AuthRequest, res) => {
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
  app.get('/api/dashboard/stats', (req, res, next) => {
    isAuthenticated(req as AuthRequest, res, next);
  }, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const stats = await storage.getDashboardStats(userId, req.user!.role);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
