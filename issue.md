# Project Setup Instructions

This document outlines the high-level steps to initialize a new full-stack project in this directory. The goal is to set up the foundation for the application using the specified technology stack.

## Tech Stack
- **Language:** TypeScript (Fullstack)
- **Runtime / Package Manager:** Bun
- **Backend (BE):** ElysiaJS
- **Frontend (FE):** Svelte
- **Database (DB):** PostgreSQL
- **ORM:** Drizzle (for schema, migrations, and querying)

## High-Level Implementation Plan

### 1. Project Initialization
- Initialize a new Bun project in the root of this directory.
- Set up a monorepo structure (e.g., using Bun workspaces) with separate directories for the frontend and backend, or a unified structure if preferred.

### 2. Backend Setup (ElysiaJS)
- Scaffold a new ElysiaJS server.
- Configure the server to run using Bun.
- Create a basic API route (e.g., health check) to verify the server is running.

### 3. Frontend Setup (Svelte)
- Scaffold a new Svelte (or SvelteKit) application.
- Ensure the frontend uses Bun for dependency management and scripts.
- Configure the frontend to be able to communicate with the ElysiaJS backend API.

### 4. Database & ORM Setup
- Set up a PostgreSQL database and configure the connection.
- Install and configure Drizzle ORM to manage the database schema, handle migrations, and perform application-level data querying.
- Connect Drizzle to the database.

### 5. Scripts and Tooling
- Add standard development scripts to the root `package.json` to run both the frontend and backend concurrently.
- Verify that the development server starts up successfully for both ends.

Please proceed with executing these setup steps.
