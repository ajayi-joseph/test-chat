import { createMockConversation } from '../conversation.mocks';

describe('createMockConversation', () => {
  it('should create conversation between specified users', () => {
    const user1 = 5;
    const user2 = 10;
    const messages = createMockConversation(user1, user2);
    
    expect(messages).toHaveLength(3);
    
    // Check that messages are between the correct users
    messages.forEach(msg => {
      expect(
        (msg.senderId === user1 && msg.recipientId === user2) ||
        (msg.senderId === user2 && msg.recipientId === user1)
      ).toBe(true);
    });
  });

  it('should create messages with correct structure', () => {
    const messages = createMockConversation(1, 2);
    
    messages.forEach(msg => {
      expect(msg).toHaveProperty('senderId');
      expect(msg).toHaveProperty('recipientId');
      expect(msg).toHaveProperty('content');
      expect(msg).toHaveProperty('timestamp');
      expect(msg).not.toHaveProperty('id'); // ID should be added by service
    });
  });

  it('should create messages with valid timestamps', () => {
    const messages = createMockConversation(1, 2);
    const now = Date.now();
    
    messages.forEach(msg => {
      const timestamp = new Date(msg.timestamp).getTime();
      expect(timestamp).toBeLessThanOrEqual(now);
      expect(timestamp).toBeGreaterThan(now - 24 * 60 * 60 * 1000); // Within last 24 hours
    });
  });

  it('should create consistent conversation flow', () => {
    const messages = createMockConversation(1, 2);
    
    // First message from user 2 to user 1
    expect(messages[0].senderId).toBe(2);
    expect(messages[0].recipientId).toBe(1);
    expect(messages[0].content).toContain("Oxford");
    
    // Second message from user 1 to user 2
    expect(messages[1].senderId).toBe(1);
    expect(messages[1].recipientId).toBe(2);
    expect(messages[1].content).toContain("food festival");
    
    // Third message from user 2 to user 1
    expect(messages[2].senderId).toBe(2);
    expect(messages[2].recipientId).toBe(1);
    expect(messages[2].content).toContain("coffee");
  });

  it('should work with any user IDs', () => {
    const testCases = [
      [100, 200],
      [1, 2],
      [999, 1],
    ];
    
    testCases.forEach(([user1, user2]) => {
      const messages = createMockConversation(user1, user2);
      expect(messages).toHaveLength(3);
      
      // Verify the conversation includes both users
      const senderIds = messages.map(m => m.senderId);
      const recipientIds = messages.map(m => m.recipientId);
      
      expect([...senderIds, ...recipientIds]).toContain(user1);
      expect([...senderIds, ...recipientIds]).toContain(user2);
    });
  });
});