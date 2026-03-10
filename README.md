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

Deploy both client and server as a single Render web service.

1. Add a `Procfile` to the project root:
   ```
   web: cd server && node dist/index.js
   ```

2. Add a root-level build script in `package.json` (already present):
   ```json
   "build": "npm run build -w server && npm run build -w client"
   ```

3. Configure the server to serve the client's static build. Add to `server/src/index.ts` before the error handler:
   ```ts
   import { fileURLToPath } from 'url';
   import { dirname, join } from 'path';

   const __dirname = dirname(fileURLToPath(import.meta.url));
   app.use(express.static(join(__dirname, '../../client/dist')));
   app.get('*', (_req, res) => {
     res.sendFile(join(__dirname, '../../client/dist/index.html'));
   });
   ```

4. On Render:
   - **Build command**: `npm install && npm run build`
   - **Start command**: `cd server && node dist/index.js`
   - Set environment variables in the Render dashboard.

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
