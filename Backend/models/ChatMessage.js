import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    content: { type: String, required: true, maxlength: 4000, trim: true },
    readAt: { type: Date, default: null },
  },
  { timestamps: true },
);

chatMessageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });

export default mongoose.model("ChatMessage", chatMessageSchema);
