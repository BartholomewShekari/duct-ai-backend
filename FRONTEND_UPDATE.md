# QUICK START: Fullstack Frontend Integration

## 1️⃣ You Have a Frontend Build (React, Vue, etc)

```bash
# From your frontend repo
npm run build

# Copy to backend static folder
cp -r dist/* ../duct-ai-backend/static/
# or for React/CRA:
cp -r build/* ../duct-ai-backend/static/

# Deploy
cd ../duct-ai-backend
git add static/
git commit -m "Deploy frontend v2"
git push

# ✓ Done! Railway redeploys automatically
```

## 2️⃣ Verify It Works

```bash
# Test locally
python -m pip install -r requirements.txt
python application.py

# Visit http://localhost:5000/
# Should see your frontend UI
```

## 3️⃣ Check Logs

```bash
# During Railway deployment
railway logs

# Or check health
curl https://your-domain.com/api/health
```

## 📁 Your Frontend Structure

Make sure your build output has this structure:

```
static/
├── index.html              # ← Required
├── css/
│   ├── main.*.css
│   └── ...
├── js/
│   ├── main.*.js
│   └── ...
└── images/
    └── ...
```

## 🔗 Important: Update Frontend URLs

If your frontend calls the API, use these paths:
- ✓ `/api/chat` (correct - reaches backend)
- ✓ `http://localhost:5000/api/chat` (dev mode)
- ✓ `https://your-domain.com/api/chat` (production)

## 🚀 That's it!

Once you `git push`:
1. Railway detects changes
2. Rebuilds: `pip install -r requirements.txt`
3. Redeploys: `gunicorn -w 1 -b 0.0.0.0:$PORT application:app`
4. Your frontend is live in ~2 minutes

## Troubleshooting

| Problem | Solution |
|---------|----------|
| 404 on frontend files | Did you `git add static/` before commit? |
| CSS not loading | Check URL paths in your HTML (should be `/static/css/...`) |
| Frontend route shows 404 | Make sure `static/index.html` exists |
| Styles/JS look old | Clear browser cache or use `Shift + F5` |

---

For detailed docs, see **FULLSTACK_DEPLOYMENT.md**
