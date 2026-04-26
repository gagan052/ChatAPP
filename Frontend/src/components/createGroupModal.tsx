import { useState } from "react";
import { createGroupApi } from "../features/groups/hooks";

interface Props {
  users: { id: string; username: string }[];
  onClose: () => void;
  onCreated: (group: any) => void;
}

export default function CreateGroupModal({ users, onClose, onCreated }: Props) {
  
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleUser = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Enter a group name");
      return;
    }
    if (selected.length < 1) {
      setError("Select at least one member");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await createGroupApi(name.trim(), selected);
      if (data.success) {
        onCreated(data.group);
        onClose();
      } else {
        setError(data.message || "Failed to create group");
      }
    } catch {
      setError("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">New group</span>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <input
            className="modal-input"
            placeholder="Group name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />

          <p className="modal-label">Add members</p>
          <div className="member-list">
            {users.map((u) => {
              const isSelected = selected.includes(u.id);
              return (
                <div
                  key={u.id}
                  className={`member-item ${isSelected ? "selected" : ""}`}
                  onClick={() => toggleUser(u.id)}
                >
                  <div className="member-avatar">
                    {u.username.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="member-name">{u.username}</span>
                  <div
                    className={`member-check ${isSelected ? "checked" : ""}`}
                  >
                    {isSelected && <span>✓</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {selected.length > 0 && (
            <p className="modal-selected-count">
              {selected.length} member{selected.length > 1 ? "s" : ""} selected
            </p>
          )}

          {error && <p className="modal-error">{error}</p>}
        </div>

        <div className="modal-footer">
          <button className="modal-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className="modal-create"
            onClick={handleCreate}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create group"}
          </button>
        </div>
      </div>
    </div>
  );
}
