# Meme Marketplace – Capstone Plan

## 1. Project Overview

**Title:** Meme Marketplace

**One-liner:** A full-stack meme marketplace where authenticated users can upload memes, browse a shared catalog, like memes, and perform demo “buy” actions, built with Node/Express/TypeScript on AWS and a React/Tailwind frontend.

**Goals:**
- Demonstrate a complete full-stack application using technologies from the course:
  - Express, TypeScript, AWS (Lambda/API Gateway, DynamoDB, S3, Cognito), React, Tailwind, Vite.
- Show end-to-end data flow from the browser to AWS services and back.
- Implement authentication, basic authorization, and serverless deployment.

## 2. Core Features (Implemented)

### Backend API

- **Health check**
  - `GET /health` → `{ status: "ok" }`.

- **Public meme browsing**
  - `GET /api/memes` – Returns all memes from DynamoDB.
    - On first call, seeds 5 starter memes so the UI is never empty.
  - `GET /api/memes/:id` – Returns a single meme document.

- **Protected meme actions (Cognito JWT)**
  - `POST /api/upload/url`
    - Input: `{ contentType }`.
    - Output: `{ key, uploadUrl }` for S3 pre-signed upload.
  - `POST /api/memes`
    - Input: `{ title, key, tags, price }`.
    - Uses `key` to build a public S3 URL, then stores a meme item in DynamoDB
      with `likes = 0` and `purchases = 0`.
  - `POST /api/memes/:id/like`
    - Writes `(userId, memeId)` to a per-user likes table and increments the
      meme’s `likes` counter only the first time that user likes it.
  - `POST /api/memes/:id/buy`
    - Demo-only "purchase": increments the meme’s `purchases` counter.
    - No payment gateway or real money involved.
  - `GET /api/memes/me/liked`
    - Returns all memes liked by the currently authenticated user.

### Frontend SPA

- **Home page**
  - Lists memes from `GET /api/memes` (starter memes + user uploads).
  - Shows likes and bought counts on each card.

- **Meme detail page**
  - Shows the meme image, title, price, likes, and bought count.
  - Logged-in users can Like and Buy; unauthenticated users see a prompt:
    - "You can't use this function yet, Sign In!".

- **Upload page** (protected)
  - Authenticated users can upload a meme:
    - Request S3 upload URL from backend.
    - Upload file directly to S3.
    - Create meme record via `POST /api/memes`.

- **Dashboard page** (protected)
  - Shows **only the memes that the current user has liked**.

- **Authentication (Cognito Hosted UI)**
  - Register/Login buttons open Cognito Hosted UI.
  - Cognito redirects to `/auth/callback#access_token=...` on the frontend.
  - The SPA stores the token in localStorage and uses it for protected API calls.

## 3. Non-Goals / Not Implemented

These are **not** implemented and will not be claimed as features:

- Full text search or advanced filters over memes.
- Real payment processing or purchase history per user.
- Complex admin interface or moderation workflow.
- Social features beyond likes (comments, follows, etc.).

A Prisma/SQLite schema is included for a `Purchase` model, but the deployed
`/buy` endpoint currently only increments a `purchases` counter in DynamoDB.

## 4. Tech Stack Summary

- **Backend**
  - Node.js, TypeScript, Express.
  - Serverless Framework v3 → AWS Lambda + HTTP API (API Gateway).
  - DynamoDB tables for:
    - `memes` – meme metadata.
    - `likes` – per-user likes.
  - S3 for meme image storage (pre-signed upload URLs, public-read objects).
  - Cognito User Pool + User Pool Client for auth (JWT access tokens).
  - `jwks-rsa` + `jsonwebtoken` to validate tokens in Express middleware.
  - Prisma/SQLite schema present but not used in the deployed flow.

- **Frontend**
  - React + TypeScript + Vite.
  - Tailwind CSS for styling.
  - React Router for SPA routing.
  - Custom `AuthProvider` for storing/accessing the Cognito token.
  - Deployed to Vercel, integrated with GitHub.

## 5. Data Flow (for Live Demo)

### 5.1. View memes

1. Browser calls `GET /api/memes`.
2. API (Lambda) calls DynamoDB `Scan` on the meme table.
3. Results are returned to the frontend and rendered as cards.

### 5.2. Upload a meme

1. User clicks **Upload** (must be signed in).
2. Frontend calls `POST /api/upload/url` with content type.
3. Backend generates an S3 pre-signed **PUT** URL and returns `{ key, uploadUrl }`.
4. Frontend uploads the image directly to S3 using `fetch(uploadUrl, { method: 'PUT', body: file })`.
5. Frontend calls `POST /api/memes` with `{ title, key, tags, price }`.
6. Backend saves the meme item to DynamoDB with the public S3 URL.

### 5.3. Like a meme

1. On the meme detail page, the user clicks **Like**.
2. Frontend calls `POST /api/memes/:id/like` with Bearer token.
3. Backend:
   - Writes `(userId, memeId)` into the likes table with a conditional put.
   - If this is the user’s first like for that meme, increments `likes` on the
     meme item.
4. Frontend updates the likes count in the UI.

### 5.4. Buy a meme (demo)

1. User clicks **Buy** on a meme.
2. Frontend calls `POST /api/memes/:id/buy` with Bearer token.
3. Backend increments the meme’s `purchases` counter in DynamoDB and returns a
   success message.
4. Frontend shows an alert confirming the demo purchase.

### 5.5. Dashboard (liked memes)

1. User navigates to **Dashboard** (protected route).
2. Frontend calls `GET /api/memes/me/liked` with Bearer token.
3. Backend queries the likes table by `userId`, then fetches each meme by
   `memeId` from the memes table.
4. Dashboard renders only those memes.

## 6. Deployment

- **Backend**
  - Deployed with `npm run deploy` (build + `serverless deploy`).
  - Region: `us-east-1`.
  - Live API URL: `https://94whf4566l.execute-api.us-east-1.amazonaws.com`.

- **Frontend**
  - Deployed on Vercel from this GitHub repo.
  - Live URL: `https://meme-marketplace-lac.vercel.app/`.
  - Uses `VITE_API_BASE_URL` to point at the API Gateway URL.

## 7. Live Demo Script (Suggested)

You can use this rough script for your live demo:

1. **Intro (1–2 minutes)**
   - Show the README and `capstone-plan.md`.
   - Briefly describe: Meme Marketplace, AWS stack, and main features.

2. **Frontend tour (4–6 minutes)**
   - Home page: show starter memes and the likes/bought counts.
   - Detail page: open a meme, explain Like + Buy behavior.
   - Upload page: upload a new meme and show it appear on the home page.
   - Dashboard: show liked memes list.

3. **Backend + AWS tour (4–6 minutes)**
   - Show `serverless.yml` and explain how Lambda, API Gateway, DynamoDB,
     S3, and Cognito are wired.
   - Open AWS console (DynamoDB + S3) and show a meme item and its image.
   - Show authentication middleware (`src/middleware/auth.ts`) and how the
     JWT is validated.

4. **Data flow deep dive (3–5 minutes)**
   - Walk through the code for one feature, e.g. upload or like:
     - React component → `frontend/src/api.ts` → Express route → DynamoDB/S3.

5. **Q&A (time as needed)**
   - Be ready to show specific files:
     - `src/app.ts` and `src/routes/memes.ts` (routing logic).
     - `src/db/dynamodb.ts` (data layer).
     - `frontend/src/pages/*` and `frontend/src/auth.tsx` (SPA + auth).
