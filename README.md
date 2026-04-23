# 🔧 PIET Research Incentive Claim System — Backend

REST API server powering the **PIET Research Incentive Claim System**. Built with Express.js and MongoDB, it handles authentication, claim management, admin operations, file uploads, email notifications, and data backups.

> **Production:** Hosted on Heroku

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Database Models](#database-models)
- [Middleware](#middleware)
- [Docker](#docker)
- [Deployment](#deployment)
- [Related Repositories](#related-repositories)
- [License](#license)

---

## Overview

This backend serves as the API layer for the PIET Research Incentive Claim System. It provides endpoints for:

- Faculty registration, login, and password reset
- Research incentive claim creation with document uploads
- Admin authentication and claim review workflows
- Department-wise analytics and statistics
- In-app notification system
- System backup and emergency access

---

## Tech Stack

| Layer              | Technology                                                       |
| ------------------ | ---------------------------------------------------------------- |
| **Runtime**        | [Node.js](https://nodejs.org/) (v20)                             |
| **Framework**      | [Express.js](https://expressjs.com/) v4                          |
| **Database**       | [MongoDB Atlas](https://www.mongodb.com/atlas) via [Mongoose](https://mongoosejs.com/) v8 |
| **Authentication** | [JWT](https://jwt.io/) via `jsonwebtoken` + cookie-based sessions |
| **File Uploads**   | [Multer](https://github.com/expressjs/multer) → [Cloudinary](https://cloudinary.com/) |
| **Email**          | [Google Gmail API](https://developers.google.com/gmail/api) via `googleapis` |
| **Password Hashing** | [bcrypt](https://github.com/kelektiv/node.bcrypt.js)          |
| **Containerization** | [Docker](https://www.docker.com/) (Alpine-based image)        |

---

## Project Structure

```
piet-p1-backend/
├── src/
│   ├── index.js                # Server entry point
│   ├── app.js                  # Express app setup, CORS, routes
│   ├── controllers/
│   │   ├── auth.controller.js       # User registration, login, logout, password reset
│   │   ├── claim.controller.js      # CRUD operations for claims
│   │   ├── admin.controller.js      # Admin login, claim management, user management, stats
│   │   ├── backup.controller.js     # System backup generation, download, emergency login
│   │   ├── user.controller.js       # User profile operations
│   │   └── notification.controller.js # Notification CRUD
│   ├── models/
│   │   ├── user.model.js            # User schema (faculty profile, academic IDs, bank details)
│   │   ├── claim.model.js           # Claim schema (publication details, status, documents)
│   │   ├── admin.model.js           # Admin schema (email, password)
│   │   └── notification.model.js    # Notification schema (user, message, read status)
│   ├── routes/
│   │   ├── auth.routes.js           # /api/auth/*
│   │   ├── claim.routes.js          # /api/form/*
│   │   ├── user.routes.js           # /api/profile/*
│   │   ├── admin.routes.js          # /api/admin/*
│   │   └── notification.routes.js   # /api/notifications/*
│   ├── middleware/
│   │   ├── authMiddleware.js        # JWT verification for faculty routes
│   │   ├── adminMiddleware.js       # JWT verification for admin routes
│   │   └── multer.js                # Multer file upload configuration
│   ├── db/
│   │   └── connectDB.js             # MongoDB connection handler
│   └── utils/
│       ├── asyncHandler.js          # Async error wrapper for Express routes
│       ├── apiError.js              # Custom API error class
│       ├── apiResponse.js           # Standardized API response class
│       ├── cloudinary.js            # Cloudinary SDK configuration
│       ├── sendMail.js              # Gmail API email sender
│       └── accountCreationEmail.js  # Registration email template
├── Dockerfile                  # Docker container configuration
├── .gitignore
└── package.json
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x
- **MongoDB** instance (local or [Atlas](https://www.mongodb.com/atlas))
- **Cloudinary** account for file uploads
- **Google Cloud** project with Gmail API enabled (for email notifications)

### Installation

```bash
# Clone the repository
git clone https://github.com/raghavkapoor-prog/piet-p1-backend.git
cd piet-p1-backend

# Install dependencies
npm install
```

### Running Locally

```bash
# Development (with auto-reload via nodemon)
npm run dev

# Production
npm start
```

The server will start on `http://localhost:4000` (configurable via `PORT` env variable).

---

## Environment Variables

Create a `.env` file in the project root:

```env
# Server
PORT=4000

# MongoDB
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net
DB_NAME=ResearchIncentives

# JWT Authentication
ACCESS_TOKEN_SECRET=<your-access-token-secret>
ACCESS_TOKEN_EXPIRY=10d

# Password Reset
RESET_PASSWORD_SECRET=<your-reset-secret>
RESET_PASSWORD_EXPIRY=300
BASE_URL=https://your-frontend-domain.com/c03ef05e65659d2a75944d3d72eb71f4f94c6f9b

# Gmail API (for sending emails)
EMAIL_CLIENT_ID=<google-oauth-client-id>
EMAIL_CLIENT_SECRET=<google-oauth-client-secret>
EMAIL_REFRESH_TOKEN=<google-oauth-refresh-token>
EMAIL_SENDER=noreply@example.com

# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>

# Admin / Emergency Access
JWT_SECRET=<admin-jwt-secret>
EMERGENCY_TOTP_SECRET=<totp-secret>
```

---

## API Reference

### Health Check

| Method | Endpoint       | Description          |
| ------ | -------------- | -------------------- |
| `GET`  | `/`            | Server status + MongoDB ping |
| `GET`  | `/**/status`   | Health check (any path ending in `/status`) |

### Auth — `/api/auth`

| Method | Endpoint         | Description                     | Auth  |
| ------ | ---------------- | ------------------------------- | ----- |
| `POST` | `/login`         | Faculty login                   | No    |
| `POST` | `/register`      | Faculty registration            | No    |
| `POST` | `/logout`        | Logout (clear cookie)           | No    |
| `GET`  | `/loggedin`      | Verify session / logged-in user | No    |
| `POST` | `/reset`         | Request password reset email    | No    |
| `POST` | `/reset/:token`  | Reset password with token       | No    |

### Claims — `/api/form`

| Method | Endpoint       | Description                       | Auth     |
| ------ | -------------- | --------------------------------- | -------- |
| `POST` | `/claim`       | Submit a new claim (with file uploads) | Faculty  |
| `GET`  | `/myClaims`    | Get logged-in user's claims       | Faculty  |
| `GET`  | `/claim/:id`   | Get a specific claim by ID        | Faculty  |
| `POST` | `/claim/:id`   | Delete a claim                    | Faculty  |

### Profile — `/api/profile`

| Method | Endpoint | Description          | Auth    |
| ------ | -------- | -------------------- | ------- |
| Routes defined in `user.routes.js` | | Profile CRUD operations | Faculty |

### Admin — `/api/admin`

| Method | Endpoint                      | Description                          | Auth  |
| ------ | ----------------------------- | ------------------------------------ | ----- |
| `POST` | `/login`                      | Admin login                          | No    |
| `POST` | `/logout`                     | Admin logout                         | No    |
| `POST` | `/register`                   | Register new admin                   | No    |
| `GET`  | `/loggedin`                   | Verify admin session                 | Admin |
| `GET`  | `/claims`                     | Get all claims                       | Admin |
| `GET`  | `/deptClaims`                 | Get claims filtered by department    | Admin |
| `GET`  | `/customClaims`               | Get claims with custom filters       | Admin |
| `GET`  | `/users`                      | Get all registered users             | Admin |
| `GET`  | `/users/:userId/claims`       | Get claims for a specific user       | Admin |
| `GET`  | `/departmentStats`            | Department-wise analytics            | Admin |
| `POST` | `/update`                     | Update claim status                  | Admin |
| `POST` | `/delete`                     | Delete a claim                       | Admin |
| `GET`  | `/backup`                     | Generate system backup               | Admin |
| `GET`  | `/server-backups`             | List available server backups        | Admin |
| `GET`  | `/server-backups/:filename`   | Download a specific backup           | Admin |
| `POST` | `/emergency-login`            | Emergency TOTP-based login           | No    |

### Notifications — `/api/notifications`

| Method | Endpoint | Description              | Auth    |
| ------ | -------- | ------------------------ | ------- |
| Routes defined in `notification.routes.js` | | Notification CRUD | Faculty |

---

## Database Models

### User
Faculty profile including personal info, department, designation, academic identifiers (Scopus, ORCID, Vidhwan, Google Scholar), bank details, profile image, and associated claims.

**Departments:** `CSE`, `AIML`, `AIDS`, `CYS`, `IT`, `ME`, `TEXTILE`, `CIVIL`, `PHARMACY`, `DCA`, `ASH`, `BBA`, `MBA`, `ECE`

### Claim
Research publication details — title, authors, category, publication date, venue, web link, calculated incentive amount, status (`Submitted` / `Processed`), and supporting document URLs.

### Admin
Administrator credentials (email + password) with timestamp tracking.

### Notification
Per-user notification messages linked to specific claims with read/unread status.

---

## Middleware

| Middleware          | Purpose                                         |
| ------------------- | ----------------------------------------------- |
| `authMiddleware.js`  | Verifies JWT from cookies for faculty routes    |
| `adminMiddleware.js` | Verifies JWT from cookies for admin routes      |
| `multer.js`          | Handles multipart file uploads (paper front page, claim proof) |

---

## Docker

Build and run the application in a container:

```bash
# Build the image
docker build -t piet-p1-backend .

# Run the container
docker run -p 4000:5000 --env-file .env piet-p1-backend
```

The Dockerfile uses `node:20-alpine` for a minimal image footprint.

---

## Deployment

The backend is currently deployed on **Heroku**. It can also be deployed to:

- **Railway** — Previously used (`piet-p1-backend-production.up.railway.app`)
- **Any Node.js PaaS** — Render, Fly.io, etc.
- **Docker** — Self-hosted with the included Dockerfile

### CORS Origins

Allowed origins are configured in `src/app.js`. Update the `corsOptions.origin` array when deploying to new domains.

---

## Related Repositories

| Repository | Description |
| --- | --- |
| [piet-p1](https://github.com/raghavkapoor-prog/piet-p1) | React + Vite frontend application |

---

## License

This project is developed for **Panipat Institute of Engineering and Technology (PIET)**.
