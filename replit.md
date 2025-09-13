# EMDR42 Therapy Platform

## Overview

EMDR42 is a comprehensive online platform for EMDR (Eye Movement Desensitization and Reprocessing) therapy, designed to facilitate PTSD treatment through secure video consultations and interactive therapeutic sessions. The platform serves three distinct user roles: patients seeking therapy, certified therapists providing treatment, and administrators managing the platform. Built with modern web technologies, it features real-time video conferencing, interactive bilateral stimulation tools, progress tracking, and comprehensive user management systems.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side application is built with **React 18** using **TypeScript** for type safety and **Vite** as the build tool. The application follows a component-based architecture with:

- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React Query (TanStack Query) for server state management and built-in React hooks for local state
- **UI Framework**: Radix UI primitives with custom Tailwind CSS styling following the shadcn/ui design system
- **Styling**: Tailwind CSS with a custom design system inspired by Cal.com, featuring clean, professional medical aesthetics
- **Layout Structure**: Role-based dashboards (Patient, Therapist, Admin) with shared components and consistent navigation

### Backend Architecture
The server-side follows a **Node.js/Express** architecture with:

- **Runtime**: Node.js with TypeScript using TSX for development
- **Web Framework**: Express.js with middleware for JSON parsing, CORS, and request logging
- **API Design**: RESTful API structure with `/api` prefix for all backend routes
- **Error Handling**: Centralized error handling middleware with proper HTTP status codes
- **Session Management**: Built-in session handling for user authentication

### Data Storage
The application uses **PostgreSQL** as the primary database with:

- **ORM**: Drizzle ORM for type-safe database queries and schema management
- **Database Provider**: Neon serverless PostgreSQL for cloud hosting
- **Schema Management**: Drizzle Kit for migrations and schema synchronization
- **Connection Pooling**: WebSocket-based connection pooling for serverless environments
- **Data Models**: User management with role-based access control (patients, therapists, admins)

### Authentication & Authorization
- **Role-based Access Control**: Three distinct user roles with different permissions and dashboard views
- **Session Management**: Server-side session handling with secure cookie storage
- **Data Protection**: Compliance with medical privacy standards and GDPR requirements

### Real-time Features
The platform includes real-time capabilities for:

- **Video Conferencing**: WebRTC-based video/audio sessions between therapists and patients
- **Interactive EMDR Tools**: Real-time bilateral stimulation with customizable visual and audio cues
- **Session Controls**: Live session management with therapist-controlled stimulation parameters

### UI/UX Design System
- **Design Philosophy**: Cal.com-inspired clean, professional medical interface
- **Color Palette**: Primary blue (220 85% 45%) for trust and professionalism, with green accents for positive actions
- **Typography**: Inter font family for consistent, readable text across all components
- **Component Library**: Comprehensive set of reusable UI components built on Radix UI primitives
- **Responsive Design**: Mobile-first approach with tablet and desktop optimizations
- **Accessibility**: WCAG-compliant components with proper ARIA labels and keyboard navigation

### Module Structure
- **Client Directory**: Contains all frontend React components, pages, and assets
- **Server Directory**: Houses Express.js backend logic, routes, and database configuration
- **Shared Directory**: Common TypeScript types and schemas used by both client and server
- **Component Organization**: Logical separation between UI components, page components, and business logic

## External Dependencies

### Core Framework Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL database connection and management
- **drizzle-orm**: Type-safe ORM for database operations and query building
- **@tanstack/react-query**: Server state management and caching for API interactions
- **express**: Node.js web application framework for REST API development

### UI Component Libraries
- **@radix-ui/react-***: Comprehensive set of accessible UI primitives including dialogs, dropdowns, forms, and navigation components
- **tailwindcss**: Utility-first CSS framework for rapid UI development
- **class-variance-authority**: Type-safe component variant management
- **lucide-react**: Modern icon library with consistent styling

### Development Tools
- **vite**: Fast build tool and development server with HMR support
- **typescript**: Static type checking for both frontend and backend code
- **wouter**: Lightweight routing library for React applications

### Database & Validation
- **drizzle-zod**: Integration between Drizzle ORM and Zod for schema validation
- **connect-pg-simple**: PostgreSQL session store for Express.js session management

### Authentication & Security
- **ws**: WebSocket library for real-time database connections in serverless environments
- Built-in Express session management for user authentication and authorization

### Utility Libraries
- **date-fns**: Modern date utility library for session scheduling and progress tracking
- **clsx** & **tailwind-merge**: Utility functions for conditional CSS class composition
- **cmdk**: Command palette component for enhanced user navigation