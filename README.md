# LabelAssist — TTB Label Verification Tool

AI-powered alcohol label verification for TTB agents. Extracts text from label images using Claude vision, compares against application data, and presents field-by-field results for human review. The agent makes all final decisions — AI is advisory only.

## Prerequisites

- **Node.js** 20+
- **npm** 10+
- **Anthropic API key** with access to `claude-sonnet-4-20250514`

## Local Development

### 1. Clone and install

```bash
git clone <repo-url> && cd label_assist
npm install
```

### 2. Configure environment

```bash
cp .env.example server/.env
```

Edit `server/.env`:

```
ANTHROPIC_API_KEY=sk-ant-...
PORT=3001
MAX_FILE_SIZE_MB=10
AI_TIMEOUT_MS=8000
```

### 3. Start dev servers

```bash
npm run dev
```

This starts both servers concurrently:
- **Client**: http://localhost:5173 (Vite, hot reload)
- **Server**: http://localhost:3001 (tsx watch, auto-restart)

The client proxies `/api/*` requests to the server automatically.

### 4. Verify it works

```bash
curl http://localhost:3001/api/health
# → {"status":"ok","timestamp":"..."}
```

### 5. Run tests

```bash
npm test
```

50 unit tests covering string normalization, fuzzy matching, field comparison (all 8 field types), and government warning validation.

### 6. Generate test images

```bash
cd server && npx tsx test/fixtures/generate-labels.ts
```

Produces 10 synthetic label images with various issues (ABV mismatch, missing warning, case differences, etc.) plus a `manifest.json` for batch testing.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | — | Required. Anthropic API key |
| `PORT` | `3001` | Server listen port |
| `MAX_FILE_SIZE_MB` | `10` | Max upload size per image |
| `AI_TIMEOUT_MS` | `8000` | Timeout for Claude API calls |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/verify` | Single label verification (multipart: `image` + `application` JSON) |
| `POST` | `/api/recompare` | Re-run field comparison after agent correction (JSON body) |
| `POST` | `/api/batch` | Batch verification (multipart: `images[]` + `manifest` JSON) |

---

## Deployment

### Option A: Vercel (client) + Railway (server)

This is the recommended split deployment for the prototype.

#### Server → Railway

1. Create a new Railway project and connect your GitHub repo.

2. Set the root directory to `server` in Railway's service settings.

3. Configure build and start commands:
   ```
   Build:  npm install && npm run build
   Start:  node dist/index.js
   ```

4. Add environment variables in Railway's dashboard:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   PORT=3001
   MAX_FILE_SIZE_MB=10
   AI_TIMEOUT_MS=8000
   ```

5. Railway assigns a public URL like `https://label-assist-server-production.up.railway.app`. Note this URL.

#### Client → Vercel

1. Create a new Vercel project and connect the same repo.

2. Set the root directory to `client`.

3. Add a `client/.env.production` file (or set in Vercel dashboard):
   ```
   VITE_API_URL=https://label-assist-server-production.up.railway.app
   ```

4. Update `client/src/utils/constants.js` to use the env var:
   ```js
   export const API_BASE = import.meta.env.VITE_API_URL
     ? `${import.meta.env.VITE_API_URL}/api`
     : '/api';
   ```

5. Framework preset: **Vite**. Build command: `npm run build`. Output directory: `dist`.

6. Deploy. Vercel assigns a URL like `https://label-assist.vercel.app`.

#### CORS

The server already includes `cors()` middleware, so cross-origin requests from the Vercel domain work out of the box. To restrict origins in production, update `server/src/index.ts`:

```ts
app.use(cors({ origin: 'https://label-assist.vercel.app' }));
```

### Option B: Render (full stack)

Deploy both client and server as a single Render web service. The Express server serves the API and the built React app from the same process.

#### Step 1: Prepare the codebase

Add static file serving to the server so it can serve the client build. Edit `server/src/index.ts` — add these lines **after** the API routes and **before** the error handler (`app.use(errorHandler)`):

```ts
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Serve the React client build
app.use(express.static(join(__dirname, '../../client/dist')));

// All non-API routes fall through to the SPA
app.get('*', (_req, res) => {
  res.sendFile(join(__dirname, '../../client/dist/index.html'));
});
```

The root `package.json` already has the correct build script:
```json
"build": "npm run build -w server && npm run build -w client"
```

#### Step 2: Push to GitHub

Render deploys from a Git repo. Make sure your code is pushed:

```bash
git add -A
git commit -m "prepare for Render deployment"
git push origin main
```

#### Step 3: Create the Render web service

1. Go to https://dashboard.render.com and click **New → Web Service**.

2. Connect your GitHub account if you haven't already, then select the `label_assist` repository.

3. Configure the service:

   | Setting | Value |
   |---------|-------|
   | **Name** | `label-assist` (or whatever you prefer) |
   | **Region** | Choose the region closest to your users |
   | **Branch** | `main` |
   | **Root Directory** | Leave blank (uses repo root) |
   | **Runtime** | `Node` |
   | **Build Command** | `npm install && npm run build` |
   | **Start Command** | `cd server && node dist/index.js` |
   | **Instance Type** | `Starter` ($7/mo) or `Free` (spins down after inactivity) |

   > **Note on Free tier**: The free instance spins down after 15 minutes of inactivity. The first request after spin-down takes ~30 seconds to cold-start. For a demo or prototype this is fine. For regular use, choose Starter or higher.

#### Step 4: Set environment variables

In the Render dashboard, go to your service → **Environment** → **Add Environment Variable**:

| Key | Value | Notes |
|-----|-------|-------|
| `ANTHROPIC_API_KEY` | `sk-ant-...` | Your Anthropic API key. Click "secret" to mask it. |
| `PORT` | `10000` | Render expects port 10000 by default. The app reads `process.env.PORT`. |
| `NODE_ENV` | `production` | Ensures Express runs in production mode. |
| `MAX_FILE_SIZE_MB` | `10` | Max upload size per image. |
| `AI_TIMEOUT_MS` | `8000` | Timeout for Claude API calls. |

> **Important**: Render assigns `PORT` automatically on some plans. Setting it to `10000` is safest. The server reads `process.env.PORT` so it will bind correctly.

#### Step 5: Deploy

Click **Create Web Service**. Render will:

1. Clone the repo
2. Run `npm install` (installs all workspace dependencies)
3. Run `npm run build` (compiles TypeScript server → `server/dist/`, builds React client → `client/dist/`)
4. Start with `cd server && node dist/index.js`

Watch the deploy logs in the Render dashboard. A successful deploy looks like:

```
==> Build successful
==> Starting service with 'cd server && node dist/index.js'
Server running on http://localhost:10000
```

#### Step 6: Verify the deployment

Render assigns a URL like `https://label-assist.onrender.com`. Test it:

```bash
# Health check
curl https://label-assist.onrender.com/api/health
# → {"status":"ok","timestamp":"..."}

# Open the app
open https://label-assist.onrender.com
```

The React app loads at the root URL. All `/api/*` requests are handled by Express on the same origin — no CORS configuration needed.

#### Auto-deploy

By default, Render auto-deploys on every push to `main`. You can change this in **Settings → Build & Deploy → Auto-Deploy** if you prefer manual deploys.

#### Custom domain (optional)

1. Go to your service → **Settings → Custom Domains**.
2. Add your domain (e.g., `labelassist.ttb.gov`).
3. Render provides DNS instructions (CNAME record pointing to your `.onrender.com` URL).
4. Render provisions a free TLS certificate automatically.

#### Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Build fails at `npm install` | Node version mismatch | Set **Environment → NODE_VERSION** to `20` |
| Build fails at `sharp` install | Missing native deps | Sharp ships prebuilt binaries for Linux — should work on Render. If not, add `npm install --include=optional` to build command |
| App loads but API returns 502 | `ANTHROPIC_API_KEY` not set or invalid | Check **Environment** tab, ensure key is correct |
| App loads but shows blank page | Static files not served | Verify the `express.static` and catch-all `app.get('*')` lines are in `index.ts` before the error handler |
| Cold start takes 30+ seconds | Using Free tier | Upgrade to Starter ($7/mo) for always-on |
| `POST /api/verify` times out | Large image + slow Claude response | Increase `AI_TIMEOUT_MS`, ensure image is under 10MB |

### Option C: Docker

Create a `Dockerfile` in the project root:

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY client/package*.json client/
COPY server/package*.json server/
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/server/package*.json ./server/
COPY --from=build /app/client/dist ./client/dist
COPY --from=build /app/package*.json ./
RUN npm install --omit=dev -w server
EXPOSE 3001
ENV NODE_ENV=production
CMD ["node", "server/dist/index.js"]
```

Build and run:

```bash
docker build -t label-assist .
docker run -p 3001:3001 -e ANTHROPIC_API_KEY=sk-ant-... label-assist
```

For the Docker setup, add the static file serving code from Option B to serve the client build from the server.

### Option D: Azure App Service

Relevant for TTB's existing Azure infrastructure.

1. Create an Azure App Service (Node.js 20 LTS, Linux).

2. Set application settings (environment variables) in the Azure portal:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   PORT=8080
   NODE_ENV=production
   ```

3. Configure deployment from GitHub via Azure's Deployment Center, or use the Azure CLI:
   ```bash
   az webapp up \
     --name label-assist \
     --resource-group ttb-rg \
     --runtime "NODE:20-lts" \
     --sku B1
   ```

4. Set startup command:
   ```
   npm install && npm run build && cd server && node dist/index.js
   ```

5. Use the static file serving approach from Option B so the single App Service serves both API and frontend.

**Note**: For production use within TTB, the Anthropic API calls would need to route through a FedRAMP-authorized endpoint or be replaced with an on-premise model. The prototype is approved for non-production use per the security review.

---

## Production Checklist

Before deploying to a shared environment:

- [ ] Set `ANTHROPIC_API_KEY` as a secret (not in source control)
- [ ] Restrict CORS origins to your frontend domain
- [ ] Review rate limiting settings in `server/src/index.ts` (default: 60 req/min)
- [ ] Set `NODE_ENV=production`
- [ ] Ensure HTTPS is enabled (handled by default on Railway/Vercel/Render/Azure)
- [ ] No PII or label images are persisted (by design — the prototype is stateless)

## Project Structure

```
label_assist/
├── client/                  # React + Vite + Tailwind v4
│   └── src/
│       ├── components/      # UI components (SingleVerify, BatchUpload, etc.)
│       ├── hooks/           # useVerify, useReviewSession
│       └── utils/           # API client, constants, export helpers
├── server/                  # Express + TypeScript
│   ├── src/
│   │   ├── routes/          # verify, recompare, batch, health
│   │   ├── services/        # extraction, comparison, warning, imageProcessor
│   │   ├── prompts/         # Claude system/user prompts
│   │   ├── utils/           # normalize, fuzzyMatch, errors, concurrency
│   │   └── middleware/      # errorHandler
│   └── test/
│       ├── utils/           # normalize, fuzzyMatch unit tests
│       ├── services/        # comparison, warning unit tests
│       └── fixtures/        # Test image generator + output
├── package.json             # Workspace root
└── design.md                # Full design document
```
