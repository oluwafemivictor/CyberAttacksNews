import { DeduplicationService } from '../../src/services/DeduplicationService';

describe('DeduplicationService', () => {
  it('should detect exact title duplicates with same source', () => {
    const existing = [
      {
        id: '123',
        title: 'Critical Security Breach',
        source_ids: ['cnn_feed']
      }
    ];

    const result = DeduplicationService.checkDuplicate(
      'Critical Security Breach',
      'cnn_feed',
      existing
    );

    expect(result.isDuplicate).toBe(true);
    expect(result.matchedIncidentId).toBe('123');
    expect(result.similarity).toBeGreaterThan(0.99);
  });

  it('should detect high-similarity titles across different sources', () => {
    const existing = [
      {
        id: '123',
        title: 'Major data breach affects 500,000 users',
        source_ids: ['blog1']
      }
    ];

    const result = DeduplicationService.checkDuplicate(
      'Major data breach impacts 500000 users',
      'news_feed',
      existing
    );

    expect(result.isDuplicate).toBe(true);
    expect(result.similarity).toBeGreaterThan(0.85);
  });

  it('should not flag dissimilar titles as duplicates', () => {
    const existing = [
      {
        id: '123',
        title: 'Critical Security Breach in Banking Sector',
        source_ids: ['feed1']
      }
    ];

    const result = DeduplicationService.checkDuplicate(
      'New vulnerability in open source library',
      'feed2',
      existing
    );

    expect(result.isDuplicate).toBe(false);
    expect(result.similarity).toBeLessThan(0.5);
  });

  it('should calculate string similarity correctly', () => {
    const similarity = DeduplicationService.calculateSimilarity(
      'hello world',
      'hello world'
    );
    expect(similarity).toBe(1);

    const partialSimilarity = DeduplicationService.calculateSimilarity(
      'hello world',
      'hello word'
    );
    expect(partialSimilarity).toBeGreaterThan(0.9);
  });
});
