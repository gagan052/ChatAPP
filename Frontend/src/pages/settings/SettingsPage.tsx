import { useEffect, useRef, useState } from "react";
import { FaCamera, FaArrowLeft } from "react-icons/fa";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/http";

import "./settings.css";

export default function SettingsPage() {
  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [user, setUser] = useState<any>({
    username: "",
    email: "",
    phone: "",
    profilePic: "",
  });

  useEffect(() => {
    const cookieUser = JSON.parse(Cookies.get("user") || "{}");

    setUser(cookieUser);
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setSelectedFile(file);

    setUser((prev: any) => ({
      ...prev,
      profilePic: URL.createObjectURL(file),
    }));
  };

  const uploadProfilePicture = async () => {
    if (!selectedFile) return;

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append("image", selectedFile);

      const token = Cookies.get("token");

      const response = await api("/api/users/upload-profile", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const updatedUser = {
        ...user,
        profilePic: response.profilePic,
      };

      Cookies.set("user", JSON.stringify(updatedUser));

      setUser(updatedUser);

      alert("Profile updated successfully");
    } catch (error: any) {
      console.error("UPLOAD ERROR:", error);

      console.log("Response:", error?.response?.data);

      alert(error?.response?.data?.message || "Failed to upload image");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-card">
        <div className="settings-topbar">
          <button className="back-btn" onClick={() => navigate("/chat")}>
            <FaArrowLeft />
          </button>

          <h2>Profile Settings</h2>
        </div>

        <div className="profile-section">
          <input
            hidden
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageChange}
          />

          <div className="avatar-wrapper">
            {user.profilePic ? (
              <img
                src={user.profilePic}
                alt="profile"
                className="profile-avatar"
              />
            ) : (
              <div className="avatar-fallback">
                {user.username?.[0]?.toUpperCase()}
              </div>
            )}

            <button
              className="camera-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              <FaCamera />
            </button>
          </div>

          {selectedFile && (
            <button
              className="save-btn"
              disabled={loading}
              onClick={uploadProfilePicture}
            >
              {loading ? "Uploading..." : "Save Photo"}
            </button>
          )}
        </div>

        <div className="info-section">
          <div className="info-box">
            <label>Username</label>

            <span>{user.username}</span>
          </div>

          {/* <div className="info-box">
            <label>Email</label>

            <span>
              {user.email ||
                "Not Available"}
            </span>
          </div>

          <div className="info-box">
            <label>
              Phone Number
            </label>

            <span>
              {user.phone ||
                "Not Available"}
            </span>
          </div> */}
        </div>

        {/* <button
          className="logout-btn"
          onClick={logout}
        >
          <FaSignOutAlt />
          Logout
        </button> */}
      </div>
    </div>
  );
}
