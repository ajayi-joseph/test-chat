import { generateMessageId } from '../idGenerator.utils';

describe('generateMessageId', () => {
  it('should generate ID with correct format', () => {
    const id = generateMessageId();
    
    // Should match pattern: msg_[timestamp]_[random]
    expect(id).toMatch(/^msg_\d{13}_[a-z0-9]{9}$/);
  });

  it('should generate unique IDs', () => {
    const ids = new Set();
    const count = 1000;
    
    for (let i = 0; i < count; i++) {
      ids.add(generateMessageId());
    }
    
    // All IDs should be unique
    expect(ids.size).toBe(count);
  });

  it('should include current timestamp', () => {
    const before = Date.now();
    const id = generateMessageId();
    const after = Date.now();
    
    // Extract timestamp from ID
    const timestamp = parseInt(id.split('_')[1]);
    
    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
  });

  it('should have consistent length', () => {
    // Generate multiple IDs
    const ids = Array.from({ length: 10 }, () => generateMessageId());
    
    // All should have the same format length (accounting for timestamp variations)
    ids.forEach(id => {
      const parts = id.split('_');
      expect(parts).toHaveLength(3);
      expect(parts[0]).toBe('msg');
      expect(parts[1]).toHaveLength(13); // Timestamp
      expect(parts[2]).toHaveLength(9);  // Random part
    });
  });
});