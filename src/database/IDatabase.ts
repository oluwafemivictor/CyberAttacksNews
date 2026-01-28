/**
 * Repository interfaces for database abstraction
 * Allows swapping between in-memory, SQL, MongoDB, etc.
 */

import { Incident, TimelineEvent, Source, Alert } from '../models/incident';

export interface IIncidentRepository {
  create(incident: Incident): Promise<Incident>;
  findById(id: string): Promise<Incident | null>;
  findAll(filter?: { status?: string; severity?: string }): Promise<Incident[]>;
  update(id: string, incident: Partial<Incident>): Promise<Incident>;
  delete(id: string): Promise<boolean>;
  findBySimilarTitle(title: string, threshold: number): Promise<Incident[]>;
}

export interface ITimelineRepository {
  create(event: TimelineEvent): Promise<TimelineEvent>;
  findByIncidentId(incidentId: string): Promise<TimelineEvent[]>;
  deleteByIncidentId(incidentId: string): Promise<boolean>;
}

export interface ISourceRepository {
  create(source: Source): Promise<Source>;
  findById(id: string): Promise<Source | null>;
  findAll(): Promise<Source[]>;
  update(id: string, source: Partial<Source>): Promise<Source>;
  delete(id: string): Promise<boolean>;
}

export interface IAlertRepository {
  create(alert: Alert): Promise<Alert>;
  findByIncidentId(incidentId: string): Promise<Alert[]>;
  deleteByIncidentId(incidentId: string): Promise<boolean>;
}

export interface IDatabase {
  incidents: IIncidentRepository;
  timelines: ITimelineRepository;
  sources: ISourceRepository;
  alerts: IAlertRepository;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
}
