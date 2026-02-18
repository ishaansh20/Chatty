import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const newSocket = io(
        import.meta.env.VITE_API_URL || "http://localhost:5000",
        {
          auth: {
            token: localStorage.getItem("token"),
          },
        },
      );

      newSocket.on("connect", () => {
        console.log("Connected to server");
        setSocket(newSocket);
      });

      newSocket.on("disconnect", () => {
        console.log("Disconnected from server");
      });

      newSocket.on("error", (error) => {
        console.error("Socket error:", error);
      });

      // Handle typing indicators
      newSocket.on("typing", (data) => {
        setTypingUsers((prev) => ({
          ...prev,
          [data.senderId]: data.isTyping,
        }));
      });

      newSocket.on("stop-typing", (data) => {
        setTypingUsers((prev) => {
          const newTypingUsers = { ...prev };
          delete newTypingUsers[data.senderId];
          return newTypingUsers;
        });
      });

      return () => {
        newSocket.close();
      };
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
  }, [user]);

  const sendMessage = (receiverId, content) => {
    if (socket) {
      socket.emit("send-message", { receiverId, content });
    }
  };

  const startTyping = (receiverId) => {
    if (socket) {
      socket.emit("typing", { receiverId, isTyping: true });
    }
  };

  const stopTyping = (receiverId) => {
    if (socket) {
      socket.emit("stop-typing", { receiverId });
    }
  };

  const value = {
    socket,
    onlineUsers,
    typingUsers,
    sendMessage,
    startTyping,
    stopTyping,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
