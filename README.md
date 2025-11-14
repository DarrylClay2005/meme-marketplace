# Meme Marketplace

This is my full-stack capstone project. I built a small meme marketplace where I can:

- Upload meme images.
- Browse a shared meme feed.
- Like memes.
- Do a demo “buy” action that increments a purchased count (no real payments).
- See a dashboard of only the memes I’ve liked.

## Live URLs

- Frontend (Vercel): https://meme-marketplace-lac.vercel.app/

## What I used

**Backend**
- Node.js, TypeScript, Express.
- Serverless Framework → AWS Lambda + HTTP API (API Gateway).
- DynamoDB (memes table + per-user likes table).
- S3 for meme image storage with pre-signed upload URLs.
- Cognito User Pool for authentication (Hosted UI + JWT access tokens).

**Frontend**
- React + TypeScript + Vite.
- Tailwind CSS.
- React Router for SPA routing.

## Main features

- **Home page**
  - Loads memes from `GET /api/memes`.
  - Shows likes and bought counts for each meme card.

- **Meme detail page**
  - Shows a large meme image, title, price, likes, and bought count.
  - If I’m signed in, I can Like and Buy.
  - If I’m not signed in and I try Like/Buy, I see: “You can't use this function yet, Sign In!”.

- **Upload page (protected)**
  - I can choose an image, set title/price/tags.
  - The frontend asks the backend for a pre-signed S3 URL, uploads the file to S3, then creates the meme record in DynamoDB.

- **Dashboard page (protected)**
  - Shows only the memes I’ve liked, using `GET /api/memes/me/liked`.

## How I run it locally

Backend (from repo root):

```bash
npm install
npx prisma generate   # only needed once; Prisma schema is optional for this demo
npm run dev           # Express on http://localhost:4000
```

Frontend (from `frontend`):

```bash
cd frontend
npm install
npm run dev           # Vite dev server on http://localhost:5173
```

For local auth/API calls I set `VITE_API_BASE_URL` to my local backend and use a Cognito user from my AWS account.

## How I deploy

Backend:

```bash
npm run build
npm run deploy
```

- Builds TypeScript and uses `serverless deploy` to push to AWS.

Frontend:

```bash
cd frontend
npm run build
```

- Vercel is connected to this GitHub repo and automatically builds/deploys the frontend.

I keep secrets (AWS credentials, Cognito client secrets, etc.) out of this repo and configure them only in my local shell or in the hosting dashboards.

## Deployment overview

### Backend (Serverless)

From the repo root, deploy:

```bash
npm run build
npm run deploy
```

- This uses `serverless.yml` to create/update:
  - Lambda function (Express handler).
  - HTTP API (API Gateway).
  - DynamoDB table, S3 bucket, and Cognito User Pool + Client.

### Frontend (Vercel)

From `frontend`:

```bash
cd frontend
npm run build
```

- This produces a static bundle in `frontend/dist`.
- The GitHub repo is connected to Vercel, which automatically builds and deploys the frontend to:
  - https://meme-marketplace-lac.vercel.app/
- Make sure `VITE_API_BASE_URL` points at your deployed API Gateway URL (`https://94whf4566l.execute-api.us-east-1.amazonaws.com`), and that the Cognito callback/redirect URIs match your deployed frontend URL.

---

## Screenshots / Demo

Add screenshots or a short demo video to this section to show the main features:

- **Home page** listing starter memes and any user-uploaded memes.
- **Meme detail** page showing the image, likes and bought counts, and Like/Buy buttons.
- **Upload** page showing the S3 pre-signed URL flow.
- **Dashboard** showing only memes you have liked.
