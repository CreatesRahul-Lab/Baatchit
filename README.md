# 🗣️ Baatein - Real-Time Chat Room Application

A **fully serverless** real-time chat application built with Next.js and Socket.io, featuring multiple chat rooms, user management, and real-time notifications. Everything runs with a single `npm run dev` command!

![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Socket.io](https://img.shields.io/badge/Socket.io-4.7-green?style=flat-square&logo=socket.io)
![Serverless](https://img.shields.io/badge/Serverless-Ready-orange?style=flat-square)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-blue?style=flat-square&logo=tailwind-css)

> **🚀 Serverless Architecture**: No separate backend server needed! Socket.io runs as Next.js API routes. One command, one port, one deploy!

## ✨ Features

### Core Features
- 🔐 **Google Authentication** - Sign in with your Google account
- ✅ **Real-time messaging** with Socket.io
- 💬 **Multiple chat rooms** with independent conversations
- 👥 **User join/leave notifications** 
- ⌨️ **Typing indicators** to show when users are typing
- 😊 **Message reactions** with emoji support
- 💾 **Chat history persistence** with MongoDB - Messages saved automatically
- 📜 **Auto-load chat history** - See last 50 messages when joining
- 👤 **User list** showing online users in each room
- 🏠 **Room creation** and browsing
- 📱 **Responsive design** for desktop and mobile
- 💾 **Database integration** - All chats and user sessions stored in MongoDB

### Advanced Features
- 🛡️ **Message validation** and profanity filtering
- 🔌 **Connection status indicators**
- 🔄 **Auto-reconnection** on network issues
- 📊 **Real-time user count** and room statistics
- 🕐 **Message timestamps** and formatting
- ✅ **Input validation** for usernames and room names
- ⚠️ **Error handling** with user-friendly messages

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v6 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **npm** or **yarn** package manager
- **Google Cloud Account** - For OAuth authentication (free)

### Installation

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <your-repo-url>
   cd Baatein
   ```

2. **Install frontend dependencies**:
   ```bash
   npm install
   ```

3. **Install server dependencies**:
   ```bash
   cd server
   npm install
   cd ..
   ```

4. **Set up environment variables**:
   
   Update `.env.local` with your configuration:
   ```env
   # Database Configuration
   MONGODB_URL=mongodb://localhost:27017/baatein-chat
   DB_NAME=baatein-chat

   # NextAuth.js Configuration
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=generate-a-secret-key-here

   # Google OAuth (Get from Google Cloud Console)
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

   **Generate NEXTAUTH_SECRET**:
   ```bash
   openssl rand -base64 32
   ```

5. **Set up Google OAuth** (Required for authentication):
   
   Follow the detailed guide in [GOOGLE_AUTH_SETUP.md](./GOOGLE_AUTH_SETUP.md)
   
   Quick steps:
   - Go to https://console.cloud.google.com/
   - Create a new project
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add `http://localhost:3000/api/auth/callback/google` to redirect URIs
   - Copy Client ID and Secret to `.env.local`

   **Note**: Make sure MongoDB is running on your system before starting the application.

### Running the Application

**🚀 Single Command - Serverless Architecture:**

```bash
npm run dev
```

That's it! The application now runs entirely on Next.js with Socket.io integrated as API routes. No separate backend server needed!

### Access the Application

- **Application**: [http://localhost:3000](http://localhost:3000)
- **Socket.io Endpoint**: `ws://localhost:3000/api/socket`
- **Health Check**: [http://localhost:3000/api/health](http://localhost:3000/api/health)

## 📁 Project Structure

```
Baatein/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── layout.tsx          # Root layout with providers
│   │   ├── page.tsx            # Home page
│   │   └── globals.css         # Global styles
│   ├── components/             # React components
│   │   ├── ChatRoom.tsx        # Main chat interface
│   │   ├── JoinRoom.tsx        # Room join interface
│   │   ├── MessageList.tsx     # Message display
│   │   ├── MessageInput.tsx    # Message input with typing
│   │   ├── UserList.tsx        # Online users sidebar
│   │   ├── ConnectionStatus.tsx # Connection indicator
│   │   ├── EmojiPicker.tsx     # Emoji selector
│   │   └── ui/
│   │       └── Toaster.tsx     # Toast notifications
│   ├── contexts/
│   │   └── ChatContext.tsx     # Global chat state
│   └── lib/
│       └── types.ts            # TypeScript interfaces
├── server/
│   ├── index.js                # Socket.io server
│   └── package.json            # Server dependencies
├── public/                     # Static assets
├── .env.local                  # Environment variables
├── package.json                # Frontend dependencies
├── tsconfig.json               # TypeScript configuration
├── tailwind.config.js          # Tailwind CSS config
└── next.config.js              # Next.js configuration
```

## 🎯 Usage Guide

### Joining a Room

1. **Enter your username** (3-20 characters, alphanumeric with hyphens/underscores)
2. **Select a room**:
   - Choose from predefined rooms (General, Tech, Random, Gaming, Music)
   - Or create a custom room
3. Click **"Join Room"**

### Chatting

- **Send messages**: Type your message and press Enter or click Send
- **React to messages**: Hover over a message and click the emoji button
- **View typing indicators**: See when other users are typing
- **View online users**: Check the sidebar (desktop) or tap "Users" (mobile)

### Room Management

- **Leave a room**: Click "Leave Room" button in the header
- **Switch rooms**: Leave current room and join another
- **View room stats**: See user count and active users

## 🛠️ Technology Stack

### Serverless Full-Stack
- **Next.js 14** - React framework with App Router + API Routes
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Socket.io** - Integrated WebSocket server (runs on Next.js)
- **Socket.io Client** - Real-time communication
- **React Context API** - State management
- **bad-words** - Profanity filter
- **MongoDB** - Optional NoSQL database for persistence

## 🔧 Configuration

### Environment Variables (`.env.local`)

```env
# Socket.io now runs on Next.js API routes - no external server needed!
# MongoDB is optional for message persistence
MONGODB_URL=mongodb://localhost:27017/baatein-chat
DB_NAME=baatein-chat
```

**Note**: MongoDB is optional. The app works perfectly without it, storing data in-memory.

### MongoDB Setup (Optional)

MongoDB is **optional** for this application. The app works perfectly without it using in-memory storage.

If you want message persistence across server restarts:

1. **Install MongoDB Community Edition**:
   - Windows: [Download Installer](https://www.mongodb.com/try/download/community)
   - Mac: `brew install mongodb-community`
   - Linux: Follow [official docs](https://docs.mongodb.com/manual/installation/)

2. **Start MongoDB**:
   - Windows: MongoDB runs as a service automatically
   - Mac/Linux: `brew services start mongodb-community` or `sudo systemctl start mongod`

3. **Add to `.env.local`**:
   ```env
   MONGODB_URL=mongodb://localhost:27017/baatein-chat
   ```

## 📡 API Endpoints

### REST API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Server health check |
| `/api/rooms` | GET | List active rooms |
| `/api/messages/:room` | GET | Get room message history |

### Socket.io Events

#### Client to Server
- `joinRoom` - Join a chat room
- `leaveRoom` - Leave current room
- `sendMessage` - Send a message
- `typing` - Typing indicator
- `addReaction` - Add emoji reaction

#### Server to Client
- `message` - Receive a message
- `userJoined` - User joined notification
- `userLeft` - User left notification
- `userTyping` - Typing indicator
- `roomUsers` - List of users in room
- `roomList` - Available rooms
- `messageReaction` - Reaction update
- `error` - Error notification

## 🧪 Development

### Available Scripts

```bash
# Frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Server
cd server
npm run dev          # Start server with nodemon
npm start            # Start server in production
```

### Building for Production

1. **Build the frontend**:
   ```bash
   npm run build
   ```

2. **Start production servers**:
   ```bash
   # Terminal 1 - Server
   cd server
   npm start

   # Terminal 2 - Frontend
   npm start
   ```

## 🐛 Troubleshooting

### Common Issues

1. **"Cannot connect to Socket.io"**
   - Make sure the Next.js dev server is running (`npm run dev`)
   - Clear browser cache and reload
   - Check browser console for Socket.io connection logs

2. **"MongoDB connection error"**
   - MongoDB is optional - the app works without it
   - If you want persistence, ensure MongoDB is running
   - Or remove MONGODB_URL from `.env.local` to use in-memory storage

3. **"Port 3000 already in use"**
   - Stop other Next.js applications
   - Or run on different port: `npm run dev -- -p 3001`

4. **TypeScript errors in IDE**
   - Run `npm install` to ensure all dependencies are installed
   - Restart TypeScript server: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

5. **Build errors**
   - Clear `.next` folder: `rm -rf .next` (or `rmdir /s .next` on Windows)
   - Clear node_modules: `rm -rf node_modules && npm install`

## 🔒 Security Features

- ✅ Input validation for usernames and room names
- ✅ Message length limits (500 characters)
- ✅ Profanity filtering on messages
- ✅ XSS protection with React's built-in escaping
- ✅ CORS configuration for allowed origins
- ✅ Username uniqueness per room

## 🚀 Deployment

### Deploy to Vercel (Frontend)

1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables:
   - `NEXT_PUBLIC_SOCKET_URL=https://your-backend-url.com`
4. Deploy!

### Deploy Backend (Server)

Options:
- **Heroku**: Follow [Heroku Node.js guide](https://devcenter.heroku.com/articles/deploying-nodejs)
- **Railway**: Use [Railway](https://railway.app/) for easy deployment
- **DigitalOcean**: Deploy on an [App Platform](https://www.digitalocean.com/products/app-platform)
- **AWS**: Use EC2 or Elastic Beanstalk

**Important**: Update MongoDB connection string to use a cloud database like [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

If you have any questions or issues, please open an issue on GitHub.

---

**Made with ❤️ using Next.js, Socket.io, and MongoDB**