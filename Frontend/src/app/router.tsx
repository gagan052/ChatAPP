import { createHashRouter, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import LoginPage from "../pages/auth/LoginPage";
import SignupPage from "../pages/auth/SignupPage";
import ChatPage from "../pages/chat/ChatPage";
import SettingsPage from "../pages/settings/SettingsPage";
import { api } from "../services/http";
import Layout from "./Layout";

// ================= PROTECTED ROUTE =================

const ProtectedRoute = ({ children }: any) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        await api("/api/auth/me");

        if (mounted) {
          setAuthenticated(true);
        }
      } catch {
        if (mounted) {
          setAuthenticated(false);
        }
      }

      if (mounted) {
        setLoading(false);
      }
    };

    checkAuth();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return authenticated ? children : <Navigate to="/" replace />;
};

// ================= ROUTER =================

export const router = createHashRouter([
  {
    path: "/",
    element: <LoginPage />,
  },

  {
    path: "/signup",
    element: <SignupPage />,
  },
  {
    element: <Layout />,
    children: [
      {
        path: "/chat",
        element: (
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/settings",
        element: (
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);
