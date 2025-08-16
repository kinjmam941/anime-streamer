# AniStream - Anime Streaming Platform

## Overview

AniStream is a modern anime streaming platform built with React, Express, and PostgreSQL. The application allows users to search for anime, browse episodes, and watch videos through an integrated video player. It features a clean, responsive interface with dark theme support and comprehensive anime metadata management.

The platform is designed as a full-stack web application with a React frontend, Express.js backend, and PostgreSQL database for data persistence. It includes real-time search capabilities, episode management, and video streaming functionality.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for type safety and modern development
- **Vite** as the build tool for fast development and optimized production builds
- **Wouter** for client-side routing instead of React Router for a lighter footprint
- **TanStack Query** for server state management, caching, and data synchronization
- **Tailwind CSS** with custom CSS variables for consistent theming and responsive design
- **shadcn/ui** component library built on Radix UI primitives for accessible, customizable components

### Backend Architecture
- **Express.js** server with TypeScript for API endpoints and middleware
- **RESTful API design** with structured routes for anime, episodes, and video sources
- **CORS enabled** for cross-origin requests with credentials support
- **Error handling middleware** with proper HTTP status codes and JSON responses
- **Request logging** with response time tracking for API monitoring

### Database Architecture
- **PostgreSQL** as the primary database with Drizzle ORM for type-safe database operations
- **Neon Database** integration for serverless PostgreSQL hosting
- **Three main entities**: Anime (title, metadata), Episodes (episode details), and VideoSources (streaming links)
- **Schema-driven approach** with Zod validation for runtime type checking
- **Database migrations** managed through Drizzle Kit

### Data Models
- **Anime**: Stores anime metadata including title, episode count, year, status, genres, description, and poster
- **Episodes**: Contains episode-specific data like episode number, title, duration, description, and thumbnail
- **VideoSources**: Manages streaming sources with quality options, URLs, providers, and referer information

### Development Workflow
- **Development mode**: Vite dev server with HMR for frontend, tsx for backend with hot reloading
- **Production build**: Vite builds frontend assets, esbuild bundles backend for Node.js deployment
- **Type checking**: Shared TypeScript configuration across frontend, backend, and shared modules
- **Path aliases**: Configured for clean imports (@/ for client, @shared/ for shared utilities)

### UI/UX Design
- **Dark theme optimized** with carefully chosen color variables for anime content
- **Responsive design** with mobile-first approach using Tailwind breakpoints
- **Component-based architecture** with reusable UI components (AnimeCard, EpisodeCard, VideoPlayer)
- **Search functionality** with real-time suggestions and keyboard navigation
- **Video player** with quality selection and episode navigation controls

## External Dependencies

### Core Framework Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL driver for Neon database connectivity
- **drizzle-orm**: Type-safe ORM for database operations with PostgreSQL dialect
- **drizzle-zod**: Integration between Drizzle schemas and Zod validation

### UI Component Libraries
- **@radix-ui/react-***: Comprehensive set of unstyled, accessible React components (dialogs, menus, form controls)
- **@tanstack/react-query**: Powerful data synchronization library for React applications
- **tailwindcss**: Utility-first CSS framework with extensive configuration

### Development Tools
- **vite**: Fast build tool with hot module replacement and optimized production builds
- **typescript**: Static type checking for JavaScript with strict configuration
- **esbuild**: Fast JavaScript bundler for production backend builds

### Utility Libraries
- **clsx**: Utility for constructing className strings conditionally
- **class-variance-authority**: Type-safe variant API for component styling
- **date-fns**: Modern JavaScript date utility library
- **wouter**: Minimalist routing library for React applications

### Media and Interaction
- **embla-carousel-react**: Touch-friendly carousel component for image galleries
- **lucide-react**: Beautiful and customizable SVG icon library
- **react-hook-form**: Performant forms library with minimal re-renders

The application integrates with external anime APIs (specifically AllAnime) for fetching anime data and streaming sources. The architecture supports caching mechanisms to reduce API calls and improve performance.