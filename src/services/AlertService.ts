import { Alert } from '../models/incident';
import { v4 as uuidv4 } from 'uuid';

// In-memory storage
const alerts = new Map<string, Alert>();
const webhookSubscriptions = new Map<string, string[]>();

export class AlertService {
  static registerWebhook(incidentId: string, webhookUrl: string): void {
    const urls = webhookSubscriptions.get(incidentId) || [];
    urls.push(webhookUrl);
    webhookSubscriptions.set(incidentId, urls);
  }

  static async notify(
    incidentId: string,
    type: 'STATUS_CHANGE' | 'NEW_INCIDENT' | 'INDEX_UPDATE',
    payload: Record<string, unknown>
  ): Promise<void> {
    const alert: Alert = {
      id: uuidv4(),
      incident_id: incidentId,
      type,
      triggered_at: new Date()
    };

    alerts.set(alert.id, alert);

    // Simulate webhook notifications
    const webhooks = webhookSubscriptions.get(incidentId) || [];
    for (const url of webhooks) {
      await this.sendWebhook(url, { alert, payload });
    }
  }

  private static async sendWebhook(
    url: string,
    data: Record<string, unknown>
  ): Promise<void> {
    // In production, this would make actual HTTP requests
    console.log(`[Webhook] POST ${url}`, data);
  }

  static getAlerts(incidentId: string): Alert[] {
    return Array.from(alerts.values()).filter(a => a.incident_id === incidentId);
  }

  static clearAlerts(incidentId: string): void {
    Array.from(alerts.entries()).forEach(([key, alert]) => {
      if (alert.incident_id === incidentId) {
        alerts.delete(key);
      }
    });
  }
}
