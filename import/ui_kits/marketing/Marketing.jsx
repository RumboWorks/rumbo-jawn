/* global React, Logo, Icon, BearingRings */
const { useState } = React;

// ---------------------------------------------------------------- Nav
function Nav() {
  const [open, setOpen] = useState(false);
  const links = [["Platform", "#platform"], ["Sounds Like Us", "#tools"], ["How it works", "#how"], ["Pricing", "#pricing"]];
  return (
    <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(250,247,241,0.86)", backdropFilter: "blur(8px)", borderBottom: "1px solid var(--rj-border)" }}>
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "0 32px", height: 70, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Logo size={30} />
        <nav style={{ display: "flex", alignItems: "center", gap: 28 }} className="rj-desktop-nav">
          {links.map(([l, h]) => (
            <a key={l} href={h} style={{ fontSize: 14, fontWeight: 600, color: "var(--rj-stone-700)", textDecoration: "none" }}>{l}</a>
          ))}
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a className="rj-btn rj-btn--ghost rj-btn--sm" href="../app/index.html">Sign in</a>
          <a className="rj-btn rj-btn--primary rj-btn--sm" href="../app/index.html"><Icon name="compass" size={16} />Try Sounds Like Us</a>
        </div>
      </div>
    </header>
  );
}

// ---------------------------------------------------------------- Hero
function Hero() {
  return (
    <section id="top" style={{ position: "relative", overflow: "hidden" }}>
      <BearingRings style={{ right: -120, top: -40, width: 400, height: 400 }} />
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "84px 32px 72px", display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 56, alignItems: "center" }}>
        <div>
          <div className="rj-eyebrow" style={{ marginBottom: 20 }}>RumboWorks · the platform for human-guided AI</div>
          <h1 style={{ fontFamily: "var(--rj-font-serif)", fontWeight: 600, fontSize: 52, lineHeight: 1.06, letterSpacing: "-0.02em", color: "var(--rj-ink)", margin: 0, textWrap: "balance" }}>
            Better AI starts with better <span style={{ color: "var(--rj-pine-600)" }}>human guidance.</span>
          </h1>
          <p style={{ fontFamily: "var(--rj-font-serif)", fontSize: 19, lineHeight: 1.62, color: "var(--rj-stone-600)", margin: "22px 0 30px", maxWidth: 460 }}>
            Turn your public pages into reusable writing guidance — so your team, and the AI tools they use, sound like you. You stay on course; you stay in control.
          </p>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <a className="rj-btn rj-btn--primary rj-btn--lg" href="../app/index.html"><Icon name="sparkles" size={18} />Generate your guidance</a>
            <a className="rj-btn rj-btn--secondary rj-btn--lg" href="#how">See how it works</a>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 22, fontSize: 13, color: "var(--rj-stone-500)" }}>
            <Icon name="shield-check" size={16} color="var(--rj-pine-500)" />
            We only read public pages. No credit card to start.
          </div>
        </div>
        <HeroPreview />
      </div>
    </section>
  );
}

// A small product-preview card (a Sounds Like Us guidance result).
function HeroPreview() {
  return (
    <div style={{ position: "relative" }}>
      <div className="rj-card" style={{ boxShadow: "var(--rj-shadow-xl)", padding: 0, overflow: "hidden", transform: "rotate(-0.6deg)" }}>
        <div style={{ background: "var(--rj-pine-800)", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <Logo size={22} light tool="Sounds Like Us" />
          </div>
          <span className="rj-badge rj-badge--success"><span className="rj-dot" />Complete</span>
        </div>
        <div style={{ padding: "20px 22px" }}>
          <div className="rj-eyebrow" style={{ color: "var(--rj-ember-600)" }}>Voice &amp; tone profile</div>
          <div style={{ fontFamily: "var(--rj-font-serif)", fontSize: 22, fontWeight: 600, color: "var(--rj-ink)", margin: "6px 0 10px" }}>Warm, plainspoken, mission-first</div>
          <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--rj-stone-600)", margin: "0 0 16px" }}>
            Writes to supporters as partners. Favors concrete impact over abstraction. Avoids jargon and hype.
          </p>
          {[["Say", "neighbors, partners, together", "pine"], ["Avoid", "leverage, synergy, disrupt", "danger"]].map(([k, v, tone]) => (
            <div key={k} style={{ display: "flex", gap: 10, alignItems: "baseline", padding: "8px 0", borderTop: "1px solid var(--rj-border)" }}>
              <span className={"rj-badge rj-badge--" + (tone === "pine" ? "pine" : "danger")} style={{ minWidth: 52, justifyContent: "center" }}>{k}</span>
              <span style={{ fontSize: 13.5, color: "var(--rj-stone-700)", fontFamily: "var(--rj-font-mono)" }}>{v}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
            <span style={{ fontFamily: "var(--rj-font-mono)", fontSize: 12, color: "var(--rj-stone-500)" }}>6 pages · 1,284 tokens · $0.042</span>
            <span className="rj-btn rj-btn--secondary rj-btn--sm">Download</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Trust row
function TrustRow() {
  const orgs = ["Nonprofits", "Foundations", "Associations", "Schools", "Public agencies"];
  return (
    <section style={{ borderTop: "1px solid var(--rj-border)", borderBottom: "1px solid var(--rj-border)", background: "var(--rj-stone-50)" }}>
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "22px 32px", display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap", justifyContent: "center" }}>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--rj-stone-500)" }}>Built for mission-driven teams</span>
        {orgs.map((o) => (
          <span key={o} style={{ fontFamily: "var(--rj-font-serif)", fontSize: 17, color: "var(--rj-stone-500)" }}>{o}</span>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- How it works
function HowItWorks() {
  const steps = [
    ["link", "Add a public URL", "Point Sounds Like Us at your website — your about page, your blog, your impact stories. No uploads, no setup."],
    ["compass", "We analyze the voice", "A guided AI pass reads only your public pages and maps how you actually sound: tone, vocabulary, what to lean into, what to avoid."],
    ["file-text", "Get reusable guidance", "Receive a voice profile and writing guidance you can hand to staff or paste into any AI tool — guidance you own and reuse, not a throwaway prompt."],
  ];
  return (
    <section id="how" style={{ maxWidth: 1140, margin: "0 auto", padding: "88px 32px" }}>
      <div style={{ textAlign: "center", marginBottom: 52 }}>
        <div className="rj-eyebrow" style={{ marginBottom: 14 }}>How it works</div>
        <h2 style={{ fontFamily: "var(--rj-font-serif)", fontWeight: 600, fontSize: 38, letterSpacing: "-0.02em", color: "var(--rj-ink)", margin: 0 }}>From public pages to guidance in minutes</h2>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 28 }}>
        {steps.map(([icon, title, body], i) => (
          <div key={title}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <span style={{ width: 44, height: 44, borderRadius: 12, background: "var(--rj-pine-50)", color: "var(--rj-pine-600)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={icon} size={22} />
              </span>
              <span style={{ fontFamily: "var(--rj-font-mono)", fontSize: 13, color: "var(--rj-ember-500)", fontWeight: 600 }}>0{i + 1}</span>
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.01em", color: "var(--rj-ink)", margin: "0 0 8px" }}>{title}</h3>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--rj-stone-600)", margin: 0 }}>{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- Tools
function Tools() {
  return (
    <section id="tools" style={{ background: "var(--rj-stone-50)", borderTop: "1px solid var(--rj-border)", borderBottom: "1px solid var(--rj-border)" }}>
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "88px 32px" }}>
        <div style={{ marginBottom: 44, maxWidth: 620 }}>
          <div className="rj-eyebrow" style={{ marginBottom: 14 }}>One platform, many tools</div>
          <h2 style={{ fontFamily: "var(--rj-font-serif)", fontWeight: 600, fontSize: 38, letterSpacing: "-0.02em", color: "var(--rj-ink)", margin: "0 0 14px" }}>Shared accounts, billing, and guardrails — across every RumboWorks tool.</h2>
          <p style={{ fontSize: 16, lineHeight: 1.6, color: "var(--rj-stone-600)", margin: 0 }}>Set up your organization once. Your team, privacy controls, and AI cost visibility come with you as new tools arrive.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
          <ToolCard icon="audio-lines" name="Sounds Like Us" status="available"
            desc="Generate reusable writing guidance from your public pages, so staff and AI tools match your voice."
            points={["Voice & tone profile", "Vocabulary & phrases to use / avoid", "Reusable guidance you can export"]} />
          <ToolCard icon="ruler" name="Model Eval" status="planned"
            desc="Evaluate AI model outputs against your own rubrics, criteria, and reviewers — with scores and reports."
            points={["Rubric-based scoring", "Reviewer workflows", "Shareable evaluation reports"]} />
        </div>
      </div>
    </section>
  );
}

function ToolCard({ icon, name, status, desc, points }) {
  const available = status === "available";
  return (
    <div className="rj-card" style={{ padding: 28, display: "flex", flexDirection: "column", opacity: available ? 1 : 0.92 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <span style={{ width: 46, height: 46, borderRadius: 12, background: available ? "var(--rj-ember-50)" : "var(--rj-stone-100)", color: available ? "var(--rj-ember-500)" : "var(--rj-stone-500)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name={icon} size={23} />
        </span>
        <span className={"rj-badge " + (available ? "rj-badge--success" : "rj-badge--neutral")}>{available ? "Available now" : "Planned"}</span>
      </div>
      <h3 style={{ fontFamily: "var(--rj-font-serif)", fontSize: 25, fontWeight: 600, color: "var(--rj-ink)", margin: "0 0 8px" }}>{name}</h3>
      <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--rj-stone-600)", margin: "0 0 18px" }}>{desc}</p>
      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 22px", display: "flex", flexDirection: "column", gap: 10 }}>
        {points.map((p) => (
          <li key={p} style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 14.5, color: "var(--rj-stone-700)" }}>
            <Icon name="check" size={16} color="var(--rj-pine-500)" strokeWidth={2.5} />{p}
          </li>
        ))}
      </ul>
      <div style={{ marginTop: "auto" }}>
        {available
          ? <a className="rj-btn rj-btn--primary" href="../app/index.html"><Icon name="arrow-right" size={17} />Open Sounds Like Us</a>
          : <span className="rj-btn rj-btn--secondary" aria-disabled="true" style={{ opacity: 0.7, cursor: "default" }}>Notify me at launch</span>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Control band
function ControlBand() {
  const points = [
    ["hand", "You stay in control", "Review, edit, and approve every piece of guidance. The AI proposes; you decide."],
    ["eye", "Privacy by default", "We read only the public pages you choose, disclose what's sent to AI providers, and store as little as possible."],
    ["package-open", "Guidance you own", "Your voice profile is a durable asset you can export, reuse, and bring to any tool — not locked-in prompt text."],
  ];
  return (
    <section id="platform" style={{ position: "relative", overflow: "hidden", background: "var(--rj-pine-800)" }}>
      <BearingRings style={{ left: -80, bottom: -160, width: 460, height: 460 }} />
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "88px 32px", position: "relative" }}>
        <div style={{ maxWidth: 640, marginBottom: 48 }}>
          <div className="rj-eyebrow" style={{ color: "var(--rj-ochre-300)", marginBottom: 14 }}>Humans at the helm</div>
          <h2 style={{ fontFamily: "var(--rj-font-serif)", fontWeight: 600, fontSize: 38, letterSpacing: "-0.02em", color: "var(--rj-stone-50)", margin: 0, lineHeight: 1.15 }}>
            AI should follow your bearing — not set its own.
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 30 }}>
          {points.map(([icon, title, body]) => (
            <div key={title}>
              <span style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(231,217,200,0.12)", color: "var(--rj-ochre-300)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <Icon name={icon} size={22} />
              </span>
              <h3 style={{ fontSize: 19, fontWeight: 700, color: "var(--rj-stone-50)", margin: "0 0 8px" }}>{title}</h3>
              <p style={{ fontSize: 14.5, lineHeight: 1.6, color: "var(--rj-pine-200)", margin: 0 }}>{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- CTA + Footer
function CTA() {
  return (
    <section id="pricing" style={{ maxWidth: 1140, margin: "0 auto", padding: "92px 32px", textAlign: "center" }}>
      <div className="rj-eyebrow" style={{ marginBottom: 16 }}>Start free</div>
      <h2 style={{ fontFamily: "var(--rj-font-serif)", fontWeight: 600, fontSize: 44, letterSpacing: "-0.02em", color: "var(--rj-ink)", margin: "0 0 18px", textWrap: "balance" }}>
        Find your voice. Keep your AI on course.
      </h2>
      <p style={{ fontSize: 17, lineHeight: 1.6, color: "var(--rj-stone-600)", maxWidth: 500, margin: "0 auto 28px" }}>
        Generate your first voice profile free. Upgrade for PDF sources, more analyses, and your whole team.
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        <a className="rj-btn rj-btn--primary rj-btn--lg" href="../app/index.html"><Icon name="sparkles" size={18} />Generate your guidance</a>
        <a className="rj-btn rj-btn--secondary rj-btn--lg" href="#how">How it works</a>
      </div>
    </section>
  );
}

function Footer() {
  const cols = [
    ["Platform", ["Overview", "Accounts & orgs", "Privacy & disclosure", "Admin"]],
    ["Tools", ["Sounds Like Us", "Model Eval (planned)"]],
    ["Company", ["About RumboWorks", "Responsible AI", "Contact"]],
  ];
  return (
    <footer style={{ background: "var(--rj-pine-900)", color: "var(--rj-pine-200)" }}>
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "56px 32px 40px", display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: 36 }}>
        <div>
          <Logo size={28} light />
          <p style={{ fontFamily: "var(--rj-font-serif)", fontSize: 15, lineHeight: 1.6, color: "var(--rj-pine-200)", margin: "16px 0 0", maxWidth: 240 }}>
            Better AI starts with better human guidance.
          </p>
        </div>
        {cols.map(([h, items]) => (
          <div key={h}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--rj-stone-50)", marginBottom: 14 }}>{h}</div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {items.map((it) => <li key={it}><a href="#top" style={{ fontSize: 14, color: "var(--rj-pine-200)", textDecoration: "none" }}>{it}</a></li>)}
            </ul>
          </div>
        ))}
      </div>
      <div style={{ borderTop: "1px solid rgba(231,217,200,0.12)" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "20px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <span style={{ fontSize: 13, color: "var(--rj-pine-300)" }}>© 2026 RumboWorks. <i>Rumbo</i> — a course worth keeping.</span>
          <span style={{ fontSize: 13, color: "var(--rj-pine-300)" }}>Privacy · Terms · Responsible AI</span>
        </div>
      </div>
    </footer>
  );
}

function MarketingApp() {
  return (
    <div>
      <Nav />
      <Hero />
      <TrustRow />
      <HowItWorks />
      <Tools />
      <ControlBand />
      <CTA />
      <Footer />
    </div>
  );
}

Object.assign(window, { MarketingApp });
