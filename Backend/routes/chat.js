import express from "express";
import mongoose from "mongoose";
import authorize from "../middlewares/authorize.js";
import ChatMessage from "../models/ChatMessage.js";
import Employee from "../models/Employee.js";

const router = express.Router();
router.use(authorize(["employee", "hr"]));

const getOtherRole = (role) => (role === "hr" ? "employee" : "hr");

router.get("/contacts", async (req, res) => {
  try {
    const contacts = await Employee.find({ role: getOtherRole(req.user.role) })
      .select("name email role position department profileImage status")
      .sort({ name: 1 })
      .lean();
    const contactIds = contacts.map((contact) => contact._id);

    const summaries = await ChatMessage.aggregate([
      {
        $match: {
          $or: [
            {
              sender: new mongoose.Types.ObjectId(req.user._id),
              recipient: { $in: contactIds },
            },
            {
              recipient: new mongoose.Types.ObjectId(req.user._id),
              sender: { $in: contactIds },
            },
          ],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $project: {
          contactId: {
            $cond: [
              { $eq: ["$sender", new mongoose.Types.ObjectId(req.user._id)] },
              "$recipient",
              "$sender",
            ],
          },
          content: 1,
          createdAt: 1,
          unread: {
            $and: [
              {
                $eq: ["$recipient", new mongoose.Types.ObjectId(req.user._id)],
              },
              { $eq: ["$readAt", null] },
            ],
          },
        },
      },
      {
        $group: {
          _id: "$contactId",
          lastMessage: {
            $first: { content: "$content", createdAt: "$createdAt" },
          },
          unreadCount: { $sum: { $cond: ["$unread", 1, 0] } },
        },
      },
    ]);

    const summaryByContact = new Map(
      summaries.map((item) => [String(item._id), item]),
    );
    return res.json({
      status: true,
      data: contacts.map((contact) => {
        const summary = summaryByContact.get(String(contact._id));
        return {
          ...contact,
          id: String(contact._id),
          lastMessage: summary?.lastMessage || null,
          unreadCount: summary?.unreadCount || 0,
        };
      }),
    });
  } catch (error) {
    console.error("Chat contacts error:", error);
    return res
      .status(500)
      .json({ status: false, message: "Unable to load chat contacts" });
  }
});

router.get("/messages/:contactId", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.contactId)) {
      return res
        .status(400)
        .json({ status: false, message: "Invalid contact" });
    }
    const contact = await Employee.findById(req.params.contactId).select(
      "_id role",
    );
    if (!contact || contact.role !== getOtherRole(req.user.role)) {
      return res
        .status(404)
        .json({ status: false, message: "Contact not found" });
    }

    const currentId = new mongoose.Types.ObjectId(req.user._id);
    const messages = await ChatMessage.find({
      $or: [
        { sender: currentId, recipient: contact._id },
        { sender: contact._id, recipient: currentId },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    return res.json({ status: true, data: messages.reverse() });
  } catch (error) {
    console.error("Chat messages error:", error);
    return res
      .status(500)
      .json({ status: false, message: "Unable to load messages" });
  }
});

export default router;
