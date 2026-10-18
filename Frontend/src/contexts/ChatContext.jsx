import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "./AuthContext";

const ChatContext = createContext(null);
const API_URL = import.meta.env.VITE_API_URL || window.location.origin;

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat must be used within ChatProvider");
  return context;
};

export const ChatProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const activeContactId = useRef(null);

  const refreshUnread = useCallback(async () => {
    const token = localStorage.getItem("authToken");
    if (!token) return;
    try {
      const response = await axios.get(`${API_URL}/api/chat/contacts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUnreadCount(
        response.data.data.reduce(
          (total, contact) => total + contact.unreadCount,
          0,
        ),
      );
    } catch {
      // The chat view reports request errors; a stale badge should not block the rest of the app.
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setSocket(null);
      setUnreadCount(0);
      activeContactId.current = null;
      return undefined;
    }

    const token = localStorage.getItem("authToken");
    if (!token) return undefined;
    const connection = io(API_URL, { auth: { token } });
    setSocket(connection);
    refreshUnread();

    const handleMessage = (message) => {
      const isActiveConversation =
        String(activeContactId.current) === String(message.senderId);
      if (!isActiveConversation) {
        setUnreadCount((count) => count + 1);
        toast.info(
          `${message.sender?.name || "New message"}: ${message.content}`,
          {
            onClick: () => window.location.assign("/chat"),
          },
        );
      }
      if (
        document.hidden &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        new Notification(message.sender?.name || "New message", {
          body: message.content,
        });
      }
    };
    const handleRead = () => refreshUnread();
    connection.on("chat:message", handleMessage);
    connection.on("chat:read", handleRead);

    return () => {
      connection.off("chat:message", handleMessage);
      connection.off("chat:read", handleRead);
      connection.disconnect();
      setSocket(null);
    };
  }, [isAuthenticated, user?.id, refreshUnread]);

  const setActiveContact = useCallback((contactId) => {
    activeContactId.current = contactId ? String(contactId) : null;
  }, []);

  return (
    <ChatContext.Provider
      value={{ socket, unreadCount, refreshUnread, setActiveContact }}
    >
      {children}
    </ChatContext.Provider>
  );
};
