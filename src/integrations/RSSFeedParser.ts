// Integration example: RSS Feed Parser

import { Source } from '../models/incident';
import { IncidentBuilder } from '../models/incident';

export interface ParsedFeedItem {
  title: string;
  description: string;
  published_date: string;
  source_url: string;
  severity?: string;
}

export class RSSFeedParser {
  static extractSeverityFromContent(title: string, description: string): string {
    const criticalKeywords = ['critical', 'emergency', 'cvss 10', 'rce'];
    const highKeywords = ['high', 'severe', 'cvss 9', 'exploit'];
    const mediumKeywords = ['medium', 'moderate', 'vulnerability'];

    const combined = `${title} ${description}`.toLowerCase();

    for (const keyword of criticalKeywords) {
      if (combined.includes(keyword)) return 'critical';
    }

    for (const keyword of highKeywords) {
      if (combined.includes(keyword)) return 'high';
    }

    for (const keyword of mediumKeywords) {
      if (combined.includes(keyword)) return 'medium';
    }

    return 'low';
  }

  static parseItem(item: ParsedFeedItem, source: Source) {
    const severity = item.severity || this.extractSeverityFromContent(
      item.title,
      item.description
    );

    return new IncidentBuilder()
      .withTitle(item.title)
      .withDescription(item.description)
      .withSeverity(severity as any)
      .withDiscoveryDate(new Date(item.published_date))
      .addSourceId(source.id)
      .build();
  }

  static normalizeTimestamp(dateString: string): string {
    // Returns ISO 8601 format
    return new Date(dateString).toISOString();
  }

  static validateRequired(item: Partial<ParsedFeedItem>): boolean {
    return !!(item.title && item.published_date && item.source_url);
  }
}
