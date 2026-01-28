import { Incident, IncidentStatus, TimelineEvent } from '../models/incident';
import { IDatabase } from '../database/IDatabase';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/Logger';

const VALID_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  'reported': ['confirmed', 'disputed'],
  'confirmed': ['ongoing', 'disputed'],
  'ongoing': ['mitigated', 'disputed'],
  'mitigated': ['resolved', 'disputed'],
  'resolved': ['disputed'],
  'disputed': ['reported', 'confirmed']
};

export class IncidentService {
  constructor(private db: IDatabase) {}

  validateTransition(currentStatus: IncidentStatus, newStatus: IncidentStatus): boolean {
    const allowedTransitions = VALID_TRANSITIONS[currentStatus] || [];
    return allowedTransitions.includes(newStatus);
  }

  async createIncident(incident: Incident): Promise<Incident> {
    try {
      const created = await this.db.incidents.create(incident);
      
      // Create initial timeline entry
      await this.addTimelineEvent(incident.id, 'created', {
        status: incident.status
      });

      logger.info(`Created incident ${incident.id}: ${incident.title}`);
      return created;
    } catch (error) {
      logger.error('Failed to create incident', error);
      throw error;
    }
  }

  async getIncident(id: string): Promise<Incident | null> {
    return this.db.incidents.findById(id);
  }

  async listIncidents(filter?: { status?: IncidentStatus; severity?: string }): Promise<Incident[]> {
    return this.db.incidents.findAll(filter);
  }

  async updateIncidentStatus(incidentId: string, newStatus: IncidentStatus): Promise<Incident> {
    const incident = await this.db.incidents.findById(incidentId);
    if (!incident) {
      throw new Error(`Incident ${incidentId} not found`);
    }

    if (!this.validateTransition(incident.status, newStatus)) {
      throw new Error(
        `Invalid status transition from ${incident.status} to ${newStatus}`
      );
    }

    const oldStatus = incident.status;
    const updated = await this.db.incidents.update(incidentId, {
      status: newStatus,
      last_updated: new Date()
    });

    // Create timeline entry
    await this.addTimelineEvent(incidentId, 'status_changed', {
      old_status: oldStatus,
      new_status: newStatus
    });

    logger.info(`Updated incident ${incidentId} status: ${oldStatus} → ${newStatus}`);
    return updated;
  }

  async addTimelineEvent(
    incidentId: string,
    event: string,
    details: Record<string, unknown>
  ): Promise<TimelineEvent> {
    const timelineEvent: TimelineEvent = {
      id: uuidv4(),
      incident_id: incidentId,
      event,
      details,
      timestamp: new Date()
    };

    return this.db.timelines.create(timelineEvent);
  }

  async getTimeline(incidentId: string): Promise<TimelineEvent[]> {
    return this.db.timelines.findByIncidentId(incidentId);
  }

  async deleteIncident(id: string): Promise<boolean> {
    await this.db.timelines.deleteByIncidentId(id);
    await this.db.incidents.delete(id);
    logger.info(`Deleted incident ${id}`);
    return true;
  }
}
