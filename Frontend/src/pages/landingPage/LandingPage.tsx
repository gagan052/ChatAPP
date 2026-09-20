import { useState, useEffect } from "react";
import "./LandingPage.css";
import { Link } from "react-router-dom";

/* ─── Data ───────────────────────────────────────────────────── */
const MOCK_USERS = [
  { initials: "MA", name: "Manan", hue: 200 },
  { initials: "GO", name: "Gourav", hue: 260 },
  { initials: "RO", name: "Rohit", hue: 320 },
  { initials: "VI", name: "Vishesh", hue: 180, active: true },
];

/* ─── Floating Particles ─────────────────────────────────────── */
interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  dur: number;
  delay: number;
  opacity: number;
}

const PARTICLES: Particle[] = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 3 + 1,
  dur: Math.random() * 12 + 8,
  delay: Math.random() * 6,
  opacity: Math.random() * 0.22 + 0.05,
}));

function FloatingParticles() {
  return (
    <div className="particles-container">
      {PARTICLES.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            animation: `floatUp ${p.dur}s ${p.delay}s infinite ease-in-out alternate`,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Navbar ─────────────────────────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    const fn = () => {
      if (window.innerWidth > 900) setMenuOpen(false);
    };
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  const handleNavClick = () => setMenuOpen(false);

  return (
    <>
      <nav className={`navbar${scrolled ? " scrolled" : ""}`}>
        <a className="navbar-logo" href="#">
          <div className="navbar-logo-icon">⚡</div>
          <span className="navbar-logo-text">
            Zynk<span>Chat</span>
          </span>
        </a>

        <div className="navbar-actions">
          <Link to="/login" className="btn-login">
            Login
          </Link>
          <Link to="/signup" className="btn-signup">
            Sign Up
          </Link>
        </div>

        <button
          className={`hamburger${menuOpen ? " open" : ""}`}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <span />
          <span />
          <span />
        </button>
      </nav>

      <div className={`mobile-menu${menuOpen ? " open" : ""}`}>
        <div className="mobile-menu-actions">
          <Link to="/login" className="btn-login" onClick={handleNavClick}>
            Login
          </Link>
          <Link to="/signup" className="btn-signup" onClick={handleNavClick}>
            Sign Up
          </Link>
        </div>
      </div>
    </>
  );
}

/* ─── Hero ───────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="hero">
      <div className="hero-grid-overlay" />
      <div className="hero-glow" />
      <div className="hero-glow hero-glow--accent" />

      <div className="hero-badge">
        <div className="hero-badge-dot" />
        <span className="hero-badge-text">REAL-TIME · WEBSOCKET · REDIS CACHED</span>
      </div>

      <h1 className="hero-title">
        Messages that move
        <br />
        <span className="hero-title-gradient">at the speed of now.</span>
      </h1>

      <p className="hero-subtitle">
        Zynk Chat is a full-stack real-time messaging platform built on WebSockets
        with Redis caching — so your chats load instantly, every single time.
      </p>

      <div className="hero-actions">
        <Link to="/signup" className="btn-primary">
          <span>Get Started — Free</span>
          <span className="btn-primary-arrow">→</span>
        </Link>
      </div>

      <div className="hero-mockup">
        <div className="mockup-chrome">
          <div className="mockup-dot" style={{ background: "#ef4444" }} />
          <div className="mockup-dot" style={{ background: "#f59e0b" }} />
          <div className="mockup-dot" style={{ background: "#22c55e" }} />
          <span className="mockup-title">zynk-chat — Vishesh</span>
        </div>

        <div className="mockup-body">
          <div className="mockup-sidebar">
            {MOCK_USERS.map((u) => (
              <div
                key={u.name}
                className={`mockup-sidebar-item${u.active ? " active" : ""}`}
              >
                <div
                  className="mockup-avatar"
                  style={{ background: `hsl(${u.hue}, 65%, 42%)` }}
                >
                  {u.initials}
                </div>
                <span className={`mockup-name${u.active ? " active" : ""}`}>
                  {u.name}
                </span>
              </div>
            ))}
          </div>

          <div className="mockup-chat">
            <div className="mockup-msg-row">
              <div className="mockup-bubble">hey! did you push the redis config?</div>
            </div>
            <div className="mockup-msg-row right">
              <div className="mockup-bubble sent">yeah, upstash is set up 🚀</div>
            </div>
            <div className="mockup-msg-row">
              <div className="mockup-bubble">messages load instantly now ⚡</div>
            </div>
            <div className="mockup-msg-row right">
              <div className="mockup-bubble sent mockup-typing">
                <span className="mockup-typing-dot" />
                <span className="mockup-typing-dot" />
                <span className="mockup-typing-dot" />
              </div>
            </div>

            <div className="mockup-input">
              <span className="mockup-input-placeholder">Type a message...</span>
              <div className="mockup-send">➤</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Footer ─────────────────────────────────────────────────── */
function Footer() {
  const scrollToTop = () =>
    window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-logo">
          <div className="footer-logo-icon">⚡</div>
          <span className="footer-logo-text">
            Zynk<span>Chat</span>
          </span>
        </div>
        <span className="footer-tagline">
          Built with WebSocket · Redis · React · Node.js
        </span>
        <button
          className="footer-top-btn"
          onClick={scrollToTop}
          aria-label="Back to top"
        >
          ↑
        </button>
      </div>
    </footer>
  );
}

/* ─── Root ───────────────────────────────────────────────────── */
export default function ZynkLanding() {
  return (
    <div className="landing-root">
      <FloatingParticles />
      <Navbar />
      <Hero />
      <Footer />
    </div>
  );
}
