/* global React, Logo, Icon, BearingRings */

// Split sign-in: brand panel + form. Disclosure-forward per RumboWorks privacy posture.
function SignIn({ onSignIn }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.05fr 1fr", height: "100%", background: "var(--rj-paper)" }}>
      {/* Brand panel */}
      <div style={{ position: "relative", overflow: "hidden", background: "var(--rj-pine-800)", padding: "56px 56px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <BearingRings style={{ right: -120, top: 40, width: 420, height: 420 }} />
        <Logo size={28} light />
        <div style={{ position: "relative", maxWidth: 420 }}>
          <div className="rj-eyebrow" style={{ color: "var(--rj-ochre-300)", marginBottom: 18 }}>Sounds Like Us</div>
          <h1 style={{ fontFamily: "var(--rj-font-serif)", fontWeight: 600, fontSize: 38, lineHeight: 1.14, letterSpacing: "-0.02em", color: "var(--rj-stone-50)", margin: 0 }}>
            Find the voice you already have.
          </h1>
          <p style={{ fontFamily: "var(--rj-font-serif)", fontSize: 17, lineHeight: 1.6, color: "var(--rj-pine-200)", marginTop: 18 }}>
            Sign in to turn your public pages into reusable writing guidance — and keep your AI on course.
          </p>
        </div>
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 9, fontSize: 13, color: "var(--rj-pine-200)" }}>
          <Icon name="shield-check" size={16} color="var(--rj-ochre-300)" />
          Every account belongs to an organization. You control who's in it.
        </div>
      </div>

      {/* Form */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
        <div style={{ width: 360, maxWidth: "100%" }}>
          <h2 style={{ fontFamily: "var(--rj-font-serif)", fontSize: 27, fontWeight: 600, color: "var(--rj-ink)", margin: "0 0 6px" }}>Sign in to RumboWorks</h2>
          <p style={{ fontSize: 14, color: "var(--rj-stone-600)", margin: "0 0 24px" }}>New here? <a href="#" style={{ color: "var(--rj-pine-600)", fontWeight: 600, textDecoration: "none" }}>Create an account</a></p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
            <button className="rj-btn rj-btn--secondary" style={{ width: "100%", justifyContent: "center" }} onClick={onSignIn}>
              <span style={{ fontWeight: 800, fontSize: 15, color: "var(--rj-ember-500)" }}>G</span>Continue with Google
            </button>
            <button className="rj-btn rj-btn--secondary" style={{ width: "100%", justifyContent: "center" }} onClick={onSignIn}>
              <span style={{ fontWeight: 800, fontSize: 14, color: "var(--rj-pine-600)" }}>in</span>Continue with LinkedIn
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "18px 0", color: "var(--rj-stone-400)", fontSize: 12 }}>
            <div style={{ flex: 1, height: 1, background: "var(--rj-border)" }} /> OR <div style={{ flex: 1, height: 1, background: "var(--rj-border)" }} />
          </div>

          <form onSubmit={(e) => { e.preventDefault(); onSignIn(); }} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="rj-field">
              <label className="rj-label">Work email</label>
              <input className="rj-input" type="email" defaultValue="maria@rivertrust.org" />
            </div>
            <div className="rj-field">
              <label className="rj-label">Password</label>
              <input className="rj-input" type="password" defaultValue="password" />
            </div>
            <button className="rj-btn rj-btn--primary" type="submit" style={{ width: "100%", marginTop: 4 }}>
              Sign in<Icon name="arrow-right" size={17} />
            </button>
          </form>

          <p style={{ fontSize: 12, color: "var(--rj-stone-500)", lineHeight: 1.5, marginTop: 20, textAlign: "center" }}>
            We use approved-domain auto-approval. Members of <b style={{ color: "var(--rj-stone-600)" }}>rivertrust.org</b> join River Trust automatically.
          </p>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { SignIn });
