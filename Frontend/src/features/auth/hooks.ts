import axios from "axios";
import { useNavigate } from "react-router-dom";
import { disconnectSocket } from "../../services/socket";
import { toast } from 'react-toastify';
import { BASE_URL } from "../../services/http";

export const useAuth = () => {
  const navigate = useNavigate();

  const login = async (identifier: string, password: string) => {
    try {
      const res = await axios.post(`${BASE_URL}/api/auth/login`, {
        identifier,
        password,
      });

      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("username", res.data.user.username);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        navigate("/chat");
        toast.success("logged In Successfully");
      } else {
        toast(res.data.message || "Invalid credentials");
      }
    } catch (err) {
      console.error(err);
      toast("Server error");
    }
  };

  const signup = async (email: string, username: string, password: string) => {
    try {
      const res = await axios.post(`${BASE_URL}/api/auth/signup`, {
        email,
        username,
        password,
      });

      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("username", res.data.user.username);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        navigate("/chat");
        toast.success("Signup Successfully");
      } else {
        toast(res.data.message || "User already exists");
      }
    } catch (err) {
      console.error(err);
      toast("Server error");
    }
  };

  const logout = () => {
    disconnectSocket();
    localStorage.clear();
    navigate("/");
    toast.success("logged Out Successfully");
  };

  const updateProfilePic = (newProfilePic: string) => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    user.profilePic = newProfilePic;
    localStorage.setItem("user", JSON.stringify(user));
  };

  return { login, signup, logout, updateProfilePic };
};