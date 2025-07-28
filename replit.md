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
- **Provider**: Replit Auth (OpenID Connect)
- **Session Storage**: PostgreSQL with connect-pg-simple
- **Authorization**: Role-based access control (admin, project_lead, developer)

**Rationale**: Replit Auth integration provides seamless authentication in the Replit environment. Role-based permissions allow for proper access control across different user types.

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

1. **Authentication Flow**: User logs in via Replit Auth → Session created in PostgreSQL → User profile stored/updated
2. **Project Management**: Admins/Project Leads create projects → Assign team members → Track progress
3. **Document Sharing**: Users upload files to projects → Files stored locally → Access controlled by authentication
4. **Role Enforcement**: Middleware checks user roles before allowing access to protected routes

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