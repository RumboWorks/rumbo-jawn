/* global React, Icon */
const { useState } = React;

// ----------------------------------------------------- Run history (tool view)
function RunHistory({ onOpen, onNew }) {
  const runs = [
    ["job_8fa2", "rivertrust.org", "complete", "$0.042", "6", "Today · 10:24"],
    ["job_8f7c", "rivertrust.org/impact", "complete", "$0.031", "4", "Yesterday"],
    ["job_8f41", "rivertrust.org/stories", "running", "—", "—", "2 days ago"],
    ["job_8e90", "partners.rivertrust.org", "failed", "$0.003", "0", "Mar 21"],
  ];
  const badge = (s) => s === "complete" ? "success" : s === "running" ? "warning" : "danger";
  return (
    <div style={{ maxWidth: 880, margin: "0 auto", padding: "36px 26px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <div className="rj-eyebrow" style={{ marginBottom: 8 }}>Sounds Like Us</div>
          <h1 style={{ fontFamily: "var(--rj-font-serif)", fontWeight: 600, fontSize: 28, letterSpacing: "-0.02em", color: "var(--rj-ink)", margin: 0 }}>Run history</h1>
        </div>
        <button className="rj-btn rj-btn--primary" onClick={onNew}><Icon name="plus" size={17} />New analysis</button>
      </div>
      <div className="rj-card" style={{ overflow: "hidden" }}>
        <table className="rj-table">
          <thead><tr><th>Job</th><th>Source</th><th>Status</th><th>Pages</th><th>Cost</th><th>Created</th><th></th></tr></thead>
          <tbody>
            {runs.map((r) => (
              <tr key={r[0]} style={{ cursor: "pointer" }} onClick={() => r[2] === "complete" && onOpen()}>
                <td style={{ fontFamily: "var(--rj-font-mono)", fontSize: 13, color: "var(--rj-pine-700)" }}>{r[0]}</td>
                <td>{r[1]}</td>
                <td><span className={"rj-badge rj-badge--" + badge(r[2])}><span className="rj-dot" />{r[2]}</span></td>
                <td className="rj-num">{r[4]}</td>
                <td className="rj-num">{r[3]}</td>
                <td style={{ color: "var(--rj-stone-500)", fontSize: 13 }}>{r[5]}</td>
                <td style={{ textAlign: "right" }}>{r[2] === "complete" && <Icon name="arrow-right" size={16} color="var(--rj-stone-400)" />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ----------------------------------------------------- Central admin observability
function Admin() {
  const [tab, setTab] = useState("jobs");
  const stats = [
    ["Jobs today", "24", "activity", "var(--rj-pine-600)"],
    ["AI spend · today", "$1.08", "circle-dollar-sign", "var(--rj-ember-500)"],
    ["Active orgs", "12", "building-2", "var(--rj-pine-600)"],
    ["Failures · 24h", "1", "alert-triangle", "var(--rj-danger)"],
  ];
  const jobs = [
    ["job_8fa2", "Sounds Like Us", "River Trust", "complete", "$0.042", "1,284", "10:24"],
    ["job_8fa1", "Sounds Like Us", "Open Fields Fund", "running", "—", "640", "10:21"],
    ["job_8f9e", "Sounds Like Us", "Maple Assoc.", "failed", "$0.003", "120", "09:58"],
    ["job_8f8d", "Sounds Like Us", "Cedar Schools", "complete", "$0.038", "1,102", "09:40"],
  ];
  const calls = [
    ["anthropic", "claude-sonnet", "analyze_voice", "$0.018", "1,284", "ok"],
    ["anthropic", "claude-sonnet", "compose_guidance", "$0.024", "980", "ok"],
    ["openai", "gpt-4o-mini", "classify_pages", "$0.001", "320", "ok"],
    ["anthropic", "claude-sonnet", "analyze_voice", "—", "0", "error"],
  ];
  const badge = (s) => s === "complete" || s === "ok" ? "success" : s === "running" ? "warning" : "danger";

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: "34px 26px 60px" }}>
      <div className="rj-eyebrow" style={{ marginBottom: 8 }}>Platform · admin</div>
      <h1 style={{ fontFamily: "var(--rj-font-serif)", fontWeight: 600, fontSize: 28, letterSpacing: "-0.02em", color: "var(--rj-ink)", margin: "0 0 22px" }}>Observability</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 26 }}>
        {stats.map(([l, v, icon, c]) => (
          <div key={l} className="rj-card" style={{ padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--rj-stone-500)" }}>{l}</span>
              <Icon name={icon} size={17} color={c} />
            </div>
            <div style={{ fontFamily: "var(--rj-font-mono)", fontSize: 27, fontWeight: 600, color: "var(--rj-ink)", marginTop: 8, fontVariantNumeric: "tabular-nums" }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--rj-border)", marginBottom: 18 }}>
        {[["jobs", "Jobs"], ["calls", "AI calls & cost"], ["errors", "Failures"]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className="slu-tab" data-on={tab === k}>{l}</button>
        ))}
      </div>

      {tab === "jobs" && (
        <div className="rj-card" style={{ overflow: "hidden" }}>
          <table className="rj-table">
            <thead><tr><th>Job</th><th>Tool</th><th>Org</th><th>Status</th><th>Cost</th><th>Tokens</th><th>Time</th></tr></thead>
            <tbody>
              {jobs.map((r) => (
                <tr key={r[0]}>
                  <td style={{ fontFamily: "var(--rj-font-mono)", fontSize: 13, color: "var(--rj-pine-700)" }}>{r[0]}</td>
                  <td>{r[1]}</td><td>{r[2]}</td>
                  <td><span className={"rj-badge rj-badge--" + badge(r[3])}><span className="rj-dot" />{r[3]}</span></td>
                  <td className="rj-num">{r[4]}</td><td className="rj-num">{r[5]}</td>
                  <td className="rj-num" style={{ color: "var(--rj-stone-500)" }}>{r[6]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "calls" && (
        <div className="rj-card" style={{ overflow: "hidden" }}>
          <table className="rj-table">
            <thead><tr><th>Provider</th><th>Model</th><th>Task</th><th>Cost</th><th>Tokens</th><th>Result</th></tr></thead>
            <tbody>
              {calls.map((r, i) => (
                <tr key={i}>
                  <td>{r[0]}</td>
                  <td style={{ fontFamily: "var(--rj-font-mono)", fontSize: 13 }}>{r[1]}</td>
                  <td style={{ fontFamily: "var(--rj-font-mono)", fontSize: 13, color: "var(--rj-stone-600)" }}>{r[2]}</td>
                  <td className="rj-num">{r[3]}</td><td className="rj-num">{r[4]}</td>
                  <td><span className={"rj-badge rj-badge--" + badge(r[5])}>{r[5]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: "12px 16px", borderTop: "1px solid var(--rj-border)", display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--rj-stone-600)", background: "var(--rj-stone-50)" }}>
            <span>Every AI call is logged with provider, model, task, tokens, and cost.</span>
            <span style={{ fontFamily: "var(--rj-font-mono)", fontWeight: 600 }}>Today: $1.08 / $20.00 cap</span>
          </div>
        </div>
      )}

      {tab === "errors" && (
        <div className="rj-alert rj-alert--danger">
          <Icon name="x-circle" size={18} />
          <div><b>job_8f9e — Maple Assoc.</b> · crawl failed: <span style={{ fontFamily: "var(--rj-font-mono)" }}>ETIMEDOUT maple.org</span>. Source unreachable after 3 retries. <a href="#" style={{ color: "var(--rj-danger)", fontWeight: 700 }}>Re-run</a></div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { RunHistory, Admin });
