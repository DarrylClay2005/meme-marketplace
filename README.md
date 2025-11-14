# Meme Marketplace

Full-stack capstone project: a simple meme marketplace where authenticated users can upload memes, browse/search the library, like memes, and perform basic "buy" actions.

This repo contains:
- **Backend**: Node.js, TypeScript, Express, Serverless Framework, AWS (S3, DynamoDB, Cognito), Prisma (SQLite for a small purchase-history model).
- **Frontend**: React, TypeScript, Tailwind CSS single-page application.

Region: `us-east-1`.

> Note: AWS credentials are configured in the underlying system; deploy steps will assume an authenticated AWS CLI in that environment.

---

## Architecture overview

**Backend (serverless API)**
- Express app wrapped with `serverless-http` and deployed to **AWS Lambda + API Gateway** via Serverless Framework.
- **DynamoDB** table stores meme documents (id, title, imageUrl, tags, likes, price, uploadedBy, createdAt).
- **S3** bucket stores meme image files, uploaded via **pre-signed URLs** exposed by the API.
- **Cognito User Pool** issues JWT access tokens; the API verifies them with `jwks-rsa` and `jsonwebtoken`.
- **Prisma + SQLite** store a simple `Purchase` table so you can demonstrate relational data and Prisma queries.

**Frontend (React SPA)**
- Vite + React + TypeScript + Tailwind CSS single-page app.
- Uses a small `api.ts` client to call the backend endpoints.
- Uses localStorage to hold the Cognito `access_token` and attaches it as `Authorization: Bearer <token>` to protected requests.

---

## API routes (backend)

Base URL examples:
- **Local dev** (Express): `http://localhost:4000`
- **Deployed** (API Gateway): `https://<api-id>.execute-api.us-east-1.amazonaws.com/dev`

**Public**
- `GET /health` – Health check; returns `{ "status": "ok" }`.
- `GET /api/memes` – List all memes from DynamoDB.
- `GET /api/memes/:id` – Get a single meme document by id.

**Protected (requires `Authorization: Bearer <access_token>` from Cognito)**
- `POST /api/upload/url`
  - Body: `{ "contentType": "image/png" }`.
  - Returns: `{ "key": "<s3-key>", "uploadUrl": "https://..." }`.
  - Client uploads the image directly to S3 using the `uploadUrl`.
- `POST /api/memes`
  - Body: `{ "title": string, "key": string, "tags": string[], "price": number }`.
  - Uses `key` to build a public S3 image URL, then writes the meme to DynamoDB.
- `POST /api/memes/:id/like`
  - Increments the meme's `likes` counter using a DynamoDB update expression.
- `POST /api/memes/:id/buy`
  - Creates a `Purchase` record in the Prisma/SQLite database linking the current user to the meme.

---

## Local development

### Backend (Express + Serverless)

From the repo root:

```bash
npm install
npx prisma generate
npm run dev
```

- This starts the Express app on `http://localhost:4000` using `src/local-server.ts`.
- For routes that touch DynamoDB/S3/Cognito, you need valid AWS credentials and environment variables available (see **Environment variables** below).

### Frontend (React + Vite + Tailwind)

From the `frontend` folder:

```bash
cd frontend
npm install
npm run dev
```

- The app runs on `http://localhost:5173`.
- By default it calls the backend at `VITE_API_BASE_URL` (configured in `.env.local`).

---

## Environment variables

### Backend

Most variables are provided automatically by Serverless in AWS. For local development, set them in your shell before running `npm run dev`:

- `REGION` – AWS region (default: `us-east-1`).
- `MEME_TABLE_NAME` – DynamoDB table name for memes (should match `serverless.yml`).
- `MEME_BUCKET_NAME` – S3 bucket for meme images (should match `serverless.yml`).
- `COGNITO_USER_POOL_ID` – ID of the Cognito User Pool.
- `COGNITO_CLIENT_ID` – ID of the Cognito User Pool Client.

### Frontend (Vite)

Create `frontend/.env.local` and set:

```bash
VITE_API_BASE_URL=http://localhost:4000
VITE_COGNITO_REGION=us-east-1
VITE_COGNITO_CLIENT_ID=<your-cognito-client-id>
VITE_COGNITO_DOMAIN=<your-cognito-domain-prefix>
VITE_COGNITO_REDIRECT_URI=http://localhost:5173/auth/callback
```

- `VITE_COGNITO_DOMAIN` is the domain prefix you configure for the Cognito Hosted UI.

---

## Testing

### Backend

```bash
npm test
```

- Runs Vitest tests such as:
  - `src/app.test.ts` – verifies `/health` endpoint.
  - `src/memes.schema.test.ts` – verifies meme creation validation schema.

### Frontend

```bash
cd frontend
npm test
```

- Runs Vitest with a simple smoke test (`src/App.test.tsx`). You can extend this with React Testing Library if desired.

---

## Deployment overview

### Backend (Serverless)

1. Ensure your AWS CLI is authenticated and using `us-east-1`.
2. From the repo root, deploy:

```bash
npm run build
npm run deploy
```

- This uses `serverless.yml` to create/update:
  - Lambda function (Express handler).
  - HTTP API (API Gateway).
  - DynamoDB table, S3 bucket, and Cognito User Pool + Client.

### Frontend (S3/CloudFront, Vercel, or Netlify)

From `frontend`:

```bash
cd frontend
npm run build
```

- This produces a static bundle in `frontend/dist`.
- Options:
  - Upload `dist` to an S3 bucket and put CloudFront in front.
  - Or deploy `dist` with Vercel/Netlify.
- Make sure `VITE_API_BASE_URL` points at your deployed API Gateway URL, and that the Cognito callback/redirect URIs match your deployed frontend URL.

---

## How to demo / present the app

You can use these steps when you explain the project:

1. **High-level overview**
   - Explain that this is a full-stack meme marketplace.
   - Backend: serverless Express API on AWS (Lambda + API Gateway + DynamoDB + S3 + Cognito + Prisma/SQLite).
   - Frontend: React + Tailwind SPA that talks to the API and uses Cognito login.

2. **Authentication flow (Cognito)**
   - Show the login button in the top-right ("Login with Cognito").
   - Click it to open the Cognito Hosted UI, sign in (or sign up), and let it redirect back to `/auth/callback`.
   - Explain that the frontend reads the `access_token` from the URL hash and stores it in localStorage.
   - Mention that all protected API calls send `Authorization: Bearer <access_token>`.

3. **Browsing memes**
   - On the Home page, show the list of memes loaded from `GET /api/memes` (DynamoDB).
   - Click a meme to navigate to `/memes/:id` and show details (image, price, likes, tags).

4. **Uploading a meme**
   - Go to the Upload page (protected route).
   - Pick an image file, enter title/price/tags.
   - Walk through the flow:
     - Frontend calls `POST /api/upload/url` to get a pre-signed S3 URL and key.
     - Frontend uploads the actual image file directly to S3 with a `PUT` request.
     - Frontend calls `POST /api/memes` with the S3 key, and the backend writes the meme document into DynamoDB.
   - Return to Home and show the new meme in the list.

5. **Likes and purchases**
   - On the meme detail page, click **Like**.
   - Explain that this calls `POST /api/memes/:id/like` which runs a DynamoDB update expression to increment the `likes` counter.
   - Mention that `POST /api/memes/:id/buy` records a `Purchase` row via Prisma/SQLite, demonstrating relational data usage.

6. **Testing and quality**
   - Mention that you have automated tests:
     - Backend Vitest tests for the health endpoint and meme validation schema.
     - Frontend Vitest smoke test (and it can be extended later).
   - Show the commands `npm test` and `cd frontend && npm test`.
