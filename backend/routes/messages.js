const express = require("express");
const { body, validationResult } = require("express-validator");
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const User = require("../models/User");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Get messages with a specific user
router.get("/:userId", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify the other user exists
    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get messages between current user and the other user
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id },
      ],
    })
      .populate("sender", "username avatar")
      .populate("receiver", "username avatar")
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Mark messages as read
    await Message.updateMany(
      { sender: userId, receiver: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() },
    );

    res.json(messages.reverse()); // Return in chronological order
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Send a new message
router.post(
  "/",
  authenticateToken,
  [
    body("receiverId").isMongoId().withMessage("Invalid receiver ID"),
    body("content")
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage("Message content must be between 1 and 1000 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { receiverId, content } = req.body;

      // Verify receiver exists
      const receiver = await User.findById(receiverId);
      if (!receiver) {
        return res.status(404).json({ message: "Receiver not found" });
      }

      // Get or create conversation
      const conversation = await Conversation.getOrCreate(
        req.user._id,
        receiverId,
      );

      // Create message
      const message = new Message({
        conversation: conversation._id,
        sender: req.user._id,
        receiver: receiverId,
        content: content.trim(),
      });

      await message.save();

      // Update conversation's last message
      conversation.lastMessage = message._id;
      conversation.lastMessageAt = message.timestamp;
      await conversation.save();

      // Populate message data
      await message.populate("sender", "username avatar");
      await message.populate("receiver", "username avatar");

      res.status(201).json({
        message: "Message sent successfully",
        data: message,
      });
    } catch (error) {
      console.error("Send message error:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Get unread message count
router.get("/unread/count", authenticateToken, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiver: req.user._id,
      isRead: false,
    });

    res.json({ unreadCount: count });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Mark messages as read
router.put("/:userId/read", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    await Message.updateMany(
      { sender: userId, receiver: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() },
    );

    res.json({ message: "Messages marked as read" });
  } catch (error) {
    console.error("Mark as read error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get recent conversations
router.get("/conversations/recent", authenticateToken, async (req, res) => {
  try {
    // Find conversations where user is a participant and has a last message
    const conversations = await Conversation.find({
      participants: req.user._id,
      lastMessage: { $exists: true, $ne: null },
    })
      .populate("participants", "username email avatar isOnline lastSeen")
      .populate("lastMessage")
      .sort({ lastMessageAt: -1 });

    // Format the response to include the other user and unread count
    const formattedConversations = await Promise.all(
      conversations.map(async (conv) => {
        // Get the other user (not the current user)
        const otherUser = conv.participants.find(
          (p) => p._id.toString() !== req.user._id.toString(),
        );

        // Get unread count for this conversation
        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          receiver: req.user._id,
          isRead: false,
        });

        return {
          _id: otherUser._id,
          user: otherUser,
          lastMessage: conv.lastMessage,
          unreadCount,
        };
      }),
    );

    res.json(formattedConversations);
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
