/* global React, Icon */
const { useState } = React;

// Structured guidance data — the workbench derives variants from this WITHOUT new AI calls.
const GUIDANCE = {
  org: "River Trust",
  summary: "River Trust is a regional land-and-water conservation nonprofit that protects watersheds by partnering with the people who live alongside them. It speaks to supporters as neighbors and collaborators, grounding big goals in specific, local impact.",
  profile: { title: "Warm, plainspoken, mission-first", tags: ["Plainspoken", "Hopeful", "Concrete", "Community-led"] },
  say: ["neighbors", "partners", "watershed", "together", "for generations", "your river"],
  avoid: ["leverage", "synergy", "disrupt", "stakeholders", "utilize", "best-in-class"],
  vocab: [
    ["Use", "“protect our rivers together”", "pine"],
    ["Use", "“neighbors and partners”", "pine"],
    ["Avoid", "“leverage stakeholder synergies”", "danger"],
    ["Avoid", "corporate buzzwords & hype", "danger"],
  ],
};

const VARIANTS = {
  staff: { label: "For staff", lead: "Guidance for people writing on behalf of River Trust:" },
  ai: { label: "For AI tools", lead: "System guidance — paste into any AI writing tool so it sounds like River Trust:" },
  grant: { label: "For grant writing", lead: "Guidance tuned for funders and grant narratives:" },
};

function Slider({ label, value, onChange, left, right }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--rj-fg-2)" }}>{label}</span>
      </div>
      <input type="range" min="0" max="100" value={value} onChange={(e) => onChange(+e.target.value)} className="slu-range" />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--rj-stone-500)", marginTop: 3 }}>
        <span>{left}</span><span>{right}</span>
      </div>
    </div>
  );
}

function Toggle({ on, onClick, label }) {
  return (
    <label className="slu-row-toggle" onClick={onClick}>
      <span>{label}</span>
      <span className="slu-switch" data-on={on}><span className="slu-knob" /></span>
    </label>
  );
}

function Workbench({ onNew }) {
  const [variant, setVariant] = useState("staff");
  const [fmt, setFmt] = useState("md");
  const [formality, setFormality] = useState(35);
  const [warmth, setWarmth] = useState(78);
  const [show, setShow] = useState({ summary: true, voice: true, vocab: true, avoid: true });
  const [copied, setCopied] = useState(false);

  const toneLine = `${warmth > 60 ? "Warm" : warmth > 35 ? "Balanced" : "Reserved"}, ${formality > 60 ? "more formal" : formality > 35 ? "conversational" : "casual"}.`;

  const copy = () => { setCopied(true); setTimeout(() => setCopied(false), 1600); };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", height: "100%", overflow: "hidden" }}>
      {/* Output document */}
      <div style={{ overflow: "auto", padding: "28px 34px 60px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <span className="rj-badge rj-badge--success"><span className="rj-dot" />Guidance ready</span>
            <span style={{ fontFamily: "var(--rj-font-mono)", fontSize: 12, color: "var(--rj-stone-500)" }}>6 pages · 1,284 tokens · $0.042</span>
          </div>

          <div className="rj-eyebrow" style={{ marginBottom: 10 }}>{VARIANTS[variant].label} · {GUIDANCE.org}</div>
          <p style={{ fontFamily: "var(--rj-font-serif)", fontStyle: "italic", fontSize: 16, color: "var(--rj-stone-600)", margin: "0 0 24px" }}>{VARIANTS[variant].lead}</p>

          {show.voice && (
            <section style={{ marginBottom: 26 }}>
              <SectionHead n="01" t="Voice & tone profile" />
              <h2 style={{ fontFamily: "var(--rj-font-serif)", fontSize: 26, fontWeight: 600, color: "var(--rj-ink)", margin: "4px 0 12px" }}>{GUIDANCE.profile.title}</h2>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                {GUIDANCE.profile.tags.map((t) => <span key={t} className="rj-badge rj-badge--pine">{t}</span>)}
              </div>
              <div style={{ fontSize: 14, color: "var(--rj-stone-600)", background: "var(--rj-stone-50)", border: "1px solid var(--rj-border)", borderRadius: 8, padding: "10px 13px", display: "inline-block" }}>
                <Icon name="sliders-horizontal" size={14} color="var(--rj-pine-500)" style={{ verticalAlign: "-2px", marginRight: 6 }} />Tone: <b style={{ color: "var(--rj-stone-700)" }}>{toneLine}</b>
              </div>
            </section>
          )}

          {show.summary && (
            <section style={{ marginBottom: 26 }}>
              <SectionHead n="02" t="Organization summary" />
              <p style={{ fontSize: 15.5, lineHeight: 1.65, color: "var(--rj-stone-700)", margin: "8px 0 0" }}>{GUIDANCE.summary}</p>
            </section>
          )}

          {show.vocab && (
            <section style={{ marginBottom: 26 }}>
              <SectionHead n="03" t="Vocabulary & phrases" />
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                {GUIDANCE.vocab.map(([k, v, tone], i) => (
                  <div key={i} style={{ display: "flex", gap: 11, alignItems: "center", padding: "9px 13px", border: "1px solid var(--rj-border)", borderRadius: 8, background: "var(--rj-white)" }}>
                    <span className={"rj-badge rj-badge--" + (tone === "pine" ? "pine" : "danger")} style={{ minWidth: 50, justifyContent: "center" }}>{k}</span>
                    <span style={{ fontSize: 14.5, color: "var(--rj-stone-700)" }}>{v}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {show.avoid && (
            <section>
              <SectionHead n="04" t="Words to avoid" />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                {GUIDANCE.avoid.map((w) => (
                  <span key={w} style={{ fontFamily: "var(--rj-font-mono)", fontSize: 13, color: "var(--rj-danger)", textDecoration: "line-through", textDecorationColor: "var(--rj-danger)", background: "var(--rj-danger-bg)", padding: "4px 10px", borderRadius: 6 }}>{w}</span>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Options panel */}
      <aside style={{ borderLeft: "1px solid var(--rj-border)", background: "var(--rj-white)", overflow: "auto", padding: "22px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Icon name="sliders-horizontal" size={17} color="var(--rj-pine-600)" />
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--rj-ink)", margin: 0 }}>Output options</h3>
        </div>
        <p style={{ fontSize: 12, color: "var(--rj-stone-500)", margin: "0 0 18px", lineHeight: 1.45 }}>Adjust freely — variants come from analysis already done. No new AI cost.</p>

        <div className="slu-panel-label">Audience variant</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
          {Object.entries(VARIANTS).map(([k, v]) => (
            <button key={k} onClick={() => setVariant(k)} className="slu-seg" data-on={variant === k}>
              <Icon name={variant === k ? "circle-dot" : "circle"} size={15} color={variant === k ? "var(--rj-ember-500)" : "var(--rj-stone-400)"} />{v.label}
            </button>
          ))}
        </div>

        <div className="slu-panel-label">Tone</div>
        <Slider label="Formality" value={formality} onChange={setFormality} left="Casual" right="Formal" />
        <Slider label="Warmth" value={warmth} onChange={setWarmth} left="Reserved" right="Warm" />

        <div className="slu-panel-label" style={{ marginTop: 6 }}>Sections</div>
        <div style={{ marginBottom: 20 }}>
          {[["voice", "Voice & tone"], ["summary", "Summary"], ["vocab", "Vocabulary"], ["avoid", "Words to avoid"]].map(([k, l]) => (
            <Toggle key={k} on={show[k]} label={l} onClick={() => setShow({ ...show, [k]: !show[k] })} />
          ))}
        </div>

        <div className="slu-panel-label">Format</div>
        <div style={{ display: "flex", gap: 6, marginBottom: 22 }}>
          {[["md", "Markdown"], ["txt", "Plain text"]].map(([k, l]) => (
            <button key={k} onClick={() => setFmt(k)} className="slu-pill" data-on={fmt === k}>{l}</button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <button className="rj-btn rj-btn--primary" style={{ width: "100%" }} onClick={copy}>
            <Icon name={copied ? "check" : "copy"} size={16} />{copied ? "Copied" : "Copy guidance"}
          </button>
          <button className="rj-btn rj-btn--secondary" style={{ width: "100%" }}>
            <Icon name="download" size={16} />Download {fmt === "md" ? ".md" : ".txt"}
          </button>
          <button className="rj-btn rj-btn--ghost rj-btn--sm" style={{ width: "100%" }} onClick={onNew}>
            <Icon name="rotate-ccw" size={15} />Start a new analysis
          </button>
        </div>
      </aside>
    </div>
  );
}

function SectionHead({ n, t }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 8, borderBottom: "1px solid var(--rj-border)" }}>
      <span style={{ fontFamily: "var(--rj-font-mono)", fontSize: 12, color: "var(--rj-ember-500)", fontWeight: 600 }}>{n}</span>
      <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--rj-stone-500)" }}>{t}</span>
    </div>
  );
}

Object.assign(window, { Workbench });
