# Copilot Instructions for CyberAttacksNews Incident Tracker

## Project Overview
CyberAttacksNews is an incident tracking system for cybersecurity events and attacks. The system tracks incidents with severity levels, status progression, timelines, and affected entities. It integrates with external news sources and security feeds to aggregate incident data.

## Core Architecture

### Data Model
The system uses an event-sourced approach with these primary entities:
- **Incident**: Core entity with id, title, description, severity (critical/high/medium/low), status, discovery_date, and last_updated
- **Timeline**: Chronological events associated with incidents (discovery, confirmation, mitigation, resolution)
- **Source**: External data sources (news feeds, security bulletins, threat intelligence)
- **Classification**: Tags for incident types (APT, ransomware, zero-day, supply-chain, etc.)

### Service Boundaries
- **Incident Service**: CRUD operations, status transitions, timeline management
- **Alert Service**: Webhook notifications for status changes and new incidents
- **Data Ingestion**: Parse and normalize external feed data into incidents
- **Search Service**: Full-text search across incidents and timeline events

## Key Workflows

### Creating an Incident (from external source)
1. Parse feed data (title, description, publish date, source URL)
2. Deduplicate against existing incidents (check for related incidents)
3. Extract severity from content analysis or use configured defaults
4. Set initial status: "reported" (unconfirmed) → "confirmed" → "ongoing"
5. Create timeline entry marking discovery
6. Trigger alerts for high/critical severity

### Incident Status Progression
Valid state transitions:
- `reported` → `confirmed` (evidence verified)
- `confirmed` → `ongoing` (actively exploiting or spreading)
- `ongoing` → `mitigated` (countermeasures deployed)
- `mitigated` → `resolved` (incident contained and recovery complete)
- Any state → `disputed` (if information proves inaccurate)

## Development Conventions

### File Organization
```
src/
  models/       # Data entities (Incident, Timeline, Source, Classification)
  services/     # Business logic (IncidentService, AlertService, etc.)
  handlers/     # API endpoint handlers
  integrations/ # External feed parsers
  utils/        # Helper functions (date parsing, deduplication)
tests/
  unit/         # Service and utility tests
  integration/  # Feed parser and workflow tests
```

### Code Patterns

**Status Updates**: Always create timeline entries when incident status changes
```typescript
// Example pattern - use this approach for state mutations
const updateIncidentStatus = async (incidentId, newStatus) => {
  validateTransition(currentStatus, newStatus); // prevent invalid transitions
  await db.incidents.update(incidentId, { status: newStatus });
  await db.timeline.create({ incidentId, event: 'status_changed', details: newStatus });
  await alertService.notify({ type: 'STATUS_CHANGE', incidentId, status: newStatus });
}
```

**Deduplication**: Use fuzzy matching on title + source to identify related incidents
- Check existing incidents before creating new ones
- Link related incidents rather than creating duplicates
- Store relationship metadata

**Severity Levels**: Use numeric scale (4=critical, 3=high, 2=medium, 1=low) internally, convert to strings in APIs

### Testing Requirements
- Incident status transition tests (all valid/invalid combinations)
- Feed parser tests for each external source type
- Deduplication accuracy tests with real-world incident titles
- Timeline ordering and completeness verification
- Alert triggering on severity thresholds

## External Integrations

### Feed Sources
The system consumes from:
- RSS/Atom feeds (security blogs, vendor advisories)
- JSON APIs (threat intelligence platforms)
- Email alerts (security mailing lists)

Parser implementations in `src/integrations/` should:
1. Normalize timestamps to ISO 8601
2. Extract severity signals (keywords: "critical", "emergency", CVE scoring)
3. Validate required fields (title, date, source)
4. Return structured IncidentData format

### Webhook Notifications
Outbound webhooks on:
- New incident creation (severity >= high)
- Status transitions (especially confirmed → ongoing, ongoing → resolved)
- Incidents added to search indexes

## Testing & Validation Commands
```bash
npm run test                    # All unit tests
npm run test:integration       # Feed parser and workflow tests
npm run lint                   # ESLint + type checking
npm run build                  # Compile TypeScript
```

## Common Pitfalls to Avoid
1. **Creating duplicate incidents**: Always deduplicate before creating - check fuzzy title match + same source
2. **Forgetting timeline entries**: Every status change must create a timeline record for audit trail
3. **Invalid status transitions**: Validate transitions - use the state machine model above
4. **Breaking incident links**: If merging related incidents, preserve all timeline data and source links
5. **Missing alert notifications**: Critical/high severity changes should always trigger alerts
