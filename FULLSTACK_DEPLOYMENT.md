# FULLSTACK DEPLOYMENT GUIDE

## Architecture

This is now a **fullstack repository** — the backend Flask app serves both the API and the frontend static files.

```
duct-ai-backend/
├── app.py                 # Flask backend (API endpoints)
├── application.py         # WSGI entry point (for gunicorn/Railway)
├── requirements.txt       # Python dependencies
├── static/                # ← Frontend files go here
│   ├── index.html         # Main SPA entry point
│   ├── css/
│   │   └── *.css
│   ├── js/
│   │   └── *.js
│   ├── images/
│   └── assets/
└── [other backend files]
```

## How It Works

### Development
Flask serves static files from the `static/` directory:
- `http://localhost:5000/static/css/style.css` → serves `static/css/style.css`
- `http://localhost:5000/static/js/app.js` → serves `static/js/app.js`
- `http://localhost:5000/` → serves `interior.html` (embedded widget)
- `http://localhost:5000/api/*` → API endpoints (unchanged)

### Production (Railway)
1. **Build phase:**
   ```bash
   python -m pip install -r requirements.txt
   ```
   
2. **Start command:**
   ```bash
   gunicorn -w 1 -b 0.0.0.0:$PORT application:app
   ```
   
3. **Deployment:**
   - Flask's static folder is configured to serve from `static/`
   - SPA fallback ensures unknown routes return `index.html` for client-side routing
   - API endpoints are protected by CORS and rate limiting as before

## Updating Frontend

### Option A: Copy from Frontend Build (Recommended)

If you have a separate frontend repository (React, Vue, Next.js, etc):

1. **Build the frontend** in your frontend repo:
   ```bash
   npm run build
   ```

2. **Copy build output to backend**:
   ```bash
   # From your frontend repo
   cp -r dist/* ../duct-ai-backend/static/
   # or for React
   cp -r build/* ../duct-ai-backend/static/
   ```

3. **Commit and push**:
   ```bash
   cd ../duct-ai-backend
   git add static/
   git commit -m "Update frontend UI"
   git push
   ```

4. **Railway redeploys automatically** ✓

### Option B: Create Frontend Here

If you want to develop the frontend directly in this repo:

1. **Create a new React/Vue/SPA project in the static folder**:
   ```bash
   # Example: Create React app
   npx create-react-app static
   # or
   npm create vite@latest static -- --template react
   ```

2. **Build and deploy**:
   ```bash
   cd static
   npm run build
   cd ..
   git add static/
   git commit -m "Update frontend"
   git push
   ```

## File Structure for Frontend

At minimum, your frontend needs:
- `static/index.html` — Main entry point
- `static/css/*` — Stylesheets
- `static/js/*` — JavaScript bundles
- `static/images/*` — Images and assets

Example structure (React):
```
static/
├── index.html              # Entry HTML (typically built by bundler)
├── css/
│   └── main.*.css          # CSS bundles
├── js/
│   └── main.*.js           # JS bundles (your app code)
└── images/
    └── [images]
```

## SPA Routing

The app has a **catch-all route** that handles SPA routing:

```python
@app.route("/<path:path>")
def serve_spa(path):
    # If file exists in static/, serve it
    if os.path.isfile(os.path.join("static", path)):
        return send_from_directory("static", path)
    # Otherwise, serve index.html for client-side routing
    return send_from_directory("static", "index.html")
```

This means:
- `http://example.com/products` → serves `index.html` (React/Vue router handles it)
- `http://example.com/static/app.js` → serves `static/app.js` (actual file)
- `http://example.com/unknown` → serves `index.html` (SPA routing)

## API Endpoints

All backend endpoints remain unchanged:
- `POST /api/chat` — AI chat endpoint
- `POST /ai-query` — Query endpoint
- `POST /recommend` — Product recommendations
- `GET /health` — Health check
- `GET /api/health` — Detailed health check
- `GET /products` — Get product list
- `GET /kb` — Get knowledge base
- etc.

## Static File Serving

Files in `static/` are automatically served:
- Route: `@app.route("/static/<path:filename>")`
- Cache headers are managed by Flask (can be configured)
- CORS is configured for all origins

## Environment Variables

No new environment variables needed! The `render.yaml` already has:
- `PYTHON_VERSION`: 3.11
- `GEMINI_API_KEY`: Your API key
- `OPENAI_API_KEY`: Optional
- `ANTHROPIC_API_KEY`: Optional
- `ANALYTICS_TOKEN`: Optional

## Deployment Checklist

- [ ] Frontend files built and copied to `static/`
- [ ] `static/index.html` exists
- [ ] `git add static/` committed
- [ ] `git push` to main branch
- [ ] Railway auto-deploys (check Railway dashboard)
- [ ] Visit `https://your-domain.com` to verify

## Troubleshooting

### Static files not loading (404)
- **Check:** Does `static/[file]` exist locally?
- **Fix:** Run `git status` to see if files were added
- **Fix:** Make sure you ran `git add static/` before commit

### CSS/JS not applying
- **Check:** Is your frontend using correct paths?
  - ✗ `href="/css/style.css"` (won't work)
  - ✓ `href="/static/css/style.css"` (correct)
  - ✓ `href="./css/style.css"` (relative, if in root)

### 404 on app routes
- **Check:** Is this a frontend route or API endpoint?
- **Frontend route:** Should return `index.html` (catch-all handles it)
- **API endpoint:** Should start with `/api/` and be in Python code

### Deployment stuck
- Check Railway logs: `railway logs` or Railway dashboard
- Verify `requirements.txt` has no syntax errors
- Verify `render.yaml` is valid YAML

## Next Steps

1. **If you have a frontend repo:**
   - Build it: `npm run build`
   - Copy to `static/`: `cp -r dist/* ../duct-ai-backend/static/`
   - Commit and push

2. **If starting fresh:**
   - Create frontend in `static/` or integrate from another repo
   - Ensure `static/index.html` exists
   - Commit and push

3. **Configure domain (if not done):**
   - Update Railway custom domain
   - Update `ALLOWED_ORIGINS` in environment if needed

## Quick Commands

```bash
# View current structure
ls -la static/

# Commit changes
git add static/
git commit -m "Update frontend"
git push

# Check deployment status
railway logs

# View current deployed version
curl https://your-domain.com/api/health
```

---

**Last Updated:** 2026-05-29
**Architecture:** Fullstack (Backend + Frontend in one repo)
**Deployment Platform:** Railway
