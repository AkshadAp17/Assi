# replit.md

## Overview

This is a GameDev Project Manager - a full-stack web application for managing game development projects. The application provides project tracking, team collaboration, and document management capabilities for game development teams.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite for development and production builds

**Rationale**: This modern React stack provides excellent developer experience, type safety, and performance. Wouter is lightweight compared to React Router, and TanStack Query handles server state management efficiently with built-in caching and synchronization.

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Style**: REST API with Express routes
- **Session Management**: Express sessions with PostgreSQL storage
- **File Handling**: Multer for file uploads with local file storage

**Rationale**: Express provides a mature, flexible foundation for the API. TypeScript ensures type safety across the full stack. REST API design keeps things simple and predictable.

### Authentication System
- **Provider**: Email/Password authentication with bcrypt hashing
- **Session Storage**: PostgreSQL with express-session
- **Authorization**: Role-based access control (admin, project_lead, developer)
- **Default Admin**: Email: admin@gamedev.com, Password: admin123

**Rationale**: Standard email/password authentication provides universal compatibility without dependency on external providers. Bcrypt ensures secure password storage with proper salt rounds.

## Key Components

### Database Schema
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL (configured for Neon serverless)
- **Tables**:
  - `users` - User profiles with roles
  - `projects` - Project information and status
  - `project_assignments` - Many-to-many relationship between users and projects
  - `documents` - File attachments for projects
  - `sessions` - Authentication sessions (required for Replit Auth)

**Rationale**: Drizzle provides excellent TypeScript integration and type safety. PostgreSQL offers reliability and advanced features. The schema supports a typical project management workflow with proper normalization.

### Role-Based Authorization
- **Admin**: Full system access, user management
- **Project Lead**: Can create/manage projects, assign team members
- **Developer**: Can view assigned projects, upload documents

**Rationale**: Three-tier role system balances flexibility with simplicity, covering typical game development team structures.

### File Management
- **Upload Strategy**: Local file system storage in `/uploads` directory
- **Security**: Authentication required for file access
- **File Types**: Documents and images with MIME type validation
- **Size Limit**: 10MB per file

**Rationale**: Local storage keeps things simple for the initial implementation. Authentication ensures only authorized users can access files.

## Data Flow

1. **Authentication Flow**: User logs in with email/password → Credentials verified with bcrypt → Session created in PostgreSQL → User profile loaded
2. **Project Management**: Admins/Project Leads create projects → Assign team members → Track progress
3. **Document Sharing**: Users upload files to projects → Files stored locally → Access controlled by authentication
4. **Role Enforcement**: Middleware checks user roles before allowing access to protected routes

## Recent Changes (July 29, 2025)

### Migration & Role Management Updates  
✓ **Successfully completed migration** from Replit Agent to standard Replit environment
✓ **Role Management Updates**: Removed admin role from user creation options - admins can only assign project leads to projects
✓ **Project Access**: All roles can now see project lists (previously restricted to developers and above)
✓ **Session Management**: Fixed authentication session persistence issues for better user experience
✓ **Admin Controls**: Admin users can assign project leads to specific projects, but cannot create new admin users

### Complete Admin & Project Lead System Implementation
✓ **Admin Powers**: Full user management with role assignment, project lead assignment, document upload
✓ **Project Lead Powers**: Developer assignment to projects, project creation/management, document upload  
✓ **Authentication & Security**: Fixed logout redirect, session management, role-based access control
✓ **Document Management**: Upload/download for admins and project leads with 10MB limit and authentication
✓ **User Interface**: Comprehensive user management table with role dropdowns, project assignment interface
✓ **Email Integration**: Welcome emails for new user creation with Gmail SMTP

### Comprehensive Role-Based System
✓ **Admin capabilities**: Create users, edit roles, assign project leads to projects, upload documents, full system access
✓ **Project Lead capabilities**: Assign developers to projects, create/manage projects, upload documents  
✓ **Developer capabilities**: View assigned projects, download documents, basic project participation
✓ **Security**: All routes protected with proper role validation and authentication middleware

### Project Lead Functionality Implementation  
✓ Enhanced project access control for project leads
✓ Project leads can now create and manage their own projects
✓ Added ability for project leads to assign team members to their projects
✓ Project leads can update projects they lead or created
✓ Implemented password update functionality for all users
✓ Fixed logout functionality to work with both GET and POST methods

### Email Integration for User Management
✓ Added Nodemailer integration with Gmail SMTP
✓ Implemented welcome email functionality for new user creation  
✓ Configured email credentials for automated user onboarding
✓ Added proper error handling for email delivery failures

### Basic Asset & Resource Management Implementation
✓ Fixed project creation form (resolved date validation issues)
✓ Implemented complete document management system
✓ Added document upload functionality with file type validation (10MB limit)
✓ Created document viewing/downloading capabilities for all project members
✓ Added secure file storage with authentication-protected access
✓ Implemented document deletion for admins/project leads
✓ Fixed user creation form by adding password field and proper hashing

### Migration from Replit Agent to Standard Replit Environment
✓ Successfully migrated project from Replit Agent to standard Replit environment
✓ Created PostgreSQL database and configured environment variables
✓ Pushed database schema using Drizzle migrations (npm run db:push)
✓ Set up default admin user (admin@gamedev.com / admin123)
✓ Verified application runs cleanly on port 5000 with proper client/server separation
✓ All authentication and security practices maintained during migration

### Previous Changes (July 28, 2025)
✓ Replaced Replit Auth with standard email/password authentication
✓ Updated database schema with passwordHash field and proper constraints
✓ Implemented login/register pages with form validation
✓ Created authentication middleware and routes (/api/auth/login, /api/auth/register, /api/auth/user, /api/auth/logout)
✓ Updated all API routes to use new authentication system
✓ Fixed TypeScript compilation errors and application startup issues

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Client-side data fetching and caching
- **@radix-ui/**: Accessible UI component primitives
- **multer**: File upload handling
- **openid-client**: Authentication via Replit Auth

### UI Dependencies
- **tailwindcss**: Utility-first CSS framework
- **shadcn/ui**: Pre-built component library
- **lucide-react**: Icon library
- **react-hook-form**: Form handling with validation

**Rationale**: These dependencies provide a solid foundation while maintaining good bundle size and performance. Radix UI ensures accessibility, while Tailwind provides rapid styling capabilities.

## Deployment Strategy

### Development
- **Server**: Runs on Express with Vite middleware for HMR
- **Database**: Connects to provisioned PostgreSQL database
- **File Storage**: Local uploads directory

### Production Build
- **Frontend**: Vite builds static assets to `dist/public`
- **Backend**: esbuild bundles server code to `dist/index.js`
- **Static Serving**: Express serves built frontend and handles API routes
- **Process**: Single Node.js process handles both API and static file serving

**Rationale**: This deployment strategy works well for Replit's environment while being simple to understand and debug. The single-process approach reduces complexity for smaller to medium-scale applications.

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key
- `REPL_ID`: Replit identifier for auth
- `ISSUER_URL`: OIDC issuer URL (defaults to Replit)