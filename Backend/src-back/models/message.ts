import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    text: {
      type: String,
    },

    fileUrl: {
      type: String,
    },

    fileType: {
      type: String,
    },

    fileName: {             
      type: String,
    },

    fileSize: {              
      type: Number,
    },

    isEdited: {
      type: Boolean,
      default: false,
    },

    status: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        delivered: {
          type: Date,
        },
        seen: {
          type: Date,
        },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);