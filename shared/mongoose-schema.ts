import mongoose from 'mongoose';

// User schema
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  firstName: {
    type: String,
    required: false,
  },
  lastName: {
    type: String,
    required: false,
  },
  profileImageUrl: {
    type: String,
    required: false,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'project_lead', 'developer'],
    default: 'developer',
  },
}, {
  timestamps: true,
});

// Project schema
const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  deadline: {
    type: Date,
    required: false,
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'on_hold'],
    default: 'active',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  projectLeadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
}, {
  timestamps: true,
});

// Project assignment schema
const projectAssignmentSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Document schema
const documentSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  fileSize: {
    type: Number,
    required: true,
  },
  mimeType: {
    type: String,
    required: true,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Create models
export const User = mongoose.models.User || mongoose.model('User', userSchema);
export const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);
export const ProjectAssignment = mongoose.models.ProjectAssignment || mongoose.model('ProjectAssignment', projectAssignmentSchema);
export const Document = mongoose.models.Document || mongoose.model('Document', documentSchema);

// Export types
export type IUser = {
  _id: string;
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

export type IProject = {
  _id: string;
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

export type IProjectAssignment = {
  _id: string;
  id: string;
  projectId: string;
  userId: string;
  assignedBy: string;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type IDocument = {
  _id: string;
  id: string;
  projectId: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  createdAt: Date | null;
  updatedAt: Date | null;
};