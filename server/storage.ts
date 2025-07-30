// In-memory storage implementation - replaces MongoDB for simpler deployment
import { memoryStorage } from './memory-storage';

// Types for compatibility with existing code
export type User = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  passwordHash: string;
  role: 'admin' | 'project_lead' | 'developer';
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type CreateUser = {
  email: string;
  firstName?: string;
  lastName?: string;
  passwordHash: string;
  role?: 'admin' | 'project_lead' | 'developer';
  profileImageUrl?: string;
};

export type UpsertUser = CreateUser & { id?: string };

export type Project = {
  id: string;
  name: string;
  description: string | null;
  deadline: Date | null;
  status: 'active' | 'completed' | 'on_hold';
  createdBy: string;
  projectLeadId: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type InsertProject = {
  name: string;
  description?: string;
  deadline?: Date | null;
  status?: 'active' | 'completed' | 'on_hold';
  createdBy: string;
  projectLeadId?: string;
};

export type ProjectAssignment = {
  id: string;
  projectId: string;
  userId: string;
  assignedBy: string;
  createdAt: Date | null;
};

export type InsertProjectAssignment = {
  projectId: string;
  userId: string;
  assignedBy: string;
};

export type Document = {
  id: string;
  projectId: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  createdAt: Date | null;
};

export type InsertDocument = {
  projectId: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
};

export const storage = {
  // User methods
  async createUser(userData: CreateUser): Promise<User> {
    return await memoryStorage.createUser(userData);
  },

  async getUserById(id: string): Promise<User | null> {
    return await memoryStorage.getUserById(id);
  },

  async getUserByEmail(email: string): Promise<User | null> {
    return await memoryStorage.getUserByEmail(email);
  },

  async getAllUsers(): Promise<any[]> {
    return await memoryStorage.getAllUsers();
  },

  async updateUser(id: string, updates: Partial<UpsertUser>): Promise<void> {
    await memoryStorage.updateUser(id, updates);
  },

  async deleteUser(id: string): Promise<void> {
    await memoryStorage.deleteUser(id);
  },

  // Project methods
  async createProject(projectData: InsertProject): Promise<Project> {
    return await memoryStorage.createProject(projectData);
  },

  async getAllProjects(): Promise<any[]> {
    return await memoryStorage.getAllProjects();
  },

  async getProjectById(id: string): Promise<any | null> {
    return await memoryStorage.getProjectById(id);
  },

  async updateProject(id: string, updates: Partial<InsertProject>): Promise<void> {
    await memoryStorage.updateProject(id, updates);
  },

  async deleteProject(id: string): Promise<void> {
    await memoryStorage.deleteProject(id);
  },

  // Project assignment methods
  async assignUserToProject(assignmentData: InsertProjectAssignment): Promise<ProjectAssignment> {
    return await memoryStorage.assignUserToProject(assignmentData);
  },

  async removeUserFromProject(projectId: string, userId: string): Promise<void> {
    await memoryStorage.removeUserFromProject(projectId, userId);
  },

  async getUserProjects(userId: string): Promise<any[]> {
    return await memoryStorage.getUserProjects(userId);
  },

  // Document methods
  async createDocument(documentData: InsertDocument): Promise<Document> {
    return await memoryStorage.createDocument(documentData);
  },

  async getProjectDocuments(projectId: string): Promise<Document[]> {
    return await memoryStorage.getProjectDocuments(projectId);
  },

  async deleteDocument(id: string): Promise<void> {
    await memoryStorage.deleteDocument(id);
  },

  // Dashboard stats method
  async getDashboardStats(): Promise<any> {
    return await memoryStorage.getDashboardStats();
  },
};