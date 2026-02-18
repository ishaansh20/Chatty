// Migration script to add conversation references to existing messages
// Run this once: node migrate-messages.js

const mongoose = require("mongoose");
const Message = require("./models/Message");
const Conversation = require("./models/Conversation");
const User = require("./models/User");
require("dotenv").config();

async function migrateMessages() {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/chatty",
    );
    console.log("Connected to MongoDB");

    // Find all messages without a conversation field
    const messagesWithoutConversation = await Message.find({
      conversation: { $exists: false },
    });

    console.log(
      `Found ${messagesWithoutConversation.length} messages to migrate`,
    );

    let migrated = 0;
    let failed = 0;

    for (const message of messagesWithoutConversation) {
      try {
        // Get or create conversation for this message
        const conversation = await Conversation.getOrCreate(
          message.sender,
          message.receiver,
        );

        // Update message with conversation reference
        message.conversation = conversation._id;
        await message.save();

        // Update conversation's last message if needed
        if (
          !conversation.lastMessage ||
          new Date(message.timestamp) > new Date(conversation.lastMessageAt)
        ) {
          conversation.lastMessage = message._id;
          conversation.lastMessageAt = message.timestamp;
          await conversation.save();
        }

        migrated++;
      } catch (error) {
        console.error(
          `Failed to migrate message ${message._id}:`,
          error.message,
        );
        failed++;
      }
    }

    console.log(`\nMigration complete!`);
    console.log(`✅ Successfully migrated: ${migrated}`);
    console.log(`❌ Failed: ${failed}`);

    // Update all conversations to ensure they have the latest message
    const allConversations = await Conversation.find();
    console.log(`\nUpdating ${allConversations.length} conversations...`);

    for (const conv of allConversations) {
      const latestMessage = await Message.findOne({
        conversation: conv._id,
      }).sort({ timestamp: -1 });

      if (latestMessage) {
        conv.lastMessage = latestMessage._id;
        conv.lastMessageAt = latestMessage.timestamp;
        await conv.save();
      }
    }

    console.log("✅ All conversations updated!");
  } catch (error) {
    console.error("Migration error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Run migration
migrateMessages();
