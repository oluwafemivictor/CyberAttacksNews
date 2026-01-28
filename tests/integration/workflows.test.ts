import { IncidentService } from '../../src/services/IncidentService';
import { AlertService } from '../../src/services/AlertService';
import { IncidentBuilder } from '../../src/models/incident';

describe('AlertService Integration', () => {
  it('should trigger alert on new incident creation', async () => {
    const incident = new IncidentBuilder()
      .withTitle('Critical Issue')
      .withSeverity('critical')
      .build();

    IncidentService.createIncident(incident);
    await AlertService.notify(incident.id, 'NEW_INCIDENT', { incident });

    const alerts = AlertService.getAlerts(incident.id);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe('NEW_INCIDENT');
  });

  it('should trigger alert on status change', async () => {
    const incident = new IncidentBuilder().withStatus('reported').build();
    IncidentService.createIncident(incident);

    IncidentService.updateIncidentStatus(incident.id, 'confirmed');
    await AlertService.notify(incident.id, 'STATUS_CHANGE', {
      old_status: 'reported',
      new_status: 'confirmed'
    });

    const alerts = AlertService.getAlerts(incident.id);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe('STATUS_CHANGE');
  });

  it('should register and use webhooks', async () => {
    const incident = new IncidentBuilder().build();
    IncidentService.createIncident(incident);

    const webhookUrl = 'https://example.com/webhook';
    AlertService.registerWebhook(incident.id, webhookUrl);
    await AlertService.notify(incident.id, 'NEW_INCIDENT', { incident });

    const alerts = AlertService.getAlerts(incident.id);
    expect(alerts.length).toBeGreaterThan(0);
  });

  it('should clear alerts for incident', async () => {
    const incident = new IncidentBuilder().build();
    IncidentService.createIncident(incident);

    await AlertService.notify(incident.id, 'NEW_INCIDENT', { incident });
    let alerts = AlertService.getAlerts(incident.id);
    expect(alerts.length).toBeGreaterThan(0);

    AlertService.clearAlerts(incident.id);
    alerts = AlertService.getAlerts(incident.id);
    expect(alerts).toHaveLength(0);
  });
});
