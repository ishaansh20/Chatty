import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useSocket } from "../contexts/SocketContext";
import {
  ChatBubbleLeftRightIcon,
  ClockIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

const Home = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const { socket } = useSocket();

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (socket) {
      // Refresh conversations when a new message arrives
      socket.on("new-message", () => {
        fetchConversations();
      });

      socket.on("message-sent", () => {
        fetchConversations();
      });

      return () => {
        socket.off("new-message");
        socket.off("message-sent");
      };
    }
  }, [socket]);

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!searchQuery.trim()) {
      setSearchError("Please enter a username to search");
      return;
    }

    setSearching(true);
    setSearchError("");
    setSearchResult(null);

    try {
      const response = await axios.get(
        `/api/users/search?username=${encodeURIComponent(searchQuery.trim())}`,
        { withCredentials: true },
      );
      setSearchResult(response.data);
    } catch (error) {
      setSearchError(error.response?.data?.message || "User not found");
    } finally {
      setSearching(false);
    }
  };

  const handleStartChat = (userId) => {
    navigate(`/chat/${userId}`);
    setSearchQuery("");
    setSearchResult(null);
    setSearchError("");
  };

  const fetchConversations = async () => {
    try {
      const response = await axios.get("/api/messages/conversations/recent", {
        withCredentials: true,
      });
      setConversations(response.data);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 168) {
      // 7 days
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome to Chatty
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Search for users to start chatting
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchError("");
                  setSearchResult(null);
                }}
                placeholder="Search by username..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <button
              type="submit"
              disabled={searching || !searchQuery.trim()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed px-6"
            >
              {searching ? "Searching..." : "Search"}
            </button>
          </div>

          {/* Search Error */}
          {searchError && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {searchError}
            </p>
          )}

          {/* Search Result */}
          {searchResult && (
            <div className="mt-4 card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {searchResult.avatar ? (
                      <img
                        className="h-10 w-10 rounded-full"
                        src={searchResult.avatar}
                        alt={searchResult.username}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {searchResult.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {searchResult.username}
                    </p>
                    <div className="flex items-center space-x-2">
                      {searchResult.isOnline && (
                        <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {searchResult.isOnline ? "Online" : "Offline"}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleStartChat(searchResult._id)}
                  className="btn-primary"
                >
                  Start Chat
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Conversations Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Conversations
          </h2>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-4">
          {conversations.length === 0 ? (
            <div className="text-center py-12">
              <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No conversations yet
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Search a username to start chatting
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {conversations.map((conversation) => (
                <Link
                  key={conversation._id}
                  to={`/chat/${conversation._id}`}
                  className="card p-4 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {conversation.user.avatar ? (
                        <img
                          className="h-10 w-10 rounded-full"
                          src={conversation.user.avatar}
                          alt={conversation.user.username}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {conversation.user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {conversation.user.username}
                          </p>
                          {conversation.user.isOnline && (
                            <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                          )}
                          {conversation.unreadCount > 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          {conversation.lastMessage &&
                            formatTime(conversation.lastMessage.timestamp)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {conversation.lastMessage?.content || "No messages yet"}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
