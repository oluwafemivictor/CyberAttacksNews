/**
 * Standalone demo showing the core incident tracking system
 * This works without external dependencies - pure TypeScript/JavaScript
 */

// ============= DATA MODELS =============

interface Incident {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'reported' | 'confirmed' | 'ongoing' | 'mitigated' | 'resolved' | 'disputed';
  discovery_date: Date;
  last_updated: Date;
  source_ids: string[];
  classifications: string[];
}

interface TimelineEvent {
  id: string;
  incident_id: string;
  event: string;
  details: Record<string, unknown>;
  timestamp: Date;
}

// ============= CORE LOGIC =============

const incidents = new Map<string, Incident>();
const timeline = new Map<string, TimelineEvent[]>();

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  'reported': ['confirmed', 'disputed'],
  'confirmed': ['ongoing', 'disputed'],
  'ongoing': ['mitigated', 'disputed'],
  'mitigated': ['resolved', 'disputed'],
  'resolved': ['disputed'],
  'disputed': ['reported', 'confirmed']
};

// ============= INCIDENT SERVICE =============

class IncidentService {
  static createIncident(title: string, description: string, severity: string): Incident {
    const incident: Incident = {
      id: generateId(),
      title,
      description,
      severity: (severity || 'medium') as any,
      status: 'reported',
      discovery_date: new Date(),
      last_updated: new Date(),
      source_ids: [],
      classifications: []
    };

    incidents.set(incident.id, incident);
    timeline.set(incident.id, [
      {
        id: generateId(),
        incident_id: incident.id,
        event: 'created',
        details: { status: incident.status },
        timestamp: new Date()
      }
    ]);

    return incident;
  }

  static getIncident(id: string): Incident | null {
    return incidents.get(id) || null;
  }

  static listIncidents(): Incident[] {
    return Array.from(incidents.values());
  }

  static updateStatus(incidentId: string, newStatus: string): Incident {
    const incident = incidents.get(incidentId);
    if (!incident) throw new Error(`Incident ${incidentId} not found`);

    const allowedTransitions = VALID_TRANSITIONS[incident.status] || [];
    if (!allowedTransitions.includes(newStatus)) {
      throw new Error(`Cannot transition from ${incident.status} to ${newStatus}`);
    }

    const oldStatus = incident.status;
    incident.status = newStatus as any;
    incident.last_updated = new Date();
    incidents.set(incidentId, incident);

    // Add timeline entry
    const events = timeline.get(incidentId) || [];
    events.push({
      id: generateId(),
      incident_id: incidentId,
      event: 'status_changed',
      details: { old_status: oldStatus, new_status: newStatus },
      timestamp: new Date()
    });
    timeline.set(incidentId, events);

    return incident;
  }

  static getTimeline(incidentId: string): TimelineEvent[] {
    return timeline.get(incidentId) || [];
  }
}

// ============= DEDUPLICATION =============

function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  if (s1 === s2) return 1;
  
  // Simple Levenshtein-like calculation
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  let matches = 0;
  for (const char of shorter) {
    if (longer.includes(char)) matches++;
  }
  return matches / longer.length;
}

function checkDuplicate(title: string): { isDuplicate: boolean; matchedId?: string; similarity: number } {
  const existingIncidents = IncidentService.listIncidents();
  
  for (const incident of existingIncidents) {
    const similarity = calculateSimilarity(title, incident.title);
    if (similarity > 0.85) {
      return { isDuplicate: true, matchedId: incident.id, similarity };
    }
  }
  
  return { isDuplicate: false, similarity: 0 };
}

// ============= DEMO =============

console.log('🎯 CyberAttacksNews Incident Tracker - Standalone Demo\n');
console.log('='.repeat(50) + '\n');

// Create incidents
console.log('📝 Creating incidents...\n');

const incident1 = IncidentService.createIncident(
  'SQL Injection Attack Detected',
  'Malicious SQL queries detected in the login form',
  'critical'
);
console.log(`✓ Created incident: ${incident1.id}`);
console.log(`  Title: ${incident1.title}`);
console.log(`  Severity: ${incident1.severity}`);
console.log(`  Status: ${incident1.status}\n`);

const incident2 = IncidentService.createIncident(
  'Unauthorized Access Attempt',
  'Multiple failed login attempts from suspicious IP',
  'high'
);
console.log(`✓ Created incident: ${incident2.id}`);
console.log(`  Title: ${incident2.title}`);
console.log(`  Status: ${incident2.status}\n`);

// Check deduplication
console.log('🔍 Testing deduplication...\n');

const similarTitle = 'SQL Injection found in login page';
const dupCheck = checkDuplicate(similarTitle);
console.log(`Testing title: "${similarTitle}"`);
console.log(`  Similarity: ${(dupCheck.similarity * 100).toFixed(1)}%`);
console.log(`  Duplicate: ${dupCheck.isDuplicate}`);
if (dupCheck.matchedId) {
  console.log(`  Matched incident: ${dupCheck.matchedId}\n`);
}

// Update status
console.log('📊 Testing status transitions...\n');

try {
  console.log(`Current status: ${incident1.status}`);
  const confirmed = IncidentService.updateStatus(incident1.id, 'confirmed');
  console.log(`✓ Updated to: ${confirmed.status}`);
  
  const ongoing = IncidentService.updateStatus(incident1.id, 'ongoing');
  console.log(`✓ Updated to: ${ongoing.status}`);
  
  const mitigated = IncidentService.updateStatus(incident1.id, 'mitigated');
  console.log(`✓ Updated to: ${mitigated.status}`);
  
  const resolved = IncidentService.updateStatus(incident1.id, 'resolved');
  console.log(`✓ Updated to: ${resolved.status}\n`);
} catch (error) {
  console.log(`✗ Error: ${(error as Error).message}\n`);
}

// Show timeline
console.log('📅 Timeline for Incident 1:\n');

const events = IncidentService.getTimeline(incident1.id);
events.forEach((event, index) => {
  const time = event.timestamp.toLocaleTimeString();
  console.log(`  ${index + 1}. [${time}] ${event.event}`);
  if (Object.keys(event.details).length > 0) {
    console.log(`     Details: ${JSON.stringify(event.details)}`);
  }
});
console.log('');

// List all incidents
console.log('📋 All Incidents:\n');

const allIncidents = IncidentService.listIncidents();
allIncidents.forEach((incident, index) => {
  console.log(`  ${index + 1}. ${incident.title}`);
  console.log(`     Status: ${incident.status} | Severity: ${incident.severity}`);
});
console.log('');

// Show statistics
console.log('📈 Statistics:\n');

console.log(`  Total incidents: ${allIncidents.length}`);
console.log(`  Critical/High: ${allIncidents.filter(i => i.severity === 'critical' || i.severity === 'high').length}`);
console.log(`  Reported: ${allIncidents.filter(i => i.status === 'reported').length}`);
console.log(`  Ongoing: ${allIncidents.filter(i => i.status === 'ongoing').length}`);
console.log(`  Resolved: ${allIncidents.filter(i => i.status === 'resolved').length}\n`);

console.log('='.repeat(50));
console.log('\n✅ Demo completed successfully!\n');
console.log('To use the full system:');
console.log('  1. npm install');
console.log('  2. npm run dev');
console.log('  3. curl http://localhost:3000/health\n');
