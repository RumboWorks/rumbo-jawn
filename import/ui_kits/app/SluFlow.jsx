/* global React, Icon */
const { useState, useEffect, useRef } = React;

// ----------------------------------------------------- New analysis (first run)
function NewAnalysis({ onRun }) {
  const [url, setUrl] = useState("https://rivertrust.org");
  const sections = [
    ["summary", "Organization summary", true],
    ["voice", "Voice & tone profile", true],
    ["vocab", "Vocabulary & phrases", true],
    ["avoid", "What to avoid", true],
    ["rewrite", "Rewrite & critique instructions", false],
  ];
  const [picked, setPicked] = useState(() => Object.fromEntries(sections.map(([k, , d]) => [k, d])));
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 26px 64px" }}>
      <div className="rj-eyebrow" style={{ marginBottom: 12 }}>Sounds Like Us · new analysis</div>
      <h1 style={{ fontFamily: "var(--rj-font-serif)", fontWeight: 600, fontSize: 32, letterSpacing: "-0.02em", color: "var(--rj-ink)", margin: "0 0 8px" }}>
        Turn your public pages into guidance
      </h1>
      <p style={{ fontSize: 16, color: "var(--rj-stone-600)", lineHeight: 1.55, margin: "0 0 28px" }}>
        Give us a public URL. We'll read it, map how your organization sounds, and write reusable guidance your team and AI tools can follow.
      </p>

      <div className="rj-card rj-card--pad" style={{ marginBottom: 18 }}>
        <div className="rj-field" style={{ marginBottom: 18 }}>
          <label className="rj-label">Public website URL</label>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}><Icon name="link" size={17} color="var(--rj-stone-400)" /></span>
              <input className="rj-input" style={{ paddingLeft: 36 }} value={url} onChange={(e) => setUrl(e.target.value)} />
            </div>
          </div>
          <span className="rj-hint">Start with your About page or homepage. We follow a few linked pages from there.</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          <div className="rj-field">
            <label className="rj-label">Analysis depth</label>
            <select className="rj-select" defaultValue="standard">
              <option value="single">Single page · fastest</option>
              <option value="standard">Homepage + linked sections</option>
              <option value="deep">Deep · up to 10 pages</option>
            </select>
          </div>
          <div className="rj-field">
            <label className="rj-label">PDF sources</label>
            <select className="rj-select" disabled>
              <option>Upgrade to add PDFs</option>
            </select>
            <span className="rj-hint">Brand books & style guides — paid feature.</span>
          </div>
        </div>

        <div className="rj-field">
          <label className="rj-label" style={{ marginBottom: 4 }}>Guidance to generate</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {sections.map(([k, label]) => (
              <label key={k} className="slu-check" data-on={picked[k]}>
                <span className="slu-checkbox" data-on={picked[k]}>{picked[k] && <Icon name="check" size={13} color="#fff" strokeWidth={3} />}</span>
                <input type="checkbox" checked={picked[k]} onChange={() => setPicked({ ...picked, [k]: !picked[k] })} style={{ display: "none" }} />
                {label}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="rj-alert rj-alert--info" style={{ marginBottom: 22 }}>
        <Icon name="shield" size={18} />
        <div><b>Before you run:</b> we only read public pages, and their content may be sent to AI providers for analysis. Don't submit URLs with confidential, donor, or member information.</div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div style={{ fontSize: 13, color: "var(--rj-stone-500)" }}>
          <Icon name="zap" size={14} color="var(--rj-ochre-500)" style={{ marginRight: 5, verticalAlign: "-2px" }} />
          Est. cost <b style={{ color: "var(--rj-stone-700)", fontFamily: "var(--rj-font-mono)" }}>~$0.04</b> · about a minute · uses 1 of 3 free analyses
        </div>
        <button className="rj-btn rj-btn--primary rj-btn--lg" onClick={onRun}>
          <Icon name="sparkles" size={18} />Generate guidance
        </button>
      </div>
    </div>
  );
}

// ----------------------------------------------------- Job progress
function Progress({ onDone }) {
  const steps = [
    ["search", "Discovering public pages", "Reading sitemap and homepage links"],
    ["download", "Fetching & extracting text", "6 pages · cleaning boilerplate"],
    ["compass", "Analyzing voice & tone", "Mapping vocabulary, cadence, and themes"],
    ["file-text", "Writing your guidance", "Composing reusable, editable output"],
  ];
  const [active, setActive] = useState(0);
  const [pct, setPct] = useState(6);
  const logRef = useRef(null);
  const [logs, setLogs] = useState(["job_8fa2 created · River Trust"]);

  useEffect(() => {
    const lines = [
      "GET rivertrust.org → 200",
      "discovered 6 candidate pages",
      "fetch /about /impact /stories → ok",
      "extracted 4,210 words",
      "ai.analyze voice → 1,284 tokens · $0.018",
      "ai.compose guidance → 980 tokens · $0.024",
      "guidance ready ✓",
    ];
    let i = 0;
    const t = setInterval(() => {
      i++;
      setPct((p) => Math.min(100, p + 14));
      setActive((a) => Math.min(steps.length - 1, Math.floor(i / 1.75)));
      setLogs((L) => [...L, lines[Math.min(i - 1, lines.length - 1)]]);
      if (i >= 7) { clearInterval(t); setPct(100); setTimeout(onDone, 700); }
    }, 620);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [logs]);

  return (
    <div style={{ maxWidth: 660, margin: "0 auto", padding: "52px 26px" }}>
      <div className="rj-eyebrow" style={{ marginBottom: 12 }}>Running · job_8fa2</div>
      <h1 style={{ fontFamily: "var(--rj-font-serif)", fontWeight: 600, fontSize: 30, letterSpacing: "-0.02em", color: "var(--rj-ink)", margin: "0 0 6px" }}>
        Listening to how you sound…
      </h1>
      <p style={{ fontSize: 15, color: "var(--rj-stone-600)", margin: "0 0 26px" }}>You can keep working — we'll email you when it's done.</p>

      <div style={{ height: 8, borderRadius: 99, background: "var(--rj-stone-100)", overflow: "hidden", marginBottom: 28 }}>
        <div style={{ height: "100%", width: pct + "%", background: "var(--rj-ember-500)", borderRadius: 99, transition: "width 0.6s var(--rj-ease)" }} />
      </div>

      <div className="rj-card" style={{ padding: 8, marginBottom: 18 }}>
        {steps.map(([icon, title, sub], i) => {
          const done = i < active, now = i === active;
          return (
            <div key={title} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 14px", borderRadius: 10, background: now ? "var(--rj-pine-50)" : "transparent" }}>
              <span style={{ width: 34, height: 34, flex: "none", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                background: done ? "var(--rj-pine-600)" : now ? "var(--rj-white)" : "var(--rj-stone-100)",
                border: now ? "2px solid var(--rj-pine-500)" : "none", color: done ? "#fff" : now ? "var(--rj-pine-600)" : "var(--rj-stone-400)" }}>
                {done ? <Icon name="check" size={17} strokeWidth={3} /> : <Icon name={now ? "loader" : icon} size={17} style={now ? { animation: "slu-spin 1s linear infinite" } : null} />}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: done || now ? "var(--rj-ink)" : "var(--rj-stone-500)" }}>{title}</div>
                <div style={{ fontSize: 12.5, color: "var(--rj-stone-500)" }}>{sub}</div>
              </div>
              {done && <span className="rj-badge rj-badge--success">Done</span>}
              {now && <span className="rj-badge rj-badge--warning"><span className="rj-dot" />Running</span>}
            </div>
          );
        })}
      </div>

      <div ref={logRef} style={{ fontFamily: "var(--rj-font-mono)", fontSize: 12, lineHeight: 1.85, color: "var(--rj-stone-500)", background: "var(--rj-stone-50)", border: "1px solid var(--rj-border)", borderRadius: 10, padding: "12px 15px", height: 116, overflow: "auto" }}>
        {logs.map((l, i) => <div key={i}><span style={{ color: "var(--rj-pine-500)" }}>›</span> {l}</div>)}
      </div>
    </div>
  );
}

Object.assign(window, { NewAnalysis, Progress });
