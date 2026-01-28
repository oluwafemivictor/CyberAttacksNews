# Deployment Quick Start Guide

## One-Click Deployment to Render, Heroku, or Fly.io

This repository is configured for instant deployment to three platforms. Choose one:

### 🚀 Render (Easiest - Recommended)

1. Go to https://render.com/register (email signup)
2. Create account and login
3. Click "New +" → "Web Service"
4. Select GitHub repo: `oluwafemivictor/CyberAttacksNews`, branch `main`
5. Configure:
   - **Name:** cyberattacksnews
   - **Environment:** Node
   - **Build Command:** `npm ci && npm run build`
   - **Start Command:** `npm start`
6. Click "Create Web Service" → Render auto-builds
7. After deploy, add PostgreSQL:
   - Click "New +" → "PostgreSQL"
   - Render auto-populates `DATABASE_URL` env var
8. Environment Variables (auto-set by Render, but confirm):
   - `NODE_ENV` = production
   - `PORT` = 3000
   - `JWT_SECRET` = (generate a strong secret)
   - `DATABASE_URL` = (Render Postgres URL)
9. Deploy finishes → visit https://`<your-render-domain>`/health

**Config file:** `render.yaml`

---

### 🚀 Heroku

1. Go to https://www.heroku.com/home → Sign up or login
2. Create New → Create New App
3. Give it a name (e.g., `cyberattacksnews`)
4. Go to **Deploy** tab → GitHub → connect
5. Search for repo: `oluwafemivictor/CyberAttacksNews`
6. Click "Connect" → enable "Automatic Deploys" (optional)
7. Click "Deploy Branch" (main)
8. Add PostgreSQL add-on:
   - Go to **Resources** tab
   - Add-ons → search "Heroku Postgres"
   - Choose a plan → "Provision"
9. Go to **Settings** → Config Vars → verify:
   - `DATABASE_URL` = (auto-added by Postgres add-on)
   - `JWT_SECRET` = (generate a strong secret)
   - `NODE_ENV` = production
10. Deploy finishes → visit https://`<your-heroku-app-name>`.herokuapp.com/health

**Config file:** `Procfile`

---

### 🚀 Fly.io (Fast, Global)

1. Go to https://fly.io → Sign up
2. Install `flyctl` CLI:
   ```bash
   # Windows: choco install flyctl
   # Or download: https://fly.io/docs/getting-started/installing-flyctl/
   ```
3. Login:
   ```bash
   flyctl auth login
   ```
4. In your project folder, run:
   ```bash
   flyctl launch --copy-config
   ```
   - Choose region (e.g., `iad` for US East)
   - Would you like to set up a PostgreSQL? → `y`
   - Would you like to deploy now? → `y`
5. Wait for deploy to finish, then:
   ```bash
   flyctl status
   ```
6. Visit https://`<your-fly-app-name>`.fly.dev/health

**Config file:** `fly.toml`

---

## Environment Variables (All Platforms)

Set these in your platform's dashboard:
- `NODE_ENV` = `production`
- `PORT` = `3000`
- `JWT_SECRET` = (strong random string, e.g., `openssl rand -hex 32`)
- `DATABASE_URL` = (provided by platform's PostgreSQL service)

---

## Verification After Deploy

Once live, test your endpoints:

```bash
# Health check (should return JSON)
curl https://<your-domain>/health

# Get incidents (should return empty array initially)
curl https://<your-domain>/api/incidents

# Create an incident
curl -X POST https://<your-domain>/api/incidents \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", "severity": "high", "description": "Testing"}'

# Search
curl "https://<your-domain>/api/search?q=test"
```

---

## Troubleshooting

**Build fails during deploy:**
- Check build logs in platform dashboard
- Ensure all `npm` commands in config match `package.json` scripts
- Verify `node_modules/.bin/tsc` is available (dependencies installed)

**Database connection fails:**
- Confirm `DATABASE_URL` env var is set correctly
- Check PostgreSQL status in dashboard
- If migrations don't run, SSH into platform and run manually:
  ```bash
  npm run migrate
  ```

**Port issues:**
- Ensure `PORT` env var is set to `3000`
- Don't hardcode ports in code (use `process.env.PORT`)

**Authentication fails:**
- Ensure `JWT_SECRET` is a strong, non-empty string
- Test with demo users (admin/admin123, etc.)

---

## Next Steps

1. Pick your platform above
2. Follow the steps to deploy
3. Test the `/health` endpoint
4. Share the live URL!

Good luck! 🚀
