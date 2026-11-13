# QueueFlow Pro 🚀
### Enterprise-Grade Full-Stack Digital Queue Management System

QueueFlow Pro is a high-performance, real-time digital queue management SaaS platform built for banks, customer support centers, hospital triage counters, government institutions, and service facilities. It enables verified managers to create isolated service counters, generate sequential tokens atomically, manage dynamic waiting queues, assign customers to service counters, and evaluate operations using interactive analytics.

---

## 📑 Table of Contents

- [Overview & Architecture](#-overview--architecture)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Project Folder Structure](#-project-folder-structure)
- [Prerequisites](#-prerequisites)
- [Installation & Quick Start](#-installation--quick-start)
- [Environment Configuration](#-environment-configuration)
- [Demo Credentials & Seeding](#-demo-credentials--seeding)
- [Comprehensive REST API Reference](#-comprehensive-rest-api-reference)
- [Security Architecture](#-security-architecture)
- [Real-Time WebSocket & Fallback Polling](#-real-time-websocket--fallback-polling)
- [Testing & Quality Verification](#-testing--quality-verification)
- [Production Deployment Guide](#-production-deployment-guide)

---

## 🏛 Overview & Architecture

QueueFlow Pro follows a modern decoupled architecture:
1. **Frontend (Vite + React 18 + Tailwind CSS)**: Modular SPA with responsive desktop/mobile layouts, live token timers, Recharts analytical dashboards, and real-time state synchronization.
2. **Backend (Node.js + Express + Socket.IO)**: Secured RESTful API with atomic MongoDB counter increments, concurrency-safe token assignment, and comprehensive validation.
3. **Database (MongoDB + Mongoose)**: Indexed collections with multi-tenant data isolation per manager, atomic sequence tracking, and high-performance aggregation pipelines.

---

## ✨ Key Features

### 🔐 1. Manager Authentication & Multi-Tenant Isolation
- Secure JWT-based authentication with bcrypt password hashing (work factor 10).
- Automatic token expiration handling and session recovery.
- **Strict Data Isolation**: All queries enforce `{ manager: req.manager._id }`. Frontend manager IDs are never trusted.

### 🏢 2. Multi-Queue Service Counters
- Managers can create, rename, and delete multiple independent queues (e.g., *Billing Counter*, *Customer Support*, *Document Verification*).
- **Independent Counter Sequences**: Each queue maintains its own prefix and independent counter (`T-001`, `T-002` vs `C-001`, `C-002`).
- Sequential numbers are never reused upon completion or cancellation.

### 🎫 3. Atomic Token Generation & Live Queue Ordering
- **Atomic MongoDB Counter Increment**: Uses `$inc` on `Queue.nextNumber` to guarantee zero duplicate token numbers under concurrent requests.
- Live token table with **UP NEXT** visual highlight for position `#1`.
- **Priority Re-ordering**: Managers can move customers up or down in the queue with instantaneous database re-indexing.
- **Cancellation Protection**: Completed tokens cannot be cancelled. Cancelling a waiting customer automatically re-numbers remaining queue positions.

### ⚡ 4. Real-Time Service Counter & "Currently Serving" Banner
- **Single-Click "ASSIGN NEXT TOKEN"**: Atomically completes any currently serving customer, assigns position `#1`, records `servedAt`, and re-indexes the line.
- Sleek Linear/Stripe-styled banner displaying active token code, customer name, live duration stopwatch, and "Mark Completed" CTA.
- Dual real-time push: **Socket.IO** rooms (`queue:${queueId}` & `manager:${managerId}`) with **fallback polling interval** every 6 seconds.

### 📊 5. Advanced Analytics Dashboard (Recharts)
- **Average Wait Time KPI**: Strictly calculated as `∑(servedAt - joinedAt) / count(assigned tokens)` in minutes, measuring wait duration until service assignment.
- **Real-Time KPIs**: Total Currently Waiting, Total Served, and Total Cancelled.
- **Queue Breakdown Grouped Bar Chart**: Comparing Waiting, Served, and Cancelled volumes across all counters.
- **24-Hour Hourly Arrivals Chart**: Interactive gradient area chart displaying hourly arrival volume over a 24-hour cycle.
- **Flexible Date Range Filtering**: Today, Last 7 Days, Last 30 Days, or Custom Date Range.

---

## 🛠 Technology Stack

### Frontend
- **Framework**: React 18 (Vite 5)
- **Styling**: Tailwind CSS, PostCSS, Autoprefixer
- **Icons**: Lucide React
- **Charts**: Recharts
- **HTTP Client**: Axios (with JWT interceptors)
- **Routing**: React Router DOM v6
- **Real-Time**: Socket.IO Client

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: MongoDB (via Mongoose ODM)
- **In-Memory Fallback**: mongodb-memory-server (zero-configuration dev support)
- **Authentication**: JSON Web Tokens (jsonwebtoken) & bcryptjs
- **Real-Time**: Socket.IO
- **Security**: Helmet, CORS, Express Rate Limit

---

## 📂 Project Folder Structure

```
queueflow-pro/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx              # Navigation & active queue drawer
│   │   │   ├── Header.jsx               # Live clock, queue info, refresh
│   │   │   ├── QueueSelector.jsx        # Quick counter dropdown
│   │   │   ├── ServingBanner.jsx        # Active customer banner with timer
│   │   │   ├── AddCustomer.jsx          # Atomic token issuance card
│   │   │   ├── TokenList.jsx            # Desktop waiting table & UP NEXT
│   │   │   ├── TokenCard.jsx            # Mobile responsive queue item
│   │   │   ├── KpiCard.jsx              # Reusable analytical metric card
│   │   │   ├── CreateQueueModal.jsx     # Counter creation modal
│   │   │   ├── RenameQueueModal.jsx     # Counter rename modal
│   │   │   ├── ConfirmModal.jsx         # Action confirmation dialog
│   │   │   └── ProtectedRoute.jsx       # Auth guard
│   │   ├── context/
│   │   │   ├── AuthContext.jsx          # Manager authentication context
│   │   │   └── ToastContext.jsx         # Non-intrusive notification system
│   │   ├── hooks/
│   │   │   └── useSocket.js             # Real-time WebSocket + Polling hook
│   │   ├── pages/
│   │   │   ├── Login.jsx                # Manager login with demo autofill
│   │   │   ├── Register.jsx             # Manager registration
│   │   │   ├── Dashboard.jsx            # Core queue operations dashboard
│   │   │   └── Analytics.jsx            # Performance metrics & Recharts
│   │   ├── services/
│   │   │   └── api.js                   # Centralized Axios API client
│   │   ├── App.jsx                      # App root & route registry
│   │   ├── main.jsx                     # Vite React entrypoint
│   │   └── index.css                    # Tailwind directives & design tokens
│   ├── .env.example
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                    # MongoDB connection & Memory fallback
│   │   ├── controllers/
│   │   │   ├── authController.js        # Register, login, me
│   │   │   ├── queueController.js       # Queue CRUD & waiting stats
│   │   │   ├── tokenController.js       # Token generation & transitions
│   │   │   └── analyticsController.js   # Wait time, breakdown, hourly
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js        # JWT verification & manager derivation
│   │   │   ├── errorMiddleware.js       # Centralized error handler
│   │   │   └── validationMiddleware.js  # Request validation
│   │   ├── models/
│   │   │   ├── Manager.js               # Manager schema
│   │   │   ├── Queue.js                 # Queue schema & atomic sequence
│   │   │   └── Token.js                 # Token state & lifecycle timestamps
│   │   ├── routes/
│   │   │   ├── authRoutes.js            # Auth endpoints
│   │   │   ├── queueRoutes.js           # Queue endpoints
│   │   │   ├── tokenRoutes.js           # Token endpoints
│   │   │   └── analyticsRoutes.js       # Analytics endpoints
│   │   ├── services/
│   │   │   ├── queueService.js          # Concurrency-safe queue logic
│   │   │   └── analyticsService.js      # Aggregation & metrics computation
│   │   ├── utils/
│   │   │   └── generateToken.js         # JWT & code format utilities
│   │   ├── app.js                       # Express app configuration
│   │   ├── seed.js                      # Realistic demo dataset seeder
│   │   └── server.js                    # HTTP + Socket.IO server listener
│   ├── test-runner.js                   # Automated 25-test verification suite
│   ├── .env.example
│   └── package.json
│
├── .gitignore
├── package.json                         # Root orchestrator (concurrently)
└── README.md
```

---

## ⚡ Prerequisites

- **Node.js**: `v18.0.0` or higher (tested on Node v24)
- **npm**: `v9.0.0` or higher
- **MongoDB**: Local MongoDB instance (`mongodb://127.0.0.1:27017`) OR a free MongoDB Atlas connection string. *(Note: If no MongoDB is reachable in development mode, the server automatically starts an in-memory database fallback!)*

---

## 🚀 Installation & Quick Start

### 1. Clone & Install Dependencies
Clone the repository and install all dependencies with a single command from the root directory:

```bash
# Clone the repository
git clone <repository_url>
cd queueflow-pro

# Install all packages (root, server, and client)
npm run install:all
```

Alternatively, you can install individually:
```bash
# Root dependencies
npm install

# Backend dependencies
cd server && npm install

# Frontend dependencies
cd ../client && npm install
```

---

## ⚙️ Environment Configuration

### Backend Configuration (`server/.env`)
Copy `server/.env.example` to `server/.env`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/queueflow_pro
JWT_SECRET=queueflow_super_secret_jwt_key_2026_change_in_production
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```

### Frontend Configuration (`client/.env`)
Copy `client/.env.example` to `client/.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## 🧪 Demo Credentials & Seeding

QueueFlow Pro includes an automated seed script that populates demo counters (*Billing Counter*, *Customer Support*, *General Enquiry*, *Document Verification*), active waiting customers, a serving customer, and historical tokens for instant analytics exploration.

Run the seed script:
```bash
npm run seed
```

### Default Demo Credentials:
- **Email**: `manager@queueflow.com`
- **Password**: `Password123!`

*(The Login screen includes a 1-click **"Auto-fill Demo Info"** button for instant access).*

---

## 💻 How to Run Locally

### Start Both Backend and Frontend Concurrently
From the project root:
```bash
npm run dev
```

- **Frontend Client**: Accessible at `http://localhost:5173`
- **Backend API**: Accessible at `http://localhost:5000`
- **Health Check**: `http://localhost:5000/api/health`

### Starting Services Separately
If you prefer running services in separate terminals:
```bash
# Terminal 1 - Backend Server
cd server
npm run dev

# Terminal 2 - Frontend Client
cd client
npm run dev
```

---

## 📡 Comprehensive REST API Reference

All protected endpoints require an `Authorization: Bearer <token>` header.

### 1. Authentication Endpoints

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register manager (`name`, `email`, `password`, `confirmPassword`) |
| `POST` | `/api/auth/login` | Public | Authenticate manager & retrieve JWT |
| `GET` | `/api/auth/me` | Protected | Get authenticated manager profile |

### 2. Queue Endpoints

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/queues` | Protected | List all active queues with live waiting counts |
| `POST` | `/api/queues` | Protected | Create new queue (`name`, `prefix`) |
| `GET` | `/api/queues/:queueId` | Protected | Get single queue details & currently serving token |
| `PATCH` | `/api/queues/:queueId` | Protected | Rename queue (`name`) |
| `DELETE` | `/api/queues/:queueId` | Protected | Soft-delete queue & cancel remaining waiting tokens |

### 3. Token Endpoints

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/queues/:queueId/tokens` | Protected | List waiting tokens (sorted by position) and serving token |
| `POST` | `/api/queues/:queueId/tokens` | Protected | Issue atomic sequential token for customer (`personName`) |
| `POST` | `/api/queues/:queueId/tokens/assign-next` | Protected | Assign position `#1` to serving & auto-complete previous |
| `PATCH` | `/api/queues/:queueId/tokens/:tokenId/move` | Protected | Move token position (`direction: "up"` or `"down"`) |
| `PATCH` | `/api/queues/:queueId/tokens/:tokenId/cancel` | Protected | Cancel waiting token & re-index following positions |
| `PATCH` | `/api/queues/:queueId/tokens/:tokenId/complete` | Protected | Mark serving token as completed |

### 4. Analytics Endpoints

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/analytics` | Protected | Get KPI metrics (Avg Wait Time, Waiting, Served, Cancelled) |
| `GET` | `/api/analytics/queues` | Protected | Get grouped queue breakdown for bar chart |
| `GET` | `/api/analytics/hourly` | Protected | Get 24-hour hourly arrival distribution |

*Query Parameters for Analytics*:
- `filter`: `today`, `7days` (default), `30days`, `custom`
- `startDate`: ISO Date String (required if `filter=custom`)
- `endDate`: ISO Date String (optional if `filter=custom`)

---

## 🛡️ Security Architecture

QueueFlow Pro implements industry best practices for security:
1. **Password Hashing**: Passwords hashed using `bcryptjs` with salt work factor 10.
2. **Strict Identity Derivation**: The manager's ID is derived solely from the cryptographically verified JWT payload (`req.manager._id`).
3. **No Cross-Tenant Leaks**: All database queries enforce `{ manager: req.manager._id }`.
4. **Rate Limiting**:
   - Global rate limiting: 1,000 requests per 15 minutes.
   - Authentication rate limiting: 100 requests per 15 minutes to thwart brute-force attempts.
5. **Security Headers**: `helmet` configured for XSS, frame-guarding, and header sanitization.
6. **CORS Restrictions**: Configured to restrict origin requests with credential exchange.
7. **Input Validation**: Rigorous checks for email format, password complexity, and token strings.

---

## 🧪 Testing & Quality Verification

QueueFlow Pro includes an automated integration test suite (`server/test-runner.js`) covering 25 test cases:
- Manager registration & duplicate prevention
- Password hashing & incorrect password rejection
- Multi-manager data isolation (Manager B rejected from Manager A's queues)
- Atomic token sequencing under multiple counters
- Up and down position swapping with boundary limits
- Concurrency-safe "Assign Next" token promotion
- Automatic completion of preceding serving tokens
- Rejection of completed token cancellation
- Analytics KPI accuracy & Recharts data payloads

Run the backend verification suite:
```bash
cd server
node test-runner.js
```

---

## 🌐 Production Deployment Guide

### Frontend Deployment (Vercel / Netlify)
1. Push code to your GitHub repository.
2. Link the repository in [Vercel](https://vercel.com) or [Netlify](https://netlify.com).
3. Set **Root Directory** to `client`.
4. Set **Build Command** to `npm run build`.
5. Set **Output Directory** to `dist`.
6. Add environment variables:
   - `VITE_API_URL`: `https://your-backend.onrender.com/api`
   - `VITE_SOCKET_URL`: `https://your-backend.onrender.com`

### Backend Deployment (Render / Railway / Heroku)
1. Link the repository in [Render](https://render.com) or [Railway](https://railway.app).
2. Set **Root Directory** to `server`.
3. Set **Build Command** to `npm install`.
4. Set **Start Command** to `npm start`.
5. Add environment variables:
   - `NODE_ENV`: `production`
   - `PORT`: `5000` (or leave default for platform)
   - `MONGO_URI`: `mongodb+srv://<user>:<password>@cluster0.mongodb.net/queueflow_pro`
   - `JWT_SECRET`: `<generated_random_64_character_string>`
   - `CLIENT_URL`: `https://your-app.vercel.app`

---

## 📄 License
This project is open-source under the [MIT License](LICENSE). Built for enterprise queue orchestration.
