# Firebase Deployment Guide

This guide walks you through deploying your full-stack React + Express application to Firebase.

## Prerequisites

1. **Firebase Account** - Sign up at [firebase.google.com](https://firebase.google.com)
2. **Firebase CLI** - Install globally:
   ```bash
   npm install -g firebase-tools
   ```
3. **Google Cloud Project** - Created automatically with Firebase

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Add project"**
3. Enter your project name (e.g., `absences-tracker`)
4. Follow the setup wizard
5. Enable **Blaze plan** (required for Cloud Run backend)

## Step 2: Initialize Firebase in Your Project

```bash
firebase login
firebase init
```

When prompted, select:
- ✅ **Hosting** - for frontend deployment
- ✅ **Functions** - for backend (or use Cloud Run)
- Select your Firebase project
- **Public directory**: `dist` (Vite builds here)
- **Single-page app**: `Yes`
- **Overwrite**: `No` (when asked about existing files)

This creates:
- `.firebaserc` - Project configuration
- `firebase.json` - Hosting & functions config
- `functions/` - Backend code folder

## Step 3: Configure Firebase JSON

Edit `firebase.json` to match your app structure:

```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "/api/**",
        "function": "api"
      },
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "functions": {
    "runtime": "nodejs20",
    "source": "functions"
  }
}
```

## Step 4: Deploy Backend to Cloud Functions

1. **Copy your Express server** to `functions/`:
   ```bash
   cp server/index.ts functions/src/index.ts
   cp server/routes/* functions/src/routes/
   ```

2. **Create `functions/src/index.ts`** (or update the existing one):
   ```typescript
   import * as functions from "firebase-functions";
   import express from "express";
   import { createServer } from "../../../server/index";

   const app = express();
   const server = createServer(app);

   // Export as a Cloud Function
   exports.api = functions.https.onRequest(app);
   ```

3. **Update `functions/package.json`**:
   ```json
   {
     "dependencies": {
       "firebase-functions": "^5.0.0",
       "express": "^4.18.0"
     },
     "devDependencies": {
       "typescript": "^5.0.0"
     }
   }
   ```

4. **Install dependencies**:
   ```bash
   cd functions
   npm install
   cd ..
   ```

## Step 5: Build Your App

```bash
pnpm build
```

This creates:
- `dist/` - Frontend build
- `functions/lib/` - Compiled backend (auto-generated from TypeScript)

## Step 6: Deploy to Firebase

Deploy everything at once:

```bash
firebase deploy
```

Or deploy specific parts:

```bash
# Frontend only
firebase deploy --only hosting

# Backend only
firebase deploy --only functions

# Both
firebase deploy
```

## Step 7: Get Your URLs

After deployment, check your URLs:

```bash
firebase open hosting
```

Your app will be live at:
- **Frontend**: `https://your-project.web.app`
- **Backend API**: `https://your-project.web.app/api/`

## Step 8: Update Frontend Configuration

If your backend API URL changes, update `client/pages/Index.tsx`:

```typescript
// Replace hardcoded URL with your Firebase deployment URL
const GOOGLE_APPS_SCRIPT_URL = "https://your-firebase-project.web.app/api/your-endpoint";
```

Or use environment variables:

```typescript
const GOOGLE_APPS_SCRIPT_URL = process.env.VITE_API_URL || "https://your-project.web.app/api/";
```

Create `.env` file:
```
VITE_API_URL=https://your-project.web.app/api/
```

## Troubleshooting

### "Firebase CLI not found"
```bash
npm install -g firebase-tools
firebase login
```

### "Permission denied" during deploy
```bash
firebase login --reauth
```

### "Functions region not set"
Add to `firebase.json`:
```json
{
  "functions": {
    "region": "us-central1"
  }
}
```

### "Cloud Build failed"
1. Check error logs: `firebase functions:log`
2. Ensure `functions/package.json` has all dependencies
3. Verify TypeScript config in `functions/`

### API calls failing in production
1. Check CORS settings in your Express server
2. Verify your API URL in frontend matches deployment URL
3. Check Cloud Functions logs in Firebase Console

## Continuous Deployment (Optional)

Connect your GitHub repo for automatic deployments:

1. Go to Firebase Console → Hosting → Connect Repository
2. Select your GitHub repo
3. Set build command: `pnpm build`
4. Set public directory: `dist`
5. Deploy!

Now every push to `main` (or selected branch) deploys automatically.

## Cost Optimization

Firebase free tier includes:
- ✅ 125K/month Cloud Function invocations
- ✅ 1GB/month data transfer
- ✅ Limited CPU/memory per function

For higher usage, upgrade to **Blaze plan** (pay-as-you-go).

Monitor usage in Firebase Console → Billing.

## Next Steps

1. Set up environment variables for sensitive data
2. Enable Firebase Authentication (if needed)
3. Add Firestore database (if needed)
4. Set up monitoring/logging
5. Configure custom domain (optional)

---

For more help: https://firebase.google.com/docs/hosting
