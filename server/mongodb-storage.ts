import { connectToDatabase } from './mongodb';
import { User, Project, ProjectAssignment, Document } from '../shared/mongoose-schema';
import type { IUser, IProject, IProjectAssignment, IDocument } from '../shared/mongoose-schema';

// Convert MongoDB document to plain object with proper id field
function convertUser(doc: any): IUser {
  return {
    ...doc.toObject(),
    id: doc._id.toString(),
    createdAt: doc.createdAt || null,
    updatedAt: doc.updatedAt || null,
  };
}

function convertProject(doc: any): IProject {
  return {
    ...doc.toObject(),
    id: doc._id.toString(),
    createdBy: doc.createdBy.toString(),
    projectLeadId: doc.projectLeadId ? doc.projectLeadId.toString() : null,
    createdAt: doc.createdAt || null,
    updatedAt: doc.updatedAt || null,
  };
}

function convertProjectAssignment(doc: any): IProjectAssignment {
  return {
    ...doc.toObject(),
    id: doc._id.toString(),
    projectId: doc.projectId.toString(),
    userId: doc.userId.toString(),
    assignedBy: doc.assignedBy.toString(),
    createdAt: doc.createdAt || null,
    updatedAt: doc.updatedAt || null,
  };
}

function convertDocument(doc: any): IDocument {
  return {
    ...doc.toObject(),
    id: doc._id.toString(),
    projectId: doc.projectId.toString(),
    uploadedBy: doc.uploadedBy.toString(),
    cloudinaryUrl: doc.cloudinaryUrl,
    cloudinaryPublicId: doc.cloudinaryPublicId,
    createdAt: doc.createdAt || null,
    updatedAt: doc.updatedAt || null,
  };
}

export const mongoStorage = {
  // User methods
  async createUser(userData: any): Promise<IUser> {
    await connectToDatabase();
    const user = new User(userData);
    const savedUser = await user.save();
    return convertUser(savedUser);
  },

  async getUserById(id: string): Promise<IUser | null> {
    await connectToDatabase();
    const user = await User.findById(id);
    return user ? convertUser(user) : null;
  },

  async getUserByEmail(email: string): Promise<IUser | null> {
    await connectToDatabase();
    const user = await User.findOne({ email });
    return user ? convertUser(user) : null;
  },

  async getAllUsers(): Promise<any[]> {
    await connectToDatabase();
    const users = await User.find({});
    const projects = await Project.find({});
    const assignments = await ProjectAssignment.find({});
    
    return users.map(user => {
      let projectCount = 0;
      
      if (user.role === 'admin') {
        projectCount = projects.length; // Admin can see all projects
      } else if (user.role === 'project_lead') {
        // Count projects where this user is the lead (createdBy)
        projectCount = projects.filter(project => 
          project.createdBy.toString() === user._id.toString()
        ).length;
      } else {
        // Count assignments for developers
        projectCount = assignments.filter(assignment => 
          assignment.userId.toString() === user._id.toString()
        ).length;
      }
      
      return {
        ...convertUser(user),
        _count: {
          projectAssignments: projectCount,
        },
      };
    });
  },

  async updateUser(id: string, updates: any): Promise<void> {
    await connectToDatabase();
    await User.findByIdAndUpdate(id, updates);
  },

  async deleteUser(id: string): Promise<void> {
    await connectToDatabase();
    await User.findByIdAndDelete(id);
  },

  // Project methods
  async createProject(projectData: any): Promise<IProject> {
    await connectToDatabase();
    const project = new Project(projectData);
    const savedProject = await project.save();
    return convertProject(savedProject);
  },

  async getAllProjects(): Promise<any[]> {
    await connectToDatabase();
    const projects = await Project.find({})
      .populate('createdBy', 'id firstName lastName email')
      .populate('projectLeadId', 'id firstName lastName email')
      .sort({ createdAt: -1 });

    const allAssignments = await ProjectAssignment.find({}).populate('userId', 'id firstName lastName email profileImageUrl');
    const allDocuments = await Document.find({});

    return projects.map(project => {
      const assignments = allAssignments.filter(a => a.projectId.toString() === project._id.toString());
      const documents = allDocuments.filter(d => d.projectId.toString() === project._id.toString());
      
      return {
        ...convertProject(project),
        createdBy: project.createdBy ? {
          id: project.createdBy._id.toString(),
          firstName: project.createdBy.firstName,
          lastName: project.createdBy.lastName,
          email: project.createdBy.email,
        } : null,
        projectLead: project.projectLeadId ? {
          id: project.projectLeadId._id.toString(),
          firstName: project.projectLeadId.firstName,
          lastName: project.projectLeadId.lastName,
          email: project.projectLeadId.email,
        } : null,
        assignments: assignments.map(a => ({
          ...convertProjectAssignment(a),
          user: {
            id: a.userId._id.toString(),
            firstName: a.userId.firstName,
            lastName: a.userId.lastName,
            email: a.userId.email,
            profileImageUrl: a.userId.profileImageUrl,
          },
        })),
        documents: documents.map(d => convertDocument(d)),
        _count: {
          assignments: assignments.length,
          documents: documents.length,
        },
      };
    });
  },

  async getProjectById(id: string): Promise<any | null> {
    await connectToDatabase();
    const project = await Project.findById(id)
      .populate('createdBy', 'id firstName lastName email')
      .populate('projectLeadId', 'id firstName lastName email');

    if (!project) return null;

    const assignments = await ProjectAssignment.find({ projectId: id }).populate('userId', 'id firstName lastName email profileImageUrl');
    const documents = await Document.find({ projectId: id });

    return {
      ...convertProject(project),
      createdBy: project.createdBy ? {
        id: project.createdBy._id.toString(),
        firstName: project.createdBy.firstName,
        lastName: project.createdBy.lastName,
        email: project.createdBy.email,
      } : null,
      projectLead: project.projectLeadId ? {
        id: project.projectLeadId._id.toString(),
        firstName: project.projectLeadId.firstName,
        lastName: project.projectLeadId.lastName,
        email: project.projectLeadId.email,
      } : null,
      assignments: assignments.map(a => ({
        ...convertProjectAssignment(a),
        user: {
          id: a.userId._id.toString(),
          firstName: a.userId.firstName,
          lastName: a.userId.lastName,
          email: a.userId.email,
          profileImageUrl: a.userId.profileImageUrl,
        },
      })),
      documents: documents.map(d => convertDocument(d)),
      _count: {
        assignments: assignments.length,
        documents: documents.length,
      },
    };
  },

  async updateProject(id: string, updates: any): Promise<void> {
    await connectToDatabase();
    await Project.findByIdAndUpdate(id, updates);
  },

  async deleteProject(id: string): Promise<void> {
    await connectToDatabase();
    await Project.findByIdAndDelete(id);
  },

  // Project assignment methods
  async assignUserToProject(assignmentData: any): Promise<IProjectAssignment> {
    await connectToDatabase();
    const assignment = new ProjectAssignment(assignmentData);
    const savedAssignment = await assignment.save();
    return convertProjectAssignment(savedAssignment);
  },

  async removeUserFromProject(projectId: string, userId: string): Promise<void> {
    await connectToDatabase();
    await ProjectAssignment.findOneAndDelete({ projectId, userId });
  },

  async getUserProjects(userId: string): Promise<any[]> {
    await connectToDatabase();
    const assignments = await ProjectAssignment.find({ userId });
    const projectIds = assignments.map(a => a.projectId);
    
    const projects = await Project.find({ _id: { $in: projectIds } })
      .populate('createdBy', 'id firstName lastName email')
      .populate('projectLeadId', 'id firstName lastName email');

    const allAssignments = await ProjectAssignment.find({ projectId: { $in: projectIds } }).populate('userId', 'id firstName lastName email profileImageUrl');
    const allDocuments = await Document.find({ projectId: { $in: projectIds } });

    return projects.map(project => {
      const projectAssignments = allAssignments.filter(a => a.projectId.toString() === project._id.toString());
      const documents = allDocuments.filter(d => d.projectId.toString() === project._id.toString());
      
      return {
        ...convertProject(project),
        createdBy: project.createdBy ? {
          id: project.createdBy._id.toString(),
          firstName: project.createdBy.firstName,
          lastName: project.createdBy.lastName,
          email: project.createdBy.email,
        } : null,
        projectLead: project.projectLeadId ? {
          id: project.projectLeadId._id.toString(),
          firstName: project.projectLeadId.firstName,
          lastName: project.projectLeadId.lastName,
          email: project.projectLeadId.email,
        } : null,
        assignments: projectAssignments.map(a => ({
          ...convertProjectAssignment(a),
          user: {
            id: a.userId._id.toString(),
            firstName: a.userId.firstName,
            lastName: a.userId.lastName,
            email: a.userId.email,
            profileImageUrl: a.userId.profileImageUrl,
          },
        })),
        documents: documents.map(d => convertDocument(d)),
        _count: {
          assignments: projectAssignments.length,
          documents: documents.length,
        },
      };
    });
  },

  // Document methods
  async createDocument(documentData: any): Promise<IDocument> {
    await connectToDatabase();
    const document = new Document(documentData);
    const savedDocument = await document.save();
    return convertDocument(savedDocument);
  },

  async getProjectDocuments(projectId: string): Promise<IDocument[]> {
    await connectToDatabase();
    const documents = await Document.find({ projectId });
    return documents.map(d => convertDocument(d));
  },

  async deleteDocument(id: string): Promise<void> {
    await connectToDatabase();
    await Document.findByIdAndDelete(id);
  },

  async getDocumentById(id: string): Promise<IDocument | null> {
    await connectToDatabase();
    const document = await Document.findById(id);
    return document ? convertDocument(document) : null;
  },

  // Dashboard stats method
  async getDashboardStats(): Promise<any> {
    await connectToDatabase();
    const users = await User.find({});
    const projects = await Project.find({});
    const documents = await Document.find({});
    
    // Fix project status counts - check for actual values in database
    const activeProjects = projects.filter(p => 
      p.status === 'active' || p.status === 'in_progress' || !p.status
    ).length;
    const completedProjects = projects.filter(p => 
      p.status === 'completed' || p.status === 'complete'
    ).length;
    const onHoldProjects = projects.filter(p => 
      p.status === 'on_hold' || p.status === 'hold'
    ).length;
    
    // Count team members (exclude admin)
    const teamMembers = users.filter(u => u.role !== 'admin').length;
    const totalUsers = users.length;
    const totalDocuments = documents.length;

    return {
      totalProjects: projects.length,
      activeProjects,
      completedProjects,
      onHoldProjects,
      teamMembers,
      totalUsers,
      totalDocuments,
    };
  },
};