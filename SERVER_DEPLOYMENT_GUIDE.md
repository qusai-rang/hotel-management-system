## LuxeStay Hotel Management System - Vercel Deployment (Option 2)

### Files Created

1. **`server/vercel.json`** - Vercel routing and function configuration
2. **`server/api/index.ts`** - Serverless function adapter that converts Express to Vercel-compatible handler

### Architecture

```
Frontend (Vercel)  -->  /api/*  -->  Vercel Serverless Function  -->  Express App  -->  MongoDB
                                                                    |
Client App (Vite)                               vercel.json routes /api/* to api/index.ts
```

### How It Works

The `api/index.ts` file is the Vercel serverless entry point that:

1. **Bootstraps the Express app** exactly as `src/app.ts` does (middleware, CORS, body parsing, routes)
2. **Adapts Vercel's request/response** objects to Express-compatible types (especially cookie parsing)
3. **Connects to MongoDB** per-invocation using dynamic import (optimizes cold starts)
4. **Proxies the request** through Express and returns the response to Vercel
5. **Falls back to SPA serving** for non-API paths (enables client-side routing)

### Environment Variables Required on Vercel

Add these to your Vercel project settings (Project > Settings > Environment Variables):

| Variable | Value | Required |
|----------|-------|----------|
| `MONGODB_URI` | Your MongoDB Atlas connection string | Yes |
| `JWT_SECRET` | Secret for JWT signing | Yes |
| `JWT_EXPIRES_IN` | Token expiration (e.g., `1d`) | Yes |
| `CORS_ORIGIN` | Your frontend Vercel URL (e.g., `https://your-app.vercel.app`) | Yes |
| `NODE_ENV` | `production` or `development` | No (defaults to `production`) |
| `PORT` | `8080` (Vercel default) | No |

### Deployment Steps

#### Step 1: Prepare the Frontend for Vercel

Your React + Vite frontend is already Vercel-ready:

- **Build command**: `npm run build` (in client directory)
- **Output directory**: `dist`
- **Framework preset**: Vite (auto-detected by Vercel)

Connect your GitHub repo to Vercel and deploy the `client/` directory.

#### Step 2: Add Backend Serverless Files

The files I've created (`server/vercel.json` and `server/api/index.ts`) need to be part of your Vercel deployment.

**Option A: Deploy server directory separately**
- Connect `server/` to a separate Vercel project (API-only)
- Or include it in the same repo with proper path configuration

**Option B: Single repo deployment**
- Keep all code in one GitHub repo
- Vercel will detect the `server/package.json` and set up Node.js automatically
- Configure the root `vercel.json` to point to the serverless function

#### Step 3: Configure Environment Variables

In your Vercel dashboard:
1. Go to **Project > Settings > Environment Variables**
2. Add all variables from `.env` (see table above)
3. For `CORS_ORIGIN`, use your frontend Vercel URL (e.g., `https://luxestay.vercel.app`)

#### Step 4: Deploy and Test

1. Push to GitHub
2. Trigger Vercel deployment
3. Once deployed, test the API health: `https://your-api.vercel.app/api/v1/health`
4. Test login/register flow
5. Verify frontend can call API endpoints

### Known Limitations & Workarounds

| Feature | Limitation | Workaround |
|---------|------------|------------|
| **Cookie-based auth** | Vercel serverless may not forward httpOnly cookies from browser | Use `Authorization: Bearer <token>` header from frontend instead of relying on cookies |
| **CSRF protection** | CSRF cookie/header flow may not work in serverless | CSRF is skipped for `/api/v1/auth/*` routes; for other routes, send `X-CSRF-Token` header from frontend |
| **Rate limiting** | Limits are per-invocation, not global | Acceptable for serverless; limits reset each function invocation |
| **MongoDB cold start** | First invocation after idle may be slow | Dynamic import of `connectDB` optimizes this; consider keeping a warm ping |
| **File serving** | `client/dist` must be built before SPA fallback works | Vercel auto-builds on deploy; ensure `dist` is in the repo or build step runs |
| **Max duration** | 30s limit on Hobby plan | Your hotel ops should be fine; upgrade plan if needed |

### Frontend-Backend Integration

Update your frontend `.env.example` or API base URL to point to the Vercel backend:

```env
# client/.env.example
VITE_API_BASE_URL=https://your-api.vercel.app/api/v1
```

In your React app, use the API URL dynamically:

```typescript
// Example API service
const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export const api = {
  login: (data) => axios.post(`${apiBase}/auth/login`, data),
  // ... other endpoints
};
```

### Testing Checklist

After deployment, verify:

- [ ] `GET /api/v1/health` returns `{ status: 'ok' }`
- [ ] `POST /api/v1/auth/login` authenticates and sets session
- [ ] `GET /api/v1/auth/me` returns user info (with auth header)
- [ ] CRUD operations for rooms, room types, guests work
- [ ] Reservation creation/check-in/out flow works
- [ ] Frontend page refreshes work (SPA fallback)
- [ ] CORS headers are present on API responses
- [ ] No 500 errors in Vercel logs

### Rollback Plan

If something goes wrong:
1. Remove the `server/api/` and `server/vercel.json` files
2. Redeploy - your original Express + MongoDB setup remains unchanged
3. The frontend can still connect to your external backend if needed

---
**Ready to deploy?** The files are set up and your project is adapted for Vercel. 

Would you like me to help with:
1. **Frontend-only Vercel deployment** (simpler, keeps backend external)?
2. **Additional configuration** for the serverless adapter (e.g., adjusting cookie handling)?
3. **Migration to Next.js** (full Vercel integration with App Router)?