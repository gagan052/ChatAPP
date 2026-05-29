import { useState, useEffect } from "react";
import "./LandingPage.css";
import { Link } from "react-router-dom";

/* ─── Data ───────────────────────────────────────────────────── */
const NAV_LINKS = ["Features", "Tech Stack", "How It Works", "Demo"];

const FEATURES = [
  {
    icon: "⚡",
    title: "Real-Time Messaging",
    desc: "Instant message delivery powered by WebSocket connections — zero delay, zero polling.",
  },
  {
    icon: "🔴",
    title: "Redis Caching",
    desc: "Messages cached in Redis so reloads never hit the database. Blazing fast experience every time.",
  },
  {
    icon: "👥",
    title: "Group Chats",
    desc: "Create groups, invite members, and chat together in dedicated channels.",
  },
  {
    icon: "🔔",
    title: "Invitations",
    desc: "Send and accept invitations to connect with other users on the platform.",
  },
  {
    icon: "🔒",
    title: "Secure Auth",
    desc: "Signup and login protected with hashed passwords and session management.",
  },
  {
    icon: "🗑️",
    title: "Message Control",
    desc: "Delete your own messages and clear entire chat histories with one click.",
  },
];

const TECH: { label: string; color: string; desc: string }[] = [
  { label: "WebSocket", color: "#3b82f6", desc: "Bidirectional real-time communication" },
  { label: "Redis",     color: "#ef4444", desc: "In-memory caching layer" },
  { label: "React",     color: "#06b6d4", desc: "Frontend UI framework" },
  { label: "Node.js",   color: "#22c55e", desc: "Backend runtime" },
  { label: "TypeScript",color: "#818cf8", desc: "Type-safe development" },
  { label: "MongoDB",   color: "#16a34a", desc: "Persistent data storage" },
];

const STEPS = [
  { n: "01", title: "Sign Up",      desc: "Create your account with username, email, phone & password." },
  { n: "02", title: "Find Users",   desc: "Search registered users and send connection invitations." },
  { n: "03", title: "Chat Live",    desc: "Open a conversation and messages fly in real-time via WebSocket." },
  { n: "04", title: "Cached & Fast",desc: "Redis serves cached messages instantly on every reload." },
];

const MOCK_USERS = [
  { initials: "MA", name: "Manan",   hue: 200 },
  { initials: "GO", name: "Gourav",  hue: 260 },
  { initials: "RO", name: "Rohit",   hue: 320 },
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
  x:       Math.random() * 100,
  y:       Math.random() * 100,
  size:    Math.random() * 3 + 1,
  dur:     Math.random() * 12 + 8,
  delay:   Math.random() * 6,
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
            left:      `${p.x}%`,
            top:       `${p.y}%`,
            width:     p.size,
            height:    p.size,
            opacity:   p.opacity,
            animation: `floatUp ${p.dur}s ${p.delay}s infinite ease-in-out alternate`,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Navbar ─────────────────────────────────────────────────── */
function Navbar() {
  const [scrolled,    setScrolled]    = useState(false);
  const [menuOpen,    setMenuOpen]    = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // Close menu on resize to desktop
  useEffect(() => {
    const fn = () => { if (window.innerWidth > 900) setMenuOpen(false); };
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  const handleNavClick = () => setMenuOpen(false);

  return (
    <>
      <nav className={`navbar${scrolled ? " scrolled" : ""}`}>
        {/* Logo */}
        <a className="navbar-logo" href="#">
          <div className="navbar-logo-icon">⚡</div>
          <span className="navbar-logo-text">
            Zynk<span>Chat</span>
          </span>
        </a>

        {/* Desktop links */}
        <div className="navbar-links">
          {NAV_LINKS.map((l) => (
            <a
              key={l}
              className="navbar-link"
              href={`#${l.toLowerCase().replace(" ", "-")}`}
            >
              {l}
            </a>
          ))}
        </div>

        {/* Desktop actions */}
        <div className="navbar-actions">
          {/* <a
            className="btn-login"
            href="https://zynk-gagan.onrender.com/#/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Login
          </a> */}
          <Link to="/login" className="btn-login">
            Login
          </Link>

          <Link to="/signup" className="btn-signup">
            Sign Up
          </Link>

          {/* <a
            className="btn-signup"
            href="https://zynk-gagan.onrender.com/#/signup"
            target="_blank"
            rel="noopener noreferrer"
          >
            Sign Up
          </a> */}
        </div>

        {/* Hamburger */}
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

      {/* Mobile Menu */}
      <div className={`mobile-menu${menuOpen ? " open" : ""}`}>
        {NAV_LINKS.map((l) => (
          <a
            key={l}
            className="mobile-menu-link"
            href={`#${l.toLowerCase().replace(" ", "-")}`}
            onClick={handleNavClick}
          >
            {l}
          </a>
        ))}
        <div className="mobile-menu-actions">
          {/* <a
            className="btn-login"
            href="https://zynk-gagan.onrender.com/#/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleNavClick}
          >
            Login
          </a> */}
          <Link to="/login" className="btn-login" onClick={handleNavClick}>
            Login
          </Link>
            <Link to="/signup" className="btn-signup" onClick={handleNavClick}>
            Sign Up
          </Link>
          {/* <a
            className="btn-signup"
            href="https://zynk-gagan.onrender.com/#/signup"
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleNavClick}
          >
            Sign Up
          </a> */}
        </div>
      </div>
    </>
  );
}

/* ─── Hero ───────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="hero">
      <div className="hero-glow" />

      {/* Badge */}
      <div className="hero-badge">
        <div className="hero-badge-dot" />
        <span className="hero-badge-text">REAL-TIME · WEBSOCKET · REDIS CACHED</span>
      </div>

      {/* Headline */}
      <h1 className="hero-title">
        Messages that move
        <br />
        <span className="hero-title-gradient">at the speed of now.</span>
      </h1>

      {/* Subtitle */}
      <p className="hero-subtitle">
        Zynk Chat is a full-stack real-time messaging platform built on WebSockets
        with Redis caching — so your chats load instantly, every single time.
      </p>

      {/* CTAs */}
      <div className="hero-actions">
        {/* <a
          className="btn-primary"
          href="https://zynk-gagan.onrender.com/#/signup"
          target="_blank"
          rel="noopener noreferrer"
        >
          Get Started — Free
        </a> */}
        <Link to="/signup" className="btn-primary">
          Get Started — Free
        </Link>

        {/* <a className="btn-secondary" href="#features">
          See Features ↓
        </a> */}
      </div>

      {/* Mock Chat Window */}
      <div className="hero-mockup">
        {/* Window chrome */}
        <div className="mockup-chrome">
          <div className="mockup-dot" style={{ background: "#ef4444" }} />
          <div className="mockup-dot" style={{ background: "#f59e0b" }} />
          <div className="mockup-dot" style={{ background: "#22c55e" }} />
          <span className="mockup-title">zynk-chat — Vishesh</span>
        </div>

        <div className="mockup-body">
          {/* Sidebar */}
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

          {/* Chat */}
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

            {/* Input */}
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

/* ─── Features ───────────────────────────────────────────────── */
function Features() {
  return (
    <section id="features" className="section">
      <div className="section-inner">
        <div className="section-header">
          <span className="section-label">What's inside</span>
          <h2 className="section-title">Built for speed &amp; simplicity</h2>
        </div>
        <div className="features-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Tech Stack ─────────────────────────────────────────────── */
function TechStack() {
  return (
    <section id="tech-stack" className="section">
      <div className="section-inner--narrow" style={{ textAlign: "center" }}>
        <div className="section-header">
          <span className="section-label">Tech Stack</span>
          <h2 className="section-title">Powered by modern tools</h2>
        </div>
        <div className="tech-grid">
          {TECH.map((t) => (
            <div
              key={t.label}
              className="tech-card"
              style={{
                border:     `1px solid ${t.color}33`,
                background: `${t.color}0d`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = `${t.color}88`;
                (e.currentTarget as HTMLElement).style.background   = `${t.color}1a`;
                (e.currentTarget as HTMLElement).style.transform    = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = `${t.color}33`;
                (e.currentTarget as HTMLElement).style.background   = `${t.color}0d`;
                (e.currentTarget as HTMLElement).style.transform    = "translateY(0)";
              }}
            >
              <div
                className="tech-dot"
                style={{ background: t.color, boxShadow: `0 0 8px ${t.color}` }}
              />
              <span className="tech-label">{t.label}</span>
              <span className="tech-desc">{t.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── How It Works ───────────────────────────────────────────── */
function HowItWorks() {
  return (
    <section id="how-it-works" className="section">
      <div className="section-inner--narrow">
        <div className="section-header">
          <span className="section-label">How It Works</span>
          <h2 className="section-title">Four steps to instant chat</h2>
        </div>
        <div className="steps-grid">
          {STEPS.map((s) => (
            <div key={s.n} className="step-card">
              <div className="step-number">{s.n}</div>
              <h3 className="step-title">{s.title}</h3>
              <p className="step-desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── CTA ────────────────────────────────────────────────────── */
function CTA() {
  return (
    <section id="demo" className="cta-section">
      <div className="cta-box">
        <div className="cta-glow" />
        <h2 className="cta-title">Ready to chat in real-time?</h2>
        <p className="cta-subtitle">
          Join Zynk Chat — create your account and start messaging instantly.
        </p>
        <div className="cta-actions">
          {/* <a
            className="btn-cta-primary"
            href="https://zynk-gagan.onrender.com/#/signup"
            target="_blank"
            rel="noopener noreferrer"
          >
            Create Account
          </a> */}
            <Link to="/signup" className="btn-cta-primary">
              Create Account
            </Link>

            <Link to="/login" className="btn-cta-secondary">
              Login →
            </Link>

          {/* <a
            className="btn-cta-secondary"
            href="https://zynk-gagan.onrender.com/#/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Login →
          </a> */}
        </div>
      </div>
    </section>
  );
}

/* ─── Footer ─────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="footer">
      <div className="footer-logo">
        <div className="footer-logo-icon">⚡</div>
        <span className="footer-logo-text">
          Zynk<span>Chat</span>
        </span>
      </div>
      <span className="footer-tagline">
        Built with WebSocket · Redis · React · Node.js
      </span>
    </footer>
  );
}

/* ─── Root ───────────────────────────────────────────────────── */
export default function ZynkLanding() {
  return (
    <div style={{ minHeight: "100vh", background: "#080c18", color: "#fff" }}>
      <FloatingParticles />
      <Navbar />
      <Hero />
      <Features />
      <TechStack />
      <HowItWorks />
      <CTA />
      <Footer />
    </div>
  );
}