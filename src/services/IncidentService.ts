import { Incident, IncidentStatus, TimelineEvent, IncidentBuilder } from '../models/incident';
import { v4 as uuidv4 } from 'uuid';

// In-memory storage for demo purposes
const incidents = new Map<string, Incident>();
const timeline = new Map<string, TimelineEvent[]>();

const VALID_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  'reported': ['confirmed', 'disputed'],
  'confirmed': ['ongoing', 'disputed'],
  'ongoing': ['mitigated', 'disputed'],
  'mitigated': ['resolved', 'disputed'],
  'resolved': ['disputed'],
  'disputed': ['reported', 'confirmed']
};

export class IncidentService {
  static validateTransition(currentStatus: IncidentStatus, newStatus: IncidentStatus): boolean {
    const allowedTransitions = VALID_TRANSITIONS[currentStatus] || [];
    return allowedTransitions.includes(newStatus);
  }

  static createIncident(incident: Incident): Incident {
    incidents.set(incident.id, { ...incident });
    timeline.set(incident.id, [
      {
        id: uuidv4(),
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

  static listIncidents(filter?: { status?: IncidentStatus; severity?: string }): Incident[] {
    let results = Array.from(incidents.values());
    
    if (filter?.status) {
      results = results.filter(i => i.status === filter.status);
    }
    if (filter?.severity) {
      results = results.filter(i => i.severity === filter.severity);
    }
    
    return results;
  }

  static updateIncidentStatus(incidentId: string, newStatus: IncidentStatus): Incident {
    const incident = incidents.get(incidentId);
    if (!incident) {
      throw new Error(`Incident ${incidentId} not found`);
    }

    if (!this.validateTransition(incident.status, newStatus)) {
      throw new Error(
        `Invalid status transition from ${incident.status} to ${newStatus}`
      );
    }

    // Update incident
    const oldStatus = incident.status;
    incident.status = newStatus;
    incident.last_updated = new Date();
    incidents.set(incidentId, incident);

    // Create timeline entry
    this.addTimelineEvent(incidentId, 'status_changed', {
      old_status: oldStatus,
      new_status: newStatus
    });

    return incident;
  }

  static addTimelineEvent(
    incidentId: string,
    event: string,
    details: Record<string, unknown>
  ): TimelineEvent {
    const timelineEvent: TimelineEvent = {
      id: uuidv4(),
      incident_id: incidentId,
      event,
      details,
      timestamp: new Date()
    };

    const events = timeline.get(incidentId) || [];
    events.push(timelineEvent);
    timeline.set(incidentId, events);

    return timelineEvent;
  }

  static getTimeline(incidentId: string): TimelineEvent[] {
    return timeline.get(incidentId) || [];
  }

  static deleteIncident(id: string): boolean {
    incidents.delete(id);
    timeline.delete(id);
    return true;
  }
}
