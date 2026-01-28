# CyberAttacksNews Incident Tracker

**Production-ready** TypeScript-based incident tracking system for cybersecurity events. Tracks incidents with severity levels, status progression, timelines, and integrates with external news sources.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server (with hot-reload)
npm run dev

# Run tests
npm run test

# Build for production
npm run build

# Start production server
npm start
```

Server runs on `http://localhost:3000`

## 📋 Features

- ✅ **Full CRUD** for incident tracking with status machine
- ✅ **Timeline Auditing** - Automatic audit trail for all changes
- ✅ **Deduplication** - Fuzzy matching prevents duplicate incidents
- ✅ **Validation** - Comprehensive input validation
- ✅ **Error Handling** - Structured error responses
- ✅ **Logging** - Configurable structured logging
- ✅ **Database Abstraction** - Repository pattern, swap databases easily
- ✅ **Configuration** - Environment-based config with validation
- ✅ **CLI Tool** - Command-line incident management
- ✅ **Docker** - Included Dockerfile and docker-compose.yml
- ✅ **API Documentation** - OpenAPI/Swagger specification
- ✅ **Testing** - Unit and integration test suite

## 📖 Documentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Detailed architecture and all features
- **[SETUP.md](SETUP.md)** - Development setup and workflow
- **[.github/copilot-instructions.md](.github/copilot-instructions.md)** - AI agent guidelines
- **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Project initialization summary

## 🏗️ Project Structure

```
src/
  api/
    swagger.ts                    # OpenAPI documentation
  config/
    ConfigLoader.ts               # Configuration management
  database/
    IDatabase.ts                  # Repository interfaces
    InMemoryDatabase.ts           # Reference implementation
  handlers/
    incidentHandler.ts            # API handlers
  integrations/
    RSSFeedParser.ts              # Feed parser example
  middleware/
    ErrorHandler.ts               # Error handling
  models/
    incident.ts                   # Data models
  services/
    IncidentService.ts            # Original service
    IncidentServiceV2.ts          # Service with dependency injection
    AlertService.ts               # Alerts & webhooks
    DeduplicationService.ts       # Duplicate detection
  utils/
    Logger.ts                     # Logging system
  examples/
    WorkflowExample.ts            # Complete workflow example
  cli.ts                          # CLI tool
  index.ts                        # Original entry point
  indexV2.ts                      # New entry point

tests/
  unit/
    IncidentService.test.ts
    DeduplicationService.test.ts
  integration/
    workflows.test.ts

Dockerfile                        # Container image
docker-compose.yml               # Docker Compose setup
.env.example                      # Environment template
```

## 📡 API Endpoints

### Incidents
- `POST /api/incidents` - Create incident
- `GET /api/incidents` - List (filterable by `?status=` and `?severity=`)
- `GET /api/incidents/:id` - Get incident details
- `PATCH /api/incidents/:id/status` - Update status
- `DELETE /api/incidents/:id` - Delete incident

### Timeline
- `GET /api/incidents/:id/timeline` - Get timeline events
- `POST /api/incidents/:id/timeline` - Add timeline event

### Utilities
- `POST /api/incidents/check-duplicate` - Check for duplicates
- `GET /health` - Health check endpoint

Full OpenAPI/Swagger specification available in [ARCHITECTURE.md](ARCHITECTURE.md)

## 🛠️ CLI Tool

```bash
# Create incident
npm run cli create --title "Attack" --description "Details..." --severity critical

# List incidents
npm run cli list --status ongoing --severity high

# Update status
npm run cli status <incident-id> --new-status confirmed

# Show timeline
npm run cli timeline <incident-id>
```

## 🐳 Docker

```bash
npm run docker:build  # Build Docker image
npm run docker:run    # Start with docker-compose
npm run docker:stop   # Stop containers
```

## ⚙️ Configuration

Environment variables (see `.env.example`):

```bash
NODE_ENV=development        # development|production|test
PORT=3000
DB_TYPE=memory              # memory|postgres|mongodb
LOG_LEVEL=info              # debug|info|warn|error
LOG_FORMAT=text             # text|json
DEDUP_THRESHOLD=0.85        # 0-1: similarity threshold
WEBHOOK_TIMEOUT=5000        # milliseconds
WEBHOOK_RETRIES=3           # retry attempts
```

## 📊 Testing

```bash
npm run test                    # All unit + integration tests
npm run test:integration       # Integration tests only
npm run test -- --watch        # Watch mode
npm run test -- --coverage     # Coverage report
npm run lint                   # ESLint style checking
npm run type-check             # TypeScript type checking
npm run build                  # Compile TypeScript
```

Test coverage:
- Status transition validation (all valid/invalid combinations)
- CRUD operations (create, read, update, delete)
- Deduplication accuracy (fuzzy matching)
- Timeline completeness and ordering
- Alert triggering on severity
- Full workflow scenarios

## 🔧 Core Services

### IncidentService
- CRUD operations on incidents
- Status machine with validated transitions
- Timeline event management
- Automatic audit trail creation

### AlertService
- Webhook notifications
- Alert registration and triggering
- Multi-channel notification support

### DeduplicationService
- Fuzzy title matching (Levenshtein distance)
- Configurable similarity threshold (default 85%)
- Cross-source duplicate detection

## 📝 Incident Lifecycle

Valid state transitions:
- `reported` → `confirmed` (evidence verified)
- `confirmed` → `ongoing` (actively exploiting)
- `ongoing` → `mitigated` (countermeasures deployed)
- `mitigated` → `resolved` (incident contained)
- Any state → `disputed` (if information inaccurate)

**Timeline Entry Example:**
```json
{
  "id": "...",
  "incident_id": "...",
  "event": "status_changed",
  "details": {
    "old_status": "reported",
    "new_status": "confirmed"
  },
  "timestamp": "2026-01-28T10:00:00Z"
}
```

## 🔄 Workflow Example

```typescript
// 1. Create incident
const incident = new IncidentBuilder()
  .withTitle("Zero-day vulnerability")
  .withSeverity("critical")
  .build();
await incidentService.createIncident(incident);
// ✓ Timeline: "created"
// ✓ Alert sent

// 2. Confirm
await incidentService.updateIncidentStatus(id, "confirmed");
// ✓ Timeline: "status_changed"
// ✓ Alert sent

// 3. Add mitigation info
await incidentService.addTimelineEvent(id, "patches_deployed", {
  systems: 1250
});

// 4. Resolve
await incidentService.updateIncidentStatus(id, "resolved");
// ✓ Complete audit trail preserved
```

## 🏭 Database Abstraction

Services use repository pattern for database independence:

```typescript
// All services depend on IDatabase interface
class IncidentService {
  constructor(private db: IDatabase) {}
  async createIncident(incident: Incident): Promise<Incident> {
    return this.db.incidents.create(incident);
  }
}

// Swap implementations:
const db = new InMemoryDatabase();      // Development
const db = new PostgresDatabase();      // Production (implement)
const db = new MongoDbDatabase();       // Alternative (implement)
```

## ⚠️ Common Patterns

### Status Updates Create Timeline Entries
```typescript
// Automatic - no need to manually add timeline
await incidentService.updateIncidentStatus(id, 'confirmed');
```

### Always Deduplicate Before Creating
```typescript
const existing = await incidentService.listIncidents();
const isDuplicate = DeduplicationService.checkDuplicate(title, source, existing);
if (!isDuplicate.isDuplicate) {
  await incidentService.createIncident(incident);
}
```

### High/Critical Severity Triggers Alerts
```typescript
if (incident.severity === 'critical' || incident.severity === 'high') {
  await AlertService.notify(incident.id, 'NEW_INCIDENT', {incident});
}
```

## 🚀 Production Deployment

Before deploying to production:

1. **Database** - Replace InMemoryDatabase with PostgreSQL/MongoDB implementation
2. **Logging** - Aggregate logs with ELK Stack or Cloud Logging
3. **Security** - Add authentication (JWT), authorization, rate limiting
4. **Monitoring** - Add APM (New Relic, Datadog)
5. **Caching** - Add Redis for frequently accessed incidents
6. **Search** - Add Elasticsearch for full-text search
7. **Webhooks** - Implement actual HTTP delivery with retries
8. **Scaling** - Add load balancing, clustering

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed production considerations.

## 🧪 Test Suite

Run the complete test suite:

```bash
npm run test

# Test output example:
# PASS  tests/unit/IncidentService.test.ts
#   IncidentService Status Transitions
#     ✓ should allow valid transition from reported to confirmed
#     ✓ should allow valid transition from confirmed to ongoing
#     ✓ should prevent invalid transition from reported to resolved
#     ✓ should allow transition to disputed from any state
#     ✓ should create timeline entry on status change
```

## 📚 Key Files

- [src/models/incident.ts](src/models/incident.ts) - Core data model
- [src/services/IncidentServiceV2.ts](src/services/IncidentServiceV2.ts) - Main business logic
- [src/database/IDatabase.ts](src/database/IDatabase.ts) - Database interface
- [src/validators/IncidentValidator.ts](src/validators/IncidentValidator.ts) - Input validation
- [src/utils/Logger.ts](src/utils/Logger.ts) - Logging system
- [src/examples/WorkflowExample.ts](src/examples/WorkflowExample.ts) - Usage examples

---

For detailed architecture and advanced usage, see [ARCHITECTURE.md](ARCHITECTURE.md)
