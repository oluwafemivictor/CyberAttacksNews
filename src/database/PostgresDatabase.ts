/**
 * PostgreSQL database implementation
 * Production-ready relational database support
 */

import { Pool, PoolClient } from 'pg';
import { Incident, TimelineEvent, Source, Alert } from '../models/incident';
import {
  IDatabase,
  IIncidentRepository,
  ITimelineRepository,
  ISourceRepository,
  IAlertRepository
} from './IDatabase';

class PostgresIncidentRepository implements IIncidentRepository {
  constructor(private pool: Pool) {}

  async create(incident: Incident): Promise<Incident> {
    const query = `
      INSERT INTO incidents (id, title, description, severity, status, discovery_date, last_updated)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const result = await this.pool.query(query, [
      incident.id,
      incident.title,
      incident.description,
      incident.severity,
      incident.status,
      incident.discovery_date,
      incident.last_updated
    ]);
    return this.rowToIncident(result.rows[0]);
  }

  async findById(id: string): Promise<Incident | null> {
    const query = 'SELECT * FROM incidents WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return result.rows.length > 0 ? this.rowToIncident(result.rows[0]) : null;
  }

  async findAll(filter?: { status?: string; severity?: string }): Promise<Incident[]> {
    let query = 'SELECT * FROM incidents ORDER BY discovery_date DESC';
    const params: any[] = [];

    if (filter?.status || filter?.severity) {
      const conditions = [];
      if (filter.status) {
        conditions.push(`status = $${params.length + 1}`);
        params.push(filter.status);
      }
      if (filter.severity) {
        conditions.push(`severity = $${params.length + 1}`);
        params.push(filter.severity);
      }
      query = `SELECT * FROM incidents WHERE ${conditions.join(' AND ')} ORDER BY discovery_date DESC`;
    }

    const result = await this.pool.query(query, params);
    return result.rows.map(row => this.rowToIncident(row));
  }

  async update(id: string, updates: Partial<Incident>): Promise<Incident> {
    const incident = await this.findById(id);
    if (!incident) {
      throw new Error(`Incident ${id} not found`);
    }

    const setClause: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id') {
        setClause.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    values.push(id);
    const query = `UPDATE incidents SET ${setClause.join(', ')}, last_updated = NOW() WHERE id = $${paramCount} RETURNING *`;
    const result = await this.pool.query(query, values);
    return this.rowToIncident(result.rows[0]);
  }

  async delete(id: string): Promise<void> {
    await this.pool.query('DELETE FROM incidents WHERE id = $1', [id]);
  }

  private rowToIncident(row: any): Incident {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      severity: row.severity as 'critical' | 'high' | 'medium' | 'low',
      status: row.status as 'reported' | 'confirmed' | 'ongoing' | 'mitigated' | 'resolved' | 'disputed',
      discovery_date: row.discovery_date,
      last_updated: row.last_updated
    };
  }
}

class PostgresTimelineRepository implements ITimelineRepository {
  constructor(private pool: Pool) {}

  async create(event: TimelineEvent): Promise<TimelineEvent> {
    const query = `
      INSERT INTO timeline_events (id, incident_id, event_type, timestamp, details)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await this.pool.query(query, [
      event.id,
      event.incident_id,
      event.event_type,
      event.timestamp,
      event.details
    ]);
    return this.rowToTimelineEvent(result.rows[0]);
  }

  async findByIncidentId(incident_id: string): Promise<TimelineEvent[]> {
    const query = 'SELECT * FROM timeline_events WHERE incident_id = $1 ORDER BY timestamp ASC';
    const result = await this.pool.query(query, [incident_id]);
    return result.rows.map(row => this.rowToTimelineEvent(row));
  }

  async findAll(): Promise<TimelineEvent[]> {
    const result = await this.pool.query('SELECT * FROM timeline_events ORDER BY timestamp DESC');
    return result.rows.map(row => this.rowToTimelineEvent(row));
  }

  async update(id: string, updates: Partial<TimelineEvent>): Promise<TimelineEvent> {
    const setClause: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id') {
        setClause.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    values.push(id);
    const query = `UPDATE timeline_events SET ${setClause.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await this.pool.query(query, values);
    return this.rowToTimelineEvent(result.rows[0]);
  }

  private rowToTimelineEvent(row: any): TimelineEvent {
    return {
      id: row.id,
      incident_id: row.incident_id,
      event_type: row.event_type,
      timestamp: row.timestamp,
      details: row.details
    };
  }
}

class PostgresSourceRepository implements ISourceRepository {
  constructor(private pool: Pool) {}

  async create(source: Source): Promise<Source> {
    const query = `
      INSERT INTO sources (id, incident_id, source_url, source_type)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await this.pool.query(query, [
      source.id,
      source.incident_id,
      source.source_url,
      source.source_type
    ]);
    return this.rowToSource(result.rows[0]);
  }

  async findByIncidentId(incident_id: string): Promise<Source[]> {
    const query = 'SELECT * FROM sources WHERE incident_id = $1';
    const result = await this.pool.query(query, [incident_id]);
    return result.rows.map(row => this.rowToSource(row));
  }

  async findAll(): Promise<Source[]> {
    const result = await this.pool.query('SELECT * FROM sources');
    return result.rows.map(row => this.rowToSource(row));
  }

  async delete(id: string): Promise<void> {
    await this.pool.query('DELETE FROM sources WHERE id = $1', [id]);
  }

  private rowToSource(row: any): Source {
    return {
      id: row.id,
      incident_id: row.incident_id,
      source_url: row.source_url,
      source_type: row.source_type
    };
  }
}

class PostgresAlertRepository implements IAlertRepository {
  constructor(private pool: Pool) {}

  async create(alert: Alert): Promise<Alert> {
    const query = `
      INSERT INTO alerts (id, incident_id, alert_type, status, created_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await this.pool.query(query, [
      alert.id,
      alert.incident_id,
      alert.alert_type,
      alert.status,
      alert.created_at
    ]);
    return this.rowToAlert(result.rows[0]);
  }

  async findByIncidentId(incident_id: string): Promise<Alert[]> {
    const query = 'SELECT * FROM alerts WHERE incident_id = $1 ORDER BY created_at DESC';
    const result = await this.pool.query(query, [incident_id]);
    return result.rows.map(row => this.rowToAlert(row));
  }

  async findAll(): Promise<Alert[]> {
    const result = await this.pool.query('SELECT * FROM alerts ORDER BY created_at DESC');
    return result.rows.map(row => this.rowToAlert(row));
  }

  async updateStatus(id: string, status: string): Promise<Alert> {
    const query = 'UPDATE alerts SET status = $1 WHERE id = $2 RETURNING *';
    const result = await this.pool.query(query, [status, id]);
    return this.rowToAlert(result.rows[0]);
  }

  private rowToAlert(row: any): Alert {
    return {
      id: row.id,
      incident_id: row.incident_id,
      alert_type: row.alert_type,
      status: row.status,
      created_at: row.created_at
    };
  }
}

export class PostgresDatabase implements IDatabase {
  private pool: Pool;
  public incidents: IIncidentRepository;
  public timeline: ITimelineRepository;
  public sources: ISourceRepository;
  public alerts: IAlertRepository;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.incidents = new PostgresIncidentRepository(this.pool);
    this.timeline = new PostgresTimelineRepository(this.pool);
    this.sources = new PostgresSourceRepository(this.pool);
    this.alerts = new PostgresAlertRepository(this.pool);
  }

  async connect(): Promise<void> {
    try {
      const client = await this.pool.connect();
      console.log('✓ Connected to PostgreSQL database');
      client.release();
    } catch (error) {
      console.error('✗ Failed to connect to PostgreSQL:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.pool.end();
    console.log('✓ Disconnected from PostgreSQL database');
  }

  async initialize(): Promise<void> {
    await this.createTables();
  }

  private async createTables(): Promise<void> {
    const client = await this.pool.connect();
    try {
      // Create incidents table
      await client.query(`
        CREATE TABLE IF NOT EXISTS incidents (
          id VARCHAR(36) PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          severity VARCHAR(20) NOT NULL,
          status VARCHAR(20) NOT NULL,
          discovery_date TIMESTAMP NOT NULL,
          last_updated TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create timeline_events table
      await client.query(`
        CREATE TABLE IF NOT EXISTS timeline_events (
          id VARCHAR(36) PRIMARY KEY,
          incident_id VARCHAR(36) NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
          event_type VARCHAR(50) NOT NULL,
          timestamp TIMESTAMP NOT NULL,
          details TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create sources table
      await client.query(`
        CREATE TABLE IF NOT EXISTS sources (
          id VARCHAR(36) PRIMARY KEY,
          incident_id VARCHAR(36) NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
          source_url VARCHAR(500),
          source_type VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create alerts table
      await client.query(`
        CREATE TABLE IF NOT EXISTS alerts (
          id VARCHAR(36) PRIMARY KEY,
          incident_id VARCHAR(36) NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
          alert_type VARCHAR(50) NOT NULL,
          status VARCHAR(20) NOT NULL,
          created_at TIMESTAMP NOT NULL
        )
      `);

      // Create indices for better query performance
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
        CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
        CREATE INDEX IF NOT EXISTS idx_timeline_incident_id ON timeline_events(incident_id);
        CREATE INDEX IF NOT EXISTS idx_sources_incident_id ON sources(incident_id);
        CREATE INDEX IF NOT EXISTS idx_alerts_incident_id ON alerts(incident_id);
      `);

      console.log('✓ Database tables initialized');
    } catch (error) {
      console.error('✗ Failed to initialize tables:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}
