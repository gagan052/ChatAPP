import { formatLastSeen } from "../../pages/chat/formatLastSeen";

interface User {
  id: string;
  _id?: string;
  username: string;
  lastSeen?: string;
  email?: string;
  phone?: string;
  profilePic?: string;
}

interface Group {
  _id: string;
  groupInfo?: { name: string };
  participants?: User[];
}

interface Props {
  chatType: "private" | "group";
  selectedUser?: string | null;
  selectedUserObj?: User;
  selectedGroup?: Group | null;
  onClose: () => void;
}

export default function ChatInfoModal({
  chatType,
  selectedUser,
  selectedUserObj,
  selectedGroup,
  onClose,
}: Props) {
  const name =
    chatType === "private" ? selectedUser : selectedGroup?.groupInfo?.name;
  const initials = name?.slice(0, 2).toUpperCase() || "?";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">
            {chatType === "private" ? "Contact Info" : "Group Info"}
          </span>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body" style={{ padding: "20px", textAlign: "center" }}>
          <div
            className={`chat-header-avatar ${
              chatType === "group" ? "group-avatar" : ""
            }`}
            style={{
              width: "80px",
              height: "80px",
              fontSize: "32px",
              margin: "0 auto 16px",
              background: (chatType === "private" && selectedUserObj?.profilePic) 
                ? `url(${selectedUserObj.profilePic}) center/cover` 
                : "var(--color-accent-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden"
            }}
          >
            {!(chatType === "private" && selectedUserObj?.profilePic) && initials}
          </div>
          <h2 style={{ marginBottom: "8px" }}>{name}</h2>

          {chatType === "private" ? (
            <div style={{ textAlign: "left", marginTop: "20px" }}>
              <div style={{ marginBottom: "12px" }}>
                <p style={{ color: "var(--color-text-faint)", fontSize: "12px", marginBottom: "4px" }}>
                  Username
                </p>
                <p>{selectedUserObj?.username}</p>
              </div>
              <div style={{ marginBottom: "12px" }}>
                <p style={{ color: "var(--color-text-faint)", fontSize: "12px", marginBottom: "4px" }}>
                  Last Seen
                </p>
                <p>{formatLastSeen(selectedUserObj?.lastSeen)}</p>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "left", marginTop: "20px" }}>
              <p style={{ color: "var(--color-text-faint)", fontSize: "12px", marginBottom: "12px" }}>
                {selectedGroup?.participants?.length} Members
              </p>
              <div className="member-list" style={{ maxHeight: "200px", overflowY: "auto" }}>
                {selectedGroup?.participants?.map((member) => (
                  <div
                    key={member._id || member.id}
                    className="member-item"
                    style={{ padding: "8px 0", borderBottom: "1px solid var(--color-surface-2)", display: "flex", alignItems: "center", gap: "10px" }}
                  >
                    <div className="member-avatar" style={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "50%",
                      background: member.profilePic ? `url(${member.profilePic}) center/cover` : "var(--color-accent-light)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px"
                    }}>
                      {!member.profilePic && member.username[0].toUpperCase()}
                    </div>
                    <span className="member-name">{member.username}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="modal-cancel" onClick={onClose} style={{ width: "100%" }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
