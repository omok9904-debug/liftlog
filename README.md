# LiftLog

LiftLog is a MERN application for user-scoped body weight tracking with JWT auth (cookie-based), MongoDB Atlas persistence, and a responsive React + TypeScript (Vite) frontend.

## Features

- **Authentication**: JWT stored in an **httpOnly cookie** (supports “keep me logged in”)
- **User-scoped data**: each user only sees their own entries
- **MongoDB Atlas** persistence via Mongoose
- **Express v5** backend (Render-compatible)
- **React + TypeScript + Vite** frontend (Netlify-compatible)
- **Theme**: light/dark
- **Responsive UI** + footer + branding

## Repo structure

- **`client/`**: React + Vite frontend
- **`server/`**: Express + MongoDB backend API

## Prerequisites

- Node.js 18+ (recommended)
- MongoDB Atlas cluster + connection string

## Local development

### 1) Backend (Express)

1. Create a local env file:
   - Copy `server/.env.example` to `server/.env`
   - Fill:
     - `MONGO_URI`
     - `JWT_SECRET`
     - (optional) `ADMIN_SECRET_KEY`, `MAX_SIGNUPS`
2. Install & run:

```bash
npm install
npm run dev
```

The API runs on `http://localhost:5050` by default.

### 2) Frontend (Vite)

1. Create a local env file:
   - Copy `client/.env.example` to `client/.env`
   - Set `VITE_API_URL=http://localhost:5050`
2. Install & run:

```bash
npm install
npm run dev
```

The UI runs on `http://localhost:5173` by default.

## Environment variables

### Backend (`server/`)

Required:
- **`MONGO_URI`**: MongoDB Atlas connection string
- **`JWT_SECRET`**: JWT signing secret

Required for production deployment:
- **`NODE_ENV`**: set to `production` on Render
- **`CORS_ORIGINS`**: comma-separated allowlist of frontend origins (include your Netlify URL)

Optional:
- **`MAX_SIGNUPS`**: limit signups (default `10`)
- **`ADMIN_SECRET_KEY`**: admin verification key

Notes:
- Backend uses a cookie named **`token`**.
- In production, cookies are set as **`httpOnly` + `secure` + `sameSite=none`** for cross-site auth (Netlify → Render).

### Frontend (`client/`)

Required:
- **`VITE_API_URL`**: base URL of the backend API

Notes:
- In production builds, the app throws if `VITE_API_URL` is missing (prevents accidentally deploying with a localhost API).

## Scripts

### Backend

- `npm run dev` (nodemon)
- `npm start` (production start)

### Frontend

- `npm run dev`
- `npm run build`
- `npm run preview`

## Deployment (Production)

This project is designed for:

- **Frontend**: Netlify
- **Backend**: Render (Node.js Web Service)
- **Database**: MongoDB Atlas

### Deploy backend to Render

1. Create a **Web Service** on Render
2. Configure:
   - **Root directory**: `server`
   - **Build command**: `npm install`
   - **Start command**: `npm start`
3. Add environment variables (Render dashboard):
   - `NODE_ENV=production`
   - `MONGO_URI=...`
   - `JWT_SECRET=...`
   - `CORS_ORIGINS=https://YOUR-NETLIFY-SITE.netlify.app`
   - (optional) `ADMIN_SECRET_KEY=...`
4. Deploy

After deploy, confirm the API is reachable:
- `GET https://YOUR-RENDER-SERVICE.onrender.com/` returns `{ "message": "LiftLog API running" }`

### Deploy frontend to Netlify

1. Create a Netlify site from this repo
2. Configure:
   - **Base directory**: `client`
   - **Build command**: `npm run build`
   - **Publish directory**: `client/dist`
3. Add environment variables (Netlify dashboard):
   - `VITE_API_URL=https://YOUR-RENDER-SERVICE.onrender.com`
4. Deploy

SPA routing is supported via `client/public/_redirects`.

### Redeploy flow (safe)

1. Deploy backend first (Render)
2. Update Netlify `VITE_API_URL` to the Render URL
3. Deploy frontend (Netlify)
4. Update Render `CORS_ORIGINS` to include the final Netlify domain(s)

## Verification checklist

- **Backend reachable**: open Render URL `/` in browser
- **CORS working**: from Netlify domain, `OPTIONS` requests return `204`
- **Login works**: login sets cookie and `/auth/me` returns user
- **Refresh persists session**: reload Netlify page, session remains logged in
- **CRUD works**: create/update/delete weight entries
- **Atlas data is user-scoped**: entries contain correct `userId`

## Troubleshooting (production)

- **CORS blocked**
  - Ensure `CORS_ORIGINS` includes your exact Netlify origin (including `https://`)
  - If you redeploy Netlify and the URL changes, update `CORS_ORIGINS`

- **Login works but refresh logs out**
  - Ensure Render has `NODE_ENV=production`
  - Ensure requests are sent with credentials (axios uses `withCredentials: true`)
  - Ensure your browser allows cross-site cookies (modern browsers can block third-party cookies in some modes)

- **Frontend built but runtime error: `VITE_API_URL is missing`**
  - Add `VITE_API_URL` in Netlify environment variables and redeploy

## Security notes

- Never commit real secrets (`MONGO_URI`, `JWT_SECRET`) to git.
- Rotate `JWT_SECRET` if you suspect it was exposed.
