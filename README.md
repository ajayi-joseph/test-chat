# 🧪 Test Chat

Welcome to the Test Chat! This is a chat application built with modern web technologies, simulating a real-world codebase. We've provided a starting point with both frontend and backend implementations to help you get started quickly.

Your task is to take ownership of this project, refactor and improve the code, fix issues, and implement new features — just like a lead engineer would when inheriting an existing app.

Most of your time will be spent working in the `frontend/src/pages/chat` directory, which contains the core chat functionality of the application. This includes the chat interface, message handling, and user interactions.

## 📋 Prerequisites

- Node.js (v18+ recommended)
- npm (v9+)

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone git@github.com:muzzapp/web-lead-tech-test.git
   cd muzz-exercise
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   cd frontend
   npm install

   # Install backend dependencies
   cd ../backend
   npm install
   cd ..
   ```

3. **Start the development servers**
   ```bash
   # Start backend server (from backend directory)
   cd backend
   npm run dev

   # Start frontend server (from frontend directory)
   cd frontend
   npm run dev
   ```

## 📁 Project Structure

```
.
├── frontend/                        # Frontend application
│   ├── src/
│   │   ├── assets/                 # Static assets like images and hardcoded api
│   │   ├── components/             # Reusable UI components
│   │   │   ├── button/
│   │   │   ├── container/    
│   │   │   ├── tabs/            
│   │   │   └── user-card/    
│   │   ├── pages/                  # Page components
│   │   │   ├── chat/              # Chat functionality
│   │   │   │   ├── _components/   # Chat-specific components
│   │   │   │   │   ├── chat-tab/  # Main chat interface
│   │   │   │   │   │   └── _components/
│   │   │   │   │   │       └── message/  # Message components
│   │   │   │   │   ├── header/    # Chat header
│   │   │   │   │   ├── profile-tab/ # User profile - Changes not needed
│   │   │   │   │   └── tabs/      # Chat navigation
│   │   │   │   └── Chat.tsx       # Main chat page
│   │   │   └── home/              # Home page with user selection
│   │   ├── store/                 # State management
│   │   │   ├── messages.store.ts  # Message state
│   │   │   ├── page.store.ts      # Page navigation state
│   │   │   └── user.store.ts      # User state
│   │   └── App.tsx                # Root component
│   └── package.json
│
└── backend/                        # Backend application
    ├── src/
    │   ├── controllers/           # Request handlers
    │   ├── models/               # Data models
    │   ├── routes/              # API routes
    │   └── server.ts            # Server entry point
    └── package.json
```

### Backend Starter

We've included a basic backend starter to save you time, but feel free to:
- Use your own backend implementation
- Modify the existing backend
- Use a different technology stack
- Implement any additional features

The current backend is a simple Express.js server with basic user and message endpoints. You can find it in the `backend` directory.

### Key Frontend Directories

- **`frontend/src/pages/chat`**: Contains the main chat functionality
  - `_components/chat-tab`: Handles message display and input
  - `_components/message`: Individual message components
  - `_components/header`: Chat header with navigation
  - `_components/profile-tab`: User profile information

- **`frontend/src/store`**: State management
  - `messages.store.ts`: Manages chat messages
  - `user.store.ts`: Handles user data and authentication
  - `page.store.ts`: Controls page navigation

- **`frontend/src/components`**: Reusable UI components
  - `button`: Custom button component
  - `container`: Page container
  - `tabs`: Navigation tabs
  - `user-card`: User display component
