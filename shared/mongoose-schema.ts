import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// User schema
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  firstName: {
    type: String,
    trim: true,
    default: null
  },
  lastName: {
    type: String,
    trim: true,
    default: null
  },
  profileImageUrl: {
    type: String,
    default: null
  },
  passwordHash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'project_lead', 'developer'],
    default: 'developer'
  }
}, {
  timestamps: true
});

// Project schema
const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxlength: 255
  },
  description: {
    type: String,
    default: null
  },
  deadline: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'on_hold'],
    default: 'active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  projectLeadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Project assignment schema
const projectAssignmentSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Ensure unique project-user assignments
projectAssignmentSchema.index({ projectId: 1, userId: 1 }, { unique: true });

// Document schema
const documentSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  fileName: {
    type: String,
    required: true,
    maxlength: 255
  },
  originalName: {
    type: String,
    required: true,
    maxlength: 255
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true,
    maxlength: 100
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Session schema for express-session
const sessionSchema = new mongoose.Schema({
  _id: String,
  expires: Date,
  session: mongoose.Schema.Types.Mixed
});

// Create models
export const User = mongoose.models.User || mongoose.model('User', userSchema);
export const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);
export const ProjectAssignment = mongoose.models.ProjectAssignment || mongoose.model('ProjectAssignment', projectAssignmentSchema);
export const Document = mongoose.models.Document || mongoose.model('Document', documentSchema);
export const Session = mongoose.models.Session || mongoose.model('Session', sessionSchema);

// Note: User methods are handled in the storage layer

// Types for MongoDB models
export type UserDocument = mongoose.Document & {
  _id: mongoose.Types.ObjectId;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  passwordHash: string;
  role: 'admin' | 'project_lead' | 'developer';
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
};

export type ProjectDocument = mongoose.Document & {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  deadline?: Date;
  status: 'active' | 'completed' | 'on_hold';
  createdBy: mongoose.Types.ObjectId;
  projectLeadId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export type ProjectAssignmentDocument = mongoose.Document & {
  _id: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  assignedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export type DocumentDocument = mongoose.Document & {
  _id: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};