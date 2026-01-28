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

## 🏗️ Project Structure*[ARCHITECTURE.md](ARCHITECTURE.md)** - Detailed architecture and features
- **[SETUP.md](SETUP.md)** - Setup and development workflow
- **[.github/copilot-instructions.md](.github/copilot-instructions.md)** - AI agent guidelines

```
src/
  models/       # Data entities (Incident, Timeline, Source)
  services/     # Business logic (IncidentService, AlertService, DeduplicationService)
  handlers/     # API endpoint handlers
  integrations/ # Feed parser implementations
  utils/        # Helper functions
tests/
  unit/         # Service and utility tests
  integration/  # Workflow and feed parser tests
```

## Quick Start

### Installation
```bash
npm install
```

### Development
```bash
npm run dev          # Start with ts-node for hot-reload
npm run build        # Compile TypeScript
npm start            # Run compiled version
```

### Testing
```bash
npm run test                    # All unit tests
npm run test:integration       # Feed parser and workflow tests
npm run lint                   # ESLint + type checking
npm run type-check             # TypeScript type checking
```

## API Endpoints

###📡 API Endpoints

### Incidents
- `POST /api/incidents` - Create incident
- `GET /api/incidents` - List (filterable by status/severity)
- `GET /api/incidents/:id` - Get details
- `PATCH /api/incidents/:id/status` - Update status
- `DELETE /api/incidents/:id` - Delete incident

### Timeline
- `GET /api/incidents/:id/timeline` - Get events
- `POST /api/incidents/:id/timeline` - Add event

### Utilities
- `POST /api/incidents/check-duplicate` - Detect duplicates
- `GET /health` - Health check

See [ARCHITECTURE.md](ARCHITECTURE.md) for full OpenAPI spec.

### Incident Lifecycle
- `reported` - Initial status from external source (unconfirmed)
- `confirmed` - Evidence verified
- `ongoing` - Actively exploiting or spreading
- `mitigated` - Countermeasures deployed
- `resolved` - Contained and recovery complete
- `disputed` - Information proven inaccurate (can transition from any state)

### Severity Levels
- `critical` - Widespread impact, immediate action required
- `high` - Significant impact on systems or data
- `medium` - Moderate impact, requires attention
- `low` - Minor impact or information gathering

## Development Conventions

### Status Updates
Always create timeline entries when updating incident status:
```typescript
const incident = IncidentService.updateIncidentStatus(id, 'confirmed');
// Timeline entry automatically created with old/new status
```

### Deduplication
Before creating incidents from external sources, check for duplicates:
```typescript
const result = DeduplicationService.checkDuplicate(title, source, existingIncidents);
if (!result.isDuplicate) {
  IncidentService.createIncident(incident);
}
```

### Alerts
Trigger notifications for high-severity incidents:
```typescript
if (incident.severity === 'critical' || incident.severity === 'high') {
  await AlertService.notify(incident.id, 'NEW_INCIDENT', { incident });
}
```

## Testing Strategy

- **Unit Tests**: Service logic, status transitions, deduplication accuracy
- **Integration Tests**: Full workflows from creation to resolution
- **Validation**: State machine transitions, timeline completeness, alert triggering

## Environment Variables

- `PORT` - Server port (default: 3000)

## Common Patterns

### Creating an Incident
```typescript
const incident = new IncidentBuilder()
  .withTitle('New Attack Discovered')
  .withDescription('Details about the attack')
  .withSeverity('critical')
  .withDiscoveryDate(new Date())
  .build();

IncidentService.createIncident(incident);
```

### Checking Duplicates
```typescript
const existing = IncidentService.listIncidents();
const result = DeduplicationService.checkDuplicate(
  newTitle,
  sourceId,
  existing
);
```

## Pitfalls to Avoid

1. **Duplicate incidents** - Always deduplicate before creating
2. **Missing timeline entries** - Every status change must create a timeline record
3. **Invalid state transitions** - Use `validateTransition()` before updating status
4. **Broken incident links** - Preserve source and timeline data when merging
5. **Missing notifications** - High/critical incidents should trigger alerts

---

For detailed development guidance, see [`.github/copilot-instructions.md`](.github/copilot-instructions.md)
