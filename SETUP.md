# Getting Started with CyberAttacksNews

## Prerequisites
- Node.js 16+ (https://nodejs.org/)
- npm 7+

## Initial Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Compile TypeScript
```bash
npm run build
```

### 3. Run Tests
```bash
npm run test                # All unit tests
npm run test:integration   # Integration tests
```

### 4. Start Development Server
```bash
npm run dev    # Runs on http://localhost:3000
```

## Project Structure Overview

```
CyberAttacksNews/
├── src/
│   ├── models/              # Data entities (Incident, Timeline, Source)
│   ├── services/            # Business logic
│   │   ├── IncidentService        # CRUD, status transitions, timeline
│   │   ├── AlertService           # Webhooks and notifications
│   │   └── DeduplicationService   # Fuzzy matching for duplicates
│   ├── handlers/            # API route handlers
│   ├── integrations/        # External feed parsers (RSS, JSON APIs)
│   ├── examples/            # Complete workflow examples
│   └── index.ts             # Express app setup
├── tests/
│   ├── unit/                # Service tests
│   └── integration/         # Workflow tests
├── .github/
│   └── copilot-instructions.md    # AI agent guidelines
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

## Key Files to Understand First

1. **[README.md](README.md)** - Overview and API reference
2. **[.github/copilot-instructions.md](.github/copilot-instructions.md)** - Development conventions
3. **[src/models/incident.ts](src/models/incident.ts)** - Core data model
4. **[src/services/IncidentService.ts](src/services/IncidentService.ts)** - Main business logic
5. **[src/examples/WorkflowExample.ts](src/examples/WorkflowExample.ts)** - Complete workflow demo

## Development Workflow

### Creating a New Feature

1. **Write tests first** (TDD approach)
   ```bash
   # Edit tests/unit/YourFeature.test.ts
   npm run test -- --watch
   ```

2. **Implement the feature**
   ```bash
   # Edit src/services/YourService.ts or src/handlers/handler.ts
   npm run lint
   npm run type-check
   ```

3. **Verify it works**
   ```bash
   npm run test
   npm run build
   ```

### Common Commands

```bash
npm run dev              # Development with auto-reload
npm run build            # Compile TypeScript to dist/
npm start                # Run compiled version
npm run lint             # Check code style
npm run type-check       # TypeScript compilation check
npm run test             # Run all tests
npm run test -- --watch  # Run tests in watch mode
```

## Testing Guidelines

### Unit Tests
Located in `tests/unit/`, test individual services:
- Status transitions
- Deduplication logic
- Data validation

```typescript
// tests/unit/MyFeature.test.ts
describe('MyFeature', () => {
  it('should do something', () => {
    // Arrange
    const input = ...;
    
    // Act
    const result = MyService.doSomething(input);
    
    // Assert
    expect(result).toBe(expected);
  });
});
```

### Integration Tests
Located in `tests/integration/`, test complete workflows:
- End-to-end incident lifecycle
- Feed ingestion and deduplication
- Alert triggering

## API Quick Reference

### Create Incident
```bash
curl -X POST http://localhost:3000/api/incidents \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Critical Vulnerability",
    "description": "Details here",
    "severity": "critical",
    "discovery_date": "2026-01-28T10:00:00Z",
    "source_ids": ["feed_1"],
    "classifications": ["zero-day"]
  }'
```

### List Incidents
```bash
curl http://localhost:3000/api/incidents?severity=critical
```

### Update Status
```bash
curl -X PATCH http://localhost:3000/api/incidents/{id}/status \
  -H "Content-Type: application/json" \
  -d '{"status": "confirmed"}'
```

### Get Timeline
```bash
curl http://localhost:3000/api/incidents/{id}/timeline
```

## Important Patterns

### Always Deduplicate Before Creating
```typescript
const existing = IncidentService.listIncidents();
const isDuplicate = DeduplicationService.checkDuplicate(
  title, sourceId, existing
);

if (!isDuplicate.isDuplicate) {
  IncidentService.createIncident(incident);
}
```

### Status Changes Create Timeline Entries
```typescript
// Automatically creates timeline entry with old/new status
IncidentService.updateIncidentStatus(incidentId, 'confirmed');
```

### High/Critical Incidents Trigger Alerts
```typescript
if (incident.severity === 'critical' || incident.severity === 'high') {
  await AlertService.notify(incident.id, 'NEW_INCIDENT', {incident});
}
```

## Troubleshooting

### Tests Failing
1. Clear cache: `rm -r dist/` (or `rmdir /s dist` on Windows)
2. Rebuild: `npm run build`
3. Run tests: `npm run test`

### TypeScript Errors
```bash
npm run type-check  # See all type errors
```

### ESLint Issues
```bash
npm run lint    # See style issues
```

## Next Steps

1. Review [.github/copilot-instructions.md](.github/copilot-instructions.md) for detailed architecture
2. Look at [src/examples/WorkflowExample.ts](src/examples/WorkflowExample.ts) for complete usage
3. Create your first test in `tests/unit/`
4. Implement corresponding feature in `src/services/`
5. Add API handlers in `src/handlers/`

## Questions?

Refer to:
- **Architecture decisions** → `.github/copilot-instructions.md`
- **API endpoints** → `README.md`
- **Code examples** → `src/examples/WorkflowExample.ts`
- **Test patterns** → `tests/unit/` and `tests/integration/`
