# CyberAttacksNews - Architecture & Features

Complete incident tracking system with production-ready patterns and components.

## 📊 Complete Feature Set

### Core Incident Management
- ✅ Full CRUD operations on incidents
- ✅ Status machine with validated transitions
- ✅ Timeline events with automatic audit trail
- ✅ Severity-based incident classification
- ✅ Multi-source tracking with deduplication

### Database Abstraction
- ✅ Repository pattern for database independence
- ✅ In-memory implementation included
- ✅ Ready for PostgreSQL, MongoDB, or any database
- ✅ Async/await pattern throughout

### Configuration & Environment
- ✅ Environment-based configuration
- ✅ Runtime validation of config
- ✅ .env support with sensible defaults
- ✅ Log level and format configuration

### Validation & Error Handling
- ✅ Incident data validation (title, description, dates)
- ✅ Status transition validation
- ✅ Custom validation errors
- ✅ Comprehensive error middleware
- ✅ Async error handling

### Logging & Monitoring
- ✅ Structured logging with levels
- ✅ JSON and text log formats
- ✅ Request/response logging
- ✅ Error logging with stack traces
- ✅ Health check endpoint

### API Documentation
- ✅ OpenAPI 3.0 specification (Swagger)
- ✅ All endpoints documented with schemas
- ✅ Parameter descriptions
- ✅ Example requests/responses

### Developer Tools
- ✅ CLI tool for incident management
- ✅ Complete workflow examples
- ✅ Test suite with patterns
- ✅ Docker support (Dockerfile + docker-compose)

---

## 🗄️ Database Abstraction Layer

The system uses repository pattern to decouple from any specific database:

```typescript
// All services use IDatabase interface
class IncidentService {
  constructor(private db: IDatabase) {}
  
  async createIncident(incident: Incident): Promise<Incident> {
    return this.db.incidents.create(incident);
  }
}

// Implementation can be swapped:
const db = new InMemoryDatabase();      // Development
const db = new PostgresDatabase();      // Production
const db = new MongoDbDatabase();       // Alternative
```

### Implemented Repositories:

- **IIncidentRepository** - Create, read, update, delete incidents
- **ITimelineRepository** - Manage timeline events  
- **ISourceRepository** - Manage external data sources
- **IAlertRepository** - Manage webhook alerts

All operations are async with proper error handling.

---

## ⚙️ Configuration System

Environment variables automatically validated on startup:

```bash
# Application
NODE_ENV=development
PORT=3000

# Database
DB_TYPE=memory          # Options: memory, postgres, mongodb
DATABASE_URL=...

# Logging
LOG_LEVEL=info         # Options: debug, info, warn, error
LOG_FORMAT=text        # Options: text, json

# Deduplication
DEDUP_THRESHOLD=0.85   # 0-1: similarity threshold
DEDUP_ENABLED=true

# Webhooks
WEBHOOK_TIMEOUT=5000   # milliseconds
WEBHOOK_RETRIES=3
```

Configuration errors prevent server startup - ensures production safety.

---

## ✅ Validation Layer

Three validation components:

### 1. IncidentValidator
```typescript
IncidentValidator.validateTitle(title)           // Min 5, max 500 chars
IncidentValidator.validateDescription(desc)     // Min 10, max 5000 chars
IncidentValidator.validateSeverity(severity)    // critical|high|medium|low
IncidentValidator.validateStatus(status)        // Enum validation
IncidentValidator.validateStatusUpdate(from, to) // Transition validation
```

### 2. SourceValidator
```typescript
SourceValidator.validateSourceType(type)  // rss|json_api|email
SourceValidator.validateUrl(url)          // URL format validation
```

### 3. Custom ValidationError
```typescript
// Returns structured validation errors
{
  error: {
    status: 400,
    message: "Validation errors",
    errors: [
      { field: "title", message: "Title is required" }
    ]
  }
}
```

---

## 📝 Logging & Monitoring

### Log Levels
- **DEBUG**: Detailed information for debugging
- **INFO**: General informational messages
- **WARN**: Warning messages
- **ERROR**: Error messages with stack traces

### Log Formats
- **text**: Human-readable format `[2026-01-28T10:00:00Z] INFO: Message`
- **json**: Machine-readable JSON format

### Request Logging
```
[2026-01-28T10:00:00Z] INFO: POST /api/incidents {status: 201, duration: 45ms}
```

### Health Check
```
GET /health → {
  status: "ok",
  database: "connected",
  timestamp: "2026-01-28T10:00:00Z"
}
```

---

## 📚 API Documentation

Full OpenAPI 3.0 specification in `src/api/swagger.ts`:

- **GET /api/incidents** - List incidents (filterable)
- **POST /api/incidents** - Create incident
- **GET /api/incidents/:id** - Get incident details
- **PATCH /api/incidents/:id/status** - Update status
- **DELETE /api/incidents/:id** - Delete incident
- **GET /api/incidents/:id/timeline** - Get timeline events
- **POST /api/incidents/:id/timeline** - Add timeline event
- **POST /api/incidents/check-duplicate** - Check for duplicates

All endpoints include:
- Request/response schemas
- Parameter descriptions
- Error responses
- Status codes

---

## 🛠️ CLI Tool

Command-line interface for incident management:

```bash
# Create incident
npm run cli create \
  --title "SQL Injection Attack" \
  --description "Malicious queries detected in login form" \
  --severity critical

# List incidents
npm run cli list --status ongoing --severity critical

# Update status
npm run cli status <incident-id> --new-status confirmed

# Show timeline
npm run cli timeline <incident-id>
```

---

## 🐳 Docker Support

### Build and run with Docker Compose:

```bash
npm run docker:build    # Build image
npm run docker:run      # Start container
npm run docker:stop     # Stop container
```

### docker-compose.yml includes:
- Application service on port 3000
- Environment configuration
- Health checks
- Optional PostgreSQL database (commented)
- Automatic restart policy

### Dockerfile features:
- Alpine base image (lightweight)
- Production dependencies only
- Health check endpoint
- Graceful shutdown handling

---

## 🧪 Testing Strategy

### Unit Tests (tests/unit/)
- Status transition validation
- CRUD operations
- Deduplication accuracy
- Data filtering

### Integration Tests (tests/integration/)
- Complete incident workflows
- Alert notifications
- Timeline completeness
- Multi-service interactions

### Run Tests:
```bash
npm run test                   # All tests
npm run test:integration      # Integration only
npm run test -- --watch       # Watch mode
npm run test -- --coverage    # Coverage report
```

---

## 🔄 Workflow Example

```typescript
// 1. Create incident from external source
const incident = new IncidentBuilder()
  .withTitle("0-day vulnerability discovered")
  .withSeverity("critical")
  .build();

await incidentService.createIncident(incident);
// ✓ Timeline event created: "created"
// ✓ Alert triggered (severity=critical)

// 2. Confirm incident
await incidentService.updateIncidentStatus(id, "confirmed");
// ✓ Timeline event created: "status_changed"
// ✓ Alert triggered: STATUS_CHANGE

// 3. Mark as ongoing
await incidentService.updateIncidentStatus(id, "ongoing");
// ✓ Timeline event created
// ✓ Status tracked

// 4. Deploy mitigation
await incidentService.addTimelineEvent(id, "patches_deployed", {
  systems_patched: 1250
});

// 5. Resolve
await incidentService.updateIncidentStatus(id, "resolved");
// ✓ Incident lifecycle complete
// ✓ Full audit trail preserved
```

---

## 🚀 Production Considerations

To prepare for production:

1. **Database**: Replace InMemoryDatabase with PostgresDatabase or MongoDbDatabase
2. **Logging**: Switch to JSON format and aggregate with ELK/CloudWatch
3. **Security**: Add authentication (JWT), rate limiting, HTTPS
4. **Monitoring**: Add APM (Application Performance Monitoring)
5. **Caching**: Add Redis for frequently accessed incidents
6. **Search**: Add Elasticsearch for full-text incident search
7. **Webhooks**: Implement actual HTTP webhook delivery with retries

---

## 📦 File Structure

```
src/
  api/
    swagger.ts                    # OpenAPI specification
  cli.ts                          # CLI tool
  config/
    ConfigLoader.ts               # Environment configuration
  database/
    IDatabase.ts                  # Repository interfaces
    InMemoryDatabase.ts           # Reference implementation
  handlers/
    incidentHandler.ts            # Original API handlers
  integrations/
    RSSFeedParser.ts              # Feed parser example
  middleware/
    ErrorHandler.ts               # Error handling
  models/
    incident.ts                   # Data models
  services/
    IncidentService.ts            # Original service (static methods)
    IncidentServiceV2.ts          # New service with DI
    AlertService.ts               # Alerts and webhooks
    DeduplicationService.ts       # Duplicate detection
  utils/
    Logger.ts                     # Logging system
  examples/
    WorkflowExample.ts            # Complete workflow demo
  index.ts                        # Original entry point
  indexV2.ts                      # New entry point with middleware

tests/
  unit/
    IncidentService.test.ts
    DeduplicationService.test.ts
  integration/
    workflows.test.ts

Dockerfile                        # Container image
docker-compose.yml               # Multi-container setup
```

---

## ✨ Key Patterns Used

1. **Repository Pattern** - Database abstraction
2. **Dependency Injection** - Services receive dependencies
3. **Builder Pattern** - Incident creation
4. **Async/Await** - Modern async handling
5. **Middleware Pattern** - Express middleware chain
6. **Error Handling** - Custom error classes
7. **Configuration Management** - Environment validation
8. **Validation Layer** - Input validation before processing
9. **Logging** - Structured, configurable logging
10. **State Machine** - Validated status transitions

---

All files documented with JSDoc comments and TypeScript types for IDE support.
