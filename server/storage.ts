import { eq, and, desc } from "drizzle-orm";
import { db } from "./db";
import * as schema from "@shared/schema";
import type { 
  User, 
  CreateUser, 
  UpsertUser,
  Project, 
  InsertProject,
  ProjectAssignment, 
  InsertProjectAssignment,
  Document, 
  InsertDocument,
  ProjectWithDetails,
  UserWithStats 
} from "@shared/schema";

export type { 
  User, 
  CreateUser, 
  UpsertUser,
  Project, 
  InsertProject,
  ProjectAssignment, 
  InsertProjectAssignment,
  Document, 
  InsertDocument,
  ProjectWithDetails,
  UserWithStats 
};

export interface IStorage {
  // User methods
  createUser(user: CreateUser): Promise<User>;
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  getAllUsers(): Promise<UserWithStats[]>;
  updateUser(id: string, updates: Partial<UpsertUser>): Promise<void>;
  deleteUser(id: string): Promise<void>;

  // Project methods
  createProject(project: InsertProject): Promise<Project>;
  getAllProjects(): Promise<ProjectWithDetails[]>;
  getProjectById(id: string): Promise<ProjectWithDetails | null>;
  updateProject(id: string, updates: Partial<InsertProject>): Promise<void>;
  deleteProject(id: string): Promise<void>;

  // Project assignment methods
  assignUserToProject(assignment: InsertProjectAssignment): Promise<ProjectAssignment>;
  removeUserFromProject(projectId: string, userId: string): Promise<void>;
  getUserProjects(userId: string): Promise<ProjectWithDetails[]>;

  // Document methods
  createDocument(document: InsertDocument): Promise<Document>;
  getProjectDocuments(projectId: string): Promise<Document[]>;
  deleteDocument(id: string): Promise<void>;
}

class DrizzleStorage implements IStorage {
  async createUser(userData: CreateUser): Promise<User> {
    const [user] = await db.insert(schema.users).values(userData).returning();
    return user;
  }

  async getUserById(id: string): Promise<User | null> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
    return user || null;
  }

  async getAllUsers(): Promise<UserWithStats[]> {
    const users = await db.query.users.findMany({
      with: {
        projectAssignments: true,
      },
    });

    return users.map(user => ({
      ...user,
      _count: {
        projectAssignments: user.projectAssignments.length,
      },
    }));
  }

  async updateUser(id: string, updates: Partial<UpsertUser>): Promise<void> {
    await db.update(schema.users).set(updates).where(eq(schema.users.id, id));
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(schema.users).where(eq(schema.users.id, id));
  }

  async createProject(projectData: InsertProject): Promise<Project> {
    const [project] = await db.insert(schema.projects).values(projectData).returning();
    return project;
  }

  async getAllProjects(): Promise<ProjectWithDetails[]> {
    const projects = await db.query.projects.findMany({
      with: {
        createdBy: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        projectLead: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        assignments: {
          with: {
            user: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                profileImageUrl: true,
              },
            },
          },
        },
        documents: true,
      },
      orderBy: [desc(schema.projects.createdAt)],
    });

    return projects.map(project => ({
      ...project,
      _count: {
        assignments: project.assignments.length,
        documents: project.documents.length,
      },
    }));
  }

  async getProjectById(id: string): Promise<ProjectWithDetails | null> {
    const project = await db.query.projects.findFirst({
      where: eq(schema.projects.id, id),
      with: {
        createdBy: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        projectLead: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        assignments: {
          with: {
            user: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                profileImageUrl: true,
              },
            },
          },
        },
        documents: true,
      },
    });

    if (!project) return null;

    return {
      ...project,
      _count: {
        assignments: project.assignments.length,
        documents: project.documents.length,
      },
    };
  }

  async updateProject(id: string, updates: Partial<InsertProject>): Promise<void> {
    await db.update(schema.projects).set(updates).where(eq(schema.projects.id, id));
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(schema.projects).where(eq(schema.projects.id, id));
  }

  async assignUserToProject(assignmentData: InsertProjectAssignment): Promise<ProjectAssignment> {
    const [assignment] = await db.insert(schema.projectAssignments).values(assignmentData).returning();
    return assignment;
  }

  async removeUserFromProject(projectId: string, userId: string): Promise<void> {
    await db.delete(schema.projectAssignments)
      .where(
        and(
          eq(schema.projectAssignments.projectId, projectId),
          eq(schema.projectAssignments.userId, userId)
        )
      );
  }

  async getUserProjects(userId: string): Promise<ProjectWithDetails[]> {
    const assignments = await db.query.projectAssignments.findMany({
      where: eq(schema.projectAssignments.userId, userId),
      with: {
        project: {
          with: {
            createdBy: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            projectLead: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            assignments: {
              with: {
                user: {
                  columns: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    profileImageUrl: true,
                  },
                },
              },
            },
            documents: true,
          },
        },
      },
    });

    return assignments.map(assignment => ({
      ...assignment.project,
      _count: {
        assignments: assignment.project.assignments.length,
        documents: assignment.project.documents.length,
      },
    }));
  }

  async createDocument(documentData: InsertDocument): Promise<Document> {
    const [document] = await db.insert(schema.documents).values(documentData).returning();
    return document;
  }

  async getProjectDocuments(projectId: string): Promise<Document[]> {
    return await db.select().from(schema.documents).where(eq(schema.documents.projectId, projectId));
  }

  async deleteDocument(id: string): Promise<void> {
    await db.delete(schema.documents).where(eq(schema.documents.id, id));
  }
}

export const storage = new DrizzleStorage();