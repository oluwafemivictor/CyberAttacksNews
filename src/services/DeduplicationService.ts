// Use require to avoid needing TS declarations at runtime
const levenshtein: any = require('js-levenshtein');

export interface DeduplicationResult {
  isDuplicate: boolean;
  matchedIncidentId?: string;
  similarity: number;
}

const DEDUP_THRESHOLD = 0.85; // 85% similarity

export class DeduplicationService {
  static calculateSimilarity(str1: string, str2: string): number {
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1;

    const distance = levenshtein(str1.toLowerCase(), str2.toLowerCase());
    return 1 - distance / maxLength;
  }

  static checkDuplicate(
    newTitle: string,
    newSource: string,
    existingIncidents: Array<{ id: string; title: string; source_ids: string[] }>
  ): DeduplicationResult {
    for (const incident of existingIncidents) {
      const similarity = this.calculateSimilarity(newTitle, incident.title);

      // Check if same source
      if (incident.source_ids.includes(newSource) && similarity > 0.7) {
        return {
          isDuplicate: true,
          matchedIncidentId: incident.id,
          similarity
        };
      }

      // Check for very high similarity across different sources
      if (similarity > DEDUP_THRESHOLD) {
        return {
          isDuplicate: true,
          matchedIncidentId: incident.id,
          similarity
        };
      }
    }

    return { isDuplicate: false, similarity: 0 };
  }
}
