import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";
import {
  ArrowLeftIcon,
  PaperAirplaneIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/24/outline";

const Chat = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { socket, sendMessage, startTyping, stopTyping, typingUsers } =
    useSocket();

  const [otherUser, setOtherUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    fetchUser();
    fetchMessages();
  }, [userId]);

  useEffect(() => {
    if (socket) {
      socket.on("new-message", handleNewMessage);
      socket.on("message-sent", handleMessageSent);
      socket.on("typing", handleTyping);
      socket.on("stop-typing", handleStopTyping);

      return () => {
        socket.off("new-message");
        socket.off("message-sent");
        socket.off("typing");
        socket.off("stop-typing");
      };
    }
  }, [socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`/api/users/${userId}`, {
        withCredentials: true,
      });
      setOtherUser(response.data);
    } catch (error) {
      console.error("Error fetching user:", error);
      navigate("/");
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`/api/messages/${userId}`, {
        withCredentials: true,
      });
      setMessages(response.data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewMessage = (message) => {
    // Only add message if it's for this conversation
    if (message.sender._id === userId || message.receiver._id === userId) {
      setMessages((prev) => [...prev, message]);
      // Scroll to bottom after new message
      setTimeout(() => scrollToBottom(), 100);
    }
  };

  const handleMessageSent = (message) => {
    setMessages((prev) => [...prev, message]);
    setSending(false);
    // Scroll to bottom after sending
    setTimeout(() => scrollToBottom(), 100);
  };

  const handleTyping = (data) => {
    if (data.senderId === userId) {
      setIsTyping(true);
    }
  };

  const handleStopTyping = (data) => {
    if (data.senderId === userId) {
      setIsTyping(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const messageContent = newMessage.trim();
    setNewMessage("");
    setSending(true);

    try {
      sendMessage(userId, messageContent);
    } catch (error) {
      console.error("Error sending message:", error);
      setSending(false);
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);

    if (e.target.value.trim()) {
      startTyping(userId);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(userId);
      }, 1000);
    } else {
      stopTyping(userId);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!currentUser || !otherUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            User not found
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            The user you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate("/")}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg lg:hidden"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div className="flex items-center space-x-3">
            {otherUser.avatar ? (
              <img
                className="h-8 w-8 rounded-full"
                src={otherUser.avatar}
                alt={otherUser.username}
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {otherUser.username.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {otherUser.username}
              </h2>
              <div className="flex items-center space-x-2">
                <div
                  className={`h-2 w-2 rounded-full ${otherUser.isOnline ? "bg-green-400" : "bg-gray-400"}`}
                ></div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {otherUser.isOnline ? "Online" : "Offline"}
                </span>
              </div>
            </div>
          </div>
        </div>
        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
          <EllipsisVerticalIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.sender._id === currentUser._id;

            return (
              <div
                key={message._id}
                className={`flex ${
                  isOwnMessage ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-sm ${
                    isOwnMessage
                      ? "bg-green-500 text-white rounded-br-none"
                      : "bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none border border-gray-200 dark:border-gray-600"
                  }`}
                >
                  <p className="text-sm break-words">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isOwnMessage
                        ? "text-green-100"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            );
          })
        )}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                {otherUser.username} is typing...
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="flex-1 input-field"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
