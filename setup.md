# Chatty Setup Instructions

## Prerequisites
- Node.js (v18 or higher)
- MongoDB (local installation or MongoDB Atlas)
- Git

## Installation Steps

### 1. Install Dependencies
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Setup

#### Backend Environment
Create a `.env` file in the `backend` directory:
```bash
cp backend/env.example backend/.env
```

Edit `backend/.env` with your configuration:
```
MONGODB_URI=mongodb://localhost:27017/chatty
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
PORT=5000
NODE_ENV=development
```

#### Frontend Environment (Optional)
Create a `.env` file in the `frontend` directory:
```bash
cp frontend/env.example frontend/.env
```

Edit `frontend/.env` if needed:
```
VITE_SERVER_URL=http://localhost:5000
```

### 3. Start MongoDB
Make sure MongoDB is running on your system:
- **Local MongoDB**: Start your local MongoDB service
- **MongoDB Atlas**: Use your cloud connection string in the `.env` file

### 4. Run the Application

#### Development Mode (Recommended)
```bash
# From the root directory
npm run dev
```

This will start both the backend server (port 5000) and frontend development server (port 5173).

#### Manual Start
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 5. Access the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## Features Included

✅ **Authentication**
- JWT-based authentication
- Secure password hashing with bcrypt
- Cookie-based session management

✅ **Real-time Chat**
- Socket.io for real-time messaging
- Typing indicators
- Online/offline status
- Message timestamps

✅ **User Management**
- User registration and login
- Profile editing
- Avatar support
- User status tracking

✅ **Responsive UI**
- Mobile-friendly design
- Dark/Light mode toggle
- Tailwind CSS styling
- Modern component structure

✅ **Security**
- Protected routes
- Input validation
- CORS configuration
- Secure cookie handling

## Project Structure
```
chatty-app/
├── backend/                 # Express.js backend
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── middleware/          # Custom middleware
│   └── server.js           # Main server file
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   └── App.jsx         # Main app component
└── package.json           # Root package.json
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check your connection string in `.env`
   - Verify MongoDB service is accessible

2. **Port Already in Use**
   - Change the PORT in backend `.env`
   - Update frontend proxy in `vite.config.js`

3. **CORS Issues**
   - Check CORS configuration in `backend/server.js`
   - Ensure frontend URL is correct

4. **Socket.io Connection Issues**
   - Verify backend server is running
   - Check Socket.io configuration
   - Ensure proper authentication token

### Development Tips

- Use browser dev tools to monitor network requests
- Check backend console for error messages
- Use MongoDB Compass to inspect database
- Monitor Socket.io events in browser console

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production` in backend `.env`
2. Use a production MongoDB instance
3. Configure proper CORS origins
4. Use HTTPS in production
5. Set secure cookie options
6. Build frontend: `cd frontend && npm run build`
7. Serve static files from backend

## Support

If you encounter any issues:
1. Check the console for error messages
2. Verify all environment variables are set
3. Ensure all dependencies are installed
4. Check MongoDB connection
5. Verify ports are available
