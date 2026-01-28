import { v4 as uuidv4 } from 'uuid';

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low';
export type IncidentStatus = 'reported' | 'confirmed' | 'ongoing' | 'mitigated' | 'resolved' | 'disputed';

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: SeverityLevel;
  status: IncidentStatus;
  discovery_date: Date;
  last_updated: Date;
  source_ids: string[];
  classifications: string[];
}

export interface TimelineEvent {
  id: string;
  incident_id: string;
  event: string;
  details: Record<string, unknown>;
  timestamp: Date;
}

export interface Source {
  id: string;
  name: string;
  type: 'rss' | 'json_api' | 'email';
  url: string;
  last_fetched?: Date;
}

export interface Alert {
  id: string;
  incident_id: string;
  type: 'STATUS_CHANGE' | 'NEW_INCIDENT' | 'INDEX_UPDATE';
  triggered_at: Date;
  webhook_url?: string;
}

export class IncidentBuilder {
  private incident: Incident;

  constructor() {
    this.incident = {
      id: uuidv4(),
      title: '',
      description: '',
      severity: 'medium',
      status: 'reported',
      discovery_date: new Date(),
      last_updated: new Date(),
      source_ids: [],
      classifications: []
    };
  }

  withTitle(title: string): IncidentBuilder {
    this.incident.title = title;
    return this;
  }

  withDescription(description: string): IncidentBuilder {
    this.incident.description = description;
    return this;
  }

  withSeverity(severity: SeverityLevel): IncidentBuilder {
    this.incident.severity = severity;
    return this;
  }

  withStatus(status: IncidentStatus): IncidentBuilder {
    this.incident.status = status;
    return this;
  }

  withDiscoveryDate(date: Date): IncidentBuilder {
    this.incident.discovery_date = date;
    return this;
  }

  addSourceId(sourceId: string): IncidentBuilder {
    this.incident.source_ids.push(sourceId);
    return this;
  }

  addClassification(classification: string): IncidentBuilder {
    this.incident.classifications.push(classification);
    return this;
  }

  build(): Incident {
    return { ...this.incident };
  }
}
