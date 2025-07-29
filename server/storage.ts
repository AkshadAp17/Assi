// MongoDB storage implementation - replaces Drizzle/PostgreSQL
import { mongoStorage } from './mongodb-storage';
import bcrypt from 'bcryptjs';

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

export type ProjectWithDetails = Project & {
  createdBy: Pick<User, 'id' | 'firstName' | 'lastName' | 'email'>;
  projectLead?: Pick<User, 'id' | 'firstName' | 'lastName' | 'email'>;
  assignments: (ProjectAssignment & {
    user: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'profileImageUrl'>;
  })[];
  documents: Document[];
  _count: {
    assignments: number;
    documents: number;
  };
};

export type UserWithStats = User & {
  _count: {
    projectAssignments: number;
  };
};

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: CreateUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Additional user operations
  getAllUsers(): Promise<UserWithStats[]>;
  updateUserRole(userId: string, role: 'admin' | 'project_lead' | 'developer'): Promise<User>;
  updateUserPassword(userId: string, passwordHash: string): Promise<void>;
  deleteUser(userId: string): Promise<void>;
  
  // Project operations
  getAllProjects(): Promise<ProjectWithDetails[]>;
  getProject(id: string): Promise<ProjectWithDetails | undefined>;
  getProjectsByUser(userId: string): Promise<ProjectWithDetails[]>;
  getProjectsByLead(userId: string): Promise<ProjectWithDetails[]>;
  createProject(projectData: InsertProject): Promise<Project>;
  updateProject(id: string, projectData: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: string): Promise<void>;
  
  // Project assignment operations
  assignUserToProject(projectId: string, userId: string, assignedBy: string): Promise<ProjectAssignment>;
  removeUserFromProject(projectId: string, userId: string): Promise<void>;
  getProjectAssignments(projectId: string): Promise<ProjectAssignment[]>;
  
  // Document operations
  createDocument(documentData: InsertDocument): Promise<Document>;
  getDocument(id: string): Promise<Document | undefined>;
  getProjectDocuments(projectId: string): Promise<Document[]>;
  deleteDocument(id: string): Promise<void>;
  
  // Stats operations
  getDashboardStats(userId: string, userRole: string): Promise<{
    activeProjects: number;
    teamMembers: number;
    dueThisWeek: number;
    totalDocuments: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return await mongoStorage.getUser(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return await mongoStorage.getUserByEmail(email);
  }

  async createUser(user: CreateUser): Promise<User> {
    return await mongoStorage.createUser(user);
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    if (user.id) {
      const existingUser = await this.getUser(user.id);
      if (existingUser) {
        // Update existing user - not implemented for MongoDB yet
        throw new Error('User update not implemented');
      }
    }
    return await mongoStorage.createUser(user);
  }

  async getAllUsers(): Promise<UserWithStats[]> {
    return await mongoStorage.getAllUsers();
  }

  async updateUserRole(userId: string, role: 'admin' | 'project_lead' | 'developer'): Promise<User> {
    const user = await mongoStorage.updateUserRole(userId, role);
    if (!user) throw new Error('User not found');
    return user;
  }

  async updateUserPassword(userId: string, passwordHash: string): Promise<void> {
    await mongoStorage.updateUserPassword(userId, passwordHash);
  }

  async deleteUser(userId: string): Promise<void> {
    await mongoStorage.deleteUser(userId);
  }

  // Project operations
  async getAllProjects(): Promise<ProjectWithDetails[]> {
    return await mongoStorage.getAllProjects();
  }

  async getProject(id: string): Promise<ProjectWithDetails | undefined> {
    return await mongoStorage.getProject(id);
  }

  async getProjectsByUser(userId: string): Promise<ProjectWithDetails[]> {
    return await mongoStorage.getProjectsByUser(userId);
  }

  async getProjectsByLead(userId: string): Promise<ProjectWithDetails[]> {
    return await mongoStorage.getProjectsByLead(userId);
  }

  async createProject(projectData: InsertProject): Promise<Project> {
    const result = await mongoStorage.createProject(projectData);
    // Extract just the project data from the detailed result
    return {
      id: result.id,
      name: result.name,
      description: result.description,
      deadline: result.deadline,
      status: result.status,
      createdBy: typeof result.createdBy === 'string' ? result.createdBy : result.createdBy.id,
      projectLeadId: result.projectLeadId,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt
    };
  }

  async updateProject(id: string, projectData: Partial<InsertProject>): Promise<Project> {
    const result = await mongoStorage.updateProject(id, projectData);
    if (!result) throw new Error('Project not found');
    // Extract just the project data from the detailed result
    return {
      id: result.id,
      name: result.name,
      description: result.description,
      deadline: result.deadline,
      status: result.status,
      createdBy: typeof result.createdBy === 'string' ? result.createdBy : (result.createdBy?.id || result.createdBy),
      projectLeadId: result.projectLeadId,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt
    };
  }

  async deleteProject(id: string): Promise<void> {
    await mongoStorage.deleteProject(id);
  }

  // Project assignment operations
  async assignUserToProject(projectId: string, userId: string, assignedBy: string): Promise<ProjectAssignment> {
    return await mongoStorage.assignUserToProject(projectId, userId, assignedBy);
  }

  async removeUserFromProject(projectId: string, userId: string): Promise<void> {
    await mongoStorage.removeUserFromProject(projectId, userId);
  }

  async getProjectAssignments(projectId: string): Promise<ProjectAssignment[]> {
    const project = await mongoStorage.getProject(projectId);
    return project ? project.assignments : [];
  }

  // Document operations
  async createDocument(documentData: InsertDocument): Promise<Document> {
    return await mongoStorage.createDocument(documentData);
  }

  async getDocument(id: string): Promise<Document | undefined> {
    return await mongoStorage.getDocument(id);
  }

  async getProjectDocuments(projectId: string): Promise<Document[]> {
    return await mongoStorage.getProjectDocuments(projectId);
  }

  async deleteDocument(id: string): Promise<void> {
    await mongoStorage.deleteDocument(id);
  }

  // Stats operations
  async getDashboardStats(userId: string, userRole: string): Promise<{
    activeProjects: number;
    teamMembers: number;
    dueThisWeek: number;
    totalDocuments: number;
  }> {
    // Basic implementation for MongoDB
    let projects: ProjectWithDetails[] = [];
    
    if (userRole === 'admin') {
      projects = await this.getAllProjects();
    } else if (userRole === 'project_lead') {
      const ledProjects = await this.getProjectsByLead(userId);
      const assignedProjects = await this.getProjectsByUser(userId);
      // Combine and deduplicate
      projects = [...ledProjects, ...assignedProjects].filter((project, index, self) => 
        index === self.findIndex(p => p.id === project.id)
      );
    } else {
      projects = await this.getProjectsByUser(userId);
    }

    const activeProjects = projects.filter(p => p.status === 'active').length;
    const totalMembers = new Set(projects.flatMap(p => p.assignments.map(a => a.userId))).size;
    
    // Calculate due this week
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
    const dueThisWeek = projects.filter(p => 
      p.deadline && new Date(p.deadline) <= oneWeekFromNow && new Date(p.deadline) >= new Date()
    ).length;
    
    const totalDocuments = projects.reduce((sum, p) => sum + p._count.documents, 0);

    return {
      activeProjects,
      teamMembers: totalMembers,
      dueThisWeek,
      totalDocuments
    };
  }
}

export const storage = new DatabaseStorage();