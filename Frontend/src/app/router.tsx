import { createHashRouter, Navigate } from "react-router-dom";
import LoginPage from "../pages/auth/LoginPage";
import SignupPage from "../pages/auth/SignupPage";
import ChatPage from "../pages/chat/ChatPage";
import SettingsPage from "../pages/settings/SettingsPage";

const ProtectedRoute = ({ children }: any) => {
  const token = localStorage.getItem("token");
  return token ? children : <LoginPage />;
};

function PublicRoute({ children }: { children: any }) {
  const token = localStorage.getItem("token");
  if (token) return <Navigate to="/chat" />;
  return children;
}


export const router = createHashRouter([
  { 
    path: "/",
    element: 
     <PublicRoute>
        <LoginPage />
     </PublicRoute>
  },
  { path: "/signup", element: <SignupPage /> },
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
]);