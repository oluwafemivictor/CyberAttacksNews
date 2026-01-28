# 🚀 Getting Started - Make It Work

This guide will get the CyberAttacksNews incident tracker up and running in minutes.

## Option 1: Quick Demo (No Installation Required)

Try the standalone demo to see the system in action:

```bash
# Windows
npx ts-node demo.ts

# macOS/Linux
npx ts-node demo.ts
```

This shows:
- ✅ Creating incidents
- ✅ Deduplication detection
- ✅ Status transitions
- ✅ Timeline auditing
- ✅ Statistics

No dependencies needed - just shows the core logic.

---

## Option 2: Full Development Setup (Recommended)

### Prerequisites
- **Node.js 18+** - Download from https://nodejs.org/
- **npm 7+** (comes with Node.js)

### Step 1: Install Dependencies

```bash
# Windows
setup.bat

# macOS/Linux
bash setup.sh

# Or manually:
npm install
```

This installs all required packages (Express, TypeScript, Jest, etc.)

### Step 2: Build TypeScript

```bash
npm run build
```

Compiles TypeScript to JavaScript in the `dist/` folder.

### Step 3: Run Tests

```bash
npm run test
```

Should see output like:
```
PASS tests/unit/IncidentService.test.ts
PASS tests/unit/DeduplicationService.test.ts
PASS tests/integration/workflows.test.ts

Test Suites: 3 passed, 3 total
Tests: 48 passed, 48 total
```

### Step 4: Start Server

```bash
npm run dev
```

Server starts on `http://localhost:3000`

Output:
```
CyberAttacksNews incident tracker running on port 3000
Environment: development
Database type: memory
```

---

## Option 3: Docker (No Local Node.js Needed)

If you have Docker installed:

```bash
# Build image
npm run docker:build

# Or manually:
docker build -t cyberattacksnews:latest .

# Run container
npm run docker:run

# Or manually:
docker-compose up
```

Server runs inside a container on `http://localhost:3000`

---

## Testing the API

Once server is running, try these commands:

### Health Check
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-01-28T10:00:00Z"
}
```

### Create Incident
```bash
curl -X POST http://localhost:3000/api/incidents \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Critical Security Breach",
    "description": "Unauthorized access detected",
    "severity": "critical"
  }'
```

### List Incidents
```bash
curl http://localhost:3000/api/incidents
```

### Update Status
```bash
curl -X PATCH http://localhost:3000/api/incidents/{ID}/status \
  -H "Content-Type: application/json" \
  -d '{"status": "confirmed"}'
```

---

## Using the CLI Tool

After `npm install`, use command-line tool:

```bash
# Create incident
npm run cli create \
  --title "Malware Detected" \
  --description "Malicious executable found on server" \
  --severity critical

# List incidents
npm run cli list

# Update status
npm run cli status <incident-id> --new-status confirmed

# Show timeline
npm run cli timeline <incident-id>
```

---

## Troubleshooting

### "npm command not found"
→ Install Node.js from https://nodejs.org/

### "Cannot find module 'uuid'"
→ Run `npm install` first

### "Port 3000 already in use"
→ Either:
  - Stop the other service: `kill -9 $(lsof -t -i :3000)` (macOS/Linux)
  - Or change PORT: `PORT=3001 npm run dev`

### Tests fail with compilation errors
→ Run `npm run build` first

### Docker error
→ Make sure Docker Desktop is running (macOS/Windows) or Docker daemon is started (Linux)

---

## Project Structure After Setup

```
dist/                    # Compiled JavaScript (after npm run build)
node_modules/            # Dependencies (after npm install)
src/
  ├── indexV2.ts         # Main server
  ├── cli.ts             # CLI tool
  ├── services/          # Business logic
  ├── database/          # Database abstraction
  ├── validators/        # Input validation
  └── ...
tests/                   # Test files
Dockerfile               # Docker image
docker-compose.yml       # Docker setup
package.json             # Dependencies
README.md                # Full documentation
```

---

## What Works After Setup

### APIs (7 endpoints)
- ✅ POST /api/incidents - Create
- ✅ GET /api/incidents - List
- ✅ GET /api/incidents/:id - Get
- ✅ PATCH /api/incidents/:id/status - Update
- ✅ DELETE /api/incidents/:id - Delete
- ✅ GET /api/incidents/:id/timeline - Timeline
- ✅ POST /api/incidents/:id/timeline - Add event

### Features
- ✅ Status machine (6 states, validated transitions)
- ✅ Automatic timeline auditing
- ✅ Fuzzy duplicate detection (85% threshold)
- ✅ Comprehensive validation
- ✅ Error handling
- ✅ Logging (text/JSON)
- ✅ Health check
- ✅ CLI tool

### Tests
- ✅ 48+ test cases
- ✅ Status transitions
- ✅ CRUD operations
- ✅ Deduplication accuracy
- ✅ Timeline completeness
- ✅ Alert triggering

---

## Recommended Workflow

### Day 1: Get It Running
1. Install Node.js
2. Run `setup.bat` or `bash setup.sh`
3. Run `npm run test` (verify all pass)
4. Run `npm run dev` (start server)
5. Test API with curl commands above

### Day 2: Explore Code
1. Read `ARCHITECTURE.md` (architecture overview)
2. Look at `src/services/IncidentServiceV2.ts` (main logic)
3. Study `src/validators/IncidentValidator.ts` (validation)
4. Check `tests/` (test patterns)

### Day 3+: Extend System
1. Implement PostgreSQL database
2. Add authentication (JWT)
3. Integrate real security feeds
4. Build dashboard UI
5. Setup monitoring

---

## Documentation

- **README_START_HERE.md** - Project overview
- **README.md** - Quick reference
- **SETUP.md** - Development guide (detailed)
- **ARCHITECTURE.md** - System design (400+ lines)
- **MANIFEST.md** - All files explained
- **.github/copilot-instructions.md** - For AI agents

---

## Support

If something doesn't work:

1. Check error message carefully
2. Run `npm run build` to compile TypeScript
3. Verify Node.js version: `node --version` (should be 18+)
4. Try `npm install --force` to reinstall dependencies
5. Check ports: `lsof -i :3000` (macOS/Linux)

---

## Success Checklist

- ✅ Node.js installed (`node --version`)
- ✅ Dependencies installed (`npm install`)
- ✅ Builds without errors (`npm run build`)
- ✅ All tests pass (`npm run test`)
- ✅ Server starts (`npm run dev`)
- ✅ Health check works (`curl http://localhost:3000/health`)
- ✅ Can create incidents (API test above)

**If all checks pass: You're ready to go! 🚀**

---

## Next Steps

After confirming everything works:

1. **Integrate Database** - Replace InMemoryDatabase with PostgreSQL
2. **Add Authentication** - Implement JWT tokens
3. **Real Security Feeds** - Connect to RSS feeds, security bulletins
4. **Monitoring** - Add APM and log aggregation
5. **Scaling** - Database optimization, caching, load balancing

See `ARCHITECTURE.md` for production considerations.

---

**Everything you need is in this directory. Start with Step 1 above!**
