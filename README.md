# 🧪 Real-time Chat Application

A modern real-time chat application built with React, TypeScript, Node.js, and Socket.IO. This project demonstrates production-ready patterns for building scalable real-time messaging systems.

## 🚀 Quick Start

```bash
# Clone and install
git clone [repository]
cd web-lead-tech-test

# Install all dependencies
cd backend && npm install
cd ../frontend && npm install

# Start both servers (in separate terminals)
cd backend && npm run dev    # Port 3001
cd frontend && npm run dev   # Port 5173
```


## 🎬 Demo


*See the real-time chat in action with typing indicators, message grouping, and instant delivery*

### Features Demonstrated:
- ⚡ Real-time message delivery
- 💬 Live typing indicators
- 👥 User switching
- 📱 Message grouping by sender and time

## 🏗️ Architecture Overview

### Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Zustand, Socket.IO Client, TanStack Query
- **Backend**: Node.js, Express, Socket.IO, TypeScript
- **Testing**: Jest, Vitest, React Testing Library
- **Styling**: Tailwind CSS

### Key Features
- ✅ Real-time bidirectional messaging
- ✅ Typing indicators with smart throttling
- ✅ Message grouping by time and sender
- ✅ Room-based conversation isolation
- ✅ Automatic reconnection handling
- ✅ Comprehensive test coverage
- ✅ Type-safe throughout

## 📐 Architectural Decisions

### 1. **Socket.IO Room-Based Architecture**
```typescript
// Consistent room naming ensures both users join the same conversation
private getRoomName(userId1: number, userId2: number): string {
  const [smaller, larger] = userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];
  return `conversation_${smaller}_${larger}`;
}
```
**Rationale**: Rooms provide natural conversation isolation without complex routing logic. The normalized naming ensures both participants always join the same room.

### 2. **Zustand for State Management**
```typescript
const useMessagesStore = create<MessagesStore>((set) => ({
  conversations: {},
  setConversationMessages: (key, messages) => {...},
  addMessage: (message) => {...}
}));
```
**Rationale**: Lightweight, TypeScript-friendly, and perfect for real-time updates without Redux boilerplate.

### 3. **Custom Hooks Pattern**
- `useSocket`: WebSocket connection lifecycle
- `useTyping`: Typing indicator management
- `useMessagesLoader`: HTTP message fetching
- `useChatActions`: Message sending and typing throttling

**Rationale**: Encapsulates complex logic, improves testability, and promotes reusability.

### 4. **Typing Indicator Throttling**
```typescript
// Frontend: 500ms throttle, 2s auto-stop
// Backend: 5s auto-stop (failsafe)
```
**Rationale**: Prevents server spam while maintaining responsive feel. Backend timeout prevents "ghost" indicators.

### 5. **Message Grouping Algorithm**
```typescript
// Groups messages by:
// - Same sender within 20 seconds
// - Hour boundaries for timestamps
// - Never groups system messages
```
**Rationale**: Improves readability and mimics popular chat UIs (WhatsApp, Slack).

## 🔄 Data Flow

### Message Flow
```
User types → Frontend throttles → Socket emits → Backend broadcasts to room → All clients update
```

### Typing Indicator Flow
```
User types → 500ms throttle → Socket emits → Backend tracks timeout → Room broadcast → UI updates
```

## 🎯 Assumptions & Trade-offs

### Assumptions
1. **No Authentication**: Simplified for demo purposes - users self-identify
2. **In-Memory Storage**: Messages don't persist across server restarts
3. **Two-User Conversations**: No group chat support currently
4. **Single Server**: No horizontal scaling considerations
5. **Mock Data**: Initial conversations are pre-populated

### Trade-offs Made

| Decision | Trade-off | Reasoning |
|----------|-----------|-----------|
| In-memory message storage | No persistence | Simplicity for demo; easy to add DB |
| Client-side message grouping | Computation on each render | Better UX flexibility |
| Typing throttle (500ms) | Slight delay vs. server load | Optimal balance found through testing |
| Room-based isolation | Memory per conversation | Scales well for typical use |
| Zustand over Redux | Less ecosystem | Simpler for this scope |

## 🧪 Testing Strategy

### Backend Testing
- **Unit Tests**: Services, handlers, utilities
- **Integration Tests**: Socket.IO events, API endpoints
- **Mocked Dependencies**: Isolated testing with Jest mocks

### Frontend Testing
- **Component Tests**: Vitest + React Testing Library
- **Hook Tests**: Custom hook behavior isolation
- **E2E Considerations**: Socket events mocked for reliability

## 🚦 Current Limitations

1. **No Database**: Messages lost on restart
2. **No Authentication**: Security not implemented
3. **No File Sharing**: Text messages only
4. **No Message History Pagination**: All messages loaded at once
5. **No Read Receipts**: No delivery/read status
6. **Basic Error Handling**: Could be more robust

## 🔮 Suggested Next Steps

### High Priority
1. **Add Database Layer**
   ```typescript
   // PostgreSQL with message table
   interface Message {
     id: uuid
     sender_id: number
     recipient_id: number
     content: text
     created_at: timestamp
     read_at: timestamp?
   }
   ```

2. **Implement Authentication**
   - JWT tokens
   - Secure socket connections
   - User session management

3. **Message Pagination**
   - Virtual scrolling for large conversations
   - Load messages in chunks
   - Implement "load more" functionality

### Medium Priority
4. **Enhanced Features**
   - Read receipts
   - Message reactions
   - File/image sharing
   - Message editing/deletion
   - Push notifications

5. **Performance Optimizations**
   - Redis for caching active conversations
   - Message compression
   - Optimize re-renders with React.memo

6. **Monitoring & Logging**
   - Structured logging (Winston/Pino)
   - Error tracking (Sentry)
   - Performance monitoring

### Nice to Have
7. **Advanced Features**
   - Group chat support
   - Voice/video calling
   - End-to-end encryption
   - Message search
   - User presence/online status

8. **DevOps Improvements**
   - Docker containerization
   - CI/CD pipeline
   - Health check endpoints
   - Kubernetes deployment configs

## 🔧 Development Tips

### Running Tests
```bash
# Backend tests
cd backend && npm test

# Frontend tests  
cd frontend && npm test
```

### Environment Variables
```env
# Backend (.env)
PORT=3001
CORS_ORIGIN=http://localhost:5173

# Frontend (.env)
VITE_API_URL=http://localhost:3001
```

### Debugging Socket.IO
```javascript
// Enable debug mode
localStorage.debug = 'socket.io-client:*';
```

## 📊 Performance Considerations

- **Message Rendering**: Virtual scrolling needed for 1000+ messages
- **Typing Indicators**: Throttled to prevent performance issues
- **Socket Connections**: Connection pooling for multiple tabs
- **State Updates**: Careful use of refs to prevent re-renders

## 🔐 Security Considerations

**Current implementation lacks security features. Before production:**
- Add authentication/authorization
- Implement rate limiting
- Sanitize message content
- Use HTTPS/WSS
- Validate all inputs
- Implement CORS properly

## 📝 Code Quality Initiatives

- ✅ 100% TypeScript coverage
- ✅ Comprehensive test suites
- ✅ ESLint configuration
- ✅ Consistent code formatting
- ✅ Clear separation of concerns
- ✅ SOLID principles applied

## 🤝 Contributing

1. Follow existing patterns
2. Add tests for new features
3. Update types when needed
4. Keep components focused
5. Document complex
