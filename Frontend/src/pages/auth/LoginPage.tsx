import { useState } from "react";
import { useAuth } from "../../features/auth/hooks";
import "./auth.css";


export default function LoginPage() {
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Welcome Back </h2>

        <input
          placeholder="Username or Email"
          onChange={(e) => setIdentifier(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={() => login(identifier, password)}>Login</button>

        <p>
          Don't have an account? <a href="/signup">Signup</a>
        </p>
      </div>
    </div>
  );
}
