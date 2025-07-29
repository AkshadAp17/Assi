import { connectToDatabase } from './mongodb';
import { User, Project, ProjectAssignment, Document } from '@shared/mongoose-schema';
import type { UserDocument, ProjectDocument, ProjectAssignmentDocument, DocumentDocument } from '@shared/mongoose-schema';
import bcrypt from 'bcryptjs';

class MongoDBStorage {
  constructor() {
    this.init();
  }

  private async init() {
    await connectToDatabase();
  }

  // User operations
  async createUser(userData: {
    email: string;
    firstName?: string;
    lastName?: string;
    passwordHash: string;
    role?: 'admin' | 'project_lead' | 'developer';
    profileImageUrl?: string;
  }) {
    await connectToDatabase();
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email.toLowerCase() });
    if (existingUser) {
      throw new Error('A user with this email already exists');
    }
    
    const user = new User({
      ...userData,
      email: userData.email.toLowerCase(),
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: userData.profileImageUrl || null
    });
    
    await user.save();
    return this.formatUser(user);
  }

  async getUser(id: string) {
    await connectToDatabase();
    const user = await User.findById(id);
    return user ? this.formatUser(user) : null;
  }

  async getUserByEmail(email: string) {
    await connectToDatabase();
    const user = await User.findOne({ email: email.toLowerCase() });
    return user ? this.formatUser(user) : null;
  }

  async getAllUsers() {
    await connectToDatabase();
    const users = await User.find({}).sort({ createdAt: -1 });
    
    // Get assignment counts for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const assignmentCount = await ProjectAssignment.countDocuments({ userId: user._id });
        return {
          ...this.formatUser(user),
          _count: {
            projectAssignments: assignmentCount
          }
        };
      })
    );
    
    return usersWithStats;
  }

  async updateUserRole(id: string, role: 'admin' | 'project_lead' | 'developer') {
    await connectToDatabase();
    const user = await User.findByIdAndUpdate(id, { role }, { new: true });
    return user ? this.formatUser(user) : null;
  }

  async updateUserPassword(id: string, newPassword: string) {
    await connectToDatabase();
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const user = await User.findByIdAndUpdate(id, { passwordHash }, { new: true });
    return user ? this.formatUser(user) : null;
  }

  async deleteUser(id: string) {
    await connectToDatabase();
    await User.findByIdAndDelete(id);
  }

  // Project operations
  async createProject(projectData: {
    name: string;
    description?: string;
    deadline?: Date | null;
    status?: 'active' | 'completed' | 'on_hold';
    createdBy: string;
    projectLeadId?: string;
  }) {
    await connectToDatabase();
    const project = new Project(projectData);
    await project.save();
    return this.getProject(project._id.toString());
  }

  async getProject(id: string) {
    await connectToDatabase();
    const project = await Project.findById(id)
      .populate('createdBy', 'id email firstName lastName')
      .populate('projectLeadId', 'id email firstName lastName');
    
    if (!project) return null;

    // Get assignments with user details
    const assignments = await ProjectAssignment.find({ projectId: id })
      .populate('userId', 'id email firstName lastName profileImageUrl');

    // Get documents
    const documents = await Document.find({ projectId: id });

    return {
      ...this.formatProject(project),
      assignments: assignments.map(this.formatAssignment),
      documents: documents.map(this.formatDocument),
      _count: {
        assignments: assignments.length,
        documents: documents.length
      }
    };
  }

  async getAllProjects() {
    await connectToDatabase();
    const projects = await Project.find({})
      .populate('createdBy', 'id email firstName lastName')
      .populate('projectLeadId', 'id email firstName lastName')
      .sort({ createdAt: -1 });

    return Promise.all(projects.map(async (project) => {
      const assignmentCount = await ProjectAssignment.countDocuments({ projectId: project._id });
      const documentCount = await Document.countDocuments({ projectId: project._id });
      
      return {
        ...this.formatProject(project),
        assignments: [],
        documents: [],
        _count: {
          assignments: assignmentCount,
          documents: documentCount
        }
      };
    }));
  }

  async getProjectsByUser(userId: string) {
    await connectToDatabase();
    const assignments = await ProjectAssignment.find({ userId }).populate({
      path: 'projectId',
      populate: [
        { path: 'createdBy', select: 'id email firstName lastName' },
        { path: 'projectLeadId', select: 'id email firstName lastName' }
      ]
    });

    return Promise.all(assignments.map(async (assignment) => {
      const project = assignment.projectId as any;
      const assignmentCount = await ProjectAssignment.countDocuments({ projectId: project._id });
      const documentCount = await Document.countDocuments({ projectId: project._id });
      
      return {
        ...this.formatProject(project),
        assignments: [],
        documents: [],
        _count: {
          assignments: assignmentCount,
          documents: documentCount
        }
      };
    }));
  }

  async getProjectsByLead(userId: string) {
    await connectToDatabase();
    const projects = await Project.find({ projectLeadId: userId })
      .populate('createdBy', 'id email firstName lastName')
      .populate('projectLeadId', 'id email firstName lastName');

    return Promise.all(projects.map(async (project) => {
      const assignmentCount = await ProjectAssignment.countDocuments({ projectId: project._id });
      const documentCount = await Document.countDocuments({ projectId: project._id });
      
      return {
        ...this.formatProject(project),
        assignments: [],
        documents: [],
        _count: {
          assignments: assignmentCount,
          documents: documentCount
        }
      };
    }));
  }

  async updateProject(id: string, updates: Partial<{
    name: string;
    description: string;
    deadline: Date | null;
    status: 'active' | 'completed' | 'on_hold';
    projectLeadId: string;
  }>) {
    await connectToDatabase();
    await Project.findByIdAndUpdate(id, updates, { new: true });
    return this.getProject(id);
  }

  async deleteProject(id: string) {
    await connectToDatabase();
    await Project.findByIdAndDelete(id);
    await ProjectAssignment.deleteMany({ projectId: id });
    await Document.deleteMany({ projectId: id });
  }

  // Project assignment operations
  async assignUserToProject(projectId: string, userId: string, assignedBy: string) {
    await connectToDatabase();
    
    // Check if assignment already exists
    const existing = await ProjectAssignment.findOne({ projectId, userId });
    if (existing) {
      throw new Error('User is already assigned to this project');
    }

    const assignment = new ProjectAssignment({
      projectId,
      userId,
      assignedBy
    });
    
    await assignment.save();
    
    const populatedAssignment = await ProjectAssignment.findById(assignment._id)
      .populate('userId', 'id email firstName lastName profileImageUrl');
    
    return this.formatAssignment(populatedAssignment);
  }

  async removeUserFromProject(projectId: string, userId: string) {
    await connectToDatabase();
    await ProjectAssignment.findOneAndDelete({ projectId, userId });
  }

  // Document operations
  async createDocument(documentData: {
    projectId: string;
    fileName: string;
    originalName: string;
    fileSize: number;
    mimeType: string;
    uploadedBy: string;
  }) {
    await connectToDatabase();
    const document = new Document(documentData);
    await document.save();
    return this.formatDocument(document);
  }

  async getDocument(id: string) {
    await connectToDatabase();
    const document = await Document.findById(id);
    return document ? this.formatDocument(document) : null;
  }

  async getProjectDocuments(projectId: string) {
    await connectToDatabase();
    const documents = await Document.find({ projectId });
    return documents.map(this.formatDocument);
  }

  async deleteDocument(id: string) {
    await connectToDatabase();
    await Document.findByIdAndDelete(id);
  }

  // Helper methods to format MongoDB documents to match the expected interface
  private formatUser(user: UserDocument) {
    return {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      profileImageUrl: user.profileImageUrl || null,
      passwordHash: user.passwordHash,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  private formatProject(project: ProjectDocument | any) {
    return {
      id: project._id.toString(),
      name: project.name,
      description: project.description || null,
      deadline: project.deadline,
      status: project.status,
      createdBy: project.createdBy ? {
        id: project.createdBy._id?.toString() || project.createdBy.toString(),
        email: project.createdBy.email || '',
        firstName: project.createdBy.firstName || null,
        lastName: project.createdBy.lastName || null
      } : null,
      projectLeadId: project.projectLeadId?.toString() || null,
      projectLead: project.projectLeadId ? {
        id: project.projectLeadId._id?.toString() || project.projectLeadId.toString(),
        email: project.projectLeadId.email || '',
        firstName: project.projectLeadId.firstName || null,
        lastName: project.projectLeadId.lastName || null
      } : null,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    };
  }

  private formatAssignment(assignment: ProjectAssignmentDocument | any) {
    return {
      id: assignment._id.toString(),
      projectId: assignment.projectId.toString(),
      userId: assignment.userId._id?.toString() || assignment.userId.toString(),
      assignedBy: assignment.assignedBy.toString(),
      user: assignment.userId._id ? {
        id: assignment.userId._id.toString(),
        email: assignment.userId.email,
        firstName: assignment.userId.firstName || null,
        lastName: assignment.userId.lastName || null,
        profileImageUrl: assignment.userId.profileImageUrl || null
      } : null,
      createdAt: assignment.createdAt
    };
  }

  private formatDocument(document: DocumentDocument) {
    return {
      id: document._id.toString(),
      projectId: document.projectId.toString(),
      fileName: document.fileName,
      originalName: document.originalName,
      fileSize: document.fileSize,
      mimeType: document.mimeType,
      uploadedBy: document.uploadedBy.toString(),
      createdAt: document.createdAt
    };
  }
}

export const mongoStorage = new MongoDBStorage();