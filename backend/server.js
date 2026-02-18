const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { createServer } = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const messageRoutes = require("./routes/messages");
const { authenticateToken } = require("./middleware/auth");

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);

// Socket.io connection handling
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("Authentication error"));
  }

  const jwt = require("jsonwebtoken");
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (err) {
    next(new Error("Authentication error"));
  }
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.userId);

  // Join user to their personal room
  socket.join(socket.userId);

  // Handle typing events
  socket.on("typing", (data) => {
    socket.to(data.receiverId).emit("typing", {
      senderId: socket.userId,
      isTyping: data.isTyping,
    });
  });

  // Handle stop typing events
  socket.on("stop-typing", (data) => {
    socket.to(data.receiverId).emit("stop-typing", {
      senderId: socket.userId,
    });
  });

  // Handle new messages
  socket.on("send-message", async (data) => {
    try {
      const Message = require("./models/Message");
      const Conversation = require("./models/Conversation");

      // Get or create conversation
      const conversation = await Conversation.getOrCreate(
        socket.userId,
        data.receiverId,
      );

      const message = new Message({
        conversation: conversation._id,
        sender: socket.userId,
        receiver: data.receiverId,
        content: data.content,
        timestamp: new Date(),
      });

      await message.save();

      // Update conversation's last message
      conversation.lastMessage = message._id;
      conversation.lastMessageAt = message.timestamp;
      await conversation.save();

      // Populate message with user data before emitting
      await message.populate("sender", "username avatar");
      await message.populate("receiver", "username avatar");

      // Emit to receiver
      socket.to(data.receiverId).emit("new-message", message);

      // Emit to sender for confirmation
      socket.emit("message-sent", message);
    } catch (error) {
      console.error("Socket send message error:", error);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.userId);
  });
});

// Connect to MongoDB Atlas
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/chatty", {
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => {
    console.log("✅ Connected to MongoDB Atlas");
    console.log("📦 Database:", mongoose.connection.db.databaseName);
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// Handle MongoDB connection events
mongoose.connection.on("connected", () => {
  console.log("🔗 Mongoose connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
  console.error("❌ Mongoose connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("⚠️  Mongoose disconnected from MongoDB");
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
