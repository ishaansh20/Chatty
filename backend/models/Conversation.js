const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Ensure only 2 participants and unique pair
conversationSchema.index({ participants: 1 }, { unique: true });

// Method to find conversation between two users
conversationSchema.statics.findBetweenUsers = async function (
  userId1,
  userId2,
) {
  return this.findOne({
    participants: { $all: [userId1, userId2], $size: 2 },
  });
};

// Method to create or get conversation between two users
conversationSchema.statics.getOrCreate = async function (userId1, userId2) {
  let conversation = await this.findOne({
    participants: { $all: [userId1, userId2], $size: 2 },
  });

  if (!conversation) {
    conversation = await this.create({
      participants: [userId1, userId2],
    });
  }

  return conversation;
};

module.exports = mongoose.model("Conversation", conversationSchema);
