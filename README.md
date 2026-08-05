# Secure Comply

Secure Comply is an enterprise-grade endpoint compliance and telemetry platform. It features a distributed architecture with a React-based frontend dashboard, a Node.js backend controller, and Java-based agents that execute compliance checks.

## Prerequisites

Before starting the project, ensure you have the following installed on your system:

- **Node.js** (v16 or higher recommended)
- **npm** or **yarn**
- **Java Development Kit (JDK)** (v11 or higher)
- **MongoDB** (Ensure MongoDB is running locally or provide a valid connection string)

## Architecture Overview

1. **Frontend (`/frontend`)**: A React application providing an executive dashboard, real-time infrastructure health monitoring, and a Compliance Center for executing remote checks.
2. **Backend (`/backend`)**: A Node.js Express server that exposes REST APIs for the frontend, manages the MongoDB connection, and handles Socket.IO real-time events.
3. **AdminServer & Agents**: The backend uses a `StartupManager` to automatically compile and spawn the Java `AdminServer` (TCP bridge) and `AgentMain` (endpoint client) in development mode.

## Setup Instructions

### 1. Backend Setup

The backend manages the database, API server, and automatically starts the Java sub-processes.

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install the Node dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   Create a `.env` file in the `backend/` directory (if it doesn't exist) and ensure it has your MongoDB connection URI and server port:
   ```env
   PORT=3001
   MONGODB_URI=mongodb://localhost:27017/secure_comply
   JWT_SECRET=your_jwt_secret_key
   ```
4. Start the backend:
   ```bash
   npm start
   ```
   *Note: The backend's `StartupManager` will automatically compile the Java files and launch the AdminServer and an Agent. You can monitor the Infrastructure Health page on the frontend to see the live startup sequence.*

### 2. Frontend Setup

The frontend is a React application built with Tailwind CSS and Framer Motion.

1. Open a new terminal window/tab.
2. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
3. Install the Node dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm start
   ```
5. The application will automatically open in your default browser at `http://localhost:3000`.

## Features and Navigation

- **Dashboard**: High-level executive overview of compliance metrics, active alerts, and overall system health.
- **Connected Clients**: Real-time inventory of all online and offline agents, including their OS versions and last heartbeat timestamps.
- **Compliance Center**: Select targeted clients and execute dynamic compliance modules (e.g., Antivirus, Windows Update, Port Scan) with live command lifecycle progress tracking.
- **Infrastructure Health**: View detailed backend diagnostics, service uptime, and a chronological startup sequence timeline.

## Troubleshooting

- **MongoDB Errors**: Ensure your local MongoDB instance is running before starting the backend.
- **Java Compilation Errors**: Ensure your `JAVA_HOME` environment variable is correctly set and that `javac` is accessible from your system's PATH.
- **Socket.IO 404 Errors**: Ensure the backend is fully started and the `StartupManager` has reached the `READY` state before the frontend attempts to connect. The frontend handles this gracefully by displaying an "Initializing..." status in the top bar.
