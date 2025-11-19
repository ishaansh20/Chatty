# Chatty - Real-time Chat Application

A modern real-time chat application built with the MERN stack (MongoDB, Express.js, React, Node.js) featuring JWT authentication, Socket.io for real-time messaging, and a responsive UI built with Tailwind CSS.

## Features

- 🔐 JWT-based authentication with secure password hashing
- 💬 Real-time messaging with Socket.io
- 👥 User management with online/offline status
- 🎨 Responsive UI with Tailwind CSS
- 📱 Mobile-friendly design
- 🌙 Dark/Light mode toggle
- ⌨️ Typing indicators
- 📅 Message timestamps and read status

## Tech Stack

### Backend
- Node.js & Express.js
- MongoDB with Mongoose
- Socket.io for real-time communication
- JWT for authentication
- bcrypt for password hashing
- cookie-parser for token management

### Frontend
- React with Vite
- Tailwind CSS for styling
- React Router for navigation
- Socket.io-client for real-time features

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or cloud instance)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm run install-all
   ```

3. Set up environment variables:
   - Copy `backend/.env.example` to `backend/.env`
   - Update the MongoDB connection string and JWT secret

4. Start the development servers:
   ```bash
   npm run dev
   ```

This will start both the backend server (port 5000) and frontend development server (port 5173).

## Project Structure

```
chatty-app/
├── backend/           # Express.js backend
│   ├── models/        # MongoDB models
│   ├── routes/        # API routes
│   ├── middleware/    # Custom middleware
│   └── utils/         # Utility functions
├── frontend/          # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   └── utils/         # Utility functions
└── package.json       # Root package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - Get all users
- `PUT /api/users/profile` - Update user profile

### Messages
- `GET /api/messages/:userId` - Get messages with specific user
- `POST /api/messages` - Send new message

## Environment Variables

Create a `.env` file in the backend directory:

```
MONGODB_URI=mongodb://localhost:27017/chatty
JWT_SECRET=your_jwt_secret_here
PORT=5000
```

## License

MIT
