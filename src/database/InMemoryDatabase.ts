/**
 * In-memory database implementation
 * Suitable for development and testing
 * Replace with SQL/MongoDB implementation for production
 */

import { Incident, TimelineEvent, Source, Alert } from '../models/incident';
import {
  IDatabase,
  IIncidentRepository,
  ITimelineRepository,
  ISourceRepository,
  IAlertRepository
} from './IDatabase';

class InMemoryIncidentRepository implements IIncidentRepository {
  private incidents = new Map<string, Incident>();

  async create(incident: Incident): Promise<Incident> {
    this.incidents.set(incident.id, { ...incident });
    return this.findById(incident.id) as Promise<Incident>;
  }

  async findById(id: string): Promise<Incident | null> {
    const incident = this.incidents.get(id);
    return incident ? { ...incident } : null;
  }

  async findAll(filter?: { status?: string; severity?: string }): Promise<Incident[]> {
    let results = Array.from(this.incidents.values());

    if (filter?.status) {
      results = results.filter(i => i.status === filter.status);
    }
    if (filter?.severity) {
      results = results.filter(i => i.severity === filter.severity);
    }

    return results.map(i => ({ ...i }));
  }

  async update(id: string, updates: Partial<Incident>): Promise<Incident> {
    const incident = this.incidents.get(id);
    if (!incident) {
      throw new Error(`Incident ${id} not found`);
    }

    const updated = { ...incident, ...updates, id, last_updated: new Date() };
    this.incidents.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.incidents.delete(id);
  }

  async findBySimilarTitle(title: string, threshold: number): Promise<Incident[]> {
    // Placeholder for full-text search implementation
    // In production, use database full-text search
    return Array.from(this.incidents.values()).filter(
      i => i.title.toLowerCase().includes(title.toLowerCase())
    );
  }
}

class InMemoryTimelineRepository implements ITimelineRepository {
  private timeline = new Map<string, TimelineEvent[]>();

  async create(event: TimelineEvent): Promise<TimelineEvent> {
    const events = this.timeline.get(event.incident_id) || [];
    events.push({ ...event });
    this.timeline.set(event.incident_id, events);
    return event;
  }

  async findByIncidentId(incidentId: string): Promise<TimelineEvent[]> {
    return (this.timeline.get(incidentId) || []).map(e => ({ ...e }));
  }

  async deleteByIncidentId(incidentId: string): Promise<boolean> {
    return this.timeline.delete(incidentId);
  }
}

class InMemorySourceRepository implements ISourceRepository {
  private sources = new Map<string, Source>();

  async create(source: Source): Promise<Source> {
    this.sources.set(source.id, { ...source });
    return this.findById(source.id) as Promise<Source>;
  }

  async findById(id: string): Promise<Source | null> {
    const source = this.sources.get(id);
    return source ? { ...source } : null;
  }

  async findAll(): Promise<Source[]> {
    return Array.from(this.sources.values()).map(s => ({ ...s }));
  }

  async update(id: string, updates: Partial<Source>): Promise<Source> {
    const source = this.sources.get(id);
    if (!source) {
      throw new Error(`Source ${id} not found`);
    }

    const updated = { ...source, ...updates, id };
    this.sources.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.sources.delete(id);
  }
}

class InMemoryAlertRepository implements IAlertRepository {
  private alerts = new Map<string, Alert>();

  async create(alert: Alert): Promise<Alert> {
    this.alerts.set(alert.id, { ...alert });
    return alert;
  }

  async findByIncidentId(incidentId: string): Promise<Alert[]> {
    return Array.from(this.alerts.values())
      .filter(a => a.incident_id === incidentId)
      .map(a => ({ ...a }));
  }

  async deleteByIncidentId(incidentId: string): Promise<boolean> {
    let count = 0;
    for (const [key, alert] of this.alerts.entries()) {
      if (alert.incident_id === incidentId) {
        this.alerts.delete(key);
        count++;
      }
    }
    return count > 0;
  }
}

export class InMemoryDatabase implements IDatabase {
  incidents: IIncidentRepository;
  timelines: ITimelineRepository;
  sources: ISourceRepository;
  alerts: IAlertRepository;
  private connected = false;

  constructor() {
    this.incidents = new InMemoryIncidentRepository();
    this.timelines = new InMemoryTimelineRepository();
    this.sources = new InMemorySourceRepository();
    this.alerts = new InMemoryAlertRepository();
  }

  async connect(): Promise<void> {
    this.connected = true;
    console.log('Connected to in-memory database');
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    console.log('Disconnected from in-memory database');
  }

  isConnected(): boolean {
    return this.connected;
  }
}
