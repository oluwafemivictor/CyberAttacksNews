/**
 * Example: Complete workflow for processing incident from external source
 * This demonstrates the key patterns described in copilot-instructions.md
 */

import { IncidentService } from '../services/IncidentService';
import { AlertService } from '../services/AlertService';
import { DeduplicationService } from '../services/DeduplicationService';
import { IncidentBuilder } from '../models/incident';
import { RSSFeedParser } from '../integrations/RSSFeedParser';

export class IncidentIngestionWorkflow {
  /**
   * Process item from external feed:
   * 1. Parse feed data
   * 2. Deduplicate against existing incidents
   * 3. Extract severity from content
   * 4. Create incident with initial status
   * 5. Trigger alerts for high/critical severity
   */
  static async ingestFromFeed(
    feedItem: any,
    sourceId: string
  ): Promise<string | null> {
    // Step 1: Parse feed data
    const parser = new RSSFeedParser();
    if (!parser.validateRequired(feedItem)) {
      console.warn('Feed item missing required fields');
      return null;
    }

    const severity = parser.extractSeverityFromContent(
      feedItem.title,
      feedItem.description
    );

    // Step 2: Deduplicate
    const existing = IncidentService.listIncidents();
    const dupCheck = DeduplicationService.checkDuplicate(
      feedItem.title,
      sourceId,
      existing
    );

    if (dupCheck.isDuplicate) {
      console.log(
        `Incident ${dupCheck.matchedIncidentId} already exists ` +
        `(${(dupCheck.similarity * 100).toFixed(1)}% similar)`
      );
      return dupCheck.matchedIncidentId || null;
    }

    // Step 3 & 4: Create incident
    const incident = new IncidentBuilder()
      .withTitle(feedItem.title)
      .withDescription(feedItem.description)
      .withSeverity(severity as any)
      .withDiscoveryDate(new Date(feedItem.published_date))
      .addSourceId(sourceId)
      .build();

    IncidentService.createIncident(incident);
    console.log(`Created incident ${incident.id}: ${incident.title}`);

    // Step 5: Trigger alerts for high/critical
    if (severity === 'critical' || severity === 'high') {
      await AlertService.notify(incident.id, 'NEW_INCIDENT', { incident });
    }

    return incident.id;
  }

  /**
   * Complete incident lifecycle example
   */
  static async completeWorkflow(): Promise<void> {
    // Create incident
    const incident = new IncidentBuilder()
      .withTitle('Zero-day vulnerability in OpenSSL')
      .withDescription('Critical remote code execution vulnerability discovered')
      .withSeverity('critical')
      .addSourceId('security_feeds')
      .addClassification('zero-day')
      .build();

    IncidentService.createIncident(incident);
    console.log(`✓ Created: ${incident.id}`);

    // Register webhooks
    AlertService.registerWebhook(
      incident.id,
      'https://company.com/alerts'
    );

    // Trigger initial alert
    await AlertService.notify(incident.id, 'NEW_INCIDENT', { incident });
    console.log('✓ Sent NEW_INCIDENT alert');

    // Add timeline event for confirmation
    IncidentService.addTimelineEvent(incident.id, 'evidence_collected', {
      evidence_type: 'CVE reference',
      link: 'https://cve.org/...'
    });

    // Confirm incident
    const confirmed = IncidentService.updateIncidentStatus(
      incident.id,
      'confirmed'
    );
    console.log(`✓ Status: ${incident.status} → ${confirmed.status}`);

    // Trigger status change alert
    await AlertService.notify(incident.id, 'STATUS_CHANGE', {
      old_status: incident.status,
      new_status: confirmed.status
    });
    console.log('✓ Sent STATUS_CHANGE alert');

    // Mark as ongoing
    const ongoing = IncidentService.updateIncidentStatus(
      incident.id,
      'ongoing'
    );
    console.log(`✓ Status: ${confirmed.status} → ${ongoing.status}`);

    // Add mitigation timeline
    IncidentService.addTimelineEvent(incident.id, 'mitigation_deployed', {
      action: 'Applied security patch to servers',
      affected_systems: 1250
    });

    // Mark as mitigated
    const mitigated = IncidentService.updateIncidentStatus(
      incident.id,
      'mitigated'
    );
    console.log(`✓ Status: ${ongoing.status} → ${mitigated.status}`);

    // Add resolution timeline
    IncidentService.addTimelineEvent(incident.id, 'incident_resolved', {
      closure_reason: 'All systems patched and verified'
    });

    // Mark as resolved
    const resolved = IncidentService.updateIncidentStatus(
      incident.id,
      'resolved'
    );
    console.log(`✓ Status: ${mitigated.status} → ${resolved.status}`);

    // Retrieve final state
    const final = IncidentService.getIncident(incident.id);
    const timeline = IncidentService.getTimeline(incident.id);

    console.log('\n✓ Final Timeline:');
    timeline.forEach(event => {
      console.log(`  [${event.timestamp.toISOString()}] ${event.event}`);
    });
  }
}
