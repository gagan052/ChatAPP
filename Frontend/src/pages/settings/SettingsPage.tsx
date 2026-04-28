import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { uploadProfilePic } from "../../features/auth/api";
import { useAuth } from "../../features/auth/hooks";
import { toast } from "react-toastify";
import "./settings.css";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { updateProfilePic } = useAuth();
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUser?.profilePic || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error("Please select an image first");
      return;
    }

    setUploading(true);
    try {
      const newPicUrl = await uploadProfilePic(file);
      updateProfilePic(newPicUrl);
      toast.success("Profile picture updated successfully!");
      navigate("/chat");
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload profile picture");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-card">
        <button className="back-btn" onClick={() => navigate("/chat")}>
          <i className="fa-solid fa-arrow-left"></i> Back to Chat
        </button>
        
        <h2>Profile Settings</h2>
        
        <div className="profile-section">
          <div className="profile-pic-container">
            <div 
              className="profile-pic-preview" 
              style={{ 
                backgroundImage: preview ? `url(${preview})` : "none",
                backgroundColor: "var(--color-surface-2)"
              }}
            >
              {!preview && <i className="fa-solid fa-user"></i>}
            </div>
            <button 
              className="change-pic-btn" 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              Select Image
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              style={{ display: "none" }}
            />
          </div>

          <div className="user-info">
            <p><strong>Username:</strong> {currentUser?.username}</p>
            <p><strong>Email:</strong> {currentUser?.email}</p>
          </div>

          <button 
            className="save-btn" 
            onClick={handleUpload} 
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
