import axios from "axios";
import Cookies from "js-cookie";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { disconnectSocket } from "../../services/socket";
import { toast } from "react-toastify";
import { BASE_URL } from "../../services/http";

export const useAuth = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  // ================= LOGIN =================

  const login = async (identifier: string, phone: string, password: string) => {
    setLoading(true);

    try {
      const res = await axios.post(
        `${BASE_URL}/api/auth/login`,

        {
          identifier,
          phone,
          password,
        },

        {
          withCredentials: true,
        }
      );

      if (res.data.success) {
        toast.success("Logged In Successfully");

        navigate("/chat");
      } else {
        toast.error(res.data.message);
      }
    } catch (err: any) {
      console.error(err);

      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ================= SIGNUP =================

  const signup = async (
    email: string,
    username: string,
    phone: string,
    password: string
  ) => {
    setLoading(true);

    try {
      const res = await axios.post(
        `${BASE_URL}/api/auth/signup`,

        {
          username,
          email,
          phone,
          password,
        },

        {
          withCredentials: true,
        }
      );

      if (res.data.success) {
        toast.success("Signup Successfully");

        navigate("/chat");
      } else {
        toast.error(res.data.message);
      }
    } catch (err: any) {
      console.error(err);

      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ================= LOGOUT =================

  const logout = async () => {
    try {
      await axios.post(
        `${BASE_URL}/api/auth/logout`,
        {},
        {
          withCredentials: true,
        }
      );

      Cookies.remove("user");

      disconnectSocket();

      navigate("/");

      toast.success("Logged Out Successfully");
    } catch (err) {
      console.error(err);
    }
  };

  // ================= GET USER =================

  const getUser = () => {
    const userCookie = Cookies.get("user");

    return userCookie ? JSON.parse(userCookie) : null;
  };

   const updateProfilePic = (newProfilePic: string) => {
  //  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userCookie = Cookies.get("user");
  const user = userCookie ? JSON.parse(userCookie) : null;

   if (!user) return;

  //  user.profilePic = newProfilePic;
  user.profilePic = newProfilePic;

  //  localStorage.setItem("user", JSON.stringify(user));
   Cookies.set("user", JSON.stringify(user)); 
  //  localStorage.setItem("user", JSON.stringify(user));
 };


  return {
    login,
    signup,
    logout,
    getUser,
    loading,
    updateProfilePic,
  };
};
