#!/usr/bin/env node

/**
 * CLI tool for CyberAttacksNews incident tracking
 * Examples:
 *   node cli create --title "Security Breach" --description "Details..." --severity critical
 *   node cli list --status ongoing --severity critical
 *   node cli status <id> --new-status confirmed
 *   node cli timeline <id>
 */

import { InMemoryDatabase } from '../database/InMemoryDatabase';
import { IncidentService } from '../services/IncidentServiceV2';
import { IncidentBuilder } from '../models/incident';
import { logger } from '../utils/Logger';

const db = new InMemoryDatabase();
const incidentService = new IncidentService(db);

interface CommandArgs {
  [key: string]: string | boolean;
}

function parseArgs(): { command: string; args: CommandArgs } {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  const params: CommandArgs = {};

  for (let i = 1; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].replace('--', '');
      params[key] = args[i + 1] || true;
      i++;
    }
  }

  return { command, args: params };
}

async function createIncident(args: CommandArgs): Promise<void> {
  try {
    const incident = new IncidentBuilder()
      .withTitle(args.title as string)
      .withDescription(args.description as string)
      .withSeverity((args.severity as string) || 'medium' as any)
      .withDiscoveryDate(new Date(args['discovery-date'] as string || Date.now()))
      .build();

    await db.connect();
    const created = await incidentService.createIncident(incident);
    console.log('✓ Created incident:');
    console.table(created);
  } catch (error) {
    logger.error('Failed to create incident', error);
  } finally {
    await db.disconnect();
  }
}

async function listIncidents(args: CommandArgs): Promise<void> {
  try {
    await db.connect();
    const incidents = await incidentService.listIncidents({
      status: args.status as any,
      severity: args.severity as string
    });

    console.log(`\n✓ Found ${incidents.length} incident(s)\n`);
    console.table(incidents.map(i => ({
      id: i.id.substring(0, 8),
      title: i.title.substring(0, 40),
      severity: i.severity,
      status: i.status,
      updated: new Date(i.last_updated).toLocaleString()
    })));
  } catch (error) {
    logger.error('Failed to list incidents', error);
  } finally {
    await db.disconnect();
  }
}

async function updateStatus(args: CommandArgs, incidentId: string): Promise<void> {
  try {
    await db.connect();
    const updated = await incidentService.updateIncidentStatus(
      incidentId,
      args['new-status'] as any
    );
    console.log('✓ Status updated:');
    console.log(`  ${updated.status.toUpperCase()} (${new Date(updated.last_updated).toLocaleString()})`);
  } catch (error) {
    logger.error('Failed to update status', error);
  } finally {
    await db.disconnect();
  }
}

async function showTimeline(incidentId: string): Promise<void> {
  try {
    await db.connect();
    const timeline = await incidentService.getTimeline(incidentId);

    console.log(`\n✓ Timeline for incident ${incidentId.substring(0, 8)}\n`);
    timeline.forEach(event => {
      console.log(`[${new Date(event.timestamp).toLocaleString()}] ${event.event}`);
      if (Object.keys(event.details).length > 0) {
        console.log(`   ${JSON.stringify(event.details)}`);
      }
    });
  } catch (error) {
    logger.error('Failed to fetch timeline', error);
  } finally {
    await db.disconnect();
  }
}

function showHelp(): void {
  console.log(`
CyberAttacksNews CLI Tool

USAGE:
  node cli <command> [options]

COMMANDS:
  create        Create new incident
                --title <text>        Required: incident title
                --description <text>  Required: incident description
                --severity <level>    Optional: critical|high|medium|low (default: medium)
                --discovery-date <date> Optional: ISO 8601 date (default: now)

  list          List incidents
                --status <status>     Optional: filter by status
                --severity <level>    Optional: filter by severity

  status        Update incident status
                --new-status <status> Required: new status

  timeline      Show incident timeline
                incident-id           Required: incident UUID or partial ID

  help          Show this help message

EXAMPLES:
  node cli create --title "SQL Injection Attack" --description "Malicious SQL queries detected" --severity high

  node cli list --status ongoing

  node cli status <incident-id> --new-status confirmed

  node cli timeline <incident-id>
  `);
}

async function main(): Promise<void> {
  const { command, args } = parseArgs();

  switch (command) {
    case 'create':
      await createIncident(args);
      break;
    case 'list':
      await listIncidents(args);
      break;
    case 'status':
      if (args._?.[0]) {
        await updateStatus(args, args._[0] as string);
      } else {
        console.error('✗ Incident ID required');
      }
      break;
    case 'timeline':
      if (args._?.[0]) {
        await showTimeline(args._[0] as string);
      } else {
        console.error('✗ Incident ID required');
      }
      break;
    case 'help':
    default:
      showHelp();
  }
}

main().catch(error => {
  logger.error('CLI error', error);
  process.exit(1);
});
