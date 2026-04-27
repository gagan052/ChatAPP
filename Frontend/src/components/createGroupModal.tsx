import { useState, useEffect } from "react";
import { createGroupApi } from "../features/groups/hooks";
import { api } from "../services/http";

interface User {
  id: string;
  username: string;
}

interface Props {
  users: User[];
  onClose: () => void;
  onCreated: (group: any) => void;
}

export default function CreateGroupModal({ users, onClose, onCreated }: Props) {
  
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);


  const [allDisplayedUsers, setAllDisplayedUsers] = useState<User[]>(users);

  useEffect(() => {
    setAllDisplayedUsers(users);
  }, [users]);

  const handleSearch = async (val: string) => {
    setSearchTerm(val);
    if (!val.trim()) {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const data = await api(`/api/users/search?q=${val}`);
      setSearchResults(data);
    } catch (err) {
      console.error("Search error:", err);
    }
  };

  const toggleUser = (user: User) => {
    setSelected((prev) => {
      const isAlreadySelected = prev.includes(user.id);
      if (isAlreadySelected) {
        return prev.filter((x) => x !== user.id);
      } else {
        
        if (!allDisplayedUsers.find(u => u.id === user.id)) {
          setAllDisplayedUsers(prevUsers => [...prevUsers, user]);
        }
        return [...prev, user.id];
      }
    });
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

  const displayedList = isSearching ? searchResults : allDisplayedUsers;

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

          <div className="modal-search-container">
            <input
              className="modal-search-input"
              placeholder="Search members to add..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          <p className="modal-label">
            {isSearching ? "Search Results" : "Add members from contacts"}
          </p>
          <div className="member-list">
            {displayedList.length === 0 && (
              <p className="no-members">No users found</p>
            )}
            {displayedList.map((u) => {
              const isSelected = selected.includes(u.id);
              return (
                <div
                  key={u.id}
                  className={`member-item ${isSelected ? "selected" : ""}`}
                  onClick={() => toggleUser(u)}
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
