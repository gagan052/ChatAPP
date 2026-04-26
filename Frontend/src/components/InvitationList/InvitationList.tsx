import { useEffect, useState } from "react";
import { socket } from "../../services/socket";
import { api } from "../../services/http";
import "./InvitationList.css";
import { onInvitationReceived, offInvitationReceived } from "../../features/invitation/socket";

interface Props {
  onBack: () => void; // ← called when user clicks back
}

const InvitationList = ({ onBack }: Props) => {
  const [invitations, setInvitations] = useState<any[]>([]);

  useEffect(() => {
    fetchInvitations();
  }, []);

  useEffect(() => {
    const handleNewInvite = (inv: any) => {
      setInvitations((prev) => [inv, ...prev]);
    };
    onInvitationReceived(handleNewInvite);
    return () => {
      offInvitationReceived(handleNewInvite);
    };
  }, []);

  const fetchInvitations = async () => {
    try {
      const data = await api("/api/invitations/pending");
      setInvitations(Array.isArray(data.invitations) ? data.invitations : []);
    } catch (err) {
      console.error("Failed to fetch invites", err);
    }
  };

  const acceptInvite = (id: string) => {
    socket.emit("accept_invitation", id);
    setInvitations((prev) => prev.filter((i) => i._id !== id));
  };

  const rejectInvite = (id: string) => {
    socket.emit("reject_invitation", id);
    setInvitations((prev) => prev.filter((i) => i._id !== id));
  };

  return (
    <div>
      {/* Back button */}
      <button className="invite-back-btn" onClick={onBack}>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back
      </button>

      <h2 className="invite-title">Invitations</h2>

      {invitations.length === 0 && (
        <p className="invite-empty">No pending invitations</p>
      )}

      {invitations.map((inv: any) => (
        <div key={inv._id} className="invite-card">
          <div className="invite-avatar">
            {inv.sender?.username?.slice(0, 2).toUpperCase()}
          </div>
          <span className="invite-username">{inv.sender?.username}</span>
          <div className="invite-actions">
            <button className="invite-accept-btn" onClick={() => acceptInvite(inv._id)}>Accept</button>
            <button className="invite-reject-btn" onClick={() => rejectInvite(inv._id)}>Decline</button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default InvitationList;