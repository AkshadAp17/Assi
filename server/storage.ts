import {
  users,
  projects,
  projectAssignments,
  documents,
  type User,
  type UpsertUser,
  type Project,
  type InsertProject,
  type ProjectAssignment,
  type InsertProjectAssignment,
  type Document,
  type InsertDocument,
  type ProjectWithDetails,
  type UserWithStats,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

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
  // (IMPORTANT) these user operations are mandatory for Replit Auth.

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: CreateUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<UserWithStats[]> {
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        _count: {
          projectAssignments: sql<number>`cast(count(${projectAssignments.id}) as int)`,
        },
      })
      .from(users)
      .leftJoin(projectAssignments, eq(users.id, projectAssignments.userId))
      .groupBy(users.id)
      .orderBy(desc(users.createdAt));

    return result;
  }



  async updateUserRole(userId: string, role: 'admin' | 'project_lead' | 'developer'): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserPassword(userId: string, passwordHash: string): Promise<void> {
    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async deleteUser(userId: string): Promise<void> {
    await db.delete(users).where(eq(users.id, userId));
  }

  // Project operations
  async getAllProjects(): Promise<ProjectWithDetails[]> {
    const result = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        deadline: projects.deadline,
        status: projects.status,
        createdBy: projects.createdBy,
        projectLeadId: projects.projectLeadId,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        createdByUser: {
          id: sql<string>`creator.id`,
          firstName: sql<string>`creator.first_name`,
          lastName: sql<string>`creator.last_name`,
          email: sql<string>`creator.email`,
        },
        projectLeadUser: {
          id: sql<string>`lead.id`,
          firstName: sql<string>`lead.first_name`,
          lastName: sql<string>`lead.last_name`,
          email: sql<string>`lead.email`,
        },
        assignmentCount: sql<number>`cast(count(distinct ${projectAssignments.id}) as int)`,
        documentCount: sql<number>`cast(count(distinct ${documents.id}) as int)`,
      })
      .from(projects)
      .leftJoin(sql`${users} as creator`, eq(projects.createdBy, sql`creator.id`))
      .leftJoin(sql`${users} as lead`, eq(projects.projectLeadId, sql`lead.id`))
      .leftJoin(projectAssignments, eq(projects.id, projectAssignments.projectId))
      .leftJoin(documents, eq(projects.id, documents.projectId))
      .groupBy(projects.id, sql`creator.id`, sql`creator.first_name`, sql`creator.last_name`, sql`creator.email`, sql`lead.id`, sql`lead.first_name`, sql`lead.last_name`, sql`lead.email`)
      .orderBy(desc(projects.createdAt));

    // Get assignments for each project
    const projectsWithAssignments = await Promise.all(
      result.map(async (project) => {
        const assignments = await db
          .select({
            id: projectAssignments.id,
            projectId: projectAssignments.projectId,
            userId: projectAssignments.userId,
            assignedBy: projectAssignments.assignedBy,
            createdAt: projectAssignments.createdAt,
            user: {
              id: users.id,
              firstName: users.firstName,
              lastName: users.lastName,
              email: users.email,
              profileImageUrl: users.profileImageUrl,
            },
          })
          .from(projectAssignments)
          .innerJoin(users, eq(projectAssignments.userId, users.id))
          .where(eq(projectAssignments.projectId, project.id));

        const projectDocuments = await db
          .select()
          .from(documents)
          .where(eq(documents.projectId, project.id));

        return {
          id: project.id,
          name: project.name,
          description: project.description,
          status: project.status,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          deadline: project.deadline,
          createdBy: project.createdByUser.id,
          projectLeadId: project.projectLeadUser.id || null,
          createdByUser: project.createdByUser,
          projectLeadUser: project.projectLeadUser.id ? project.projectLeadUser : undefined,
          assignments,
          documents: projectDocuments,
          _count: {
            assignments: project.assignmentCount,
            documents: project.documentCount,
          },
        } as ProjectWithDetails;
      })
    );

    return projectsWithAssignments;
  }

  async getProject(id: string): Promise<ProjectWithDetails | undefined> {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id));

    if (!project) return undefined;

    const [createdByUser] = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, project.createdBy));

    let projectLeadUser = undefined;
    if (project.projectLeadId) {
      [projectLeadUser] = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        })
        .from(users)
        .where(eq(users.id, project.projectLeadId));
    }

    const assignments = await db
      .select({
        id: projectAssignments.id,
        projectId: projectAssignments.projectId,
        userId: projectAssignments.userId,
        assignedBy: projectAssignments.assignedBy,
        createdAt: projectAssignments.createdAt,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          profileImageUrl: users.profileImageUrl,
        },
      })
      .from(projectAssignments)
      .innerJoin(users, eq(projectAssignments.userId, users.id))
      .where(eq(projectAssignments.projectId, id));

    const projectDocuments = await db
      .select()
      .from(documents)
      .where(eq(documents.projectId, id));

    return {
      ...project,
      createdBy: createdByUser,
      projectLead: projectLeadUser,
      assignments,
      documents: projectDocuments,
      _count: {
        assignments: assignments.length,
        documents: projectDocuments.length,
      },
    } as ProjectWithDetails;
  }

  async getProjectsByLead(userId: string): Promise<ProjectWithDetails[]> {
    // Get all projects where user is the project lead
    const result = await db
      .select()
      .from(projects)
      .where(eq(projects.projectLeadId, userId))
      .orderBy(desc(projects.createdAt));

    // Get full project details for each project
    const projectsWithDetails = await Promise.all(
      result.map(async (project) => {
        // Get creator details
        const [createdByUser] = await db
          .select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
          })
          .from(users)
          .where(eq(users.id, project.createdBy));

        // Get project lead details
        let projectLeadUser = undefined;
        if (project.projectLeadId) {
          [projectLeadUser] = await db
            .select({
              id: users.id,
              firstName: users.firstName,
              lastName: users.lastName,
              email: users.email,
            })
            .from(users)
            .where(eq(users.id, project.projectLeadId));
        }

        // Get assignments
        const assignments = await db
          .select({
            id: projectAssignments.id,
            projectId: projectAssignments.projectId,
            userId: projectAssignments.userId,
            assignedBy: projectAssignments.assignedBy,
            createdAt: projectAssignments.createdAt,
            user: {
              id: users.id,
              firstName: users.firstName,
              lastName: users.lastName,
              email: users.email,
              profileImageUrl: users.profileImageUrl,
            },
          })
          .from(projectAssignments)
          .innerJoin(users, eq(projectAssignments.userId, users.id))
          .where(eq(projectAssignments.projectId, project.id));

        // Get documents
        const projectDocuments = await db
          .select()
          .from(documents)
          .where(eq(documents.projectId, project.id));

        return {
          id: project.id,
          name: project.name,
          description: project.description,
          status: project.status,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          deadline: project.deadline,
          createdBy: createdByUser,
          projectLead: projectLeadUser,
          assignments,
          documents: projectDocuments,
          _count: {
            assignments: assignments.length,
            documents: projectDocuments.length,
          },
        } as ProjectWithDetails;
      })
    );

    return projectsWithDetails;
  }

  async getProjectsByUser(userId: string): Promise<ProjectWithDetails[]> {
    const userProjects = await db
      .select({ projectId: projectAssignments.projectId })
      .from(projectAssignments)
      .where(eq(projectAssignments.userId, userId));

    if (userProjects.length === 0) return [];

    const projectIds = userProjects.map(p => p.projectId);
    const allProjects = await this.getAllProjects();
    
    return allProjects.filter(project => projectIds.includes(project.id));
  }

  async getProjectsByLead(userId: string): Promise<ProjectWithDetails[]> {
    const allProjects = await this.getAllProjects();
    return allProjects.filter(project => 
      project.projectLeadId === userId || project.createdBy === userId
    );
  }

  async createProject(projectData: InsertProject): Promise<Project> {
    const [project] = await db
      .insert(projects)
      .values(projectData)
      .returning();
    return project;
  }

  async updateProject(id: string, projectData: Partial<InsertProject>): Promise<Project> {
    const [project] = await db
      .update(projects)
      .set({ ...projectData, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return project;
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Project assignment operations
  async assignUserToProject(projectId: string, userId: string, assignedBy: string): Promise<ProjectAssignment> {
    const [assignment] = await db
      .insert(projectAssignments)
      .values({
        projectId,
        userId,
        assignedBy,
      })
      .returning();
    return assignment;
  }

  async removeUserFromProject(projectId: string, userId: string): Promise<void> {
    await db
      .delete(projectAssignments)
      .where(
        and(
          eq(projectAssignments.projectId, projectId),
          eq(projectAssignments.userId, userId)
        )
      );
  }

  async getProjectAssignments(projectId: string): Promise<ProjectAssignment[]> {
    return await db
      .select()
      .from(projectAssignments)
      .where(eq(projectAssignments.projectId, projectId));
  }

  // Document operations
  async createDocument(documentData: InsertDocument): Promise<Document> {
    const [document] = await db
      .insert(documents)
      .values(documentData)
      .returning();
    return document;
  }

  async getDocument(id: string): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document;
  }

  async getProjectDocuments(projectId: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.projectId, projectId))
      .orderBy(desc(documents.createdAt));
  }

  async deleteDocument(id: string): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  // Stats operations
  async getDashboardStats(userId: string, userRole: string): Promise<{
    activeProjects: number;
    teamMembers: number;
    dueThisWeek: number;
    totalDocuments: number;
  }> {
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);

    let activeProjectsQuery;
    let documentsQuery;

    if (userRole === 'developer') {
      // For developers, only count projects they're assigned to
      const userProjectIds = await db
        .select({ projectId: projectAssignments.projectId })
        .from(projectAssignments)
        .where(eq(projectAssignments.userId, userId));

      const projectIds = userProjectIds.map(p => p.projectId);

      if (projectIds.length === 0) {
        return {
          activeProjects: 0,
          teamMembers: 0,
          dueThisWeek: 0,
          totalDocuments: 0,
        };
      }

      activeProjectsQuery = db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(projects)
        .where(
          and(
            sql`${projects.id} = ANY(${projectIds})`,
            eq(projects.status, 'active')
          )
        );

      documentsQuery = db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(documents)
        .where(sql`${documents.projectId} = ANY(${projectIds})`);
    } else {
      // For admins and project leads, count all projects
      activeProjectsQuery = db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(projects)
        .where(eq(projects.status, 'active'));

      documentsQuery = db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(documents);
    }

    const [activeProjectsResult] = await activeProjectsQuery;
    const [teamMembersResult] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(users);

    const [dueThisWeekResult] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(projects)
      .where(
        and(
          eq(projects.status, 'active'),
          sql`${projects.deadline} <= ${oneWeekFromNow}`,
          sql`${projects.deadline} >= ${new Date()}`
        )
      );

    const [totalDocumentsResult] = await documentsQuery;

    return {
      activeProjects: activeProjectsResult.count,
      teamMembers: teamMembersResult.count,
      dueThisWeek: dueThisWeekResult.count,
      totalDocuments: totalDocumentsResult.count,
    };
  }
}

export const storage = new DatabaseStorage();
