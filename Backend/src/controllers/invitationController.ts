import  Invitation  from "../models/invitation";
import Conversation from "../models/conversation";

// POST /api/invitations/send
export const sendInvitation = async (req: any, res: any) => {
  try {
    const senderId = req.user._id;
    const { receiverId } = req.body;

    const existingConversation = await Conversation.findOne({
      type: "private",
      participants: { $all: [senderId, receiverId] },
    });
    if (existingConversation) {
      return res.status(400).json({ message: "Already contacts" });
    }

    const rejected: any = await Invitation.findOne({
      sender: senderId,
      receiver: receiverId,
      status: "rejected",
    });

    if (rejected) {
      const hoursSinceRejection =
        (Date.now() - new Date(rejected.rejectedAt).getTime()) /
        (1000 * 60 * 60);
        
      if (hoursSinceRejection < 24) {
        return res.status(400).json({
          message: `You can send another invite after ${Math.ceil(
            24 - hoursSinceRejection
          )} hours`,
        });
      }
    }

    const existing = await Invitation.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
      status: "pending",
    });

    if (existing) {
      return res.status(400).json({ message: "Invitation already sent" });
    }

    const invitation = await Invitation.create({
      sender: senderId,
      receiver: receiverId,
    });

    const populated = await invitation.populate("sender", "username email");

    res.json({ invitation: populated });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/invitations/accept
export const acceptInvitation = async (req: any, res: any) => {
  try {
    const { invitationId } = req.body;

    const invitation = await Invitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found" });
    }
    if (invitation.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // update status
    invitation.status = "accepted";
    await invitation.save();

    // create conversation between both users
    const conversation = await Conversation.create({
      type: "private",
      participants: [invitation.sender, invitation.receiver],
    });

    const populated = await conversation.populate(
      "participants",
      "username email"
    );

    res.json({ conversation: populated });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/invitations/reject
export const rejectInvitation = async (req: any, res: any) => {
  try {
    const { invitationId } = req.body;

    const invitation = await Invitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found" });
    }

    // update status + set rejectedAt for 24hr cooldown
    invitation.status = "rejected";
    invitation.rejectedAt = new Date();
    await invitation.save();

    res.json({ message: "Invitation rejected" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/invitations/pending
export const getPendingInvitations = async (req: any, res: any) => {
  try {
    const invitations = await Invitation.find({
      receiver: req.user.id,
      status: "pending",
    }).populate("sender", "username email");

    res.json({ invitations });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/invitations/status/:receiverId
export const getInvitationStatus = async (req: any, res: any) => {
  try {
    const senderId = req.user._id;
    const { receiverId } = req.params;

    const conversation = await Conversation.findOne({
      type: "private",
      participants: { $all: [senderId, receiverId] },
    });
    if (conversation) {
      return res.json({ status: "contacts" });
    }

    const invitation = await Invitation.findOne({
      sender: senderId,
      receiver: receiverId,
    });

    if (!invitation) return res.json({ status: "none" });
    return res.json({ status: invitation.status });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
