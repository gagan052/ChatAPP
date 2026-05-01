import { useState } from "react";
import { formatLastSeen } from "../../pages/chat/formatLastSeen";
import { updateGroupApi } from "../../features/groups/hooks";
import { uploadChatFile } from "../../features/chat/api";
import { toast } from "react-toastify";

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
  groupInfo?: { 
    name: string; 
    admin?: { _id: string; username: string; profilePic?: string };
    avatar?: string;
  };
  participants?: User[];
}

interface Props {
  chatType: "private" | "group";
  selectedUser?: string | null;
  selectedUserObj?: User;
  selectedGroup?: Group | null;
  currentUserId: string;
  onClose: () => void;
  onGroupUpdated?: (updatedGroup: any) => void;
}

export default function ChatInfoModal({
  chatType,
  selectedUser,
  selectedUserObj,
  selectedGroup,
  currentUserId,
  onClose,
  onGroupUpdated,
}: Props) {
  const name =
    chatType === "private" ? selectedUser : selectedGroup?.groupInfo?.name;
  const initials = name?.slice(0, 2).toUpperCase() || "?";
  
  const isAdmin = selectedGroup?.groupInfo?.admin?._id === currentUserId;
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [newGroupName, setNewGroupName] = useState(name || "");
  const [loading, setLoading] = useState(false);

  const handleUpdateName = async () => {
    if (!selectedGroup?._id || !newGroupName.trim()) return;

    try {
      setLoading(true);
      console.log("Updating group name:", newGroupName.trim());
      const response = await updateGroupApi(selectedGroup._id, { name: newGroupName.trim() });
      console.log("Group name update response:", response);
      if (response.success && onGroupUpdated) {
        onGroupUpdated(response.group);
      }
      setIsEditingName(false);
      toast.success("Group name updated!");
    } catch (err) {
      console.error("Error updating group name:", err);
      toast.error("Failed to update group name");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAvatar = async (file: File) => {
    if (!selectedGroup?._id) return;

    try {
      setLoading(true);
      console.log("Uploading group avatar file");
      const uploadResponse = await uploadChatFile(file);
      console.log("Uploaded avatar:", uploadResponse);
      const response = await updateGroupApi(selectedGroup._id, { avatar: uploadResponse.fileUrl });
      console.log("Group avatar update response:", response);
      if (response.success && onGroupUpdated) {
        onGroupUpdated(response.group);
      }
      toast.success("Group avatar updated!");
    } catch (err) {
      console.error("Error updating group avatar:", err);
      toast.error("Failed to update group avatar");
    } finally {
      setLoading(false);
    }
  };

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
          <div className="chat-header-avatar-wrapper" style={{ position: "relative" }}>
            <div
              className={`chat-header-avatar ${
                chatType === "group" ? "group-avatar" : ""
              }`}
              style={{
                width: "80px",
                height: "80px",
                fontSize: "32px",
                margin: "0 auto 16px",
                background: 
                  (chatType === "private" && selectedUserObj?.profilePic) 
                    ? `url(${selectedUserObj.profilePic}) center/cover` 
                    : (chatType === "group" && selectedGroup?.groupInfo?.avatar)
                    ? `url(${selectedGroup.groupInfo.avatar}) center/cover`
                    : "var(--color-accent-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden"
              }}
            >
              {!(
                (chatType === "private" && selectedUserObj?.profilePic) ||
                (chatType === "group" && selectedGroup?.groupInfo?.avatar)
              ) && initials}
            </div>
            {isAdmin && (
              <label
                htmlFor="groupAvatarInput"
                style={{
                  position: "absolute",
                  bottom: 16,
                  right: "calc(50% - 40px - 10px)",
                  background: "var(--color-accent)",
                  borderRadius: "50%",
                  width: "24px",
                  height: "24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "white",
                  fontSize: "12px"
                }}
                title="Change group avatar"
              >
                <i className="fa-solid fa-camera"></i>
                <input
                  id="groupAvatarInput"
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleUpdateAvatar(e.target.files[0]);
                      e.target.value = "";
                    }
                  }}
                />
              </label>
            )}
          </div>

          {chatType === "group" && isEditingName ? (
            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
              <input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleUpdateName();
                  if (e.key === "Escape") {
                    setIsEditingName(false);
                    setNewGroupName(name || "");
                  }
                }}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                  fontSize: "16px"
                }}
              />
              <button
                onClick={handleUpdateName}
                disabled={loading}
                style={{
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: "8px",
                  background: "var(--color-accent)",
                  color: "white",
                  cursor: "pointer"
                }}
              >
                Save
              </button>
            </div>
          ) : (
            <h2 style={{ marginBottom: "8px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              {name}
              {isAdmin && (
                <button
                  onClick={() => {
                    setNewGroupName(name || "");
                    setIsEditingName(true);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--color-text-faint)"
                  }}
                >
                  <i className="fa-solid fa-pen"></i>
                </button>
              )}
            </h2>
          )}

          {chatType === "group" && selectedGroup?.groupInfo?.admin && (
            <p style={{ 
              color: "var(--color-text-faint)", 
              fontSize: "12px", 
              marginBottom: "16px"
            }}>
              Admin: {selectedGroup.groupInfo.admin.username}
            </p>
          )}

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
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span className="member-name">{member.username}</span>
                      {selectedGroup?.groupInfo?.admin?._id === (member._id || member.id) && (
                        <span style={{ fontSize: "11px", color: "var(--color-accent)" }}>Admin</span>
                      )}
                    </div>
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
