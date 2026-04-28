import { createBrowserRouter } from "react-router-dom";
import LoginPage from "../pages/auth/LoginPage";
import SignupPage from "../pages/auth/SignupPage";
import ChatPage from "../pages/chat/ChatPage";
import SettingsPage from "../pages/settings/SettingsPage";

const ProtectedRoute = ({ children }: any) => {
  const token = localStorage.getItem("token");
  return token ? children : <LoginPage />;
};

export const router = createBrowserRouter([
  { path: "/", element: <LoginPage /> },
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