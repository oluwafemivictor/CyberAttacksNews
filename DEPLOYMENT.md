# Deployment Guide - CyberAttacksNews

This guide covers deploying CyberAttacksNews to production on Railway, with optional PostgreSQL database support.

## Table of Contents

1. [Local Development](#local-development)
2. [Deploy to Railway](#deploy-to-railway)
3. [Configure Database](#configure-database)
4. [Authentication](#authentication)
5. [Environment Variables](#environment-variables)
6. [Monitoring](#monitoring)
7. [Troubleshooting](#troubleshooting)

---

## Local Development

### Prerequisites

- Node.js 18+
- TypeScript
- npm or yarn
- Optional: PostgreSQL 15+

### Setup

```bash
# Clone repository
git clone https://github.com/oluwafemivictor/CyberAttacksNews.git
cd CyberAttacksNews

# Install dependencies
npm install

# Build TypeScript
npm run build

# Run in development (in-memory database)
npm run dev

# Or run with PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/cyberattacksnews npm run dev
```

Server starts on `http://localhost:3000`

### Testing

```bash
# Run all tests
npm test

# Run integration tests
npm test:integration

# Watch mode
npm run test:watch

# Lint code
npm run lint

# Type check
npm run type-check
```

---

## Deploy to Railway

Railway is a modern deployment platform with free tier support.

### Step 1: Create Railway Account

1. Go to [https://railway.app](https://railway.app)
2. Sign up with GitHub account
3. Create new project

### Step 2: Connect GitHub Repository

1. In Railway dashboard, click "New Project"
2. Select "Deploy from GitHub"
3. Connect your GitHub account
4. Select `oluwafemivictor/CyberAttacksNews` repository
5. Click "Deploy"

### Step 3: Add PostgreSQL (Optional)

For production, we recommend PostgreSQL instead of in-memory database:

1. In Railway project dashboard, click "+ Add Service"
2. Select "PostgreSQL"
3. Accept defaults and create
4. PostgreSQL service is now linked to your project

### Step 4: Configure Environment Variables

In Railway dashboard, for your Web service:

1. Go to "Variables" tab
2. Add these variables:

```
NODE_ENV=production
PORT=3000
JWT_SECRET=generate-a-random-secret-key-here
DATABASE_URL=${{Postgres.DATABASE_URL}}  # Auto-populated if PostgreSQL added
```

To generate a secure JWT_SECRET:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

3. Click "Deploy" to apply changes

### Step 5: Verify Deployment

Once deployed:

1. Railway assigns your app a public URL (e.g., `https://cyberattacksnews.railway.app`)
2. Visit the URL in your browser
3. You should see the CyberAttacksNews dashboard
4. Test authentication:

```bash
curl https://cyberattacksnews.railway.app/auth/demo-users
```

---

## Configure Database

### Using In-Memory Database (Development)

Default - no configuration needed. Data is lost on restart.

```bash
npm run dev
```

### Using PostgreSQL (Production Recommended)

#### Local PostgreSQL Setup

```bash
# Install PostgreSQL
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql
# Windows: Download installer from postgresql.org

# Create database
createdb cyberattacksnews

# Set DATABASE_URL
export DATABASE_URL="postgresql://localhost/cyberattacksnews"

# Or for remote PostgreSQL
export DATABASE_URL="postgresql://user:password@host:port/dbname"

# Start server
npm run dev
```

Tables are automatically created on first run.

#### Using Railway PostgreSQL

When you add PostgreSQL to Railway, it automatically:
- Creates the database
- Provides CONNECTION_URL
- Adds it to your environment variables as `Postgres.DATABASE_URL`

Reference it in your Web service:
```
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

#### Using External PostgreSQL (Supabase, AWS RDS, etc.)

1. Obtain your DATABASE_URL connection string
2. Add to environment variables
3. Ensure database exists and is accessible
4. Server will auto-create tables

---

## Authentication

CyberAttacksNews uses JWT-based authentication.

### Demo Users (Testing)

Use these credentials to test locally or in production:

```
Username: admin      Password: admin123      Role: admin
Username: analyst    Password: analyst123    Role: analyst  
Username: viewer     Password: viewer123     Role: viewer
```

### Get Authentication Token

```bash
curl -X POST https://your-domain.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user-1",
    "username": "admin",
    "role": "admin"
  },
  "expiresIn": "24h"
}
```

### Use Token in API Requests

```bash
curl https://your-domain.com/api/incidents \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

### Roles

- **admin**: Full access - create, update, delete incidents and change status
- **analyst**: Read/write - create incidents and timeline events
- **viewer**: Read-only - view incidents and timeline

### Production: Update Demo Users

Replace demo users in `src/middleware/Auth.ts`:

```typescript
const DEMO_USERS = [
  {
    id: 'user-1',
    username: 'your-username',
    password: 'your-password', // Use bcrypt in production!
    role: 'admin'
  }
  // ... more users
];
```

For production, integrate with:
- Database user table
- LDAP/Active Directory
- OAuth2 (Google, GitHub, etc.)
- SAML

---

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production`, `development` |
| `PORT` | Server port | `3000` |
| `JWT_SECRET` | Token signing key | `32-character-random-string` |

### Optional - Database

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection | `postgresql://user:pass@host/db` |

### Optional - Integrations

| Variable | Description |
|----------|-------------|
| `SLACK_WEBHOOK_URL` | Slack alert notifications |
| `SLACK_CHANNEL` | Slack channel for alerts |
| `SMTP_HOST` | Email server host |
| `SMTP_PORT` | Email server port |
| `SMTP_USER` | Email server user |
| `SMTP_PASS` | Email server password |
| `ALERT_EMAIL` | Email for incident alerts |

---

## Monitoring

### Railway Dashboard

1. Go to your Railway project dashboard
2. View logs in real-time
3. Monitor CPU/memory usage
4. Check deployment history

### Health Check

```bash
curl https://your-domain.com/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-28T21:30:00Z"
}
```

### Viewing Logs

```bash
# Railway CLI
railway logs -s web

# Or in dashboard: Deployments → View Logs
```

### Metrics to Monitor

- API response times
- Error rates
- Database connection pool usage
- JWT token validation failures
- Incident creation/update frequency

---

## Troubleshooting

### 401 Unauthorized Errors

Problem: "No authentication token provided"

Solution: Include JWT token in Authorization header:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://your-domain.com/api/incidents
```

### 403 Forbidden Errors

Problem: "Insufficient permissions"

Solution: Ensure user has correct role:
- `admin`: Can change incident status
- `analyst`: Can create incidents
- `viewer`: Can only view

### Database Connection Errors

Problem: "Failed to connect to PostgreSQL"

Solutions:
1. Verify DATABASE_URL is correct
2. Check database is running
3. Verify network connectivity
4. Check authentication credentials
5. Ensure PostgreSQL accepts remote connections

```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### Server Crashes

Check logs:
```bash
railway logs -s web -f  # Follow logs
```

Common causes:
- DATABASE_URL missing (use in-memory or configure Postgres)
- JWT_SECRET not set
- Port already in use
- Out of memory

### Railway Deployment Fails

1. Push all changes to GitHub
2. Check build logs in Railway dashboard
3. Ensure package.json is valid
4. Run locally: `npm run build && npm start`
5. Check for TypeScript errors: `npm run type-check`

---

## Production Checklist

- [ ] Update `JWT_SECRET` to a secure random value
- [ ] Configure PostgreSQL or use managed database service
- [ ] Replace demo users with real authentication
- [ ] Enable HTTPS (Railway does this automatically)
- [ ] Set up error monitoring (Sentry, Datadog, etc.)
- [ ] Configure backup strategy for database
- [ ] Set up alerts for high severity incidents
- [ ] Review and update CORS settings
- [ ] Enable rate limiting
- [ ] Set up log aggregation
- [ ] Document your deployment process
- [ ] Test rollback procedures
- [ ] Monitor application performance

---

## Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8949)

---

**Need help?** Open an issue on [GitHub](https://github.com/oluwafemivictor/CyberAttacksNews/issues)
