import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import ChatMessage from "./models/ChatMessage.js";
import Employee from "./models/Employee.js";

const userRoom = (userId) => `user:${userId}`;
const getOtherRole = (role) => (role === "hr" ? "employee" : "hr");

export default function attachChatSocket(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication required"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await Employee.findById(decoded._id).select(
        "_id role name profileImage",
      );
      if (
        !user ||
        user.role !== decoded.role ||
        !["employee", "hr"].includes(user.role)
      ) {
        return next(new Error("Unauthorized"));
      }
      socket.user = user;
      return next();
    } catch {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const currentUser = socket.user;
    const currentId = new mongoose.Types.ObjectId(currentUser._id);
    socket.join(userRoom(currentId));

    socket.on("chat:send", async (payload, acknowledge = () => {}) => {
      try {
        const recipientId = payload?.recipientId;
        const content =
          typeof payload?.content === "string" ? payload.content.trim() : "";
        if (
          !mongoose.isValidObjectId(recipientId) ||
          !content ||
          content.length > 4000
        ) {
          return acknowledge({
            status: false,
            message: "Enter a message up to 4000 characters",
          });
        }
        const recipient = await Employee.findById(recipientId).select(
          "_id role name profileImage",
        );
        if (!recipient || recipient.role !== getOtherRole(currentUser.role)) {
          return acknowledge({
            status: false,
            message: "This chat is not available",
          });
        }

        const message = await ChatMessage.create({
          sender: currentId,
          recipient: recipient._id,
          content,
        });
        const serialized = {
          id: String(message._id),
          senderId: String(currentId),
          recipientId: String(recipient._id),
          content: message.content,
          createdAt: message.createdAt,
          readAt: message.readAt,
        };
        io.to(userRoom(recipient._id)).emit("chat:message", {
          ...serialized,
          sender: {
            id: String(currentId),
            name: currentUser.name,
            profileImage: currentUser.profileImage,
          },
        });
        return acknowledge({ status: true, data: serialized });
      } catch (error) {
        console.error("Chat send error:", error);
        return acknowledge({
          status: false,
          message: "Message could not be sent",
        });
      }
    });

    socket.on("chat:read", async (payload, acknowledge = () => {}) => {
      try {
        const senderId = payload?.contactId;
        if (!mongoose.isValidObjectId(senderId))
          return acknowledge({ status: false });
        const sender = await Employee.findById(senderId).select("_id role");
        if (!sender || sender.role !== getOtherRole(currentUser.role)) {
          return acknowledge({ status: false });
        }
        const readAt = new Date();
        const result = await ChatMessage.updateMany(
          { sender: sender._id, recipient: currentId, readAt: null },
          { $set: { readAt } },
        );
        io.to(userRoom(sender._id)).emit("chat:read", {
          readerId: String(currentId),
          count: result.modifiedCount,
          readAt,
        });
        return acknowledge({ status: true, readAt });
      } catch (error) {
        console.error("Chat read receipt error:", error);
        return acknowledge({ status: false });
      }
    });
  });
}
