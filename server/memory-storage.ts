// In-memory storage implementation
import type { User, CreateUser, UpsertUser, Project, InsertProject, ProjectAssignment, InsertProjectAssignment, Document, InsertDocument } from './storage';

class MemoryStorage {
  private users: Map<string, User> = new Map();
  private projects: Map<string, Project> = new Map();
  private projectAssignments: Map<string, ProjectAssignment> = new Map();
  private documents: Map<string, Document> = new Map();
  private lastUserId = 0;
  private lastProjectId = 0;
  private lastAssignmentId = 0;
  private lastDocumentId = 0;

  constructor() {
    // Initialize with default admin user
    this.initializeAdmin();
  }

  private generateId(prefix: string): string {
    switch (prefix) {
      case 'user':
        return `user_${++this.lastUserId}`;
      case 'project':
        return `project_${++this.lastProjectId}`;
      case 'assignment':
        return `assignment_${++this.lastAssignmentId}`;
      case 'document':
        return `document_${++this.lastDocumentId}`;
      default:
        return `${prefix}_${Date.now()}`;
    }
  }

  private async initializeAdmin(): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@gamedev.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    // Import bcrypt dynamically to avoid issues if not available
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    const adminUser: User = {
      id: this.generateId('user'),
      email: adminEmail,
      firstName: 'System',
      lastName: 'Administrator',
      profileImageUrl: null,
      passwordHash,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(adminUser.id, adminUser);
  }

  // User methods
  async createUser(userData: CreateUser): Promise<User> {
    const user: User = {
      id: this.generateId('user'),
      email: userData.email,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: userData.profileImageUrl || null,
      passwordHash: userData.passwordHash,
      role: userData.role || 'developer',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.users.set(user.id, user);
    return user;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const usersArray = Array.from(this.users.values());
    return usersArray.find(user => user.email === email) || null;
  }

  async getAllUsers(): Promise<any[]> {
    const users = Array.from(this.users.values());
    return users.map(user => {
      const userAssignments = Array.from(this.projectAssignments.entries())
        .filter(([_, a]) => a.userId === user.id);
      
      return {
        ...user,
        _count: {
          projectAssignments: userAssignments.length,
        },
      };
    });
  }

  async updateUser(id: string, updates: Partial<UpsertUser>): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      const updatedUser = {
        ...user,
        ...updates,
        updatedAt: new Date(),
      };
      this.users.set(id, updatedUser);
    }
  }

  async deleteUser(id: string): Promise<void> {
    this.users.delete(id);
    // Also remove any project assignments for this user
    const assignmentsToDelete = Array.from(this.projectAssignments.entries())
      .filter(([_, assignment]) => assignment.userId === id)
      .map(([assignmentId, _]) => assignmentId);
    
    assignmentsToDelete.forEach(assignmentId => {
      this.projectAssignments.delete(assignmentId);
    });
  }

  // Project methods
  async createProject(projectData: InsertProject): Promise<Project> {
    const project: Project = {
      id: this.generateId('project'),
      name: projectData.name,
      description: projectData.description || null,
      deadline: projectData.deadline || null,
      status: projectData.status || 'active',
      createdBy: projectData.createdBy,
      projectLeadId: projectData.projectLeadId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.projects.set(project.id, project);
    return project;
  }

  async getAllProjects(): Promise<any[]> {
    const projects = Array.from(this.projects.values());
    return projects.map(project => {
      const assignments = Array.from(this.projectAssignments.values())
        .filter(a => a.projectId === project.id);
      const documents = Array.from(this.documents.values())
        .filter(d => d.projectId === project.id);
      const createdBy = this.users.get(project.createdBy);
      const projectLead = project.projectLeadId ? this.users.get(project.projectLeadId) : null;

      return {
        ...project,
        createdBy: createdBy ? {
          id: createdBy.id,
          firstName: createdBy.firstName,
          lastName: createdBy.lastName,
          email: createdBy.email,
        } : null,
        projectLead: projectLead ? {
          id: projectLead.id,
          firstName: projectLead.firstName,
          lastName: projectLead.lastName,
          email: projectLead.email,
        } : null,
        assignments: assignments.map(a => {
          const user = this.users.get(a.userId);
          return {
            ...a,
            user: user ? {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              profileImageUrl: user.profileImageUrl,
            } : null,
          };
        }),
        documents: documents,
        _count: {
          assignments: assignments.length,
          documents: documents.length,
        },
      };
    });
  }

  async getProjectById(id: string): Promise<any | null> {
    const project = this.projects.get(id);
    if (!project) return null;

    const assignments = Array.from(this.projectAssignments.values())
      .filter(a => a.projectId === id);
    const documents = Array.from(this.documents.values())
      .filter(d => d.projectId === id);
    const createdBy = this.users.get(project.createdBy);
    const projectLead = project.projectLeadId ? this.users.get(project.projectLeadId) : null;

    return {
      ...project,
      createdBy: createdBy ? {
        id: createdBy.id,
        firstName: createdBy.firstName,
        lastName: createdBy.lastName,
        email: createdBy.email,
      } : null,
      projectLead: projectLead ? {
        id: projectLead.id,
        firstName: projectLead.firstName,
        lastName: projectLead.lastName,
        email: projectLead.email,
      } : null,
      assignments: assignments.map(a => {
        const user = this.users.get(a.userId);
        return {
          ...a,
          user: user ? {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            profileImageUrl: user.profileImageUrl,
          } : null,
        };
      }),
      documents: documents,
      _count: {
        assignments: assignments.length,
        documents: documents.length,
      },
    };
  }

  async updateProject(id: string, updates: Partial<InsertProject>): Promise<void> {
    const project = this.projects.get(id);
    if (project) {
      const updatedProject = {
        ...project,
        ...updates,
        updatedAt: new Date(),
      };
      this.projects.set(id, updatedProject);
    }
  }

  async deleteProject(id: string): Promise<void> {
    this.projects.delete(id);
    // Also remove any assignments and documents for this project
    const assignmentsToDelete = Array.from(this.projectAssignments.entries())
      .filter(([_, assignment]) => assignment.projectId === id)
      .map(([assignmentId, _]) => assignmentId);
    
    const documentsToDelete = Array.from(this.documents.entries())
      .filter(([_, document]) => document.projectId === id)
      .map(([documentId, _]) => documentId);

    assignmentsToDelete.forEach(assignmentId => {
      this.projectAssignments.delete(assignmentId);
    });
    
    documentsToDelete.forEach(documentId => {
      this.documents.delete(documentId);
    });
  }

  // Project assignment methods
  async assignUserToProject(assignmentData: InsertProjectAssignment): Promise<ProjectAssignment> {
    const assignment: ProjectAssignment = {
      id: this.generateId('assignment'),
      projectId: assignmentData.projectId,
      userId: assignmentData.userId,
      assignedBy: assignmentData.assignedBy,
      createdAt: new Date(),
    };
    
    this.projectAssignments.set(assignment.id, assignment);
    return assignment;
  }

  async removeUserFromProject(projectId: string, userId: string): Promise<void> {
    const assignmentToDelete = Array.from(this.projectAssignments.entries())
      .find(([_, assignment]) => assignment.projectId === projectId && assignment.userId === userId);
    
    if (assignmentToDelete) {
      this.projectAssignments.delete(assignmentToDelete[0]);
    }
  }

  async getUserProjects(userId: string): Promise<any[]> {
    const assignments = Array.from(this.projectAssignments.values())
      .filter(a => a.userId === userId);
    const projectIds = assignments.map(a => a.projectId);
    
    const projects = Array.from(this.projects.values())
      .filter(p => projectIds.includes(p.id));

    return projects.map(project => {
      const projectAssignments = Array.from(this.projectAssignments.values())
        .filter(a => a.projectId === project.id);
      const documents = Array.from(this.documents.values())
        .filter(d => d.projectId === project.id);
      const createdBy = this.users.get(project.createdBy);
      const projectLead = project.projectLeadId ? this.users.get(project.projectLeadId) : null;

      return {
        ...project,
        createdBy: createdBy ? {
          id: createdBy.id,
          firstName: createdBy.firstName,
          lastName: createdBy.lastName,
          email: createdBy.email,
        } : null,
        projectLead: projectLead ? {
          id: projectLead.id,
          firstName: projectLead.firstName,
          lastName: projectLead.lastName,
          email: projectLead.email,
        } : null,
        assignments: projectAssignments.map(a => {
          const user = this.users.get(a.userId);
          return {
            ...a,
            user: user ? {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              profileImageUrl: user.profileImageUrl,
            } : null,
          };
        }),
        documents: documents,
        _count: {
          assignments: projectAssignments.length,
          documents: documents.length,
        },
      };
    });
  }

  // Document methods
  async createDocument(documentData: InsertDocument): Promise<Document> {
    const document: Document = {
      id: this.generateId('document'),
      projectId: documentData.projectId,
      fileName: documentData.fileName,
      originalName: documentData.originalName,
      fileSize: documentData.fileSize,
      mimeType: documentData.mimeType,
      uploadedBy: documentData.uploadedBy,
      createdAt: new Date(),
    };
    
    this.documents.set(document.id, document);
    return document;
  }

  async getProjectDocuments(projectId: string): Promise<Document[]> {
    return Array.from(this.documents.values())
      .filter(d => d.projectId === projectId);
  }

  async deleteDocument(id: string): Promise<void> {
    this.documents.delete(id);
  }

  // Dashboard stats method
  async getDashboardStats(): Promise<any> {
    const users = Array.from(this.users.values());
    const projects = Array.from(this.projects.values());
    const documents = Array.from(this.documents.values());
    
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    const totalUsers = users.length;
    const totalDocuments = documents.length;

    return {
      totalProjects: projects.length,
      activeProjects,
      completedProjects,
      totalUsers,
      totalDocuments,
    };
  }
}

export const memoryStorage = new MemoryStorage();