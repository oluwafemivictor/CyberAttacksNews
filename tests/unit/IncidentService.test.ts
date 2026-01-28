import { IncidentService } from '../../src/services/IncidentService';
import { IncidentBuilder } from '../../src/models/incident';

describe('IncidentService Status Transitions', () => {
  it('should allow valid transition from reported to confirmed', () => {
    const incident = new IncidentBuilder().withStatus('reported').build();
    IncidentService.createIncident(incident);

    const updated = IncidentService.updateIncidentStatus(incident.id, 'confirmed');
    expect(updated.status).toBe('confirmed');
  });

  it('should allow valid transition from confirmed to ongoing', () => {
    const incident = new IncidentBuilder().withStatus('confirmed').build();
    IncidentService.createIncident(incident);

    const updated = IncidentService.updateIncidentStatus(incident.id, 'ongoing');
    expect(updated.status).toBe('ongoing');
  });

  it('should prevent invalid transition from reported to resolved', () => {
    const incident = new IncidentBuilder().withStatus('reported').build();
    IncidentService.createIncident(incident);

    expect(() => {
      IncidentService.updateIncidentStatus(incident.id, 'resolved');
    }).toThrow('Invalid status transition');
  });

  it('should allow transition to disputed from any state', () => {
    const statuses = ['reported', 'confirmed', 'ongoing', 'mitigated', 'resolved'];
    
    for (const status of statuses) {
      const incident = new IncidentBuilder().withStatus(status as any).build();
      IncidentService.createIncident(incident);

      const updated = IncidentService.updateIncidentStatus(incident.id, 'disputed');
      expect(updated.status).toBe('disputed');
    }
  });

  it('should create timeline entry on status change', () => {
    const incident = new IncidentBuilder().withStatus('reported').build();
    IncidentService.createIncident(incident);

    IncidentService.updateIncidentStatus(incident.id, 'confirmed');
    const timeline = IncidentService.getTimeline(incident.id);

    const statusChangeEvent = timeline.find(e => e.event === 'status_changed');
    expect(statusChangeEvent).toBeDefined();
    expect(statusChangeEvent?.details.old_status).toBe('reported');
    expect(statusChangeEvent?.details.new_status).toBe('confirmed');
  });
});

describe('IncidentService CRUD', () => {
  it('should create and retrieve incident', () => {
    const incident = new IncidentBuilder()
      .withTitle('Test Incident')
      .withDescription('Test Description')
      .build();

    IncidentService.createIncident(incident);
    const retrieved = IncidentService.getIncident(incident.id);

    expect(retrieved).toEqual(incident);
  });

  it('should list incidents with filters', () => {
    const incident1 = new IncidentBuilder()
      .withTitle('Critical Issue')
      .withSeverity('critical')
      .withStatus('reported')
      .build();

    const incident2 = new IncidentBuilder()
      .withTitle('Minor Issue')
      .withSeverity('low')
      .withStatus('confirmed')
      .build();

    IncidentService.createIncident(incident1);
    IncidentService.createIncident(incident2);

    const critical = IncidentService.listIncidents({ severity: 'critical' });
    expect(critical).toHaveLength(1);
    expect(critical[0].title).toBe('Critical Issue');
  });

  it('should delete incident', () => {
    const incident = new IncidentBuilder().build();
    IncidentService.createIncident(incident);

    IncidentService.deleteIncident(incident.id);
    const retrieved = IncidentService.getIncident(incident.id);

    expect(retrieved).toBeNull();
  });
});
