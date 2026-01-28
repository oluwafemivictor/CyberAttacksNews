import { Router, Request, Response } from 'express';
import { IncidentService } from '../services/IncidentService';
import { AlertService } from '../services/AlertService';
import { DeduplicationService } from '../services/DeduplicationService';
import { IncidentBuilder } from '../models/incident';

export const router = Router();

// Create incident
router.post('/incidents', (req: Request, res: Response) => {
  try {
    const { title, description, severity, discovery_date, source_ids, classifications } = req.body;

    const incident = new IncidentBuilder()
      .withTitle(title)
      .withDescription(description)
      .withSeverity(severity || 'medium')
      .withDiscoveryDate(new Date(discovery_date))
      .withStatus('reported')
      .build();

    if (source_ids) {
      source_ids.forEach((id: string) => {
        // Rebuild with source IDs (builder pattern limitation workaround)
        incident.source_ids.push(id);
      });
    }

    if (classifications) {
      classifications.forEach((cls: string) => {
        incident.classifications.push(cls);
      });
    }

    const created = IncidentService.createIncident(incident);
    AlertService.notify(created.id, 'NEW_INCIDENT', { incident: created });

    res.status(201).json(created);
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});

// Get incident
router.get('/incidents/:id', (req: Request, res: Response) => {
  const incident = IncidentService.getIncident(req.params.id);
  if (!incident) {
    res.status(404).json({ error: 'Incident not found' });
    return;
  }
  res.json(incident);
});

// List incidents
router.get('/incidents', (req: Request, res: Response) => {
  const { status, severity } = req.query;
  const incidents = IncidentService.listIncidents({
    status: status as any,
    severity: severity as string
  });
  res.json(incidents);
});

// Update incident status
router.patch('/incidents/:id/status', (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const incident = IncidentService.updateIncidentStatus(req.params.id, status);
    AlertService.notify(incident.id, 'STATUS_CHANGE', { incident });
    res.json(incident);
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});

// Get timeline
router.get('/incidents/:id/timeline', (req: Request, res: Response) => {
  const timeline = IncidentService.getTimeline(req.params.id);
  res.json(timeline);
});

// Add timeline event
router.post('/incidents/:id/timeline', (req: Request, res: Response) => {
  const { event, details } = req.body;
  const timelineEvent = IncidentService.addTimelineEvent(req.params.id, event, details);
  res.status(201).json(timelineEvent);
});

// Check for duplicates
router.post('/incidents/check-duplicate', (req: Request, res: Response) => {
  try {
    const { title, source } = req.body;
    const existing = IncidentService.listIncidents();
    const result = DeduplicationService.checkDuplicate(title, source, existing);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});
